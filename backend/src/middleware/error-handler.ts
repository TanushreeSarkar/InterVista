import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
  }

  console.error('❌ Unhandled error:', err);
  
  return res.status(500).json({
    error: 'Internal server error',
    status: 500,
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    status: 404,
  });
}