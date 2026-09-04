import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authRateLimiter } from '@/middleware/rate-limit.js';
import { meSchema, hasOrgSchema } from './schemas.js';
import { getSessionUser, getOrganizationStatus } from './service.js';

const router = Router();

// Better Auth handles sign-up/sign-in natively at /api/auth/*
// This router holds custom auth-related endpoints only.
router.use(authRateLimiter);

// Get current session (alternative to Better Auth's built-in endpoint)
router.get('/me', validate(meSchema), async (req, res, next) => {
  try {
    const session = await getSessionUser(req.headers);

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Check if user has organization
router.get('/has-org', validate(hasOrgSchema), async (req, res, next) => {
  try {
    const session = await getSessionUser(req.headers);

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const data = await getOrganizationStatus(session.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
