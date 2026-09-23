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
    logger.warn(
      'REDIS_URL not set — background jobs and Redis rate limiting disabled (in-memory fallbacks used)',
    );
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

/**
 * Distributed lock for cron schedules (Slice 7: multi-instance double-fire).
 * Uses SET NX EX so only one replica runs a given schedule. The lock auto-
 * expires (ttlSeconds) so a crashed replica can't block future runs; on
 * success the holder releases it with a token-checked DEL so we never delete
 * a lock that has already expired and been re-acquired by another instance.
 * Returns null when Redis is unavailable (single-instance fallback: proceed).
 */
export async function acquireCronLock(
  name: string,
  ttlSeconds: number,
): Promise<(() => Promise<void>) | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    if (client.status !== 'ready') {
      await client.connect();
    }
    const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const key = `cron-lock:${name}`;
    const acquired = await client.set(key, token, 'EX', ttlSeconds, 'NX');
    if (acquired !== 'OK') return null;

    return async () => {
      // Token-checked release (compare-and-delete) via Lua.
      try {
        await client.eval(
          `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
          1,
          key,
          token,
        );
      } catch {
        // Best-effort release; TTL covers us.
      }
    };
  } catch (err) {
    // Redis down at fire time: run anyway (degrades to old in-process behavior).
    logger.warn(`Cron lock unavailable for ${name}, proceeding: ${(err as Error).message}`);
    return null;
  }
}

/** Wrap a cron callback so it only runs on one instance. */
export async function withCronLock(
  name: string,
  ttlSeconds: number,
  fn: () => Promise<void>,
): Promise<void> {
  const release = await acquireCronLock(name, ttlSeconds);
  if (release === null) {
    logger.info(`⏭️ Cron ${name} skipped (lock held by another instance)`);
    return;
  }
  try {
    await fn();
  } finally {
    await release();
  }
}
