import express from 'express';
import {getFeedback,getDashboard} from '../controllers/userController.js';
import {verifyToken} from '../middleware/auth.js';
import {requireSubscription} from '../middleware/authorize.js';


const router = express.Router();

router.use(verifyToken)
router.use(requireSubscription)

// @route   GET /api/user/dashboard
// @desc    Get user dashboard (requires authentication)
// @access  Private (any authenticated user)
router.get('/dashboard', getDashboard);


router.get('/feedback', getFeedback);


export default router;

