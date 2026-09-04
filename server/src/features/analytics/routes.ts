import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { z } from 'zod';
import { analyticsService } from './service.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

const analyticsParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    days: z.coerce.number().positive().max(365).optional(),
  }),
});

// All analytics routes require authentication and membership
router.use(authMiddleware);

// Sentiment trends
router.get('/:slug/sentiment', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const days = Number(req.query.days ?? 30);
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: organization.id },
      },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getSentimentTrends(organization.id, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Category breakdown
router.get('/:slug/categories', validate(analyticsParamsSchema), async (req, res, next) => {
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

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getCategoryBreakdown(organization.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Heatmap
router.get('/:slug/heatmap', validate(analyticsParamsSchema), async (req, res, next) => {
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

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getHeatmap(organization.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Top issues
router.get('/:slug/issues', validate(analyticsParamsSchema), async (req, res, next) => {
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

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getTopIssues(organization.id);
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
    const userId = (req as any).user.id;

    const organization = await prisma.organization.findUnique({ where: { slug } });
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: organization.id } },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getAlerts(organization.id, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Recommendations (Pro only)
router.get('/:slug/recommendations', validate(analyticsParamsSchema), async (req, res, next) => {
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

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (organization.currentPlan !== 'pro') {
      return res.status(403).json({ success: false, message: 'Pro plan required for recommendations' });
    }

    const data = await analyticsService.getRecommendations(organization.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };