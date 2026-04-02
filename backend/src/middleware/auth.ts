import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types/types';
import logger from '../lib/logger';

const COOKIE_NAME = 'intervista_session';

/**
 * JWT authentication middleware.
 * Reads JWT from httpOnly cookie first, Authorization header as fallback.
 * Attaches decoded payload to req.user.
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      // Clear expired cookie
      res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      res.status(401).json({ error: 'Token has expired. Please sign in again.' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token. Please sign in again.' });
      return;
    }
    logger.error('Auth middleware error', error);
    res.status(401).json({ error: 'Authentication failed.' });
  }
}
