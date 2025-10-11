import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import feedbackRoutes from "./routes/feedback.js";
import userRoutes from "./routes/user.js";
import authRoutes from "./routes/auth.js"; // Import auth routes
import aiRoutes from "./routes/ai.js"; // Import AI routes
import settingsRoutes from "./routes/settings.js"
import paymentRoutes from './routes/payment.js';
import analyticsRoutes from "./routes/analytics.js"
import { handleWebhook } from "./controllers/paymentController.js";
import {startInsightGenerationJob} from "./jobs/generateInsights.js"

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

// Enable cookie parsing
app.use(cookieParser());


// IMPORTANT: Define webhook route BEFORE bodyParser.json()
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Enable JSON parsing for incoming requests
// This tells the server how to read JSON data sent from the frontend
// It's like teaching the receptionist how to read different types of mail
app.use(express.json());

// Connect to MongoDB database
// This is like connecting your building to the city's water and electricity
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/jwtAuthDB");
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop the server if database connection fails
  }
};


// Define all API routes
// These are like different departments in your building

// Authentication routes (login, register, logout)
// All routes starting with /api/auth go to authRoutes
app.use("/api/auth", authRoutes);

// Feedback routes (submit feedback, get feedback)
// All routes starting with /api/feedback go to feedbackRoutes
app.use("/api/feedback", feedbackRoutes);


app.use("/api/ai", aiRoutes);
 

app.use("/api/user", userRoutes);

app.use("/api/setting",settingsRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/', analyticsRoutes);

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

// const sampleData = {
//   "organizationId": "68d7c2b335e495cd97d1528c",
//   "summaryData": {
//     "totalFeedback": 150,
//     "sentimentDistribution": {
//       "Positive": 75,
//       "Negative": 30,
//       "Neutral": 30,
//       "Mixed": 15
//     },
//     "urgencyDistribution": {
//       "High": 20,
//       "Medium": 50,
//       "Low": 80
//     },
//     "topKeywords": [
//       "performance",
//       "interface",
//       "bug",
//       "speed",
//       "usability",
//       "login",
//       "mobile",
//       "notifications",
//       "error",
//       "loading"
//     ],
//     "topCategories": [
//       "Technical Issues",
//       "User Experience",
//       "Feature Requests",
//       "Performance",
//       "Bug Reports"
//     ],
//     "highUrgencySamples": [
//       {
//         "text": "App crashes frequently on login, urgent fix needed.",
//         "category": "Bug Reports"
//       },
//       {
//         "text": "Performance is terrible on mobile devices.",
//         "category": "Performance"
//       },
//       {
//         "text": "Critical security vulnerability in payment processing.",
//         "category": "Technical Issues"
//       }
//     ]
//   },
//   "recommendations": [
//     {
//       "title": "Optimize Mobile Performance",
//       "reason": "45% of feedback mentions performance issues, with high urgency on mobile devices, indicating a key pain point for users.",
//       "action": "Conduct a mobile performance audit and implement lazy loading for images and data."
//     },
//     {
//       "title": "Fix Login Bugs Immediately",
//       "reason": "Login-related keywords appear in 25% of negative feedback, with multiple high-urgency reports of crashes.",
//       "action": "Prioritize debugging the login flow and release a hotfix within the next sprint."
//     },
//     {
//       "title": "Enhance User Interface Usability",
//       "reason": "Usability complaints are prevalent in neutral and mixed sentiment feedback, suggesting room for improvement.",
//       "action": "Run user testing sessions and redesign key UI elements based on feedback."
//     },
//     {
//       "title": "Address Notification Errors",
//       "reason": "Notifications are a top keyword with frequent error reports, impacting user engagement.",
//       "action": "Review notification logic and add retry mechanisms for failed deliveries."
//     },
//     {
//       "title": "Expand Feature Requests",
//       "reason": "Feature requests show positive intent but highlight gaps in current offerings.",
//       "action": "Analyze top-requested features and plan development for the next quarter."
//     }
//   ],
//   "lastUpdated": "2025-10-02T08:56:00.000Z",
//   "createdAt": "2025-10-02T08:56:00.000Z",  // Auto-added by timestamps
//   "updatedAt": "2025-10-02T08:56:00.000Z"   // Auto-added by timestamps
// }

// const insertToDb = async () =>{
//   try{
//     const data = await Insight.create(sampleData)
//     console.log("Inserted data: ",data)
//   }catch(error){
//     console.log("Error inserting sample data :",error.message)
//   }
// }

// insertToDb()

startInsightGenerationJob();


// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  console.error('Error Stack:', error.stack);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
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
