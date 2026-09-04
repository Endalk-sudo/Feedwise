import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';

/**
 * Better Auth instance.
 * Mounted at /api/auth in the Express app.
 * Uses the Prisma adapter so users/sessions live in the same
 * PostgreSQL database as application data.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
        input: true,
      },
      hasOrganization: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      stripeCustomerId: {
        type: 'string',
        required: false,
        input: false,
      },
      subscriptionStatus: {
        type: 'string',
        required: false,
        defaultValue: 'inactive',
        input: false,
      },
      currentPlan: {
        type: 'string',
        required: false,
        input: false,
      },
      trialEndsAt: {
        type: 'date',
        required: false,
        input: false,
      },
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
    },
  },
  trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:3000'],
});

export type Session = typeof auth.$Infer.Session;
