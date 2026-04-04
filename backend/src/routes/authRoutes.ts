import { Router } from 'express';
import { signup, signin, signout, getMe, resetPassword, verifyReset, oauth } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { signupSchema, signinSchema, resetPasswordSchema, verifyResetSchema } from '../validators';
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

router.post('/signup', authLimiter, validateBody(signupSchema), signup);
router.post('/signin', authLimiter, validateBody(signinSchema), signin);
router.post('/oauth', authLimiter, oauth);
router.post('/signout', authMiddleware, signout);
router.get('/me', authMiddleware, getMe);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/verify-reset', authLimiter, validateBody(verifyResetSchema), verifyReset);

export const authRoutes = router;
