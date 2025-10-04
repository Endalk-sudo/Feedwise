import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getCategoryCount,
  getSentimentSnapshot,
  getSentimentTrends,
  getCategoryBreakdown,
  getRecurringIssues,
  getSentimentByCategory,
  getPriorityAlerts,
  getGrowthRecommendations
} from "../controllers/analyticsController.js";

const router = express.Router();
 
// Basic Analytics Endpoints
router.get("/basic/categories", verifyToken, getCategoryCount);
router.get("/basic/sentiment", verifyToken, getSentimentSnapshot);

// Pro Analytics Endpoints
router.get("/pro/sentiment-trends", verifyToken, getSentimentTrends);
router.get("/pro/category-breakdown", verifyToken, getCategoryBreakdown);
router.get("/pro/recurring-issues", verifyToken, getRecurringIssues);
router.get("/pro/sentiment-by-category", verifyToken, getSentimentByCategory);
router.get("/pro/priority-alerts", verifyToken, getPriorityAlerts);
router.get("/pro/recommendations", verifyToken, getGrowthRecommendations);

export default router;