/**
 * Test environment stubs. server modules validate env at import time
 * (src/lib/env.ts fails fast), so tests run with placeholder values.
 * No test below touches the network or a real database.
 */
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '5000';
process.env.DATABASE_URL ??=
  'postgresql://postgres:feedback_dev@localhost:5434/feedback?schema=public';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-that-is-at-least-32-chars-long';
process.env.BETTER_AUTH_URL ??= 'http://localhost:5000';
process.env.GEMINI_API_KEY ??= 'test-gemini-key';
process.env.AI_MODEL ??= 'gemini-2.0-flash';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_unit';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_unit_test_secret';
process.env.STRIPE_BASIC_PRICE_ID ??= 'price_test_basic';
process.env.STRIPE_PRO_PRICE_ID ??= 'price_test_pro';
process.env.S3_BUCKET ??= 'test-bucket';
process.env.S3_REGION ??= 'us-east-1';
process.env.S3_ACCESS_KEY_ID ??= 'test-key';
process.env.S3_SECRET_ACCESS_KEY ??= 'test-secret';
process.env.S3_ENDPOINT ??= 'http://localhost:9000';
process.env.CLIENT_URL ??= 'http://localhost:5173';
