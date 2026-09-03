// Import necessary modules
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import logger from '../utils/logger.js';

dotenv.config(); // Load environment variables from .env file

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

/**
 * Helper function for AI calls with retry logic
 */
const callAiWithRetry = async (modelName, contents, config, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(contents, config);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      logger.warn(`AI call failed (attempt ${i + 1}/${retries}): ${error.message}`);
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};


// --- AI Model Initialization ---
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// --- Helper Function for AI Categorization ---
async function analyzeFeedback(originalText, categories) {
  // --- AI Category Schema ---
  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: "The category of the feedback.",
        enum: categories,
      },
      text: {
        type: Type.STRING,
        description: "The original feedback text provided by the user.",
      },
      sentiment: {
        type: Type.STRING,
        description: "Overall sentiment of the feedback.",
        enum: ["Positive", "Negative", "Neutral", "Mixed"],
      },
      urgency: {
        type: Type.STRING,
        description: "How urgent the feedback seems.",
        enum: ["Low", "Medium", "High"],
      },
      rating: {
        type: Type.NUMBER,
        description:
          "AI-inferred rating score from 1 (worst) to 5 (best) based on the feedback text.",
        minimum: 1,
        maximum: 5,
      },
      keyPoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Main insights or summarized ideas extracted from the feedback.",
      },
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Important keywords or themes extracted from the feedback.",
      },
      confidence: {
        type: Type.NUMBER,
        description: "Confidence score of the AI's analysis (0.0 - 1.0).",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["category", "text", "sentiment", "rating"],
  };

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

    The category must be one of: ${analysisSchema.properties.category.enum.join(
          ", "
        )}.

    Feedback: "${originalText}"`;

    // Generate structured content using the optimized helper
    const text = await callAiWithRetry(
      "gemini-2.0-flash",
      [{ role: "user", parts: [{ text: prompt }] }],
      {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      }
    );

    const parsedData = JSON.parse(text);
    logger.info(`Feedback analyzed successfully. Sentiment: ${parsedData.sentiment}`);

    return {
      text: originalText, // Use originalText as feedbackText
      ...parsedData,
    };
  } catch (error) {
    logger.error("Error in analyzeFeedback:", error);
    throw new Error("Failed to analyze feedback with AI.");
  }
}

async function generateAiCategories(businessType, businessDescription) {
  const responseSchema = {
    type: Type.ARRAY,
    description: "A list of feedback categories.",
    items: {
      type: Type.STRING,
      description: "A single feedback category.",
    },
    minItems: 5,
    maxItems: 14,
  };

    const prompt = `
      You are an intelligent business insight assistant.

      Your task is to create a list of categories for analyzing customer feedback for a specific business.

      Use the business details below to understand the context.

      ---

      Business Type: ${businessType}
      Business Description: ${businessDescription}

      ---

      Generate 5–14 clear, concise, and relevant feedback categories that this business could use to organize and analyze customer feedback.

      Each category should represent a common theme customers might mention in their feedback (e.g., "Product Quality", "Customer Support", "Pricing", "Delivery Speed").

      Examples based on business type:
      - For retail: "Product Variety", "Store Atmosphere"
      - For SaaS: "Feature Usability", "Technical Support"

      Output your response in valid JSON format as an array of strings.
      Do not include explanations or extra text.
      `;

  try {
    const text = await callAiWithRetry(
      "gemini-2.0-flash",
      [{ role: "user", parts: [{ text: prompt }] }],
      {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    );
    
    const categories = JSON.parse(text);

     // Validate the response
    if (!Array.isArray(categories) || categories.length < 5 || categories.length > 14) {
      throw new Error("Invalid categories generated by AI.");
    }
    if (!categories.every(cat => typeof cat === 'string' && cat.trim().length > 0)) {
      throw new Error("Categories must be non-empty strings.");
    }

    logger.info(`Generated ${categories.length} categories for business: ${businessType}`);
    return categories

  } catch (error) {
      logger.error("Error generating AI categories:", error);
      throw new Error("Failed to generate categories. Please try again.");
  }
}


export { analyzeFeedback, generateAiCategories, callAiWithRetry };
