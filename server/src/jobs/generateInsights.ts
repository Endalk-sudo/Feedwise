import cron from 'node-cron';
import { prisma } from '@/lib/prisma.js';
import { generateInsights } from '@/features/ai/service.js';
import { syncSubscriptionStatus } from '@/features/payments/service.js';

/**
 * Daily insight generation job
 * Runs at 2 AM daily to generate AI insights for Pro organizations
 */
export function startInsightGenerationJob(): void {
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Starting daily insight generation job...');

    try {
      // Get all Pro organizations
      const proOrgs = await prisma.organization.findMany({
        where: { currentPlan: 'pro' },
        select: { id: true },
      });

      console.log(`Found ${proOrgs.length} Pro organizations`);

      for (const org of proOrgs) {
        try {
          // Get last 30 days of feedback
          const feedbacks = await prisma.feedback.findMany({
            where: {
              organizationId: org.id,
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          });

          if (feedbacks.length === 0) {
            console.log(`No feedback for organization ${org.id}, skipping`);
            continue;
          }

          // Generate insights
          const insights = await generateInsights(feedbacks);

          if (insights.length > 0) {
            // Delete old insights for this period
            await prisma.insight.deleteMany({
              where: {
                organizationId: org.id,
                periodStart: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
            });

            // Create new insights
            await prisma.insight.createMany({
              data: insights.map((i: { title: string; reason: string; action: string; priority: number }) => ({
                organizationId: org.id,
                title: i.title,
                reason: i.reason,
                action: i.action,
                priority: i.priority,
                periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                periodEnd: new Date(),
              })),
              skipDuplicates: true,
            });

            console.log(`Generated ${insights.length} insights for organization ${org.id}`);
          }
        } catch (error) {
          console.error(`Failed to generate insights for org ${org.id}:`, error);
        }
      }

      console.log('✅ Daily insight generation job completed');
    } catch (error) {
      console.error('❌ Insight generation job failed:', error);
    }
  });

  console.log('📅 Insight generation job scheduled (daily at 2 AM)');
}

/**
 * Subscription status sync job
 * Runs every hour to sync subscription status with Stripe
 */
export function startSubscriptionSyncJob(): void {
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Starting subscription sync job...');

    try {
      await syncSubscriptionStatus();
      console.log('✅ Subscription sync job completed');
    } catch (error) {
      console.error('❌ Subscription sync job failed:', error);
    }
  });

  console.log('📅 Subscription sync job scheduled (hourly)');
}