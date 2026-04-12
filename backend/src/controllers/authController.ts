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
    // Use 'none' in production to allow cross-domain cookies (Netlify -> Backend)
    // Use 'lax' in development for localhost
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

// Custom signup/signin removed. All identity creation flows through Firebase Auth
// and hits the generic verifyFirebase endpoint.

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
    sameSite: isProduction ? 'none' : 'lax',
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

// OTP reset logic removed. Native Firebase Auth `sendPasswordResetEmail` is now used client-side.

/**
 * POST /api/auth/verify-firebase
 */
export async function verifyFirebaseToken(
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

/**
 * POST /api/auth/refresh
 * Refreshes the session cookie for an authenticated user.
 */
export async function refresh(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    // Generate a new JWT and invalidate the old one if needed, but here we just issue a new one
    // to extend the session.
    const tokenPayload: JwtPayload = {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      jti: uuidv4(),
    };
    
    // Optional: blocklist the old token req.user.jti
    
    const token = generateToken(tokenPayload);
    setAuthCookie(res, token);

    res.json({ data: { message: 'Session refreshed.' } });
  } catch (error) {
    next(error);
  }
}
