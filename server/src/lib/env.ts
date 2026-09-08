import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env before validating: this module runs at import time,
// before any dotenv.config() call in the entry point.
dotenv.config();

/**
 * Environment variable validation with Zod.
 * Fails fast at startup with a clear message instead of
 * mysteriously failing later at runtime.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5000'),

  // AI (Vercel AI SDK + Google provider)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  AI_MODEL: z.string().default('gemini-2.0-flash'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_BASIC_PRICE_ID: z.string().min(1, 'STRIPE_BASIC_PRICE_ID is required'),
  STRIPE_PRO_PRICE_ID: z.string().min(1, 'STRIPE_PRO_PRICE_ID is required'),

  // Object storage (S3-compatible: AWS S3, MinIO, R2, ...)
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a URL'),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  S3_PUBLIC_URL: z.string().url().optional(),
  // Canned ACL for uploads (providers without ACL support, e.g. R2, use bucket policy instead)
  S3_OBJECT_ACL: z.string().default('public-read'),

  // URLs
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
