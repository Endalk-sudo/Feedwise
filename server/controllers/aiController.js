import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBk1sz80MY8xDVkNWHgPMCLZxlQ-9WXWgc'; 

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

export default async function getAIResponse(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ 
      role: "user", 
      parts: [{ text: prompt }] 
    }]
  });

    return res.status(200).json({ response: response.text });

  } catch (error) {
    console.error("Error getting AI response:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}