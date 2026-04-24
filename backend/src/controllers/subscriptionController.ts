import { Request, Response, NextFunction } from 'express';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { getRazorpay, verifyRazorpaySignature, verifyWebhookSignature, PLANS } from '../lib/razorpay';
import logger from '../lib/logger';

/**
 * GET /api/subscription/status
 * Returns the user's current subscription status.
 */
export async function getSubscriptionStatus(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const subscription = userDoc.data()?.subscription || {
      plan: 'free',
      status: 'active',
      expiresAt: null,
    };

    // Check if premium has expired
    if (subscription.plan === 'premium' && subscription.expiresAt) {
      const expiresAt = subscription.expiresAt?.toDate?.() || new Date(subscription.expiresAt);
      if (expiresAt < new Date()) {
        subscription.plan = 'free';
        subscription.status = 'expired';
        // Auto-downgrade in DB
        await getDb().collection('users').doc(userId).update({
          'subscription.plan': 'free',
          'subscription.status': 'expired',
        });
      }
    }

    // Count sessions this month for free users
    let sessionsUsed = 0;
    let sessionsLimit: number = PLANS.free.sessionsPerMonth;

    if (subscription.plan === 'free') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allSessions = await getDb()
        .collection('sessions')
        .where('userId', '==', userId)
        .get();
      sessionsUsed = allSessions.docs.filter(doc => {
        const data = doc.data();
        if (!data.createdAt) return false;
        const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        return created >= startOfMonth;
      }).length;
    } else {
      sessionsLimit = -1; // unlimited
    }

    res.json({
      data: {
        plan: subscription.plan || 'free',
        status: subscription.status || 'active',
        expiresAt: subscription.expiresAt?.toDate?.()?.toISOString?.() || null,
        sessionsUsed,
        sessionsLimit,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
      },
    });
  } catch (error) { next(error); }
}

/**
 * POST /api/subscription/create-order
 * Creates a Razorpay order for Premium subscription.
 */
export async function createOrder(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Check if already premium
    const subscription = userDoc.data()?.subscription;
    if (subscription?.plan === 'premium') {
      const expiresAt = subscription.expiresAt?.toDate?.() || new Date(subscription.expiresAt);
      if (expiresAt > new Date()) {
        res.status(400).json({ error: 'You already have an active Premium subscription.' });
        return;
      }
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: PLANS.premium.price,
      currency: PLANS.premium.currency,
      receipt: `premium_${userId}_${Date.now()}`,
      notes: {
        userId,
        plan: 'premium',
      },
    });

    res.json({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create Razorpay order', error);
    next(error);
  }
}

/**
 * POST /api/subscription/verify-payment
 * Verifies Razorpay payment signature and activates Premium.
 */
export async function verifyPayment(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: 'Missing payment verification data.' });
      return;
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      logger.warn(`Invalid payment signature for user ${userId}, order ${razorpay_order_id}`);
      res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
      return;
    }

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PLANS.premium.durationDays);

    // Update user subscription
    await getDb().collection('users').doc(userId).update({
      subscription: {
        plan: 'premium',
        status: 'active',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        activatedAt: getFieldValue().serverTimestamp(),
        expiresAt,
      },
      updatedAt: getFieldValue().serverTimestamp(),
    });

    // Store payment record
    await getDb().collection('payments').doc().set({
      userId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: PLANS.premium.price,
      currency: PLANS.premium.currency,
      plan: 'premium',
      status: 'captured',
      createdAt: getFieldValue().serverTimestamp(),
    });

    logger.info(`Premium activated for user ${userId}, payment ${razorpay_payment_id}`);

    res.json({
      data: {
        plan: 'premium',
        status: 'active',
        expiresAt: expiresAt.toISOString(),
        message: 'Premium subscription activated successfully!',
      },
    });
  } catch (error) {
    logger.error('Payment verification error', error);
    next(error);
  }
}

/**
 * POST /api/subscription/webhook
 * Handles Razorpay webhook events. No auth — uses signature verification.
 */
export async function handleWebhook(
  req: Request, res: Response
): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing webhook signature.' });
      return;
    }

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!verifyWebhookSignature(body, signature)) {
      logger.warn('Invalid Razorpay webhook signature');
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = event.event;

    logger.info(`Razorpay webhook received: ${eventType}`);

    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        if (payment?.notes?.userId) {
          const userId = payment.notes.userId;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + PLANS.premium.durationDays);

          await getDb().collection('users').doc(userId).update({
            subscription: {
              plan: 'premium',
              status: 'active',
              razorpayPaymentId: payment.id,
              activatedAt: getFieldValue().serverTimestamp(),
              expiresAt,
            },
            updatedAt: getFieldValue().serverTimestamp(),
          });

          logger.info(`Webhook: Premium activated for user ${userId}`);
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload?.payment?.entity;
        if (payment?.notes?.userId) {
          await getDb().collection('payments').doc().set({
            userId: payment.notes.userId,
            razorpayPaymentId: payment.id,
            amount: payment.amount,
            status: 'failed',
            failureReason: payment.error_description || 'Unknown',
            createdAt: getFieldValue().serverTimestamp(),
          });
          logger.warn(`Webhook: Payment failed for user ${payment.notes.userId}`);
        }
        break;
      }

      default:
        logger.info(`Unhandled webhook event: ${eventType}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook processing error', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}
