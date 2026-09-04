import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    plan: z.enum(['basic', 'pro']),
  }),
});

export const verifySessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
