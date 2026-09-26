import mongoose from 'mongoose';
import { config, validateConfig } from './index';
import logger from '../utils/logger';

export const connectDatabase = async () => {
  try {
    validateConfig();
    
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};
