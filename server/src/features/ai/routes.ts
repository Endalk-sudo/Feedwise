import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { resolveOrganizationMember } from '@/middleware/organization.js';
import { pipeUIMessageStreamToResponse, type UIMessage } from 'ai';
import { chatSchema, chatStreamSchema } from './schemas.js';
import { chatWithAI, createChatMessageStream } from './service.js';
import { prisma } from '@/lib/prisma.js';
import { aiRateLimiter } from '@/middleware/rate-limit.js';

const router = Router();

async function chatContext(slug: string, userId: string) {
  const { organization, member } = await resolveOrganizationMember(slug, userId);
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
router.post('/:slug/chat', authMiddleware, aiRateLimiter, validate(chatSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const { message } = req.body;
    const userId = (req as any).user.id;

    const ctx = await chatContext(slug, userId);
    if (!ctx.ok) {
      return res.status(ctx.status).json({ success: false, message: ctx.message });
    }

    const reply = await chatWithAI(message, ctx.feedbacks);
    res.json({ success: true, data: { reply } });
  } catch (error) {
    next(error);
  }
});

// AI Chat streaming endpoint (protected, Pro only) — AI SDK UI-message
// stream protocol, consumed by useChat + DefaultChatTransport.
router.post(
  '/:slug/chat/stream',
  authMiddleware,
  validate(chatStreamSchema),
  async (req, res, next) => {
    try {
      const slug = req.params.slug as string;
      const { messages } = req.body as { messages: UIMessage[] };
      const userId = (req as any).user.id;

      const ctx = await chatContext(slug, userId);
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
