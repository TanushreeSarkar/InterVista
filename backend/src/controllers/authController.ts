import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getFieldValue, getAdmin } from '../db/firestore';
import { AuthRequest, JwtPayload } from '../types/types';
import { sanitizeFields } from '../lib/sanitize';
import logger from '../lib/logger';
import { addToBlocklist } from '../lib/tokenBlocklist';

const SALT_ROUNDS = 12;
const COOKIE_NAME = 'intervista_session';

function generateToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expiresIn as any,
  });
}

/**
 * Sets the JWT as an httpOnly cookie on the response.
 */
function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: maxAgeMs,
    path: '/',
  });
}

/**
 * POST /api/auth/signup
 */
export async function signup(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Sanitize string inputs
    const sanitized = sanitizeFields({ name }, ['name']);

    // Check if email already exists
    const existingUser = await getDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user document
    const userRef = getDb().collection('users').doc();
    const userData = {
      name: sanitized.name,
      email, // already lowercased by zod
      passwordHash,
      createdAt: getFieldValue().serverTimestamp(),
      updatedAt: getFieldValue().serverTimestamp(),
    };

    await userRef.set(userData);

    // Generate JWT
    const tokenPayload: JwtPayload = {
      sub: userRef.id,
      email,
      name: sanitized.name,
      jti: uuidv4(),
    };
    const token = generateToken(tokenPayload);

    // Set httpOnly cookie
    setAuthCookie(res, token);

    res.status(201).json({
      data: {
        user: {
          id: userRef.id,
          name: sanitized.name,
          email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/signin
 */
export async function signin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user by email
    const usersSnapshot = await getDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate JWT
    const tokenPayload: JwtPayload = {
      sub: userDoc.id,
      email: userData.email,
      name: userData.name,
      jti: uuidv4(),
    };
    const token = generateToken(tokenPayload);

    // Set httpOnly cookie
    setAuthCookie(res, token);

    res.json({
      data: {
        user: {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/signout
 * Clears the session cookie.
 */
export async function signout(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (req.user && req.user.jti && req.user.exp) {
    await addToBlocklist(req.user.jti, new Date(req.user.exp * 1000));
  }
  
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
  res.json({ data: { message: 'Signed out successfully.' } });
}

/**
 * GET /api/auth/me  (protected)
 */
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const userData = userDoc.data()!;
    res.json({
      data: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    // Check user exists
    const usersSnapshot = await getDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // Don't reveal whether email exists
      res.json({ data: { message: 'If an account with that email exists, a reset code has been sent.' } });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Store in Firestore
    await getDb().collection('passwordResets').doc().set({
      email,
      otp,
      expiresAt,
      used: false,
      createdAt: getFieldValue().serverTimestamp(),
      updatedAt: getFieldValue().serverTimestamp(),
    });

    // Send OTP via email if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const { sendOTPEmail } = await import('../lib/email');
        await sendOTPEmail(email, otp);
        logger.info('Password reset OTP email sent');
      } catch (emailErr) {
        logger.error('Failed to send OTP email', { emailErr });
        res.status(503).json({ 
          error: 'Failed to send reset email. Please try again or contact support.' 
        });
        return;
      }
    } else {
      logger.warn('SMTP not configured — OTP email skipped');
    }

    res.json({ data: { message: 'If an account with that email exists, a reset code has been sent.' } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-reset
 */
export async function verifyReset(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;

    // Find the OTP doc
    const otpSnapshot = await getDb()
      .collection('passwordResets')
      .where('email', '==', email)
      .where('otp', '==', otp)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (otpSnapshot.empty) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    const otpDoc = otpSnapshot.docs[0];
    const otpData = otpDoc.data();

    // Check expiry
    const expiresAt = otpData.expiresAt.toDate ? otpData.expiresAt.toDate() : new Date(otpData.expiresAt);
    if (new Date() > expiresAt) {
      res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
      return;
    }

    // Update password
    const usersSnapshot = await getDb()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await usersSnapshot.docs[0].ref.update({
      passwordHash,
      updatedAt: getFieldValue().serverTimestamp(),
    });

    // Delete the OTP doc
    await otpDoc.ref.delete();

    res.json({ data: { message: 'Password has been reset successfully.' } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/oauth
 */
export async function oauth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { idToken, provider } = req.body;
    if (!idToken || !provider) {
      res.status(400).json({ error: 'Missing idToken or provider.' });
      return;
    }

    const admin = getAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    if (!email) {
      res.status(400).json({ error: 'OAuth provider did not return an email address.' });
      return;
    }

    const usersRef = getDb().collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).limit(1).get();

    let userDoc;
    let userId;
    let userName = name || email.split('@')[0];

    if (usersSnapshot.empty) {
      // Create new user
      const userRef = usersRef.doc();
      userId = userRef.id;
      const userData = {
        name: userName,
        email,
        provider,
        picture: picture || null,
        createdAt: getFieldValue().serverTimestamp(),
        updatedAt: getFieldValue().serverTimestamp(),
        lastLoginAt: getFieldValue().serverTimestamp(),
      };
      await userRef.set(userData);
    } else {
      userDoc = usersSnapshot.docs[0];
      userId = userDoc.id;
      userName = userDoc.data().name;
      await userDoc.ref.update({
        lastLoginAt: getFieldValue().serverTimestamp(),
      });
    }

    // Generate JWT
    const tokenPayload: JwtPayload = {
      sub: userId,
      email,
      name: userName,
      jti: uuidv4(),
    };
    const token = generateToken(tokenPayload);

    // Set cookie
    setAuthCookie(res, token);

    res.json({
      data: {
        user: {
          id: userId,
          name: userName,
          email,
        },
      },
    });
  } catch (error) {
    logger.error('OAuth error', { error });
    res.status(401).json({ error: 'Invalid OAuth token.' });
  }
}
