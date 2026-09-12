import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { resolveOrganizationMember } from '@/middleware/organization.js';
import {
  analyticsParamsSchema,
  retentionRiskParamsSchema,
  analyticsExportParamsSchema,
} from './schemas.js';
import { analyticsService } from './service.js';
import { validateApiToken } from '@/features/webhooks/service.js';

const router = Router();

// Phase 6 (D4): token-auth analytics read — BEFORE the cookie-session
// middleware below. `Authorization: Bearer fw_...` for CRM/Slack/POS.
router.get('/:slug/token/sentiment', async (req, res) => {
  const slug = req.params.slug as string;
  const bearer = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const token = await validateApiToken(slug, bearer, 'analytics:read');
  if (!token) return res.status(401).json({ success: false, message: 'Invalid API token' });
  const days = Number(req.query.days ?? 30);
  const data = await analyticsService.getSentimentTrends(token.organizationId, days);
  res.json({ success: true, data });
});

// All analytics routes below require authentication and membership
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

// Phase 5 (F1): retention-risk aggregate (Pro only, cookie session).
router.get('/:slug/retention-risk', validate(retentionRiskParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }
    if (ctx.plan !== 'pro') {
      return res
        .status(403)
        .json({ success: false, message: 'Pro plan required for retention risk' });
    }
    const days = Number(req.query.days ?? 30);
    const data = await analyticsService.getRetentionRisk(ctx.organizationId, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Phase 6 (V3): CSV export — the button in AnalyticsPage links here.
router.get('/:slug/export', validate(analyticsExportParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }
    const days = Number((req.query as { days?: number }).days ?? 90);
    const rows = await analyticsService.getExportRows(ctx.organizationId, days);
    const header =
      'id,text,category,rating,sentiment,urgency,satisfaction,fixable,concrete_issue,retention_risk,verified,status,owner_reply,created_at';
    // CWE-1236: neutralize spreadsheet formula injection. Customer-controlled
    // text like `=HYPERLINK(...)` or `=WEBSERVICE(...)` must not execute when
    // the export is opened in Excel/Sheets — prefix dangerous leading chars.
    const esc = (v: unknown) => {
      if (v == null) return '';
      let s = String(v).replaceAll('"', '""');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = rows.map((r) =>
      [
        r.id, r.text, r.category, r.rating, r.sentiment, r.urgency,
        r.satisfactionEstimate, r.fixableProblem, r.concreteIssue,
        r.retentionRisk, r.verified, r.status, r.ownerReply, r.createdAt.toISOString(),
      ]
        .map(esc)
        .join(','),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${slug}.csv"`);
    res.send([header, ...lines].join('\n'));
  } catch (error) {
    next(error);
  }
});

// Phase 7 (F4): staff performance (members; org totals from audit fields).
router.get('/:slug/staff-performance', validate(analyticsParamsSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await orgContext(slug, (req as any).user.id);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }
    const data = await analyticsService.getStaffPerformance(ctx.organizationId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
