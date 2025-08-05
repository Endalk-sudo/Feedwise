import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import feedbackRoutes from "./routes/feedback.js";
import userRoutes from "./routes/user.js";

// Load environment variables from .env file
// This is like reading configuration settings before starting
dotenv.config();

// Create the main Express application
// Think of this as building the main office building
const app = express();

// Enable CORS (Cross-Origin Resource Sharing)
// This allows your React app (running on localhost:5173) to talk to your server (localhost:5000)
// It's like allowing visitors from different neighborhoods to enter your building
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Enable JSON parsing for incoming requests
// This tells the server how to read JSON data sent from the frontend
// It's like teaching the receptionist how to read different types of mail
app.use(express.json());

// Connect to MongoDB database
// This is like connecting your building to the city's water and electricity
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/feedback-app");
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop the server if database connection fails
  }
};

// Define all API routes
// These are like different departments in your building

// Authentication routes (login, register, logout)
// All routes starting with /api/auth go to userRoutes
app.use("/api/auth", userRoutes);

// Feedback routes (submit feedback, get feedback)
// All routes starting with /api/feedback go to feedbackRoutes
app.use("/api/feedback", feedbackRoutes);

// Health check endpoint
// This is like a "ping" to check if the server is alive
// Visit http://localhost:5000/health to see if server is running
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running!",
    timestamp: new Date().toISOString()
  });
});

// Start the server
// This is like opening the building for business
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB(); // First connect to database
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`💬 Feedback endpoints: http://localhost:${PORT}/api/feedback`);
  });
};

// Start everything
startServer();
