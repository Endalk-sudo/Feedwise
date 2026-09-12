import cron from 'node-cron';
import { prisma } from '@/lib/prisma.js';
import {
  enqueueInsightGeneration,
  enqueueDigestEmail,
  getDefaultQueue,
  getInsightsQueue,
} from '@/lib/queue.js';
import { syncSubscriptionStatus } from '@/features/payments/service.js';
import { ensureRedisConnected, withCronLock } from '@/lib/redis.js';
import { startInsightsWorker } from '@/workers/insights.worker.js';
import { startNotificationWorker } from '@/workers/notification.worker.js';
import logger from '@/utils/logger.js';

/** Start of the current ISO week (Monday 00:00 local) — stable upsert bucket. */
function startOfIsoWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() - ((day + 6) % 7)); // back to Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

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
    // Distributed lock: only one replica runs the daily job (Slice 7 fix).
    await withCronLock('insight-generation', 60 * 60, async () => {
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
  });

  logger.info('✅ Insight generation schedule registered (BullMQ preferred, cron fallback, distributed lock)');
}

/**
 * Daily digest emails (Phase 3, 7AM): one per org with 24h activity.
 * Honors the org settings opt-out (settings.emailDigest === false) in the
 * worker. Falls back to direct send when Redis is unavailable.
 */
export function startDigestJob(): void {
  cron.schedule('0 7 * * *', async () => {
    await withCronLock('digest', 30 * 60, async () => {
    logger.info('📧 Daily digest schedule triggered');
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Digests are a paid feature — align with the 2AM insight cron's Pro gate
      // so free-tier orgs don't receive daily commercial email.
      const activeOrgs = await prisma.organization.findMany({
        where: { currentPlan: 'pro', feedbacks: { some: { createdAt: { gte: since } } } },
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
  });

  logger.info('✅ Digest schedule registered (7AM, BullMQ preferred, inline fallback, distributed lock)');
}

/**
 * Hourly subscription status sync (Stripe).
 * Lightweight; keeps using cron + direct call for now.
 * Can be moved to BullMQ later if volume grows.
 */
export function startSubscriptionSyncJob(): void {
  cron.schedule('0 * * * *', async () => {
    await withCronLock('subscription-sync', 10 * 60, async () => {
    logger.info('🔄 Starting hourly subscription sync...');
    try {
      await syncSubscriptionStatus();
      logger.info('✅ Subscription sync completed');
    } catch (error) {
      logger.error(`Subscription sync failed: ${(error as Error).message}`);
    }
    });
  });
  logger.info('✅ Subscription sync schedule registered');
}

/**
 * Phase 5 (D2): predictive churn cron (runs after the 2AM insight job).
 * For each Pro org: rolling 7-day satisfaction delta + High-urgency trend;
 * a drop > 0.3 pts/week with rising High urgency (or High-risk open pile-up)
 * writes a `Churn risk rising` Insight surfaced in Priority Alerts.
 * Phase 7 (F3): promoter follow-up — Positive + satisfaction >= 4 rows in
 * the last 7 days trigger a referral-request email (digest opt-out honored).
 */
export function startRetentionForecastJob(): void {
  cron.schedule('30 2 * * *', async () => {
    await withCronLock('retention-forecast', 60 * 60, async () => {
    logger.info('📉 Retention forecast schedule triggered');
    try {
      const { analyticsService } = await import('@/features/analytics/service.js');
      const { sendReferralRequestEmail, dashboardUrlFor } = await import('@/lib/mail.js');
      const proOrgs = await prisma.organization.findMany({
        where: { currentPlan: 'pro' },
        select: { id: true },
      });
      for (const org of proOrgs) {
        try {
          const forecast = await analyticsService.getSatisfactionForecast(org.id);
          const risk = await analyticsService.getRetentionRisk(org.id, 7);
          const highRiskOpen = (risk.highRiskOpen as unknown[]).length;
          if (
            (forecast.satisfactionDelta <= -0.3 && forecast.urgencyRising) ||
            (forecast.trend === 'falling' && highRiskOpen >= 3)
          ) {
            // Phase 10: churn-insight upsert — while a falling trend persists
            // we'd otherwise write an identical "Churn risk rising" alert every
            // night (14 after 2 weeks). Bucket per ISO week (stable periodStart)
            // and replace any existing churn insight for this week instead of
            // appending. Safe because the cron runs under a distributed lock
            // (withCronLock), so only one replica does this delete-then-create.
            const weekStart = startOfIsoWeek();
            await prisma.insight.deleteMany({
              where: {
                organizationId: org.id,
                title: 'Churn risk rising — satisfaction falling',
                periodStart: { gte: weekStart },
              },
            });
            await prisma.insight.create({
              data: {
                organizationId: org.id,
                title: 'Churn risk rising — satisfaction falling',
                reason:
                  `Satisfaction moved ${forecast.satisfactionDelta.toFixed(2)} pts/week ` +
                  `(${forecast.urgencyRising ? 'High-urgency volume rising' : 'High-risk pile-up'}; ` +
                  `${highRiskOpen} high-risk open).`,
                action: 'Work the High retention-risk queue this week: Accept/Resolve the top rows first.',
                priority: 9,
                periodStart: weekStart,
                periodEnd: new Date(),
              },
            });
            logger.info(`Predictive churn insight upserted for org ${org.id}`);
          }
          const promoters = await prisma.feedback.findMany({
            where: {
              organizationId: org.id,
              sentiment: 'Positive',
              satisfactionEstimate: { gte: 4 },
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, text: true, category: true, createdAt: true },
          });
          if (promoters.length > 0) {
            await sendReferralRequestEmail(org.id, promoters, dashboardUrlFor());
          }
        } catch (error) {
          logger.error(`Forecast failed for org ${org.id}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      logger.error(`Retention forecast job failed: ${(error as Error).message}`);
    }
    });
  });
  logger.info('✅ Retention forecast schedule registered (2:30AM, predictive churn + promoters, distributed lock)');
}
