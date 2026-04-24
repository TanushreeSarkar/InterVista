import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authRoutes } from './authRoutes';
import { sessionRoutes } from './sessionRoutes';
import { answerRoutes } from './answerRoutes';
import { questionBankRoutes } from './questionBankRoutes';
import { analyticsRoutes } from './analyticsRoutes';
import { userRoutes } from './userRoutes';
import { ttsRoutes } from './ttsRoutes';
import { reportRoutes } from './reportRoutes';
import { subscriptionRoutes } from './subscriptionRoutes';
import { publicRoutes } from './publicRoutes';

const router = Router();

// ─── Route-specific rate limiters ──────────────────────────



// AI routes: 20 req / hour per IP (expensive API calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests', retryAfter: 3600 });
  },
});

router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/answers', aiLimiter, answerRoutes);
router.use('/question-banks', questionBankRoutes);
router.use('/analytics', aiLimiter, analyticsRoutes);
router.use('/users', userRoutes);
router.use('/tts', aiLimiter, ttsRoutes);
router.use('/reports', reportRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/public', publicRoutes);

export const apiRouter = router;
