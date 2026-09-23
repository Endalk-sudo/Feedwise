import { Router, type Request, type Response, type NextFunction } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { resolveOrganizationMember, type OrganizationContext } from '@/middleware/organization.js';
import { pipeUIMessageStreamToResponse, type UIMessage } from 'ai';
import { chatSchema, chatStreamSchema } from './schemas.js';
import { chatWithAI, createChatMessageStream, answerAnalyticsQuery } from './service.js';
import { prisma } from '@/lib/prisma.js';
import { aiRateLimiter } from '@/middleware/rate-limit.js';

const router = Router();

/**
 * Pro-plan gate, runs BEFORE body validation so free-plan callers get the
 * documented 403 "Pro plan required" even when their payload would also fail
 * schema validation (previously /chat/stream returned a misleading 400).
 * The resolved org/member is cached on res.locals for chatContext.
 */
async function requireProPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;
    const userId = (req as Request & { user: { id: string } }).user.id;
    const ctx = await resolveOrganizationMember(slug, userId);
    if (!ctx.organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    if (!ctx.member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (ctx.organization.currentPlan !== 'pro') {
      return res.status(403).json({ success: false, message: 'Pro plan required for AI chat' });
    }
    res.locals.chatAccess = ctx;
    next();
  } catch (error) {
    next(error);
  }
}

async function chatContext(slug: string, userId: string, pre?: OrganizationContext) {
  const { organization, member } = pre ?? (await resolveOrganizationMember(slug, userId));
  if (!organization) {
    return { ok: false as const, status: 404, message: 'Organization not found' };
  }
  if (!member) {
    return { ok: false as const, status: 403, message: 'Forbidden' };
  }
  if (organization.currentPlan !== 'pro') {
    return { ok: false as const, status: 403, message: 'Pro plan required for AI chat' };
  }

  // Recent feedback as chat context
  const feedbacks = await prisma.feedback.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return { ok: true as const, feedbacks };
}

// AI Chat endpoint (protected, Pro only)
router.post(
  '/:slug/chat',
  authMiddleware,
  aiRateLimiter,
  requireProPlan,
  validate(chatSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { message } = req.body;
      const userId = (req as any).user.id;

      const ctx = await chatContext(slug, userId, res.locals.chatAccess);
      if (!ctx.ok) {
        return res.status(ctx.status).json({ success: false, message: ctx.message });
      }

      const reply = await chatWithAI(message, ctx.feedbacks);
      res.json({ success: true, data: { reply } });
    } catch (error) {
      next(error);
    }
  },
);

// Phase 7 (E1): NLQ — keyword-routed structured cards + Gemini summary.
// Same Pro gate + feedback context as the stream endpoint.
router.post(
  '/:slug/nlq',
  authMiddleware,
  aiRateLimiter,
  requireProPlan,
  validate(chatSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { message } = req.body;
      const userId = (req as any).user.id;

      const ctx = await chatContext(slug, userId, res.locals.chatAccess);
      if (!ctx.ok) {
        return res.status(ctx.status).json({ success: false, message: ctx.message });
      }
      const organization = res.locals.chatAccess.organization;
      const data = await answerAnalyticsQuery(message, organization.id, ctx.feedbacks);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

// AI Chat streaming endpoint (protected, Pro only) — AI SDK UI-message
// stream protocol, consumed by useChat + DefaultChatTransport.
router.post(
  '/:slug/chat/stream',
  authMiddleware,
  aiRateLimiter,
  // Gate before validate: free-plan + invalid body must yield 403, not 400.
  requireProPlan,
  validate(chatStreamSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { messages } = req.body as { messages: UIMessage[] };
      const userId = (req as any).user.id;

      const ctx = await chatContext(slug, userId, res.locals.chatAccess);
      if (!ctx.ok) {
        return res.status(ctx.status).json({ success: false, message: ctx.message });
      }

      const stream = await createChatMessageStream(messages, ctx.feedbacks);
      await pipeUIMessageStreamToResponse({ response: res, stream });
    } catch (error) {
      if (!res.headersSent) {
        next(error);
        return;
      }
      res.end();
    }
  },
);

export { router as aiRoutes };
