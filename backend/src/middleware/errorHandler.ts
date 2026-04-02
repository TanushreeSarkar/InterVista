import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

/**
 * Custom error class with HTTP status code.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Global error handler middleware.
 * - Production: never expose stack traces or internal details
 * - Development: return full error details
 * - Maps known error types to appropriate HTTP status codes
 */
export function globalErrorHandler(
  err: Error & { statusCode?: number; code?: string | number; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the full error internally
  logger.error(`${err.message}`, { stack: err.stack, code: err.code });

  const isProduction = process.env.NODE_ENV === 'production';

  // ─── Map known error types to status codes ───────────────
  let statusCode = err.statusCode || err.status || 500;
  let clientMessage = err.message || 'Internal server error';

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    clientMessage = err.name === 'TokenExpiredError'
      ? 'Token has expired. Please sign in again.'
      : 'Invalid token. Please sign in again.';
  }

  // Zod validation errors → 400
  if (err.name === 'ZodError') {
    statusCode = 400;
    clientMessage = 'Validation failed';
  }

  // Multer file size errors → 413
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    clientMessage = 'File too large. Maximum size is 25MB.';
  }

  // Multer unexpected field → 400
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    clientMessage = 'Unexpected file field.';
  }

  // Firestore not found errors → 404
  if (err.code === 5 || (err.message && err.message.includes('NOT_FOUND'))) {
    statusCode = 404;
    clientMessage = 'Resource not found.';
  }

  // SyntaxError from JSON parsing → 400
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    clientMessage = 'Invalid JSON in request body.';
  }

  // ─── Build response ─────────────────────────────────────
  if (isProduction) {
    // Never expose internals in production
    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal server error' : clientMessage,
    });
  } else {
    // Development: include details
    res.status(statusCode).json({
      error: clientMessage,
      stack: err.stack,
    });
  }
}
