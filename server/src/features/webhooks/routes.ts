import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { resolveOrganizationMember } from '@/middleware/organization.js';
import { z } from 'zod';
import {
  issueApiToken,
  listApiTokens,
  revokeApiToken,
  listWebhookLogs,
} from '@/features/webhooks/service.js';

const router = Router();

const tokenParams = z.object({ params: z.object({ slug: z.string().min(1) }) });
const issueTokenSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80).optional(),
    scopes: z.array(z.string().max(40)).max(10).optional(),
    expiresInDays: z.coerce.number().int().positive().max(365).optional(),
  }),
  params: z.object({ slug: z.string().min(1) }),
});
const revokeTokenSchema = z.object({
  params: z.object({ slug: z.string().min(1), id: z.string().cuid() }),
});
const logsQuery = z.object({
  params: z.object({ slug: z.string().min(1) }),
  query: z.object({ limit: z.coerce.number().int().positive().max(50).optional() }),
});

async function requireManager(slug: string, userId: string) {
  const { organization, member } = await resolveOrganizationMember(slug, userId);
  if (!organization) return { ok: false as const, status: 404, message: 'Organization not found' };
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return { ok: false as const, status: 403, message: 'Forbidden - owner/admin only' };
  }
  return { ok: true as const, organizationId: organization.id };
}

// Phase 6 (D4): issue a scoped public API token (plaintext shown once).
router.post('/:slug/tokens', authMiddleware, validate(issueTokenSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await requireManager(slug, (req as any).user.id);
    if (!ctx.ok) return res.status(ctx.status).json({ success: false, message: ctx.message });
    const data = await issueApiToken(ctx.organizationId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug/tokens', authMiddleware, validate(tokenParams), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await requireManager(slug, (req as any).user.id);
    if (!ctx.ok) return res.status(ctx.status).json({ success: false, message: ctx.message });
    res.json({ success: true, data: await listApiTokens(ctx.organizationId) });
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/:slug/tokens/:id',
  authMiddleware,
  validate(revokeTokenSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const ctx = await requireManager(slug, (req as any).user.id);
      if (!ctx.ok) return res.status(ctx.status).json({ success: false, message: ctx.message });
      await revokeApiToken(ctx.organizationId, req.params.id as string);
      res.json({ success: true, message: 'Token revoked' });
    } catch (error) {
      next(error);
    }
  },
);

// Phase 6 (V3/F7): outbound webhook delivery log.
router.get('/:slug/webhooks/logs', authMiddleware, validate(logsQuery), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const ctx = await requireManager(slug, (req as any).user.id);
    if (!ctx.ok) return res.status(ctx.status).json({ success: false, message: ctx.message });
    const limit = Number((req.query as { limit?: number }).limit ?? 20);
    res.json({ success: true, data: await listWebhookLogs(ctx.organizationId, limit) });
  } catch (error) {
    next(error);
  }
});

export { router as webhooksRoutes };
