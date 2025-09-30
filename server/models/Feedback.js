import mongoose from "mongoose";

// This is the "blueprint" for all feedback in your database
// Think of it like a form template that every feedback must follow

const feedbackSchema = new mongoose.Schema({
  // Which organization this feedback belongs to
  // It's like saying "this review is for McDonald's" or "this review is for Starbucks"
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',  // Links to the Organization model
    required: true,       // Every feedback MUST belong to an organization
    index: true           // Makes database searches faster
  },
  
  // Optional: Used if you want to group feedback by project/feature
  // For example: "mobile-app", "website", "new-menu"
  projectKey: {
    type: String,
    default: 'default',   // If not specified, use 'default'
    trim: true            // Remove extra spaces
  },
  
  // The actual feedback text that users type
  text: {
    type: String,
    required: true,       // Must have text content
    maxlength: 5000       // Maximum 5000 characters (about a page of text)
  },
  
  // Category of feedback (AI-detected or user-provided)
  category: {
    type: String,
    required: true,
    trim: true
  },

  // Star rating from 1–5 (AI-inferred or user-provided)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },

  // --- AI Analysis Fields ---
  sentiment: {
    type: String,
    enum: ["Positive", "Negative", "Neutral","Mixed"],
  },
  urgency: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  keyPoints: {
    type: [String], // array of main extracted insights
    default: [],
  },
  keywords: {
    type: [String],
    default: []
  },
  confidence: {
    type: Number,  // 0.0 – 1.0
    min: 0,
    max: 1,
  },

  // Store full raw AI JSON response for flexibility / debugging
  rawAnalysis: {
    type: mongoose.Schema.Types.Mixed,
  },
  
  // When this feedback was created
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create the actual model from our schema
const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
