import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { handleStripeEvent, createCheckoutSession, stripe, PaymentError } from './service.js';
import { env } from '@/lib/env.js';
import { prisma } from '@/lib/prisma.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    organizationMember: { findFirst: vi.fn() },
    subscription: { upsert: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function signedPayload(payload: object): { rawBody: Buffer; signature: string } {
  const rawBody = Buffer.from(JSON.stringify(payload));
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: rawBody.toString(),
    secret: env.STRIPE_WEBHOOK_SECRET,
  });
  return { rawBody, signature };
}

describe('handleStripeEvent', () => {
  it('rejects a missing signature with 400', async () => {
    await expect(handleStripeEvent(Buffer.from('{}'), undefined)).rejects.toMatchObject({
      name: 'PaymentError',
      status: 400,
    });
  });

  it('rejects a forged signature with 400', async () => {
    await expect(handleStripeEvent(Buffer.from('{}'), 't=123,v1=deadbeef')).rejects.toBeInstanceOf(
      PaymentError,
    );
  });

  it('accepts a signed unknown event without touching the database', async () => {
    const { rawBody, signature } = signedPayload({
      id: 'evt_unit_test',
      object: 'event',
      type: 'customer.created',
      data: { object: {} },
    });

    await expect(handleStripeEvent(rawBody, signature)).resolves.toBeUndefined();
  });
});

describe('createCheckoutSession double-billing guard', () => {
  const member = {
    organization: {
      id: 'org-1',
      name: 'Test Org',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_existing' as string | null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue(member as never);
    vi.mocked(prisma.organization.update).mockResolvedValue({} as never);
  });

  it('blocks a new checkout when an active subscription exists (409)', async () => {
    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_existing',
      status: 'active',
    } as never);

    await expect(createCheckoutSession('user-1', 'a@b.c', 'pro')).rejects.toMatchObject({
      name: 'PaymentError',
      status: 409,
    });
    expect(prisma.organization.update).not.toHaveBeenCalled();
  });

  it('blocks checkout for a trialing/past_due subscription too', async () => {
    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_existing',
      status: 'past_due',
    } as never);

    await expect(createCheckoutSession('user-1', 'a@b.c', 'pro')).rejects.toBeInstanceOf(
      PaymentError,
    );
  });

  it('proceeds when the stored subscription is canceled and clears the stale pointer', async () => {
    vi.spyOn(stripe.subscriptions, 'retrieve').mockResolvedValue({
      id: 'sub_existing',
      status: 'canceled',
    } as never);
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_new',
      url: 'https://checkout.example.com',
    } as never);

    const result = await createCheckoutSession('user-1', 'a@b.c', 'pro');
    expect(result.sessionId).toBe('cs_new');
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { stripeSubscriptionId: null },
    });
  });

  it('proceeds when the stored subscription no longer exists in Stripe', async () => {
    vi.spyOn(stripe.subscriptions, 'retrieve').mockRejectedValue(new Error('No such subscription'));
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_new',
      url: 'https://checkout.example.com',
    } as never);

    const result = await createCheckoutSession('user-1', 'a@b.c', 'basic');
    expect(result.sessionId).toBe('cs_new');
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { stripeSubscriptionId: null },
    });
  });

  it('proceeds without any Stripe lookup when the org has no subscription id', async () => {
    const retrieveSpy = vi
      .spyOn(stripe.subscriptions, 'retrieve')
      .mockResolvedValue({ id: 'sub_x', status: 'active' } as never);
    vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      id: 'cs_new',
      url: 'https://checkout.example.com',
    } as never);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      organization: { ...member.organization, stripeSubscriptionId: null },
    } as never);

    const result = await createCheckoutSession('user-1', 'a@b.c', 'pro');
    expect(result.sessionId).toBe('cs_new');
    expect(retrieveSpy).not.toHaveBeenCalled();
  });
});
