import express, { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.js';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma.js';
import { env } from '@/lib/env.js';

const router = Router();

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Minimal view of the Stripe subscription fields we persist.
 * Stripe's TS types vary across API versions, so we read through
 * this view instead of depending on exact SDK field names.
 */
interface SubscriptionView {
  id: string;
  status: string;
  metadata: { plan?: string };
  items: { data: Array<{ price?: { id?: string } | string | null }> };
  current_period_end: number;
  cancel_at_period_end: boolean;
}

function toSubscriptionView(subscription: Stripe.Subscription): SubscriptionView {
  return subscription as unknown as SubscriptionView;
}

function periodEndDate(view: SubscriptionView): Date {
  return new Date(view.current_period_end * 1000);
}

function priceIdOf(view: SubscriptionView): string | null {
  const price = view.items.data[0]?.price;
  if (!price || typeof price === 'string') return null;
  return price.id ?? null;
}

// Create checkout session
router.post('/checkout', authMiddleware, async (req, res, next) => {
  try {
    const { plan } = req.body as { plan?: string };
    const userId = (req as { user?: { id: string; email?: string } }).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (plan !== 'basic' && plan !== 'pro') {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // Get user's organization
    const member = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!member) {
      return res.status(400).json({ success: false, message: 'No organization found' });
    }

    const organization = member.organization;

    // Get or create Stripe customer
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (req as { user?: { email?: string } }).user?.email,
        name: organization.name,
        metadata: { organizationId: organization.id },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID
    const priceId = plan === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_BASIC_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.CLIENT_URL}/dashboard/settings?payment=success`,
      cancel_url: `${env.CLIENT_URL}/dashboard/settings?payment=cancelled`,
      metadata: {
        organizationId: organization.id,
        plan,
      },
      subscription_data: {
        metadata: {
          organizationId: organization.id,
          plan,
        },
      },
    });

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    next(error);
  }
});

// Create billing portal session
router.post('/portal', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as { user?: { id: string } }).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const member = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!member?.organization.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: member.organization.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/dashboard/settings`,
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    next(error);
  }
});

// Verify checkout session
router.get('/verify-session/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId as string;

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const organizationId = session.metadata?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Invalid session' });
    }

    // Verify user owns this organization
    const userId = (req as { user?: { id: string } }).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });

    if (!member) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (session.payment_status === 'paid' && session.subscription) {
      const view = toSubscriptionView(session.subscription as Stripe.Subscription);
      const plan = view.metadata.plan ?? 'basic';

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: view.status,
          currentPlan: plan,
          stripeSubscriptionId: view.id,
          stripePriceId: priceIdOf(view),
          stripeCurrentPeriodEnd: periodEndDate(view),
        },
      });

      await prisma.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: view.id,
          stripePriceId: priceIdOf(view),
          stripeCurrentPeriodEnd: periodEndDate(view),
          status: view.status,
        },
        update: {
          stripeSubscriptionId: view.id,
          stripePriceId: priceIdOf(view),
          stripeCurrentPeriodEnd: periodEndDate(view),
          status: view.status,
        },
      });
    }

    res.json({ success: true, data: { status: session.payment_status } });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook (mounted with express.raw body parser in index.ts)
export async function handleWebhook(req: express.Request, res: express.Response) {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    if (typeof sig !== 'string') throw new Error('Missing stripe-signature header');
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        if (organizationId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const view = toSubscriptionView(subscription);
          const plan = view.metadata.plan ?? 'basic';
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionStatus: view.status,
              currentPlan: plan,
              stripeSubscriptionId: view.id,
              stripePriceId: priceIdOf(view),
              stripeCurrentPeriodEnd: periodEndDate(view),
            },
          });

          await prisma.subscription.upsert({
            where: { organizationId },
            create: {
              organizationId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: view.id,
              stripePriceId: priceIdOf(view),
              stripeCurrentPeriodEnd: periodEndDate(view),
              status: view.status,
            },
            update: {
              stripeSubscriptionId: view.id,
              stripePriceId: priceIdOf(view),
              stripeCurrentPeriodEnd: periodEndDate(view),
              status: view.status,
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as unknown as { subscription?: string | null };
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const view = toSubscriptionView(subscription);
          const org = await prisma.organization.findFirst({
            where: { stripeSubscriptionId: view.id },
          });
          if (org) {
            await prisma.organization.update({
              where: { id: org.id },
              data: {
                subscriptionStatus: view.status,
                stripeCurrentPeriodEnd: periodEndDate(view),
              },
            });

            await prisma.subscription.update({
              where: { organizationId: org.id },
              data: {
                stripeCurrentPeriodEnd: periodEndDate(view),
                status: view.status,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const view = toSubscriptionView(subscription);
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: view.id },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: 'canceled',
              currentPlan: 'basic',
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
            },
          });

          await prisma.subscription.update({
            where: { organizationId: org.id },
            data: { status: 'canceled' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as { subscription?: string | null };
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const view = toSubscriptionView(subscription);
          const org = await prisma.organization.findFirst({
            where: { stripeSubscriptionId: view.id },
          });
          if (org) {
            await prisma.organization.update({
              where: { id: org.id },
              data: { subscriptionStatus: 'past_due' },
            });
            await prisma.subscription.update({
              where: { organizationId: org.id },
              data: { status: 'past_due' },
            });
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

export { router as paymentRoutes };
