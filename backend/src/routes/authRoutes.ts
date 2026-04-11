import { Router } from 'express';
import { signout, getMe, verifyFirebaseToken, refresh } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

// Auth routes: 10 req / 15 min per IP (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests', retryAfter: 900 });
  },
});

const router = Router();

// Single unified route for verifying Firebase logic. (Handles OAuth logging in + Email signing in + creating users).
router.post('/verify-firebase', authLimiter, verifyFirebaseToken);
router.post('/signout', authMiddleware, signout);
router.get('/me', authMiddleware, getMe);
router.post('/refresh', authMiddleware, refresh);

export const authRoutes = router;
