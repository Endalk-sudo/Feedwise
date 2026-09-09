import { Worker, type Job } from 'bullmq';
import { getRedis } from '@/lib/redis.js';
import { JOB_NAMES } from '@/lib/queue.js';
import { prisma } from '@/lib/prisma.js';
import { generateInsights } from '@/features/ai/service.js';
import logger from '@/utils/logger.js';

interface InsightsJobData {
  organizationId: string;
}

async function processInsightJob(job: Job<InsightsJobData>): Promise<{ count: number }> {
  const { organizationId } = job.data;
  logger.info(`Processing insight job for org ${organizationId}`);

  const feedbacks = await prisma.feedback.findMany({
    where: {
      organizationId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (feedbacks.length === 0) {
    logger.info(`No feedback for org ${organizationId}, skipping`);
    return { count: 0 };
  }

  const insights = await generateInsights(feedbacks);

  if (insights.length > 0) {
    await prisma.insight.deleteMany({
      where: {
        organizationId,
        periodStart: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    await prisma.insight.createMany({
      data: insights.map((i: { title: string; reason: string; action: string; priority: number }) => ({
        organizationId,
        title: i.title,
        reason: i.reason,
        action: i.action,
        priority: i.priority,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  logger.info(`Generated ${insights.length} insights for org ${organizationId}`);
  return { count: insights.length };
}

let worker: Worker | null = null;

export function startInsightsWorker(): Worker | null {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis unavailable — insights worker not started');
    return null;
  }

  if (worker) return worker;

  worker = new Worker(
    'aifc-insights',
    async (job) => {
      if (job.name === JOB_NAMES.GENERATE_INSIGHTS) {
        return processInsightJob(job as Job<InsightsJobData>);
      }
      logger.warn(`Unknown job name on insights queue: ${job.name}`);
      return {};
    },
    {
      connection: redis as any,
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Insight job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Insight job ${job?.id} failed: ${err.message}`);
  });

  logger.info('✅ Insights BullMQ worker started');
  return worker;
}

export async function stopInsightsWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
