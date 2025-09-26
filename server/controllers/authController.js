import {v2 as cloudinary} from 'cloudinary';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken'; // For creating and verifying JWTs
import User from '../models/User.js'; // User model (MongoDB)
import RefreshToken from '../models/RefreshToken.js'; // Refresh token model
import Organization from "../models/Organization.js"
import orgLogo from "../models/OrgLogo.js"
import dotenv from "dotenv";
import multer from 'multer';
import { uploadToCloudinary } from '../utils/uploadHelper.js';
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Check for required environment variables
if (!process.env.JWT_SECRET_ACCESS || !process.env.JWT_SECRET_REFRESH) {
  console.error('JWT secrets are not defined in environment variables');
  process.exit(1);
}

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS; // Secret key for signing access tokens
const REFRESH_SECRET = process.env.JWT_SECRET_REFRESH; // Secret key for signing refresh tokens
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m'; // Default to 15 minutes
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d'; // Default to 7 days
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Multer Configuration for In-Memory Storage ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to generate access and refresh tokens for a user
const generateTokens = (user) => {
    const payload = {
        user: {
            id: user._id.toString() // Convert ObjectId to string and use _id instead of id
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
const  register = async (req, res) => {
    const { username, email, password} = req.body;
    console.log('Registration attempt:', { username, email, password: password ? 'provided' : 'missing' });
    // Input validation
    if (!username || !email || !password) {
        console.log('Missing fields');
        return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (password.length < 6) {
        console.log('Password too short');
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (username.length < 3) {
        console.log('Username too short');
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    try {
        // Check if user already exists
        let user = await User.findOne({ email});
        console.log('User lookup result:', user ? 'exists' : 'not found');
        if (user) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }
          if (!emailRegex.test(email)) {
        console.log('Invalid email');
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
        // Create new user (password will be hashed in the model)
        user = new User({
            username,
            email,
            password,
            });
        await user.save(); // Save user to database
        // Create initial RefreshToken document for the user
        const refreshTokenDoc = new RefreshToken({
          userId: user._id,
          refreshTokens: []
        });
        await refreshTokenDoc.save();
        res.status(201).json({ message: 'User registered successfully' });
         
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server Error during registration' });
    }
};

const setOrganization = async (req,res)=>{
  // Destructure organization name and slug from the request body.
  const {orgName,orgSlug} = req.body
    try{
    // Get the user ID from the authenticated user.
    const userId = req.user.id;
    // --- Validation ---
    // Check if an organization with the given slug already exists to ensure uniqueness.
    const isOrg = await Organization.findOne({ slug: orgSlug });
    if (isOrg) {
        return res.status(400).send({ ok: false, message: "Slug is already taken, it has to be unique" });
    }
    // --- QR Code Generation ---
    // Construct the URL that will be encoded into the QR code.
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const content = `${baseUrl}/feedback/${orgSlug}`;
    // Generate a data URL for the QR code image.
    const qrDataUrl = await QRCode.toDataURL(content, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H'
    });
    // --- Organization Creation ---
    // Prepare the data for the new organization.
    const orgData = {
      ownerId: userId,
      name :orgName,
      slug : orgSlug,
      content: content,
      qrDataUrl: qrDataUrl
    };
    
    // Create the new organization in the database.
    const org = await Organization.create(orgData);
    // --- Logo Handling ---
    // If a logo file was uploaded, process it.
    if (req.file) {
      // Upload the file buffer to Cloudinary using the modular helper function.
      const result = await uploadToCloudinary(req.file.buffer);
      
      // Create a new logo document in the database with the Cloudinary URL.
      await orgLogo.create({
        orgId: org._id,
        url: result.secure_url,
        public_id: result.public_id,
      });
    }
    // --- User Update ---
    // Update the user document to link it with the new organization.
    const user = await User.findByIdAndUpdate(
      userId,
      { hasOrganization: true, organizationId: org._id },
      { new: true } // Return the updated user document.
    );
    // --- Success Response ---
    // Send a success response with the user and organization data.
    return  res.status(201).send({ ok:true, user, organization: org})
    } catch(err){
        // --- Error Handling ---
        console.error("Organization setup error:", err);
        res.status(500).json({ message: "Server error during organization setup" });
    }
}

// =====================
// Login an existing user
// =====================
const login = async (req, res) => {
    const { email, password } = req.body;
    // Input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }
    try {
        // Find user by email
        let user = await User.findOne({ email});
        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }
        // Check if password matches (uses model's comparePassword method)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }
        // Generate new tokens
        const {accessToken, refreshToken } = generateTokens(user);
        let refresh = await RefreshToken.findOne({ userId: user._id });
        if (!refresh) {
          // Create new refresh token document if it doesn't exist
          refresh = new RefreshToken({
            userId: user._id,
            refreshTokens: []
          });
        }
        // Store refresh token in user document
        refresh.refreshTokens.push({ token: refreshToken });
        await refresh.save();
        
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Adjust for production
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        res.json({
          message: 'Logged in successfully',
          accessToken,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            hasOrganization: user.hasOrganization,
            organizationId: user.organizationId,
            currentPlan: user.currentPlan,
            subscriptionStatus : user.subscriptionStatus
          }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server Error during login' });
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
    const storedRefreshToken = await RefreshToken.findOne({ userId: decoded.user.id });
    
    if (!storedRefreshToken) {
      return res.status(403).json({ message: 'Refresh token not found for user' });
    }
    // Check if refresh token exists in user document
    const tokenExists = storedRefreshToken.refreshTokens.some(
      tokenObj => tokenObj.token === refreshTokenFromCookie
    );
    if (!tokenExists) {
      // Token might be compromised - remove all refresh tokens
      storedRefreshToken.refreshTokens = [];
      await storedRefreshToken.save();
      return res.status(403).json({ message: 'Invalid or revoked Refresh Token' });
    }

    // Get user from database
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate new access token
    const newAccessToken = jwt.sign(
      { user: { id: user.id } }, 
      ACCESS_SECRET, 
      { expiresIn: ACCESS_EXPIRATION }
    );
    res.json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
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
          const storedRefreshToken = await RefreshToken.findOne({ userId: decoded.user.id });
          
          if (storedRefreshToken) {
            // Remove the specific refresh token
            storedRefreshToken.refreshTokens = storedRefreshToken.refreshTokens.filter(
              tokenObj => tokenObj.token !== refreshToken
            );
            await storedRefreshToken.save();
          }
        }
        
        // Clear cookie
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
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
        id: user._id,
        username: user.username,
        email: user.email,
        hasOrganization: user.hasOrganization,
        organizationId: user.organizationId,
        currentPlan: user.currentPlan,
        subscriptionStatus : user.subscriptionStatus
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server Error while fetching profile' });
  }
};

export default {register,login,refreshToken,logout,setOrganization, upload, getProfile}