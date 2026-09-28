import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongodbUri: process.env.MONGODB_URI || '',
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  cloudinary: {
    // Legacy (Cloudinary storage is being replaced by Backblaze B2).
    // Keep optional so the server boots without CLOUDINARY_* set.
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  b2: {
    keyId: process.env.B2_KEY_ID || '',
    appKey: process.env.B2_APP_KEY || '',
    endpoint: process.env.B2_ENDPOINT || '',
    bucket: process.env.B2_BUCKET || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10), // 50MB default
    allowedFormats: (process.env.ALLOWED_FORMATS || 'mp3,flac,wav,aac,m4a,ogg').split(','),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  env: process.env.NODE_ENV || 'development',
};

export const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'B2_KEY_ID',
    'B2_APP_KEY',
    'B2_ENDPOINT',
    'B2_BUCKET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(message);
    throw new Error(message);
  }
};
