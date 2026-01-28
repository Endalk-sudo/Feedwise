import Feedback from "../models/Feedback.js";
import { callAiWithRetry } from "../services/aiServices.js";
import logger from '../utils/logger.js';

/**
 * Main controller function to handle AI response generation based on user prompts
 * and relevant customer feedback data.
 * 
 * This function:
 * 1. Validates the request inputs
 * 2. Retrieves relevant customer feedback based on the user's prompt
 * 3. Constructs an enhanced prompt with context
 * 4. Calls the AI model to generate a response
 * 5. Returns the AI response to the client
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with AI-generated content or error message
 */
export default async function getAIResponse(req, res) {
  // Extract prompt and user data from request body
  const { prompt, user } = req.body;

  try {
    // Validate that user and organization ID are provided
    if (!user || !user.organizationId) {
      return res.status(400).json({ error: "Invalid user or organization." });
    }

    // Validate that prompt is provided
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    /**
     * STRATEGY: Retrieve the most relevant feedback instead of just the most recent
     * 
     * We extract keywords from the user's prompt and try to find feedback that matches
     * these keywords. If no matches are found, we fall back to the most recent feedback.
     * This ensures the AI has the most contextually relevant data to work with.
     */

    // Extract meaningful keywords from the prompt
    const keywords = prompt.toLowerCase()          // Convert to lowercase for case-insensitive matching
      .replace(/[^\w\s]/g, '')                     // Remove punctuation marks
      .split(/\s+/)                                // Split into words
      .filter(word => word.length > 3);            // Focus on longer, more meaningful words

    // Create a regex pattern to match any of the keywords in feedback text
    const keywordPattern = keywords.length > 0 
      ? new RegExp(keywords.join('|'), 'i')        // 'i' flag for case-insensitive matching
      : null;

    let feedbacks;
    
    // First, try to find feedback that matches the keywords from the prompt
    if (keywordPattern) {
      feedbacks = await Feedback.find({
        organizationId: user.organizationId,      // Only feedback from user's organization
        text: keywordPattern                       // Match against our keyword pattern
      }).sort({ createdAt: -1 }).limit(15);        // Get most recent matches first
    }

    // Fallback: If no keyword matches found, use most recent feedback
    if (!feedbacks || feedbacks.length === 0) {
      feedbacks = await Feedback.find({ 
        organizationId: user.organizationId 
      }).sort({ createdAt: -1 }).limit(15);        // Get 15 most recent feedback entries
    }

    // Format the feedback texts for inclusion in the prompt
    const feedbackTexts = feedbacks.map(fb => `- ${fb.text}`).join("\n");

    /**
     * PROMPT ENGINEERING: Construct an enhanced prompt with context
     * 
     * We provide the AI with:
     * 1. Relevant customer feedback as context
     * 2. The user's original question/request
     * 
     * This helps the AI generate more accurate and context-aware responses.
     */
    const fullPrompt = `
          Here are some relevant customer feedbacks:
          ${feedbackTexts}

          Now, based on this feedback: ${prompt}
      `;

    /**
     * AI MODEL CONFIGURATION
     * 
     * We use Google's Gemini model with specific configuration:
     * - Model: gemini-2.0-flash (fast and cost-effective for conversational AI)
     * - Temperature: 0.2 (low creativity, more focused and deterministic responses)
     * - Max tokens: 100 (limits response length for conciseness)
     * 
     * System instructions define the AI's personality and response guidelines
     */
    const text = await callAiWithRetry(
      "gemini-2.0-flash",
      [{ role: "user", parts: [{ text: fullPrompt }] }],
      {
        temperature: 0.2,
        maxOutputTokens: 100,
        systemInstruction: {
          role: "system",
          parts: [{
            text: `You are FeedbackAI — a professional, insightful, and friendly AI assistant designed to help business owners and teams understand their customer feedback and make better decisions.
            Your core personality:
            - Analytical but approachable: you explain insights clearly and in plain language.
            - Business-savvy: you think like a consultant who wants the user's business to grow.
            - Supportive and trustworthy: always give thoughtful, constructive advice, never dismissive.
            - Engaging: use a warm, confident, and positive tone.
            Your main focus is to:
            1. Summarize and analyze customer feedback.
            2. Highlight patterns, opportunities, and problems from feedback.
            3. Provide actionable business recommendations.
            If the user asks something unrelated to customer feedback:
            - Politely respond in a helpful way.
            - Gently steer back to customer insights when possible.
            Guidelines:
            - Priority: feedback data provided.
            - Fallback: general business strategy/strategy.
            - Avoid hallucinations.`
          }]
        }
      }
    );

    // Validate that we received a response from the AI
    if (!text) {
      return res.status(500).json({ error: "Failed to get a valid response from AI." });
    }

    // Log successful AI interaction
    logger.info(`AI Response generated for user: ${user.id}`);

    // Return successful response with AI-generated content
    return res.status(200).json({ response: text });

  } catch (error) {
    // Log the error for debugging purposes
    logger.error("Error getting AI response:", error);

    // Return user-friendly error message
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}