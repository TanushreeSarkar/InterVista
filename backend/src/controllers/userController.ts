import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { sanitizeFields } from '../lib/sanitize';
import logger from '../lib/logger';

const SALT_ROUNDS = 12;

/**
 * GET /api/users/profile
 */
export async function getProfile(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const doc = await getDb().collection('users').doc(userId).get();
    if (!doc.exists) { res.status(404).json({ error: 'User not found.' }); return; }

    const data = doc.data()!;
    res.json({
      data: {
        id: doc.id,
        name: data.name,
        email: data.email,
        bio: data.bio || '',
        targetRole: data.targetRole || '',
        targetCompany: data.targetCompany || '',
        preferences: data.preferences || {
          emailNotifications: true,
          pushNotifications: false,
          language: 'en',
          timezone: 'UTC',
        },
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      },
    });
  } catch (error) { next(error); }
}

/**
 * PUT /api/users/profile
 */
export async function updateProfile(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { name, bio, targetRole, targetCompany } = req.body;

    // Sanitize all string inputs
    const sanitized = sanitizeFields(
      { name, bio, targetRole, targetCompany },
      ['name', 'bio', 'targetRole', 'targetCompany']
    );

    const updates: Record<string, any> = { updatedAt: getFieldValue().serverTimestamp() };
    if (sanitized.name) updates.name = sanitized.name;
    if (bio !== undefined) updates.bio = sanitized.bio;
    if (targetRole !== undefined) updates.targetRole = sanitized.targetRole;
    if (targetCompany !== undefined) updates.targetCompany = sanitized.targetCompany;

    await getDb().collection('users').doc(userId).update(updates);
    res.json({ data: { message: 'Profile updated.' } });
  } catch (error) { next(error); }
}

/**
 * PUT /api/users/preferences
 */
export async function updatePreferences(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { emailNotifications, pushNotifications, language, timezone } = req.body;

    const preferences = {
      emailNotifications: Boolean(emailNotifications),
      pushNotifications: Boolean(pushNotifications),
      language: language || 'en',
      timezone: timezone || 'UTC',
    };

    await getDb().collection('users').doc(userId).update({
      preferences,
      updatedAt: getFieldValue().serverTimestamp(),
    });

    res.json({ data: { message: 'Preferences updated.' } });
  } catch (error) { next(error); }
}

/**
 * PUT /api/users/password
 */
export async function changePassword(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    // With Firebase Auth, passwords are not stored in Firestore.
    // Changing the password requires re-authenticating the user with their current credentials,
    // which should be handled client-side via Firebase SDK (or by triggering a password reset).
    res.status(501).json({ error: 'Please use the "Reset Password" flow on the login page to change your password.' });
  } catch (error) { next(error); }
}

/**
 * DELETE /api/users/account
 * Cascade deletes: sessions, questions, answers, evaluations, questionBanks
 */
export async function deleteAccount(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;

    const collections = ['sessions', 'questions', 'answers', 'evaluations', 'questionBanks'];

    for (const col of collections) {
      const snap = await getDb().collection(col).where('userId', '==', userId).get();
      const batch = getDb().batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      if (!snap.empty) await batch.commit();
    }

    // Also delete questions/answers that belong to user's sessions
    const sessionSnap = await getDb().collection('sessions').where('userId', '==', userId).get();
    for (const sessionDoc of sessionSnap.docs) {
      const qSnap = await getDb().collection('questions').where('sessionId', '==', sessionDoc.id).get();
      const aBatch = getDb().batch();
      qSnap.docs.forEach((d) => aBatch.delete(d.ref));
      if (!qSnap.empty) await aBatch.commit();
    }

    await getDb().collection('users').doc(userId).delete();

    logger.info(`User account deleted: ${userId}`);
    res.json({ data: { message: 'Account deleted permanently.' } });
  } catch (error) { next(error); }
}
