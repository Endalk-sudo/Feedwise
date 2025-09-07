import {v2 as cloudinary} from 'cloudinary';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken'; // For creating and verifying JWTs
import User from '../models/User.js'; // User model (MongoDB)
import RefreshToken from '../models/RefreshToken.js'; // Refresh token model
import Organization from "../models/Organization.js"
import orgLogo from "../models/OrgLogo.js"
import dotenv from "dotenv";
import ms from 'ms';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/uploadHelper.js';

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS; // Secret key for signing access tokens
const REFRESH_SECRET = process.env.JWT_SECRET_REFRESH; // Secret key for signing refresh tokens
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_TOKEN_EXPIRATION; // How long access tokens are valid
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_TOKEN_EXPIRATION;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// --- Multer Configuration for In-Memory Storage ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Helper function to generate access and refresh tokens for a user
const generateTokens = (user) => {
    const payload = {
        user: {
            id: user.id,
            roles: user.roles, // Include user roles in the token for authorization
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

    try {
        // Check if user already exists
        let user = await User.findOne({ email});
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

         if (!emailRegex.test(email)) { // <--- Changed this line
        return res.status(400).json({ msg: 'Please enter a valid email address.' });
    }

        // Create new user (password will be hashed in the model)
        user = new User({
            username,
            email,
            password,
            });

        await user.save(); // Save user to database

       
        // Generate tokens for the new user
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in DB for future validation
        const newRefreshToken = new RefreshToken({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + ms(REFRESH_EXPIRATION)), // Set expiration
        });
        await newRefreshToken.save();
        
        res.status(201).json({
            msg: 'User registered successfully',
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, email: user.email},
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
        console.log("error",err.message);
        res.status(500).json({ message: "Server error" });
    }
}






// =====================
// Login an existing user
// =====================
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        let user = await User.findOne({ email});
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if password matches (uses model's comparePassword method)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Generate new tokens
        const {accessToken, refreshToken } = generateTokens(user);

        // Remove old refresh tokens for this user and save the new one
        await RefreshToken.deleteMany({ userId: user.id });
        const newRefreshToken = new RefreshToken({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + ms(REFRESH_EXPIRATION)),
        });
        await newRefreshToken.save();

        res.json({
            msg: 'Logged in successfully',
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, email: user.email, hasOrganization: user.hasOrganization ,organizationId: user.organizationId},
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ... (imports and generateTokens helper function)

// In authController.js, update the refreshToken function:
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ msg: 'Refresh Token not provided' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Check if refresh token exists in DB and is valid
    const storedRefreshToken = await RefreshToken.findOne({ 
      token: refreshToken, 
      userId: decoded.user.id 
    });

    if (!storedRefreshToken) {
      return res.status(403).json({ msg: 'Invalid or revoked Refresh Token' });
    }

    // Check if refresh token has expired
    if (new Date() > storedRefreshToken.expiresAt) {
      await RefreshToken.deleteOne({ _id: storedRefreshToken._id });
      return res.status(403).json({ msg: 'Refresh Token expired' });
    }

    // Get user from database
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { user: { id: user.id, roles: user.roles } }, 
      ACCESS_SECRET, 
      { expiresIn: ACCESS_EXPIRATION }
    );

    res.json({
      accessToken: newAccessToken,
    });

  } catch (err) {
    console.error(err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ msg: 'Refresh Token expired', code: 'REFRESH_TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ msg: 'Invalid Refresh Token' });
    }
    res.status(500).send('Server Error');
  }
};

// ... (other exports)

const logout = async (req, res) => {
    // Invalidate the refresh token by deleting it from the database
    // This assumes the refresh token is sent in the request body for logout
    const { refreshToken } = req.body; // <--- Correctly extracts refresh token from body

    if (!refreshToken) {
        return res.status(400).json({ msg: 'Refresh token is required for logout' });
    }

    try {
        // Optionally verify the refresh token first before deleting
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET); // This ensures the refresh token format is valid

        // Delete the refresh token from the database
        const result = await RefreshToken.deleteOne({ token: refreshToken, userId: decoded.user.id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'Refresh token not found or already revoked' });
        }

        res.status(200).json({ msg: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        // Catch JWT errors if the refresh token format is invalid or it's expired
        if (err.name === 'TokenExpiredError') {
             return res.status(400).json({ msg: 'Refresh token provided for logout is expired' });
        }
        res.status(500).send('Server Error during logout');
    }
};

export default {register,login,refreshToken,logout,setOrganization, upload}
