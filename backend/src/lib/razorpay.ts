import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from './logger';

let _instance: InstanceType<typeof Razorpay> | null = null;

/**
 * Get the Razorpay client singleton.
 * Lazily initialized to avoid crashing on startup if keys are missing.
 */
export function getRazorpay(): InstanceType<typeof Razorpay> {
  if (!_instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }

    _instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    logger.info('Razorpay client initialized');
  }

  return _instance;
}

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// ─── Plan configuration ────────────────────────────────────
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    sessionsPerMonth: 3,
  },
  premium: {
    name: 'Premium',
    price: 49900, // ₹499 in paise
    priceDisplay: '₹499',
    currency: 'INR',
    sessionsPerMonth: Infinity,
    durationDays: 30,
  },
} as const;
