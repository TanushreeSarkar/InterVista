import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
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

// Trust proxy for secure cookies in production (behind Render/Netlify/Heroku)
app.set('trust proxy', 1);

// ─── Security: Helmet ──────────────────────────────────────
// In production, disable Helmet's CSP since Netlify sets its own headers
// and the API is a pure JSON backend (no HTML pages to protect).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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

      // Check if origin is in our allowed list
      if (corsOrigins.some(allowed => origin === allowed)) {
        callback(null, true);
      } else if (!isProduction) {
        // Dev: allow any origin with warning
        logger.warn(`CORS: Allowing unlisted origin in dev: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  })
);

// ─── Cookie parser ─────────────────────────────────────────
app.use(cookieParser());
app.use(mongoSanitize({ replaceWith: '_' }));

// ─── Body parsers ──────────────────────────────────────────
// Raw body for Razorpay webhook signature verification (must come before JSON parser)
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Rate limiting ─────────────────────────────────────────
// Global: 500 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const retryAfter = Math.ceil(15 * 60); // seconds
    res.status(429).json({ error: 'Too many requests', retryAfter });
  },
});
app.use(globalLimiter);

// ─── Static uploads (legacy — files now stored in Firebase Storage) ──
// Kept for backward compatibility with any locally-cached files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Catch-all 404 for unmatched routes ────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'Route not found',
    hint: 'All API endpoints are prefixed with /api. Try /health or /api/auth/me',
  });
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
