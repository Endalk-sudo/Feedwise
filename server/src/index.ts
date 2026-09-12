import dotenv from 'dotenv';

dotenv.config();

import { app } from './app.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import { ensureRedisConnected, closeRedis } from './lib/redis.js';
import logger from './utils/logger.js';
import { startInsightGenerationJob, startDigestJob, startSubscriptionSyncJob, startRetentionForecastJob } from './jobs/generateInsights.js';
import { stopInsightsWorker } from './workers/insights.worker.js';
import { stopNotificationWorker } from './workers/notification.worker.js';

// Start the server
const startServer = async () => {
  try {
    logger.info('🔄 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Redis is optional but preferred for queues + rate limiting
    const redisOk = await ensureRedisConnected();
    if (redisOk) {
      logger.info('✅ Redis ready for BullMQ + rate limiting');
    }

    startInsightGenerationJob();
    startDigestJob();
    startSubscriptionSyncJob();
    startRetentionForecastJob();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📊 Health check: http://localhost:${env.PORT}/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await stopInsightsWorker().catch(() => {});
        await stopNotificationWorker().catch(() => {});
        await closeRedis().catch(() => {});
        await prisma.$disconnect().catch(() => {});
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error(`❌ Failed to start server: ${(error as Error).message}`, {
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
};

startServer();
