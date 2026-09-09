import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { feedbackRateLimiter } from '@/middleware/rate-limit.js';
import { feedbackService } from './service.js';
import {
  submitFeedbackSchema,
  getFeedbacksSchema,
  feedbackParamsSchema,
  updateFeedbackStatusSchema,
  correctFeedbackSchema,
} from './schemas.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

async function requireMember(slug: string, userId: string) {
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization) {
    return { ok: false as const, status: 404, message: 'Organization not found' };
  }
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: organization.id } },
  });
  if (!member) {
    return { ok: false as const, status: 403, message: 'Forbidden' };
  }
  return { ok: true as const, organization, member };
}

// Public - submit feedback (rate limited)
router.post('/:slug', feedbackRateLimiter, validate(submitFeedbackSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const { text, rating, contextTags } = req.body;
    const ip = (req.ip || req.headers['x-forwarded-for']) as string | undefined;
    const feedback = await feedbackService.submit(slug, text, {
      ipAddress: typeof ip === 'string' ? ip : undefined,
      rating,
      contextTags,
    });
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

// Protected - list feedbacks
router.get('/:slug', authMiddleware, validate(getFeedbacksSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;
    const result = await requireMember(slug, userId);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const data = await feedbackService.getFeedbacks(result.organization.id, req.query as any);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Protected - stats (includes top actions + acted-on rate)
router.get('/:slug/stats', authMiddleware, validate(feedbackParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const userId = (req as any).user.id;
    const result = await requireMember(slug, userId);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const stats = await feedbackService.getStats(result.organization.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// Protected - single feedback
router.get('/:slug/:id', authMiddleware, validate(feedbackParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const result = await requireMember(slug, userId);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const feedback = await feedbackService.getFeedbackById(id, result.organization.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
});

// Protected - close the loop (status / reply / note)
router.patch(
  '/:slug/:id/status',
  authMiddleware,
  validate(updateFeedbackStatusSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const id = req.params.id as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const updated = await feedbackService.updateStatus(id, result.organization.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

// Protected - human correction of AI analysis
router.patch(
  '/:slug/:id/correct',
  authMiddleware,
  validate(correctFeedbackSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const id = req.params.id as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const updated = await feedbackService.correctAnalysis(id, result.organization.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

export { router as feedbackRoutes };
