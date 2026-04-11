import { Router } from 'express';
import { getSubscriptionStatus, createCheckoutSession, createPortalSession } from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/checkout', authMiddleware, createCheckoutSession);
router.post('/portal', authMiddleware, createPortalSession);

export const subscriptionRoutes = router;
