// Import necessary modules
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";



dotenv.config(); // Load environment variables from .env file

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- AI Model Initialization ---
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Initialize the Google GenAI client
// The constructor expects an options object with the API key
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- AI Category Schema ---
const analysisSchema = { 
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "The category of the feedback.",
      enum: [
        "Product Quality & Features",
        "Service Quality & Customer Support",
        "Staff Behavior & Professionalism",
        "Cleanliness & Hygiene",
        "Pricing & Affordability",
        "Speed of Service & Efficiency",
        "Product Availability & Variety",
        "Ease of Use & Accessibility",
        "Suggestions & Recommendations",
        "Complaint & Issue Resolution",
        "Overall Experience & Satisfaction",
        "Technical Issues & Bugs",
        "Delivery & Logistics",
        "Brand Perception & Trust",
      ],
    },
    text: {
      type: Type.STRING,
      description: "The original feedback text provided by the user.",
    },
    sentiment: {
      type: Type.STRING,
      description: "Overall sentiment of the feedback.",
      enum: ["Positive", "Negative", "Neutral","Mixed"],
    },
    urgency: {
      type: Type.STRING,
      description: "How urgent the feedback seems.",
      enum: ["Low", "Medium", "High"],
    },
    rating: {
      type: Type.NUMBER,
      description: "AI-inferred rating score from 1 (worst) to 5 (best) based on the feedback text.",
      minimum: 1,
      maximum: 5,
    },
     keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Main insights or summarized ideas extracted from the feedback.",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Important keywords or themes extracted from the feedback.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score of the AI's analysis (0.0 - 1.0).",
      minimum: 0,
      maximum: 1,
    }
  },
  required: ["category", "text", "sentiment", "rating"]
};

// --- Helper Function for AI Categorization ---
async function analyzeFeedback(originalText) {
  try {
    const prompt = `Analyze and categorize the following customer feedback.
Return ONLY a valid JSON object with the following structure:
{
  "category": "...",
  "text": "...",
  "sentiment": "...",
  "urgency": "...",
  "rating": 1-5,
  "keyPoints": [string] // 2–4 short, clear insights,
  "keywords": ["..."],
  "confidence": 0.0 - 1.0
}

  Rules:
- Use ONLY allowed values for category, sentiment, and urgency.
- Always include ALL fields.
- keyPoints must be descriptive but concise.
- No extra text, no markdown, no explanations.

The category must be one of: ${analysisSchema.properties.category.enum.join(", ")}.

Feedback: "${originalText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    const cleanedText = responseText.replace(/```json|```/g, '').trim();

    console.log("AI Categorization Response:", cleanedText);
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Error during AI feedback categorization:", error);
    throw new Error("The AI failed to process the feedback. Please try again.");
  }
}



export default analyzeFeedback;