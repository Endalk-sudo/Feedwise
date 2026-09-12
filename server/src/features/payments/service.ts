import Stripe from 'stripe';
import { prisma } from '@/lib/prisma.js';
import { env } from '@/lib/env.js';
import logger from '@/utils/logger.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class PaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Minimal view of the Stripe subscription fields we persist.
 * Stripe's TS types vary across API versions, so we read through
 * this view instead of depending on exact SDK field names.
 */
export interface SubscriptionView {
  id: string;
  status: string;
  metadata: { plan?: string };
  items: { data: Array<{ price?: { id?: string } | string | null }> };
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export function toSubscriptionView(subscription: Stripe.Subscription): SubscriptionView {
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

interface OrgWithId {
  id: string;
  name: string;
  stripeCustomerId: string | null;
}

/** Persist subscription state to Organization + Subscription rows. */
export async function applySubscriptionState(
  organizationId: string,
  view: SubscriptionView,
  customerId: string,
  plan?: string,
): Promise<void> {
  const data = {
    subscriptionStatus: view.status,
    currentPlan: plan ?? view.metadata.plan ?? 'basic',
    stripeSubscriptionId: view.id,
    stripePriceId: priceIdOf(view),
    stripeCurrentPeriodEnd: periodEndDate(view),
    cancelAtPeriodEnd: view.cancel_at_period_end,
  };

  await prisma.organization.update({ where: { id: organizationId }, data });

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: view.id,
      stripePriceId: priceIdOf(view),
      stripeCurrentPeriodEnd: periodEndDate(view),
      cancelAtPeriodEnd: view.cancel_at_period_end,
      status: view.status,
    },
    update: {
      stripeSubscriptionId: view.id,
      stripePriceId: priceIdOf(view),
      stripeCurrentPeriodEnd: periodEndDate(view),
      cancelAtPeriodEnd: view.cancel_at_period_end,
      status: view.status,
    },
  });
}

async function getOrCreateCustomerId(org: OrgWithId, email?: string): Promise<string> {
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name: org.name,
    metadata: { organizationId: org.id },
  });

  await prisma.organization.update({
    where: { id: org.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

async function memberOrganization(userId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!member) {
    throw new PaymentError(400, 'No organization found');
  }
  return member.organization;
}

/** Stripe subscription statuses where the customer is still being billed. */
const BILLING_ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);

/**
 * Guard for new checkouts: resolve the organization's existing subscription.
 * Returns the subscription view when it is still billing in Stripe (caller must
 * block and route to the billing portal). When the stored id is stale — the
 * subscription was canceled or deleted in Stripe — the pointer is cleared and
 * null is returned so a legitimate re-subscribe can proceed.
 */
async function activeSubscriptionOn(organization: { id: string; stripeSubscriptionId: string | null }) {
  if (!organization.stripeSubscriptionId) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
    const view = toSubscriptionView(subscription);
    if (BILLING_ACTIVE_STATUSES.has(view.status)) return view;

    logger.warn(
      `Org ${organization.id} pointed at non-billing subscription ${view.id} (status: ${view.status}); clearing stale pointer.`,
    );
    await prisma.organization.update({
      where: { id: organization.id },
      data: { stripeSubscriptionId: null },
    });
    return null;
  } catch (error) {
    // Subscription no longer retrievable (deleted in Stripe) — stale pointer.
    logger.warn(
      `Could not retrieve subscription ${organization.stripeSubscriptionId} for org ${organization.id}; clearing stale pointer: ${(error as Error).message}`,
    );
    await prisma.organization.update({
      where: { id: organization.id },
      data: { stripeSubscriptionId: null },
    });
    return null;
  }
}

/**
 * Heal a legacy double-subscription: when applying a new subscription to an org
 * that still points at a different, still-billing subscription, cancel the old
 * one so the customer is not charged for an orphaned plan. Never throws —
 * checkout state must still be applied.
 */
async function cancelPreviousSubscription(
  organizationId: string,
  newSubscriptionId: string,
): Promise<void> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeSubscriptionId: true },
  });
  const previousId = organization?.stripeSubscriptionId ?? null;
  if (!previousId || previousId === newSubscriptionId) return;

  try {
    const previous = toSubscriptionView(await stripe.subscriptions.retrieve(previousId));
    if (!BILLING_ACTIVE_STATUSES.has(previous.status)) return;
    // Cancel immediately without invoicing again: the new subscription takes
    // over billing from now on.
    await stripe.subscriptions.cancel(previousId, { invoice_now: false, prorate: false });
    logger.warn(
      `Cancelled orphaned subscription ${previousId} for org ${organizationId} (replaced by ${newSubscriptionId}).`,
    );
  } catch (error) {
    logger.warn(
      `Could not cancel previous subscription ${previousId} for org ${organizationId}: ${(error as Error).message}`,
    );
  }
}

/** Create a Checkout session for the user's first organization. */
export async function createCheckoutSession(
  userId: string,
  email: string | undefined,
  plan: 'basic' | 'pro',
): Promise<{ sessionId: string; url: string | null }> {
  const organization = await memberOrganization(userId);

  // Never start a second subscription while one is still billing — the old sub
  // would keep charging invisibly after applySubscriptionState overwrites the id.
  const existing = await activeSubscriptionOn(organization);
  if (existing) {
    throw new PaymentError(
      409,
      'This organization already has an active subscription. Use the billing portal to change or cancel your plan.',
    );
  }

  const customerId = await getOrCreateCustomerId(organization, email);
  const priceId = plan === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_BASIC_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.CLIENT_URL}/dashboard/settings?payment=success`,
    cancel_url: `${env.CLIENT_URL}/dashboard/settings?payment=cancelled`,
    metadata: { organizationId: organization.id, plan },
    subscription_data: { metadata: { organizationId: organization.id, plan } },
  });

  return { sessionId: session.id, url: session.url };
}

/** Create a billing-portal session for the user's organization. */
export async function createPortalSession(userId: string): Promise<{ url: string }> {
  const organization = await memberOrganization(userId);
  if (!organization.stripeCustomerId) {
    throw new PaymentError(400, 'No billing account found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${env.CLIENT_URL}/dashboard/settings`,
  });

  return { url: session.url };
}

/**
 * Verify a Checkout session belongs to the user's org and persist state.
 * Returns the Stripe payment status.
 */
export async function verifyAndApplySession(sessionId: string, userId: string): Promise<string> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    throw new PaymentError(400, 'Invalid session');
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!member) {
    throw new PaymentError(403, 'Forbidden');
  }

  if (session.payment_status === 'paid' && session.subscription) {
    const view =
      typeof session.subscription === 'string'
        ? toSubscriptionView(await stripe.subscriptions.retrieve(session.subscription))
        : toSubscriptionView(session.subscription);
    await cancelPreviousSubscription(organizationId, view.id);
    await applySubscriptionState(
      organizationId,
      view,
      session.customer as string,
      view.metadata.plan ?? 'basic',
    );
  }

  return session.payment_status;
}

/** Apply a verified webhook event. Throws PaymentError(400) on bad signature. */
export async function handleStripeEvent(
  rawBody: Buffer,
  signature: string | undefined,
): Promise<void> {
  let event: Stripe.Event;
  try {
    if (!signature) throw new Error('Missing stripe-signature header');
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new PaymentError(400, `Webhook Error: ${(err as Error).message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      if (organizationId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const view = toSubscriptionView(subscription);
        // Heal pre-guard double-subscriptions: cancel any still-billing sub the
        // org was previously pointed at before overwriting the pointer.
        await cancelPreviousSubscription(organizationId, view.id);
        await applySubscriptionState(
          organizationId,
          view,
          session.customer as string,
          view.metadata.plan ?? 'basic',
        );
      }
      break;
    }

    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as { subscription?: string | null };
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const view = toSubscriptionView(subscription);
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: view.id },
        });
        if (org) {
          const status = event.type === 'invoice.paid' ? view.status : 'past_due';
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: status,
              ...(event.type === 'invoice.paid'
                ? { stripeCurrentPeriodEnd: periodEndDate(view) }
                : {}),
            },
          });
          await prisma.subscription.update({
            where: { organizationId: org.id },
            data: {
              status,
              ...(event.type === 'invoice.paid'
                ? { stripeCurrentPeriodEnd: periodEndDate(view) }
                : {}),
            },
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const view = toSubscriptionView(event.data.object as Stripe.Subscription);
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

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }
}

/** Hourly job: sync subscription state from Stripe for all linked orgs. */
export async function syncSubscriptionStatus(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: { id: true, stripeSubscriptionId: true },
  });

  for (const org of orgs) {
    if (!org.stripeSubscriptionId) continue;
    try {
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      const view = toSubscriptionView(subscription);
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          subscriptionStatus: view.status,
          stripeCurrentPeriodEnd: periodEndDate(view),
          cancelAtPeriodEnd: view.cancel_at_period_end,
        },
      });
      await prisma.subscription.update({
        where: { organizationId: org.id },
        data: {
          status: view.status,
          stripeCurrentPeriodEnd: periodEndDate(view),
          cancelAtPeriodEnd: view.cancel_at_period_end,
        },
      });
    } catch (error) {
      logger.error(`Failed to sync subscription for org ${org.id}: ${(error as Error).message}`);
    }
  }
}
