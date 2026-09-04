import { Router } from 'express';
import multer from 'multer';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { z } from 'zod';
import { prisma } from '@/lib/prisma.js';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary.js';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

const updateSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    logo: z.string().url().optional().or(z.literal('')),
  }),
});

// Upload logo
router.post('/logo', authMiddleware, upload.single('logo'), async (req, res, next) => {
  try {
    const { slug } = req.query;
    const userId = (req as any).user.id;

    if (!slug || !req.file) {
      return res.status(400).json({ success: false, message: 'Missing slug or file' });
    }

    const organization = await prisma.organization.findUnique({ where: { slug: slug as string } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: organization.id } },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Delete old logo if exists
    if (organization.logo) {
      const publicId = organization.logo.split('/').pop()?.split('.')[0];
      if (publicId) await deleteFromCloudinary(`organizations/${organization.id}/${publicId}`);
    }

    // Upload new logo
    const result = await uploadToCloudinary(req.file.buffer, `organizations/${organization.id}`);

    await prisma.organization.update({
      where: { id: organization.id },
      data: { logo: result.secure_url },
    });

    res.json({ success: true, data: { logo: result.secure_url } });
  } catch (error) {
    next(error);
  }
});

// Update organization settings
router.put('/:slug', authMiddleware, validate(updateSettingsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: organization.id } },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export { router as settingsRoutes };