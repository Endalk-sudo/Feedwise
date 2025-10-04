import cron from 'node-cron';
import Feedback from '../models/Feedback.js';
import Insight from '../models/insightModel.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js'; // Import the User model to check plans
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"

dotenv.config()

// Helper function to get top items by frequency
const getTopItems = (arr, limit = 10) => {
  const count = {};
  arr.forEach(item => count[item] = (count[item] || 0) + 1);
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([item]) => item);
};

// Initialize gemini with your API key from environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates and saves AI-powered insights for a single organization.
 * This function is the core worker that performs data aggregation, AI analysis,
 * and database storage. It assumes the organization passed to it is already
 * verified to be a 'pro' customer.
 * @param {object} org - The organization document object.
 */
const generateInsightsForOrg = async (org) => {
  console.log(`Starting insight generation for PRO organization: ${org.name} (ID: ${org._id})`);
  try {
    // 1. AGGREGATE DATA from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summary = await Feedback.aggregate([
      { $match: { organizationId: org._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          sentimentCounts: { $push: '$sentiment' },
          urgencyCounts: { $push: '$urgency' },
          topCategories: { $push: '$category' },
          allKeywords: { $push: '$keywords' },
          // Get a sample of high-urgency feedback for context
          highUrgencySamples: {
            $push: {
              $cond: [
                { $eq: ['$urgency', 'High'] },
                { text: '$text', category: '$category' },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalFeedback: 1,
          sentimentDistribution: { $arrayToObject: [
            { k: "Positive", v: { $size: { $filter: { input: "$sentimentCounts", cond: { $eq: ["$$this", "Positive"] } } } } },
            { k: "Negative", v: { $size: { $filter: { input: "$sentimentCounts", cond: { $eq: ["$$this", "Negative"] } } } } },
            { k: "Neutral", v: { $size: { $filter: { input: "$sentimentCounts", cond: { $eq: ["$$this", "Neutral"] } } } } },
            { k: "Mixed", v: { $size: { $filter: { input: "$sentimentCounts", cond: { $eq: ["$$this", "Mixed"] } } } } },
          ]},
          urgencyDistribution: { $arrayToObject: [
            { k: "High", v: { $size: { $filter: { input: "$urgencyCounts", cond: { $eq: ["$$this", "High"] } } } } },
            { k: "Medium", v: { $size: { $filter: { input: "$urgencyCounts", cond: { $eq: ["$$this", "Medium"] } } } } },
            { k: "Low", v: { $size: { $filter: { input: "$urgencyCounts", cond: { $eq: ["$$this", "Low"] } } } } },
          ]},
          // Flatten all keyword arrays for processing in code
          allKeywords: { $concatArrays: "$allKeywords" },
          // Include categories for processing
          topCategories: "$topCategories",
          // Filter out nulls and take the first 3 high-urgency samples
          highUrgencySamples: { $slice: [{ $filter: { input: "$highUrgencySamples", cond: { $ne: ["$$this", null] } } }, 3] }
        }
      }
    ]);

    // If there's no feedback in the last 30 days, there's nothing to analyze.
    if (summary.length === 0 || summary[0].totalFeedback === 0) {
      console.log(`No feedback found for org ${org.name} in the last 30 days. Skipping.`);
      return;
    }

    const summaryData = summary[0];

    // Compute top keywords and categories by frequency
    summaryData.topKeywords = getTopItems(summaryData.allKeywords);
    summaryData.topCategories = getTopItems(summaryData.topCategories);

    // 2. CONSTRUCT THE AI PROMPT
    const prompt = `
    You are an expert SaaS business analyst and product strategist. I am providing you with a summary of customer feedback from the last 30 days.
    
    Your task is to analyze this data and generate 3 to 5 actionable growth recommendations.
    
    The recommendations should identify key strengths to leverage, major weaknesses to address, or potential opportunities for growth.
    
    Here is the data summary:
    ${JSON.stringify(summaryData, null, 2)}
    
    Based on the data above, provide your recommendations.
    **Crucial Instruction: Format your entire response as a single JSON array of objects. Each object must have the following keys: 'title', 'reason', and 'action'. Do not include any text before or after the JSON array.**
    
    Example of the expected format:
    [
      { "title": "A catchy title for the recommendation", "reason": "The data-driven reason for this recommendation.", "action": "A clear, actionable step to take." }
    ]
    `;

    const model = "gemini-2.5-flash";

    // 3. CALL THE AI API
    const completion = await ai.models.generateContent({
      model: model, 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        // systemInstruction: "You are a cat. Your name is Neko.",
        responseMimeType: "application/json"  // This helps ensure you get JSON back
      }
    });

    const aiResponseText = completion.text;
    
    let recommendations;
    try {
      // The AI might return a JSON object with a key, so we parse and find the array
      const parsedResponse = JSON.parse(aiResponseText);
      recommendations = parsedResponse.recommendations || parsedResponse; // Fallback to direct array
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON for org:", org.name, parseError);
      console.error("Raw AI Response:", aiResponseText);
      return;
    }

    // Validate that recommendations is an array
    if (!Array.isArray(recommendations)) {
      console.error("AI response recommendations is not an array for org:", org.name, "Type:", typeof recommendations);
      return;
    }

    // 4. SAVE THE INSIGHTS TO THE DATABASE
    await Insight.findOneAndUpdate(
      { organizationId: org._id },
      {
        summaryData: summaryData,
        recommendations: recommendations,
        lastUpdated: new Date()
      },
      { upsert: true, new: true } // upsert creates if not found, new returns the new doc
    );

    console.log(`Successfully generated and saved insights for PRO organization: ${org.name}`);

  } catch (error) {
    console.error(`Failed to generate insights for PRO organization ${org.name}:`, error);
  }
};


/**
 * Starts the scheduled cron job to generate insights for all pro users.
 * It runs daily at 2:00 AM server time.
 */
export const startInsightGenerationJob = () => {
  // Schedule the job to run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily insight generation job for PRO users...');
    
    try {
      // 1. Find all users who are on the 'pro' plan.
      const proUsers = await User.find({ currentPlan: 'pro' }).select('organizationId');
      
      if (proUsers.length === 0) {
        console.log('No pro users found. Skipping insight generation.');
        return;
      }

      // 2. Extract the unique organizationIds from these pro users.
      const proOrgIds = proUsers.map(user => user.organizationId).filter(id => id != null);

      if (proOrgIds.length === 0) {
          console.log('Found pro users, but none are linked to an organization. Skipping.');
          return;
      }

      // 3. Find only the organizations that belong to pro users.
      const organizations = await Organization.find({ _id: { $in: proOrgIds } });

      // 4. Loop through this filtered list of organizations and generate insights.
      for (const org of organizations) {
        await generateInsightsForOrg(org);
        // Optional: add a small delay between API calls to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); 
      }

      console.log(`Daily insight generation job finished. Processed ${organizations.length} PRO organizations.`);
    } catch (error) {
      console.error("An error occurred during the insight generation job:", error);
    }
  });
};