import { createApp } from './app';
import { env } from './config/env';
import { connectMongo } from './config/mongo';
import { logger } from './utils/logger';
import type { Server } from 'node:http';

const bootstrap = async () => {
  try {
    await connectMongo();

    const app = createApp();
    const server: Server = app.listen(env.port, () => {
      logger.info(`Server running on http://localhost:${env.port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${env.port} is already in use. Backend is likely already running in another terminal. Stop old process or use \"npm run dev:restart\".`,
        );
        process.exit(1);
      }

      logger.error('Server failed to start', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to bootstrap backend', error);
    process.exit(1);
  }
};

void bootstrap();
