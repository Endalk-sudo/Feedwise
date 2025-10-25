/**
 * controllers/feedbackController.js
 *
 * This file contains the logic for handling feedback submissions and retrieval.
 * It uses the Google Generative AI SDK (@google/genai) to categorize feedback automatically.
 */

// Import necessary modules
import Feedback from "../models/Feedback.js";
import Organization from "../models/Organization.js";
import {analyzeFeedback} from "../services/aiServices.js"
import OrgLogo from "../models/OrgLogo.js"


// --- Route Controllers ---


export const getFeedback = async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const allFeedbacks = await Feedback.find({ organizationId: org._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalFeedbacks = await Feedback.countDocuments({ organizationId: org._id });
    const hasMore = skip + allFeedbacks.length < totalFeedbacks;

    res.status(200).json({
      feedbacks: allFeedbacks,
      hasMore,
      total: totalFeedbacks,
      page: pageNum,
      limit: limitNum
    });

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
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ message: "Feedback text is required and cannot be empty." });
  }

  try {
    const org = await Organization.findOne({ slug: orgSlug });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Call the AI to analyze the feedback
    const analyzedData = await analyzeFeedback(text,org.categories);

    console.log("AI Analyzed Feedback Data:", analyzedData);

    // Create a new feedback document with both raw text and AI analysis
    const newFeedback = await Feedback.create({
      organizationId: org._id,
      text: analyzedData.text,              // Original feedback
      category: analyzedData.category,      // AI-assigned category
      rating: analyzedData.rating,          // AI-inferred rating
      sentiment: analyzedData.sentiment,    // AI sentiment
      urgency: analyzedData.urgency,        // AI urgency
      keyPoints: analyzedData.keyPoints,    // AI key points
      keywords: analyzedData.keywords || [],// AI extracted keywords
      confidence: analyzedData.confidence,  // AI confidence score
      rawAnalysis: analyzedData             // Full AI JSON dump
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
        const logo = await OrgLogo.findOne({orgId : org._id})

        const logoUrl = logo ? logo.url : null;

        res.status(200).json({ orgName:org.name, orgLogo:logoUrl });

    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}