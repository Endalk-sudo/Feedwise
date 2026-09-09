import { Redis } from 'ioredis';
import { env } from '@/lib/env.js';
import logger from '@/utils/logger.js';

/**
 * Shared Redis connection for BullMQ queues and rate limiting.
 * Uses REDIS_URL (local Docker Redis or Upstash Redis URL).
 * Falls back to null when unset so the app still boots in pure-dev mode.
 */
let redis: Redis | null = null;
let connectionFailed = false;

export function getRedis(): Redis | null {
  if (connectionFailed) return null;
  if (redis) return redis;

  const url = env.REDIS_URL;
  if (!url) {
    logger.warn('REDIS_URL not set — background jobs and Redis rate limiting disabled (in-memory fallbacks used)');
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
      // Upstash / serverless friendly
      tls: url.startsWith('rediss://') ? {} : undefined,
      lazyConnect: true,
    });

    redis.on('error', (err: Error) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    return redis;
  } catch (err) {
    logger.error(`Failed to create Redis client: ${(err as Error).message}`);
    connectionFailed = true;
    return null;
  }
}

export async function ensureRedisConnected(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    if (client.status !== 'ready') {
      await client.connect();
    }
    await client.ping();
    return true;
  } catch (err) {
    logger.error(`Redis ping failed: ${(err as Error).message}`);
    connectionFailed = true;
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
  }
}
