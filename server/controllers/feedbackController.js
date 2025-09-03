/**
 * controllers/feedbackController.js
 *
 * This file contains the logic for handling feedback submissions and retrieval.
 * It uses the Google Generative AI SDK (@google/genai) to categorize feedback automatically.
 */

// Import necessary modules
import Feedback from "../models/Feedback.js";
import Organization from "../models/Organization.js";
import categorizeFeedback from "../services/aiServices.js"


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