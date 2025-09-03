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

// --- JSON Schema for AI Response ---

// This schema defines the structure we want the AI to return in JSON format
// This is called "structured output" - it ensures the AI responds in a predictable format
const categorySchema = {
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
  },
  required: ["category", "text"],
};

// --- Helper Function for AI Categorization ---

/**
 * Categorizes the given feedback text using the Gemini AI model.
 * * @param {string} originalText - The user's feedback text to categorize
 * @returns {Promise<object>} A promise that resolves to an object with { category, text }
 * * This function sends the feedback to the AI and requests a structured JSON response based on the defined schema.
 */
async function categorizeFeedback(originalText) {
  try {
    // Create a clear prompt for the AI
    const prompt = `Analyze and categorize the following customer feedback.
Return ONLY a valid JSON object with the following structure:
{
  "category": "...",
  "text": "..."
}
The category must be one of: Product Quality & Features, Service Quality & Customer Support, Staff Behavior & Professionalism, Cleanliness & Hygiene, Pricing & Affordability, Speed of Service & Efficiency, Product Availability & Variety, Ease of Use & Accessibility, Suggestions & Recommendations, Complaint & Issue Resolution, Overall Experience & Satisfaction, Technical Issues & Bugs, Delivery & Logistics, Brand Perception & Trust.

Feedback: "${originalText}"`;

    // Send the prompt to the AI model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Specify the model directly in the request
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: categorySchema,
        temperature: 0.2,
      },
    });

    const responseText = response.text;

    // Remove Markdown code block formatting if present
    const cleanedText = responseText.replace(/```json|```/g, '').trim();

    console.log("AI Categorization Response:", cleanedText);

    // Parse the JSON string into a JavaScript object
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Error during AI feedback categorization:", error);
    // Provide a user-friendly error message
    throw new Error("The AI failed to process the feedback. Please try again.");
  }
}


export default categorizeFeedback;