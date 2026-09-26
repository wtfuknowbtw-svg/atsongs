import express from 'express';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { adminSetupService } from './services/adminSetupService';
import { securityHeaders, corsOptions, rateLimiter } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import routes from './routes';

const app = express();

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    
    await adminSetupService.ensureAdminExists();

    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
