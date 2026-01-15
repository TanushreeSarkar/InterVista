import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  logLevel: process.env.LOG_LEVEL || 'info',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  },
  useFirebaseStorage: process.env.USE_FIREBASE_STORAGE === 'true',
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'none',
    endpoint: process.env.LLM_ENDPOINT,
  },
  stt: {
    mode: process.env.STT_MODE || 'local',
    localCommand: process.env.LOCAL_STT_CMD,
  },
  retention: {
    audioDays: parseInt(process.env.RETENTION_DAYS_AUDIO || '90', 10),
    transcriptDays: parseInt(process.env.RETENTION_DAYS_TRANSCRIPT || '365', 10),
  },
  jwtAdminSecret: process.env.JWT_SECRET || process.env.JWT_ADMIN_SECRET || 'super-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
};
