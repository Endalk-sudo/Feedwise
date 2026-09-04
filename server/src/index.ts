import dotenv from 'dotenv';

dotenv.config();

import { app } from './app.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import logger from './utils/logger.js';
import { startInsightGenerationJob, startSubscriptionSyncJob } from './jobs/generateInsights.js';

// Start the server
const startServer = async () => {
  try {
    logger.info('🔄 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    startInsightGenerationJob();
    startSubscriptionSyncJob();

    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📊 Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${(error as Error).message}`, {
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
};

startServer();
