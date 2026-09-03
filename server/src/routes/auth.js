import express from 'express';
import authController from '../controllers/authController.js'
import {verifyToken} from "../middleware/auth.js"
import validate from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema, orgSetupSchema } from '../middleware/schemas.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(registerSchema), authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validate(loginSchema), authController.login);

// @route   POST /api/auth/refresh-token
// @desc    Get a new access token using refresh token
// @access  Public (but requires a valid refresh token)
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user by invalidating refresh token
// @access  Public (requires refresh token)
router.post('/logout', authController.logout);


// @route   POST /api/auth/organization
// @desc    Set organization for the user
router.post('/organization', verifyToken, authController.upload.single('logo'), validate(orgSetupSchema), authController.setOrganization);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private (requires authentication)
router.get('/profile', verifyToken, authController.getProfile);

export default router;
