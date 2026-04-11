import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { subscribeNewsletter, submitContactForm } from '../controllers/publicController';

const router = Router();

// Rate limiting for public endpoints to prevent spam
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/newsletter', publicLimiter, subscribeNewsletter);
router.post('/contact', publicLimiter, submitContactForm);

export const publicRoutes = router;
