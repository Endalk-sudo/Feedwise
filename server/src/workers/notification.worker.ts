import { Worker, type Job } from 'bullmq';
import { getRedis } from '@/lib/redis.js';
import { JOB_NAMES } from '@/lib/queue.js';
import { prisma } from '@/lib/prisma.js';
import {
  sendHighUrgencyAlert,
  sendDigestEmail,
  dashboardUrlFor,
} from '@/lib/mail.js';
import logger from '@/utils/logger.js';

interface UrgencyAlertData {
  organizationId: string;
  feedbackId: string;
}

interface DigestData {
  organizationId: string;
}

async function processUrgencyAlert(job: Job<UrgencyAlertData>): Promise<{ sent: boolean }> {
  const { organizationId, feedbackId } = job.data;
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, organizationId },
  });
  if (!feedback) {
    logger.warn(`Urgency alert: feedback ${feedbackId} not found, skipping`);
    return { sent: false };
  }
  const result = await sendHighUrgencyAlert(
    organizationId,
    {
      id: feedback.id,
      text: feedback.text,
      category: feedback.category,
      sentiment: feedback.sentiment,
      urgency: feedback.urgency,
      satisfactionEstimate: feedback.satisfactionEstimate,
      fixableProblem: feedback.fixableProblem,
      concreteIssue: feedback.concreteIssue,
      retentionRisk: feedback.retentionRisk,
      createdAt: feedback.createdAt,
    },
    dashboardUrlFor(),
  );
  return { sent: result.sent };
}

async function processDigest(job: Job<DigestData>): Promise<{ sent: boolean }> {
  const { organizationId } = job.data;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recent, highUrgencyOpen, satisfactionAgg] = await Promise.all([
    prisma.feedback.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        OR: [{ urgency: 'High' }, { fixableProblem: true }, { retentionRisk: 'High' }],
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    }),
    prisma.feedback.count({
      where: { organizationId, urgency: 'High', status: 'open' },
    }),
    prisma.feedback.aggregate({
      where: { organizationId, createdAt: { gte: since }, satisfactionEstimate: { not: null } },
      _avg: { satisfactionEstimate: true },
    }),
  ]);

  const total24h = await prisma.feedback.count({
    where: { organizationId, createdAt: { gte: since } },
  });

  const result = await sendDigestEmail(
    organizationId,
    recent.map((f) => ({
      id: f.id,
      text: f.text,
      category: f.category,
      urgency: f.urgency,
      satisfactionEstimate: f.satisfactionEstimate,
      retentionRisk: f.retentionRisk,
      status: f.status,
      createdAt: f.createdAt,
    })),
    { total24h, highUrgencyOpen, avgSatisfaction: satisfactionAgg._avg.satisfactionEstimate },
    dashboardUrlFor(),
  );
  return { sent: result.sent };
}

let worker: Worker | null = null;

/** Notification worker on the default queue (alerts + digests). No-op without Redis. */
export function startNotificationWorker(): Worker | null {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis unavailable — notification worker not started');
    return null;
  }
  if (worker) return worker;

  worker = new Worker(
    'aifc-default',
    async (job) => {
      if (job.name === JOB_NAMES.HIGH_URGENCY_ALERT) {
        return processUrgencyAlert(job as Job<UrgencyAlertData>);
      }
      if (job.name === JOB_NAMES.SEND_DIGEST_EMAIL) {
        return processDigest(job as Job<DigestData>);
      }
      // Other aifc-default jobs (batch analysis, subscription sync) are
      // handled elsewhere; ignore them here.
      return {};
    },
    { connection: redis as any, concurrency: 5 },
  );

  worker.on('completed', (job) => {
    logger.info(`Notification job ${job.id} completed`);
  });
  worker.on('failed', (job, err) => {
    logger.error(`Notification job ${job?.id} failed: ${err.message}`);
  });

  logger.info('✅ Notification BullMQ worker started');
  return worker;
}

export async function stopNotificationWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}
