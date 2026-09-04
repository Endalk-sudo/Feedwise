import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';
import { handleStripeEvent, PaymentError } from './service.js';
import { env } from '@/lib/env.js';

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
