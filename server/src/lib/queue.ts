import { Queue, type Job, type ConnectionOptions } from 'bullmq';
import { getRedis } from '@/lib/redis.js';
import logger from '@/utils/logger.js';

/**
 * Job names used across the app.
 */
export const JOB_NAMES = {
  GENERATE_INSIGHTS: 'generate-insights',
  ANALYZE_FEEDBACK_BATCH: 'analyze-feedback-batch',
  SYNC_SUBSCRIPTION: 'sync-subscription',
  SEND_DIGEST_EMAIL: 'send-digest-email',
  HIGH_URGENCY_ALERT: 'high-urgency-alert',
  // Phase 4 (D1): agent action loop — draft reply + route High+fixable rows.
  ACTION_LOOP: 'action-loop',
  // Phase 6 (V3/F7): signed outbound webhook push.
  WEBHOOK_PUSH: 'webhook-push',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

/**
 * Shared connection options for BullMQ (ioredis).
 */
function getConnection(): ConnectionOptions | null {
  const redis = getRedis();
  if (!redis) return null;
  // BullMQ accepts the ioredis instance or connection options.
  return redis as unknown as ConnectionOptions;
}

let insightsQueue: Queue | null = null;
let defaultQueue: Queue | null = null;

/**
 * Main application queue (insights, batch analysis, digests).
 */
export function getDefaultQueue(): Queue | null {
  if (defaultQueue) return defaultQueue;
  const connection = getConnection();
  if (!connection) return null;

  defaultQueue = new Queue('aifc-default', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

  return defaultQueue;
}

/**
 * Dedicated insights queue (heavier AI work).
 */
export function getInsightsQueue(): Queue | null {
  if (insightsQueue) return insightsQueue;
  const connection = getConnection();
  if (!connection) return null;

  insightsQueue = new Queue('aifc-insights', {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 30 },
    },
  });

  return insightsQueue;
}

/**
 * Enqueue daily insight generation for one organization.
 */
export async function enqueueInsightGeneration(organizationId: string): Promise<string | null> {
  const queue = getInsightsQueue();
  if (!queue) {
    logger.warn('Insights queue unavailable — skipping enqueue');
    return null;
  }
  const job = await queue.add(
    JOB_NAMES.GENERATE_INSIGHTS,
    { organizationId },
    { jobId: `insights-${organizationId}-${Date.now()}` },
  );
  return job.id ?? null;
}

/**
 * Enqueue batch analysis of feedbacks (e.g. after bulk import).
 */
export async function enqueueBatchAnalysis(
  organizationId: string,
  feedbackIds: string[],
): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) return null;
  const job = await queue.add(JOB_NAMES.ANALYZE_FEEDBACK_BATCH, {
    organizationId,
    feedbackIds,
  });
  return job.id ?? null;
}

/**
 * Enqueue subscription sync for a Stripe customer.
 */
export async function enqueueSubscriptionSync(userId: string): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) return null;
  const job = await queue.add(JOB_NAMES.SYNC_SUBSCRIPTION, { userId });
  return job.id ?? null;
}

/**
 * Enqueue an immediate high-urgency alert email (Phase 3).
 * Null-safe when Redis is unavailable — callers must not fail on null.
 */
export async function enqueueHighUrgencyAlert(
  organizationId: string,
  feedbackId: string,
): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) {
    logger.warn('Default queue unavailable — skipping urgency alert enqueue');
    return null;
  }
  const job = await queue.add(
    JOB_NAMES.HIGH_URGENCY_ALERT,
    { organizationId, feedbackId },
    { jobId: `urgency-${feedbackId}` },
  );
  return job.id ?? null;
}

/**
 * Enqueue a daily digest email for one organization (Phase 3).
 */
export async function enqueueDigestEmail(organizationId: string): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) {
    logger.warn('Default queue unavailable — skipping digest enqueue');
    return null;
  }
  const job = await queue.add(
    JOB_NAMES.SEND_DIGEST_EMAIL,
    { organizationId },
    { jobId: `digest-${organizationId}-${new Date().toISOString().slice(0, 10)}` },
  );
  return job.id ?? null;
}

/**
 * Enqueue the Phase 4 (D1) action loop for one feedback row.
 * Fired for High urgency or High retention risk or tolerated friction
 * (satisfied tone + fixable problem); the worker decides whether to act.
 * Null-safe when Redis is unavailable — callers must not fail on null.
 */
export async function enqueueActionLoop(
  organizationId: string,
  feedbackId: string,
): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) {
    logger.warn('Default queue unavailable — skipping action-loop enqueue');
    return null;
  }
  const job = await queue.add(
    JOB_NAMES.ACTION_LOOP,
    { organizationId, feedbackId },
    { jobId: `action-${feedbackId}` },
  );
  return job.id ?? null;
}

/**
 * Enqueue a signed outbound webhook push (Phase 6 V3/F7).
 */
export async function enqueueWebhookPush(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const queue = getDefaultQueue();
  if (!queue) {
    logger.warn('Default queue unavailable — skipping webhook enqueue');
    return null;
  }
  const job = await queue.add(JOB_NAMES.WEBHOOK_PUSH, { organizationId, event, payload });
  return job.id ?? null;
}

export type { Job };
