import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file
 

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

export default async function getAIResponse(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Generate content from the prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      length: 100,
      temperature: 0.2
    });
    // const response = await result.response;
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