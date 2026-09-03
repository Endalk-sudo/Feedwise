import LogoImage from "../models/OrgLogo.js";
import Organization from '../models/Organization.js';
import {uploadToCloudinary,deleteFromCloudinary} from '../utils/uploadHelper.js';

/**
 * Update organization settings (business name)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

export const updateOrganizationSettings = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;
    const file = req.file; // The uploaded file from multer

    // Validate business name input
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    // Find the user's organization
    let organization = await Organization.findOne({ ownerId: user.id });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // --- Logo Update Logic ---
    // Check if a new logo file has been uploaded
    if (file) {
      // Step 1: Upload the new logo to Cloudinary from the buffer
      const cloudinaryResponse = await uploadToCloudinary(file.buffer);

      // Step 2: Find the existing logo record in the database
      const existingImage = await LogoImage.findOne({ orgId: organization._id });

      // Step 3: If an old logo exists, delete it from Cloudinary.
      // This is done *after* the new one is successfully uploaded to prevent data loss.
      if (existingImage && existingImage.public_id) {
        await deleteFromCloudinary(existingImage.public_id);
      }

      // Step 4: Update or create the logo record in the database.
      if (existingImage) {
        // If a logo record already exists, update its URL and public_id
        existingImage.url = cloudinaryResponse.secure_url;
        existingImage.public_id = cloudinaryResponse.public_id;
        await existingImage.save();
      } else {
        // If no logo record exists, create a new one
        await LogoImage.create({
          orgId: organization._id,
          url: cloudinaryResponse.secure_url,
          public_id: cloudinaryResponse.public_id,
        });
      }
    }

    // --- Business Name Update Logic ---
    // Update the organization's name
    organization.name = name;
    await organization.save();

    // --- Success Response ---
    // Send a success response
    return res.status(200).json({
      success: true,
      message: "Settings updated successfully"
    });

  } catch (error) {
    // --- Error Handling ---
    // Log the error for debugging and send a generic server error response
    console.error('Error updating organization settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update organization settings'
    });
  }
};

/**
 * Get organization settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOrganizationSettings = async (req, res) => {
  try {
    const user = req.user;

    const organization = await Organization.findOne({ ownerId: user.id })
      .select('name slug createdAt updatedAt');
    
    if (!organization) {
      return res.status(404).json({ 
        success: false, 
        error: 'Organization not found' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: organization 
    });

  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch organization settings' 
    });
  }
};