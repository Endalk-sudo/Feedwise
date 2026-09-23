import { Router } from 'express';
import multer from 'multer';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { logoQuerySchema, updateSettingsSchema, getSettingsSchema } from './schemas.js';
import { SettingsError, getSettings, updateSettings, uploadLogo } from './service.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function settingsError(res: import('express').Response, error: unknown): boolean {
  if (error instanceof SettingsError) {
    res.status(error.status).json({ success: false, message: error.message });
    return true;
  }
  return false;
}

// Upload logo (owner/admin)
router.post(
  '/logo',
  authMiddleware,
  upload.single('logo'),
  validate(logoQuerySchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Logo file is required' });
      }

      const data = await uploadLogo(req.query.slug as string, userId, req.file);
      res.json({ success: true, data });
    } catch (error) {
      if (!settingsError(res, error)) next(error);
    }
  },
);

// Get organization settings (members)
router.get('/:slug', authMiddleware, validate(getSettingsSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const data = await getSettings(req.params.slug as string, userId);
    res.json({ success: true, data });
  } catch (error) {
    if (!settingsError(res, error)) next(error);
  }
});

// Update organization settings (owner/admin)
router.put('/:slug', authMiddleware, validate(updateSettingsSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { name, logo } = req.body;
    const data = await updateSettings(req.params.slug as string, userId, { name, logo });
    res.json({ success: true, data });
  } catch (error) {
    if (!settingsError(res, error)) next(error);
  }
});

export { router as settingsRoutes };
