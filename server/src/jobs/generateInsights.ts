import cron from 'node-cron';
import { prisma } from '@/lib/prisma.js';
import {
  enqueueInsightGeneration,
  enqueueDigestEmail,
  getDefaultQueue,
  getInsightsQueue,
} from '@/lib/queue.js';
import { syncSubscriptionStatus } from '@/features/payments/service.js';
import { ensureRedisConnected } from '@/lib/redis.js';
import { startInsightsWorker } from '@/workers/insights.worker.js';
import { startNotificationWorker } from '@/workers/notification.worker.js';
import logger from '@/utils/logger.js';

/**
 * Schedule daily insight generation.
 * Prefer BullMQ (Redis) so work is durable and won't block the API process.
 * Falls back to node-cron in-process when Redis is unavailable.
 */
export function startInsightGenerationJob(): void {
  // Always try to start the workers (no-op if no Redis)
  startInsightsWorker();
  startNotificationWorker();

  // Cron that *enqueues* jobs (or runs inline as fallback)
  cron.schedule('0 2 * * *', async () => {
    logger.info('🔄 Daily insight generation schedule triggered');

    const redisOk = await ensureRedisConnected();
    const queue = getInsightsQueue();

    try {
      const proOrgs = await prisma.organization.findMany({
        where: { currentPlan: 'pro' },
        select: { id: true },
      });

      logger.info(`Found ${proOrgs.length} Pro organizations`);

      if (redisOk && queue) {
        for (const org of proOrgs) {
          await enqueueInsightGeneration(org.id);
        }
        logger.info(`Enqueued insight jobs for ${proOrgs.length} orgs via BullMQ`);
      } else {
        // Fallback: run sequentially in-process (same logic as old job)
        const { generateInsights } = await import('@/features/ai/service.js');
        for (const org of proOrgs) {
          try {
            const feedbacks = await prisma.feedback.findMany({
              where: {
                organizationId: org.id,
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
              orderBy: { createdAt: 'desc' },
              take: 100,
            });

            if (feedbacks.length === 0) continue;

            const insights = await generateInsights(feedbacks);
            if (insights.length > 0) {
              await prisma.insight.deleteMany({
                where: {
                  organizationId: org.id,
                  periodStart: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
              });
              await prisma.insight.createMany({
                data: insights.map(
                  (i: { title: string; reason: string; action: string; priority: number }) => ({
                    organizationId: org.id,
                    title: i.title,
                    reason: i.reason,
                    action: i.action,
                    priority: i.priority,
                    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    periodEnd: new Date(),
                  }),
                ),
                skipDuplicates: true,
              });
              logger.info(`Generated ${insights.length} insights for org ${org.id} (fallback)`);
            }
          } catch (error) {
            logger.error(`Failed insights for org ${org.id}: ${(error as Error).message}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Daily insight job failed: ${(error as Error).message}`);
    }
  });

  logger.info('✅ Insight generation schedule registered (BullMQ preferred, cron fallback)');
}

/**
 * Daily digest emails (Phase 3, 7AM): one per org with 24h activity.
 * Honors the org settings opt-out (settings.emailDigest === false) in the
 * worker. Falls back to direct send when Redis is unavailable.
 */
export function startDigestJob(): void {
  cron.schedule('0 7 * * *', async () => {
    logger.info('📧 Daily digest schedule triggered');
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeOrgs = await prisma.organization.findMany({
        where: { feedbacks: { some: { createdAt: { gte: since } } } },
        select: { id: true },
      });
      logger.info(`Found ${activeOrgs.length} orgs with 24h activity`);

      const redisOk = await ensureRedisConnected();
      const queue = getDefaultQueue();
      const { sendDigestEmail, dashboardUrlFor } = await import('@/lib/mail.js');

      for (const org of activeOrgs) {
        try {
          if (redisOk && queue) {
            await enqueueDigestEmail(org.id);
          } else {
            // Inline fallback (same shape as the worker path)
            const [recent, highUrgencyOpen, satisfactionAgg, total24h] = await Promise.all([
              prisma.feedback.findMany({
                where: {
                  organizationId: org.id,
                  createdAt: { gte: since },
                  OR: [{ urgency: 'High' }, { fixableProblem: true }, { retentionRisk: 'High' }],
                },
                orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
                take: 10,
              }),
              prisma.feedback.count({
                where: { organizationId: org.id, urgency: 'High', status: 'open' },
              }),
              prisma.feedback.aggregate({
                where: {
                  organizationId: org.id,
                  createdAt: { gte: since },
                  satisfactionEstimate: { not: null },
                },
                _avg: { satisfactionEstimate: true },
              }),
              prisma.feedback.count({
                where: { organizationId: org.id, createdAt: { gte: since } },
              }),
            ]);
            await sendDigestEmail(
              org.id,
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
              {
                total24h,
                highUrgencyOpen,
                avgSatisfaction: satisfactionAgg._avg.satisfactionEstimate,
              },
              dashboardUrlFor(),
            );
          }
        } catch (error) {
          logger.error(`Digest failed for org ${org.id}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.error(`Daily digest job failed: ${(error as Error).message}`);
    }
  });

  logger.info('✅ Digest schedule registered (7AM, BullMQ preferred, inline fallback)');
}

/**
 * Hourly subscription status sync (Stripe).
 * Lightweight; keeps using cron + direct call for now.
 * Can be moved to BullMQ later if volume grows.
 */
export function startSubscriptionSyncJob(): void {
  cron.schedule('0 * * * *', async () => {
    logger.info('🔄 Starting hourly subscription sync...');
    try {
      await syncSubscriptionStatus();
      logger.info('✅ Subscription sync completed');
    } catch (error) {
      logger.error(`Subscription sync failed: ${(error as Error).message}`);
    }
  });
  logger.info('✅ Subscription sync schedule registered');
}
