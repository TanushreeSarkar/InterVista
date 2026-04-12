import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/types';
import logger from '../lib/logger';
import { isBlocked } from '../lib/tokenBlocklist';

const COOKIE_NAME = 'intervista_session';

/**
 * JWT authentication middleware.
 * Reads JWT from httpOnly cookie first, Authorization header as fallback.
 * Attaches decoded payload to req.user.
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Try httpOnly cookie first
    let token = req.cookies?.[COOKIE_NAME];

    // 2. Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { jti?: string };
    
    if (decoded.jti && await isBlocked(decoded.jti)) {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
      });
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }
    
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
      });
      res.status(401).json({ error: 'Token has expired. Please sign in again.' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      const isProduction = process.env.NODE_ENV === 'production';
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
      });
      res.status(401).json({ error: 'Invalid token. Please sign in again.' });
      return;
    }
    logger.error('Auth middleware error', error);
    res.status(401).json({ error: 'Authentication failed.' });
  }
}
