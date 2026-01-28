import express from 'express';
import { getFeedback, submitFeedback ,getOrgInfo } from "../controllers/feedbackController.js";
import {verifyToken} from '../middleware/auth.js';
import validate from '../middleware/validationMiddleware.js';
import { submitFeedbackSchema, getFeedbackSchema } from '../middleware/schemas.js';

const router = express.Router();

// All routes in this file start with "/api/feedback"

// GET /api/feedback
// Purpose: Get all feedback for the logged-in organization
// Who can use: Only authenticated organizations
// What it returns: Array of feedback objects with text, rating, and date
router.get('/all', verifyToken, validate(getFeedbackSchema), getFeedback);

// POST /api/feedback
// Purpose: Submit new feedback from customers
// Who can use: Anyone (no authentication required)
// What it needs: organizationId, text, and optionally rating/projectKey
router.post("/:orgSlug", submitFeedback);



router.get("/:orgSlug", getOrgInfo);


export default router;
 