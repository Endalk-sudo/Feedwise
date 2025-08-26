import express from 'express';
import {getFeedback,getDashboard} from '../controllers/userController.js';
import {verifyToken} from '../middleware/auth.js';


const router = express.Router();

// @route   GET /api/user/dashboard
// @desc    Get user dashboard (requires authentication)
// @access  Private (any authenticated user)
router.get('/dashboard',verifyToken, getDashboard);


router.get('/feedback',verifyToken, getFeedback);


export default router;

