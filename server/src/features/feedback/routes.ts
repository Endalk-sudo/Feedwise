import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { feedbackRateLimiter } from '@/middleware/rate-limit.js';
import { feedbackService } from './service.js';
import { submitFeedbackSchema, getFeedbacksSchema, feedbackParamsSchema } from './schemas.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

// Public - submit feedback (with rate limiting)
router.post('/:slug', feedbackRateLimiter, validate(submitFeedbackSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const { text } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const feedback = await feedbackService.submit(slug, text, ip);
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

// Protected - get feedbacks
router.get('/:slug', authMiddleware, validate(getFeedbacksSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check membership
    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden - Not a member of this organization' });
    }

    const result = await feedbackService.getFeedbacks(organization.id, req.query as any);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Get feedback stats (protected)
router.get('/:slug/stats', authMiddleware, validate(feedbackParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const stats = await feedbackService.getStats(organization.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Get single feedback (protected)
router.get('/:slug/:id', authMiddleware, validate(feedbackParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const id = req.params.id as string;
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const feedback = await feedbackService.getFeedbackById(id, organization.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

export { router as feedbackRoutes };