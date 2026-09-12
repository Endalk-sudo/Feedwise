import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma.js';
import { env } from './env.js';
import { sendMail } from './mail.js';

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
    // Password-reset emails go through the same SMTP service as
    // urgency alerts (no-op + logged when SMTP_HOST is empty).
    sendResetPassword: async ({ user, token }) => {
      const url = `${env.CLIENT_URL}/auth/reset-password?token=${token}`;
      await sendMail({
        to: user.email,
        subject: 'Reset your Feedwise password',
        html: `
          <h2>Reset your password</h2>
          <p>Hi ${user.name || 'there'}, click the link below to choose a new password. It expires in 1 hour.</p>
          <p><a href="${url}">Reset password →</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    },
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
