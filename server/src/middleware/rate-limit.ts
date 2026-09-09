import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { Request, Response } from 'express';
import { getRedis } from '@/lib/redis.js';
import logger from '@/utils/logger.js';

/**
 * Create a rate limiter. Uses Redis store when REDIS_URL is available
 * (shared across instances / serverless), otherwise falls back to
 * the default in-memory store.
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  prefix?: string;
} = {}) {
  const redis = getRedis();
  const base = {
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true as const,
    legacyHeaders: false as const,
    // ipKeyGenerator is required by express-rate-limit v8 when using a custom
    // keyGenerator: it normalizes IPv6 addresses to their subnet so IPv6
    // users can't bypass the limit by rotating addresses.
    keyGenerator: options.keyGenerator || ((req: Request) => ipKeyGenerator(req.ip || 'unknown')),
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
  };

  if (redis) {
    try {
      return rateLimit({
        ...base,
        store: new RedisStore({
          // ioredis `call` overloads don't accept a spread string[] and
          // resolve to Result<unknown>, so route through the (command, args)
          // overload and cast to the RedisReply shape rate-limit-redis expects.
          sendCommand: (...args: string[]): Promise<RedisReply> =>
            redis.call(args[0] as string, args.slice(1)) as unknown as Promise<RedisReply>,
          prefix: options.prefix || 'rl:',
        }),
      });
    } catch (err) {
      logger.warn(`Redis rate-limit store failed, using memory: ${(err as Error).message}`);
    }
  }

  return rateLimit(base);
}

/**
 * Stricter rate limiter for sensitive endpoints (login, register, feedback submission)
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many attempts, please try again later',
  prefix: 'rl:strict:',
});

/**
 * Auth session endpoints (polled by the client, so roomier than strict)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  message: 'Too many auth requests, please try again later',
  prefix: 'rl:auth:',
});

/**
 * Feedback submission rate limiter (per IP)
 */
export const feedbackRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many feedback submissions, please try again later',
  prefix: 'rl:feedback:',
});

/**
 * AI endpoints — protect Gemini quota from spam
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'AI rate limit reached, please try again later',
  prefix: 'rl:ai:',
});
