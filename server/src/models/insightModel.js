import mongoose from "mongoose";

const insightSchema = new mongoose.Schema({
  // Link the insight to a specific organization
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true // Ensures there's only one insight document per organization
  },
  
  // Store the aggregated data summary that was sent to the AI
  // This is useful for debugging and understanding the context of the recommendations
  summaryData: {
    type: mongoose.Schema.Types.Mixed, // A flexible type to store our summary object
    required: true
  },
  
  // Store the final, clean recommendations from the AI
  // We store it as an array of parsed objects for easy frontend consumption
  recommendations: {
    type: [mongoose.Schema.Types.Mixed], // Array of recommendation objects
    required: true
  },
  
  // Automatically track when this insight was last generated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;