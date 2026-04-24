import { Response, NextFunction } from 'express';
import { getDb } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { PLANS } from '../lib/razorpay';
import logger from '../lib/logger';

/**
 * Middleware: Require an active premium subscription.
 * Returns 403 with UPGRADE_REQUIRED code if the user is on the free plan.
 */
export async function requirePremium(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    const subscription = userDoc.data()?.subscription;

    if (!subscription || subscription.plan !== 'premium') {
      res.status(403).json({
        error: 'This feature requires a Premium subscription.',
        code: 'UPGRADE_REQUIRED',
        upgradeUrl: '/pricing',
      });
      return;
    }

    // Check expiry
    const expiresAt = subscription.expiresAt?.toDate?.() || new Date(subscription.expiresAt);
    if (expiresAt < new Date()) {
      // Auto-downgrade expired subscription
      await getDb().collection('users').doc(userId).update({
        'subscription.plan': 'free',
        'subscription.status': 'expired',
      });

      logger.info(`Auto-downgraded expired subscription for user ${userId}`);

      res.status(403).json({
        error: 'Your Premium subscription has expired. Please renew.',
        code: 'UPGRADE_REQUIRED',
        upgradeUrl: '/pricing',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Subscription middleware error', error);
    next(error);
  }
}

/**
 * Middleware: Check session creation limit for free users.
 * Free users get 3 sessions/month. Premium users are unlimited.
 */
export async function checkSessionLimit(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    const subscription = userDoc.data()?.subscription;
    const isPremium = subscription?.plan === 'premium' &&
      subscription.expiresAt &&
      (subscription.expiresAt.toDate?.() || new Date(subscription.expiresAt)) > new Date();

    // Premium users have unlimited sessions
    if (isPremium) {
      next();
      return;
    }

    // Count sessions created this month for free users
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Simple query by userId only (no composite index needed), then filter in-memory
    const allSessions = await getDb()
      .collection('sessions')
      .where('userId', '==', userId)
      .get();

    const count = allSessions.docs.filter(doc => {
      const data = doc.data();
      if (!data.createdAt) return false;
      const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      return created >= startOfMonth;
    }).length;

    const limit = PLANS.free.sessionsPerMonth;

    if (count >= limit) {
      res.status(403).json({
        error: `Free plan limit reached. You've used ${count}/${limit} interviews this month.`,
        code: 'SESSION_LIMIT',
        remaining: 0,
        limit,
        used: count,
        upgradeUrl: '/pricing',
      });
      return;
    }

    // Attach remaining count for downstream use
    (req as any).sessionLimit = { remaining: limit - count, limit, used: count };
    next();
  } catch (error) {
    logger.error('Session limit middleware error', error);
    next(error);
  }
}
