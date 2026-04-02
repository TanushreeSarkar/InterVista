import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import http from 'http';

import { validateEnv } from './config/validate';
import { apiRouter } from './routes';
import { globalErrorHandler } from './middleware/errorHandler';
import { initSocketIO } from './lib/socketHandler';
import logger from './lib/logger';

// ─── Validate environment ─────────────────────────────────
validateEnv();

// ─── Express app ───────────────────────────────────────────
const app = express();

// ─── Security: Helmet ──────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        frameSrc: ["'none'"],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
  })
);

// ─── CORS ──────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

// In dev, always include localhost:3000
if (!isProduction && !corsOrigins.includes('http://localhost:3000')) {
  corsOrigins.push('http://localhost:3000');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else if (isProduction) {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      } else {
        // Dev: allow any origin with warning
        logger.warn(`CORS: Allowing unlisted origin in dev: ${origin}`);
        callback(null, true);
      }
    },
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  })
);

// ─── Cookie parser ─────────────────────────────────────────
app.use(cookieParser());

// ─── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Rate limiting ─────────────────────────────────────────
// Global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const retryAfter = Math.ceil(15 * 60); // seconds
    res.status(429).json({ error: 'Too many requests', retryAfter });
  },
});
app.use(globalLimiter);

// ─── Static uploads ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global error handler ──────────────────────────────────
app.use(globalErrorHandler);

// ─── HTTP Server + Socket.IO ───────────────────────────────
const server = http.createServer(app);
initSocketIO(server, corsOrigins);

// ─── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`🚀 InterVista backend running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
