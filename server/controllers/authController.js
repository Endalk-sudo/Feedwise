import { v2 as cloudinary } from 'cloudinary';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken'; // For creating and verifying JWTs
import User from '../models/User.js'; // User model (MongoDB)
import RefreshToken from '../models/RefreshToken.js'; // Refresh token model
import Organization from '../models/Organization.js';
import orgLogo from '../models/OrgLogo.js';
import dotenv from 'dotenv';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/uploadHelper.js';
import { generateAiCategories } from '../services/aiServices.js';
import logger from '../utils/logger.js';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check for required environment variables
if (!process.env.JWT_SECRET_ACCESS || !process.env.JWT_SECRET_REFRESH) {
    console.error('JWT secrets are not defined in environment variables');
    process.exit(1);
}

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS; // Secret key for signing access tokens
const REFRESH_SECRET = process.env.JWT_SECRET_REFRESH; // Secret key for signing refresh tokens
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m'; // Default to 15 minutes
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '15d'; // Default to 15 days
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Multer Configuration for In-Memory Storage ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to generate access and refresh tokens for a user
const generateTokens = (user) => {
    const payload = {
        user: {
            id: user._id.toString(),
        },
    };
    // Create access and refresh tokens with expiration
    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRATION });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRATION });
    return { accessToken, refreshToken };
};

// =====================
// Register a new user
// =====================
const register = async (req, res) => {
    const { username, email, password } = req.body;
    logger.info(`Registration attempt for email: ${email}`);
    // Input validation
    if (!username || !email || !password) {
        logger.warn('Registration failed: Missing fields');
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (password.length < 6) {
        logger.warn('Registration failed: Password too short');
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (username.length < 3) {
        logger.warn('Registration failed: Username too short');
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (!emailRegex.test(email)) {
        logger.warn(`Registration failed: Invalid email format ${email}`);
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            logger.warn(`Registration failed: User already exists ${email}`);
            return res.status(409).json({
                success: false,
                message: 'User already exists',
                code: 'AUTH_USER_EXISTS',
                errors: [{ field: 'email', message: 'Email is already registered' }],
            });
        }
        // Create new user (password will be hashed in the model)
        user = new User({
            username,
            email,
            password,
        });
        await user.save(); // Save user to database

        // Generate tokens for auto-login
        const { accessToken, refreshToken } = generateTokens(user);

        // Calculate refresh token expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15);

        // Store refresh token in DB
        const newRefreshToken = new RefreshToken({
            userId: user._id,
            token: refreshToken,
            expiresAt: expiresAt,
        });

        await newRefreshToken.save();

        // Set refresh token in HTTP-only cookie
        // CRITICAL: For cross-domain cookies to work:
        // 1. sameSite must be 'none' for different domains
        // 2. secure must be true (HTTPS only) when sameSite is 'none'
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Always true for cross-domain cookies with sameSite: 'none'
            sameSite: 'none', // Required for cross-domain requests
            maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        });

        res.status(201).json({
            message: 'User registered successfully',
            accessToken,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                hasOrganization: user.hasOrganization,
                organizationId: user.organizationId,
                currentPlan: user.currentPlan,
                subscriptionStatus: user.subscriptionStatus,
            },
        });
    } catch (err) {
        logger.error(`Registration error: ${err.message}`, { stack: err.stack });
        res.status(500).json({
            success: false,
            message: 'Server Error during registration',
            code: 'SERVER_ERROR',
            errors: [],
        });
    }
};

const setOrganization = async (req, res) => {
    // Destructure organization name and slug from the request body.
    const { orgName, orgSlug, businessType, businessDescription } = req.body;

    if (!orgName || !orgSlug || !businessType || !businessDescription) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        // Get the user ID from the authenticated user.
        const userId = req.user.id;
        // --- Validation ---
        // Check if an organization with the given slug already exists to ensure uniqueness.
        const isOrg = await Organization.findOne({ slug: orgSlug });
        if (isOrg) {
            return res.status(400).json({ ok: false, message: 'Slug is already taken, it has to be unique' });
        }
        // --- QR Code Generation ---
        // Construct the URL that will be encoded into the QR code.
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const content = `${baseUrl}/feedback/${orgSlug}`;
        // Generate a data URL for the QR code image.
        const qrDataUrl = await QRCode.toDataURL(content, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H',
        });

        let aiCategories;
        try {
            aiCategories = await generateAiCategories(businessType, businessDescription);
        } catch (aiError) {
            logger.error(`AI category generation failed: ${aiError.message}`);
            // Fallback to default categories based on business type
            aiCategories = [
                'Product Quality',
                'Customer Service',
                'Pricing',
                'User Experience',
                'Features',
                'Support',
                'Performance',
                'Reliability',
            ];
        }

        const orgData = {
            ownerId: userId,
            name: orgName,
            slug: orgSlug,
            content: content,
            qrDataUrl: qrDataUrl,
            businessType: businessType,
            businessDescription: businessDescription,
            categories: aiCategories,
        };

        // Create the new organization in the database.
        const org = await Organization.create(orgData);
        // --- Logo Handling ---
        // If a logo file was uploaded, process it.
        if (req.file) {
            try {
                // Check if Cloudinary is configured
                if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                    throw new Error('Cloudinary is not configured but a logo was uploaded.');
                }
                // Upload the file buffer to Cloudinary using the modular helper function.
                const result = await uploadToCloudinary(req.file.buffer);

                // Create a new logo document in the database with the Cloudinary URL.
                await orgLogo.create({
                    orgId: org._id,
                    url: result.secure_url,
                    public_id: result.public_id,
                });
            } catch (uploadError) {
                logger.error(`Logo upload failed: ${uploadError.message}`);
                // We don't want to fail the entire organization setup if just the logo fails
                // but we should inform the user if we can or just log it. 
                // Currently, we'll just log it.
            }
        }
        // --- User Update ---
        // Update the user document to link it with the new organization.
        const user = await User.findByIdAndUpdate(
            userId,
            { hasOrganization: true, organizationId: org._id },
            { new: true }, // Return the updated user document.
        );
        // --- Success Response ---
        // Send a success response with the user and organization data.
        return res.status(201).json({ ok: true, user, organization: org });
    } catch (err) {
        // --- Error Handling ---
        logger.error(`Organization setup error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ 
            success: false,
            message: 'Server error during organization setup',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// =====================
// Login an existing user
// =====================
const login = async (req, res) => {
    const { email, password } = req.body;
    // Input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials',
                code: 'AUTH_INVALID_CREDENTIALS',
                errors: [],
            });
        }
        // Check if password matches (uses model's comparePassword method)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials',
                code: 'AUTH_INVALID_CREDENTIALS',
                errors: [],
            });
        }
        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(user);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15);

        const newRefreshToken = new RefreshToken({
            userId: user._id,
            token: refreshToken,
            expiresAt: expiresAt,
        });

        await newRefreshToken.save();

        // Set refresh token in HTTP-only cookie
        // CRITICAL: For cross-domain cookies to work:
        // 1. sameSite must be 'none' for different domains
        // 2. secure must be true (HTTPS only) when sameSite is 'none'
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Always true for cross-domain cookies with sameSite: 'none'
            sameSite: 'none', // Required for cross-domain requests
            maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        });

        res.json({
            message: 'Logged in successfully',
            accessToken,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                hasOrganization: user.hasOrganization,
                organizationId: user.organizationId,
                currentPlan: user.currentPlan,
                subscriptionStatus: user.subscriptionStatus,
            },
        });
    } catch (err) {
        logger.error(`Login error: ${err.message}`, { stack: err.stack });
        res.status(500).json({
            success: false,
            message: 'Server Error during login',
            code: 'SERVER_ERROR',
            errors: [],
        });
    }
};

// In authController.js, update the refreshToken function:
const refreshToken = async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
        return res.status(401).json({ message: 'Refresh token not found' });
    }
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshTokenFromCookie, REFRESH_SECRET);
        // Check if refresh token exists in DB and is valid
        const storedRefreshToken = await RefreshToken.findOne({ token: refreshTokenFromCookie });

        if (!storedRefreshToken) {
            // Clear the invalid token from the client's cookies
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
            });
            return res.status(403).json({ message: 'Forbidden: Invalid or expired refresh token.' });
        }

        // Get user from database
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign({ user: { id: user._id.toString() } }, ACCESS_SECRET, {
            expiresIn: ACCESS_EXPIRATION,
        });

        res.json({
            accessToken: newAccessToken,
        });
    } catch (err) {
        logger.error(`Refresh token error: ${err.message}`, { stack: err.stack });
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Refresh Token expired', code: 'REFRESH_TOKEN_EXPIRED' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }
        res.status(500).json({ message: 'Server Error during token refresh' });
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            // Verify token to get user ID
            const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
            const storedRefreshToken = await RefreshToken.findOne({ token: refreshToken });

            if (storedRefreshToken) {
                await RefreshToken.deleteOne({ token: refreshToken });
            }
        }

        // Clear cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        logger.error(`Logout error: ${err.message}`, { stack: err.stack });
        // Catch JWT errors if the refresh token format is invalid or it's expired
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Refresh token provided for logout is expired' });
        }
        res.status(500).json({ message: 'Server Error during logout' });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        // Get user ID from the verified token
        const userId = req.user.id;

        // Find user by ID and exclude password field
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user data
        res.json({
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                hasOrganization: user.hasOrganization,
                organizationId: user.organizationId,
                currentPlan: user.currentPlan,
                subscriptionStatus: user.subscriptionStatus,
            },
        });
    } catch (err) {
        logger.error(`Get profile error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ message: 'Server Error while fetching profile' });
    }
};

export default { register, login, refreshToken, logout, setOrganization, upload, getProfile };
