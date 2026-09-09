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

export type { Job };
