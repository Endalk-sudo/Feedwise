import express, { Router } from 'express';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { checkoutSchema, verifySessionSchema } from './schemas.js';
import {
  PaymentError,
  createCheckoutSession,
  createPortalSession,
  verifyAndApplySession,
  handleStripeEvent,
} from './service.js';

// Re-exported for jobs and tests (single Stripe client instance).
export { stripe } from './service.js';

const router = Router();

function paymentError(res: express.Response, error: unknown) {
  if (error instanceof PaymentError) {
    res.status(error.status).json({ success: false, message: error.message });
    return true;
  }
  return false;
}

// Create checkout session
router.post('/checkout', authMiddleware, validate(checkoutSchema), async (req, res, next) => {
  try {
    const user = (req as { user?: { id: string; email?: string } }).user;
    if (!user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await createCheckoutSession(user.id, user.email, req.body.plan);
    res.json({ success: true, data });
  } catch (error) {
    if (!paymentError(res, error)) next(error);
  }
});

// Create billing portal session
router.post('/portal', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as { user?: { id: string } }).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await createPortalSession(userId);
    res.json({ success: true, data });
  } catch (error) {
    if (!paymentError(res, error)) next(error);
  }
});

// Verify checkout session
router.get(
  '/verify-session/:sessionId',
  authMiddleware,
  validate(verifySessionSchema),
  async (req, res, next) => {
    try {
      const userId = (req as { user?: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const status = await verifyAndApplySession(req.params.sessionId as string, userId);
      res.json({ success: true, data: { status } });
    } catch (error) {
      if (!paymentError(res, error)) next(error);
    }
  },
);

// Stripe webhook (mounted with express.raw body parser in app.ts)
export async function handleWebhook(req: express.Request, res: express.Response) {
  try {
    await handleStripeEvent(req.body as Buffer, req.headers['stripe-signature'] as string);
    res.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentError) {
      return res.status(error.status).send(`Webhook Error: ${error.message}`);
    }
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export { router as paymentRoutes };
