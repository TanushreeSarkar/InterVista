import { Router } from 'express';
import { getSubscriptionStatus, createOrder, verifyPayment, handleWebhook } from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Authenticated routes
router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/create-order', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);

// Webhook — NO auth middleware (uses Razorpay signature verification)
router.post('/webhook', handleWebhook);

export const subscriptionRoutes = router;
