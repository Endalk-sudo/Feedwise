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
    index: true          // Makes database searches faster
  },
  
  // Optional: Used if you want to group feedback by project/feature
  // For example: "mobile-app", "website", "new-menu"
  projectKey: {
    type: String,
    default: 'default',  // If not specified, use 'default'
    trim: true          // Remove extra spaces
  },
  
  // The actual feedback text that users type
  text: {
    type: String,
    required: true,      // Must have text content
    maxlength: 5000      // Maximum 5000 characters (about a page of text)
  },
  
  // Star rating from 1-5
  // 1 = terrible, 5 = excellent
  rating: {
    type: Number,
    min: 1,              // Can't be less than 1
    max: 5,              // Can't be more than 5
    default: 3           // If no rating provided, use 3 (neutral)
  },
  
  // When this feedback was created
  // Automatically set to current date/time
  createdAt: {
    type: Date,
    default: Date.now,
    index: true          // Fast sorting by date
  }
});

// Create the actual model from our schema
// Now we can use 'Feedback' to create, read, update, delete feedback
const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
