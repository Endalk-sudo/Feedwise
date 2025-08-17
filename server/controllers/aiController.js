import { GoogleGenAI } from "@google/genai";
import Feedback from "../models/Feedback.js"; // Feedback model
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function getAIResponse(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Retrieve relevant feedbacks (example: top 5 feedbacks)
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(10); // Replace with vector search for better results
    const feedbackTexts = feedbacks.map(fb => `- ${fb.text}`).join("\n");

    // Augment the prompt with retrieved feedbacks
    const fullPrompt = `
      Here are some relevant feedbacks from our customers:
      ${feedbackTexts}

      Based on this feedback, ${prompt}
    `;

    // Generate content from the augmented prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      length: 200,
      temperature: 0.2,
    });

    const text = response.text;

    if (!text) {
      return res.status(500).json({ error: "Failed to get a valid response from AI." });
    }

    return res.status(200).json({ response: text });

  } catch (error) {
    console.error("Error getting AI response:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}