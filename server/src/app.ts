import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
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

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
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

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
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
