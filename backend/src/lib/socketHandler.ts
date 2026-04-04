import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/types';
import { generateQuickFeedback } from './ai';
import logger from './logger';

function parseCookieHeader(cookieStr: string, name: string): string | null {
  if (!cookieStr) return null;
  const match = cookieStr.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer, corsOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  // JWT authentication middleware for WebSocket
  io.use((socket, next) => {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) return next(new Error('Authentication required'));
    const token = parseCookieHeader(cookie, 'intervista_session');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    // Join user-specific room
    socket.join(`user:${user.sub}`);
    logger.info('Socket connected');

    socket.on('disconnect', () => {
      logger.info('Socket disconnected');
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit quick per-answer feedback to a specific user via WebSocket.
 * Called asynchronously after answer submission (non-blocking).
 */
export async function emitAnswerFeedback(
  userId: string,
  sessionId: string,
  question: string,
  answer: string,
  questionIndex: number,
  personaId?: string
): Promise<void> {
  if (!io) return;

  try {
    const feedback = await generateQuickFeedback(question, answer, personaId);
    io.to(`user:${userId}`).emit('answer:feedback', {
      sessionId,
      questionIndex,
      ...feedback,
    });
  } catch (error) {
    logger.error('Failed to emit answer feedback');
  }
}

/**
 * Notify user that evaluation is ready.
 */
export function emitEvaluationReady(userId: string, sessionId: string, overallScore: number): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('evaluation:ready', { sessionId, overallScore });
}

/**
 * Notify user of session status change.
 */
export function emitSessionUpdated(userId: string, sessionId: string, status: string): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('session:updated', { sessionId, status });
}
