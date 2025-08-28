import Organization from '../models/Organization.js';

/**
 * Update organization settings (business name)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateOrganizationSettings = async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Business name is required' 
      });
    }

    // Find organization by owner ID or create if it doesn't exist
    let organization = await Organization.findOne({ ownerId: user.id });
    
    if (!organization) {
      // Create new organization if it doesn't exist
      organization = new Organization({
        ownerId: user.id,
        name: name.trim(),
        slug: name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        content: "Default content", // You might want to change this
        qrDataUrl: "Default QR URL" // You might want to change this
      });
    } else {
      // Update existing organization
      organization.name = name.trim();
      
      // Generate slug if not exists
      if (!organization.slug) {
        organization.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
    }

    const updatedOrganization = await organization.save();
    
    return res.status(200).json({ 
      success: true, 
      data: {
        id: updatedOrganization._id,
        name: updatedOrganization.name,
        slug: updatedOrganization.slug,
        updatedAt: updatedOrganization.updatedAt
      }
    });

  } catch (error) {
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