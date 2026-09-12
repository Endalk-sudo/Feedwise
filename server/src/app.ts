import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';

import { auth } from './lib/auth.js';
import { env } from './lib/env.js';
import logger from './utils/logger.js';

// Import feature routes
import { feedbackRoutes } from './features/feedback/routes.js';
import { analyticsRoutes } from './features/analytics/routes.js';
import { aiRoutes } from './features/ai/routes.js';
import { paymentRoutes, handleWebhook } from './features/payments/routes.js';
import { settingsRoutes } from './features/settings/routes.js';
import { organizationRoutes } from './features/organization/routes.js';
import { authRoutes } from './features/auth/routes.js';
import { webhooksRoutes } from './features/webhooks/routes.js';
import { createRateLimiter } from './middleware/rate-limit.js';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// CORS for Better Auth - must allow credentials
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Rate limiting (Redis-backed when REDIS_URL is set)
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  prefix: 'rl:api:',
});
app.use('/api/', apiLimiter);

// Custom auth endpoints (/me, /has-org) BEFORE the Better Auth catch-all,
// otherwise toNodeHandler swallows them with a 404. Unmatched paths fall
// through to Better Auth below.
app.use('/api/auth', authRoutes);

// CRITICAL: Mount Better Auth BEFORE body parsers.
// Better Auth handles its own body parsing for auth routes.
// NOTE: Express 5 requires the {*any} wildcard syntax (bare `*` throws).
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(cookieParser());

// Stripe webhook (raw body needed) - must be before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Enable JSON parsing for all other routes
app.use(express.json());

// Feature routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Phase 6 (D4): minimal public API docs (token issuance + token endpoints).
app.get('/api/docs', (_req, res) => {
  res.json({
    success: true,
    data: {
      auth: 'Cookie session for dashboard; `Authorization: Bearer fw_...` (scoped ApiToken) for integrations.',
      issueToken: 'POST /api/webhooks/:slug/tokens { name?, scopes?, expiresInDays? } (owner/admin, cookie session)',
      tokenAnalytics: 'GET /api/analytics/:slug/token/sentiment?days=30 (scope analytics:read)',
      webhooks: 'POST /api/feedback/:slug/webhooks { url, events, secret? } — signed with X-Feedwise-Signature (HMAC-SHA256)',
      webhookLogs: 'GET /api/webhooks/:slug/webhooks/logs',
      exportCsv: 'GET /api/analytics/:slug/export?format=csv&days=90 (cookie session)',
    },
  });
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  let redis = 'disabled';
  try {
    const { ensureRedisConnected } = await import('./lib/redis.js');
    redis = (await ensureRedisConnected()) ? 'connected' : 'unavailable';
  } catch {
    redis = 'error';
  }
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    redis,
  });
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`${error.message}`, { stack: error.stack });

  res.status((error as { status?: number }).status ?? 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  });
});
