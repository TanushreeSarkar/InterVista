import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createSession, getSessions, getSession, getSessionQuestions, getSessionTranscript, exportSession, listPersonas } from '../controllers/sessionController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createSessionSchema } from '../validators';

const router = Router();

// AI rate limiter for session creation (each creates 5 AI questions)
const sessionCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many requests', retryAfter: 3600 });
  },
});

router.post('/', authMiddleware, sessionCreateLimiter, validateBody(createSessionSchema), createSession);
router.get('/', authMiddleware, getSessions);
router.get('/personas', authMiddleware, listPersonas);
router.get('/:id', authMiddleware, getSession);
router.get('/:id/questions', authMiddleware, getSessionQuestions);
router.get('/:id/transcript', authMiddleware, getSessionTranscript);
router.get('/:id/export', authMiddleware, exportSession);

export const sessionRoutes = router;
