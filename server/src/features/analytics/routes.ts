import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { resolveOrganizationMember } from '@/middleware/organization.js';
import { analyticsParamsSchema } from './schemas.js';
import { analyticsService } from './service.js';

const router = Router();

// All analytics routes require authentication and membership
router.use(authMiddleware);

async function orgContext(
  slug: string,
  userId: string,
): Promise<
  | { ok: true; organizationId: string; plan: string | null }
  | { ok: false; status: number; message: string }
> {
  const { organization, member } = await resolveOrganizationMember(slug, userId);
  if (!organization) {
    return { ok: false, status: 404, message: 'Organization not found' };
  }
  if (!member) {
    return { ok: false, status: 403, message: 'Forbidden' };
  }
  return { ok: true, organizationId: organization.id, plan: organization.currentPlan };
}

// Sentiment trends
router.get('/:slug/sentiment', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const days = Number(req.query.days ?? 30);
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const data = await analyticsService.getSentimentTrends(ctx.organizationId, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Category breakdown
router.get('/:slug/categories', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const data = await analyticsService.getCategoryBreakdown(ctx.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Heatmap
router.get('/:slug/heatmap', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const data = await analyticsService.getHeatmap(ctx.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Top issues
router.get('/:slug/issues', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const data = await analyticsService.getTopIssues(ctx.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Alerts
router.get('/:slug/alerts', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const days = Number(req.query.days ?? 15);
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const data = await analyticsService.getAlerts(ctx.organizationId, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Recommendations (Pro only)
router.get('/:slug/recommendations', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    if (ctx.plan !== 'pro') {
      return res
        .status(403)
        .json({ success: false, message: 'Pro plan required for recommendations' });
    }

    const data = await analyticsService.getRecommendations(ctx.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
