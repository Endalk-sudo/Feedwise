import { createHash } from 'node:crypto';
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
  draftReplyParamsSchema,
  verifyFeedbackSchema,
} from './schemas.js';
import { listWebhooks, createWebhook, deleteWebhook } from '@/features/webhooks/service.js';
import { createWebhookSchema, webhookParamsSchema } from './schemas.js';
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
router.post(
  '/:slug',
  feedbackRateLimiter,
  validate(submitFeedbackSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { text, rating, contextTags } = req.body;
      // `trust proxy` (app.ts) makes req.ip the real client IP behind nginx.
      // Do NOT fall back to x-forwarded-for directly: without the proxy setting
      // it is client-spoofable. Hash before persisting — raw IPs are PII with no
      // retention policy; a salted hash still supports dedupe/abuse analysis.
      const ip = req.ip;
      const ipHash = ip ? createHash('sha256').update(`fw-ip:${ip}`).digest('hex') : undefined;
      const feedback = await feedbackService.submit(slug, text, {
        ipAddress: ipHash,
        rating,
        contextTags,
      });
      res.status(201).json({ success: true, data: feedback });
    } catch (error) {
      next(error);
    }
  },
);

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
router.get(
  '/:slug/stats',
  authMiddleware,
  validate(feedbackParamsSchema),
  async (req, res, next) => {
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
  },
);

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

// Phase 4 (D1/F6): read-only Gemini owner-reply draft preview (member-only).
router.get(
  '/:slug/:id/draft-reply',
  authMiddleware,
  validate(draftReplyParamsSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const id = req.params.id as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const draft = await feedbackService.draftReply(id, result.organization.id);
      if (draft == null) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }
      res.json({ success: true, data: { draft } });
    } catch (error) {
      next(error);
    }
  },
);

// Phase 6 (D3): manual verification toggle — trust badge source of truth.
router.patch(
  '/:slug/:id/verify',
  authMiddleware,
  validate(verifyFeedbackSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const id = req.params.id as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const updated = await feedbackService.verify(id, result.organization.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

// Phase 6 (V3/F7): outbound webhook subscriptions (owner/admin via service).
router.get(
  '/:slug/webhooks',
  authMiddleware,
  validate(feedbackParamsSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const data = await listWebhooks(result.organization.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/:slug/webhooks',
  authMiddleware,
  validate(createWebhookSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      const data = await createWebhook(result.organization.id, userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:slug/webhooks/:id',
  authMiddleware,
  validate(webhookParamsSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const id = req.params.id as string;
      const userId = (req as any).user.id;
      const result = await requireMember(slug, userId);
      if (!result.ok) {
        return res.status(result.status).json({ success: false, message: result.message });
      }
      await deleteWebhook(result.organization.id, id);
      res.json({ success: true, message: 'Webhook removed' });
    } catch (error) {
      next(error);
    }
  },
);

export { router as feedbackRoutes };
