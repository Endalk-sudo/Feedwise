import { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { z } from 'zod';
import { chatWithAI } from './service.js';
import { prisma } from '@/lib/prisma.js';

const router = Router();

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

// AI Chat endpoint (protected, Pro only)
router.post('/:slug/chat', authMiddleware, validate(chatSchema), async (req, res, next) => {
  try {
    const slug = req.params.slug as string;
    const { message } = req.body;
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
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Check if Pro plan
    if (organization.currentPlan !== 'pro') {
      return res.status(403).json({ success: false, message: 'Pro plan required for AI chat' });
    }

    // Get recent feedback for context
    const feedbacks = await prisma.feedback.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const reply = await chatWithAI(message, feedbacks);
    res.json({ success: true, data: { reply } });
  } catch (error) {
    next(error);
  }
});

export { router as aiRoutes };