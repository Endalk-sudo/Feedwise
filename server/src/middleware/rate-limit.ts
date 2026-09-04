import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Create a rate limiter with standard configuration
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
} = {}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later',
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later',
      });
    },
  });
}

/**
 * Stricter rate limiter for sensitive endpoints (login, register, feedback submission)
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many attempts, please try again later',
});

/**
 * Auth session endpoints (polled by the client, so roomier than strict)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  message: 'Too many auth requests, please try again later',
});

/**
 * Feedback submission rate limiter (per IP)
 */
export const feedbackRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many feedback submissions, please try again later',
});