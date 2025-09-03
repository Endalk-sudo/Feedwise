/**
 * controllers/feedbackController.js
 *
 * This file contains the logic for handling feedback submissions and retrieval.
 * It uses the Google Generative AI SDK (@google/genai) to categorize feedback automatically.
 */

// Import necessary modules
import { GoogleGenAI, Type } from "@google/genai";
import Feedback from "../models/Feedback.js";
import Organization from "../models/Organization.js";
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

// --- Route Controllers ---


export const getFeedback = async (req, res) => {
  const user = req.user;
  try {
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const allFeedbacks = await Feedback.find({ organizationId: org._id }).sort({createdAt: -1});

    res.status(200).json(allFeedbacks);

  } catch (error) {
    console.error("Error in getFeedback:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

/**
 * POST /:orgSlug/feedback
 * Submits new feedback, categorizes it using AI, and saves it to the database.
 */
export const submitFeedback = async (req, res) => {
  const { orgSlug } = req.params;
  const { text, rating } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ message: "Feedback text is required and cannot be empty." });
  }

  try {
    const org = await Organization.findOne({ slug: orgSlug });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Call the AI to categorize the feedback
    const categorizedData = await categorizeFeedback(text);

    console.log("Categorized Feedback Data:", categorizedData);
    // Create a new feedback document with the data from the AI
    const newFeedback = await Feedback.create({
      organizationId: org._id,
      text: categorizedData.text,
      category: categorizedData.category,
      rating: rating,
    });

    res.status(201).json({ ok: true, id: newFeedback._id });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getOrgInfo = async (req,res)=>{
    const {orgSlug} = req.params;
    try{
        const org = await Organization.findOne({slug:orgSlug});
        if(!org){
            return res.status(404).json({message:"Organization not found"});
        }
        
        res.status(200).json({ orgName:org.name, orgLogo:org.logo });

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}