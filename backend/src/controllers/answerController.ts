import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { evaluateAnswers } from '../lib/ai';
import { transcribeAudio } from '../lib/transcribe';
import { emitAnswerFeedback, emitEvaluationReady } from '../lib/socketHandler';
import { sendSessionCompleteEmail } from '../lib/email';
import { sanitizeFields } from '../lib/sanitize';
import logger from '../lib/logger';

// ─── Allowed audio MIME types ──────────────────────────────
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
];

// ─── Multer setup ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const sessionId = req.body.sessionId || 'unknown';
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', sessionId);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('UNSUPPORTED_MEDIA_TYPE'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter,
});

/**
 * POST /api/answers  (protected, multipart)
 */
export async function submitAnswer(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { sessionId, questionId, questionIndex, text } = req.body;

    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    let answerText = text || '';
    // Sanitize text input
    if (answerText) {
      answerText = sanitizeFields({ text: answerText }, ['text']).text;
    }

    const answerData: Record<string, any> = {
      sessionId, questionId, questionIndex: parseInt(questionIndex) || 0,
      userId, text: answerText,
      createdAt: getFieldValue().serverTimestamp(), updatedAt: getFieldValue().serverTimestamp(),
    };

    // If audio uploaded, save path and auto-transcribe if no text provided
    if (req.file) {
      answerData.audioPath = req.file.path;
      answerData.audioFilename = req.file.filename;

      if (!answerText && process.env.OPENAI_API_KEY) {
        try {
          const transcript = await transcribeAudio(req.file.path);
          answerData.text = sanitizeFields({ text: transcript }, ['text']).text;
          answerText = answerData.text;
        } catch (err) {
          logger.error('Transcription failed', err);
        }
      }
    }

    const answerRef = getDb().collection('answers').doc();
    await answerRef.set(answerData);

    // Async: emit quick feedback via WebSocket (non-blocking)
    const questionDoc = await getDb().collection('questions').doc(questionId).get();
    const questionText = questionDoc.exists ? questionDoc.data()!.text : '';
    const personaId = sessionDoc.data()!.personaId;

    // Fire and forget — don't await
    emitAnswerFeedback(userId, sessionId, questionText, answerText, parseInt(questionIndex) || 0, personaId).catch(() => {});

    res.status(201).json({
      data: {
        id: answerRef.id, ...answerData,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Handle unsupported media type from multer file filter
    if (error.message === 'UNSUPPORTED_MEDIA_TYPE') {
      res.status(415).json({ error: 'Unsupported file type. Only audio files are allowed: webm, mp4, mpeg, wav, ogg.' });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/answers/evaluation/:sessionId
 */
export async function getEvaluation(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.sessionId as string;

    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    // Check if evaluation exists
    const existingEval = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();
    if (!existingEval.empty) {
      const evalDoc = existingEval.docs[0];
      const evalData = evalDoc.data();
      res.json({ data: { id: evalDoc.id, ...evalData, createdAt: evalData.createdAt?.toDate?.()?.toISOString?.() || null, updatedAt: evalData.updatedAt?.toDate?.()?.toISOString?.() || null } });
      return;
    }

    const questionsSnapshot = await getDb().collection('questions').where('sessionId', '==', sessionId).orderBy('index', 'asc').get();
    const questions = questionsSnapshot.docs.map((doc) => doc.data().text as string);

    const answersSnapshot = await getDb().collection('answers').where('sessionId', '==', sessionId).orderBy('questionIndex', 'asc').get();
    const answers = answersSnapshot.docs.map((doc) => doc.data().text as string);

    const personaId = sessionDoc.data()!.personaId;
    const evaluation = await evaluateAnswers(questions, answers, personaId);

    const evalRef = getDb().collection('evaluations').doc();
    const evalData = {
      sessionId, userId, ...evaluation,
      createdAt: getFieldValue().serverTimestamp(), updatedAt: getFieldValue().serverTimestamp(),
    };
    await evalRef.set(evalData);

    await getDb().collection('sessions').doc(sessionId).update({ status: 'completed', updatedAt: getFieldValue().serverTimestamp() });

    // Emit evaluation ready via WebSocket
    emitEvaluationReady(userId, sessionId, evaluation.overallScore);

    // Send email notification (fire and forget)
    try {
      const userDoc = await getDb().collection('users').doc(userId).get();
      if (userDoc.exists && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const userData = userDoc.data()!;
        sendSessionCompleteEmail(
          userData.email, userData.name, sessionDoc.data()!.role,
          evaluation.overallScore, evaluation.recommendation
        ).catch((err) => logger.error('Failed to send evaluation email', err));
      }
    } catch (emailErr) {
      logger.error('Email notification error', emailErr);
    }

    res.json({ data: { id: evalRef.id, ...evalData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
  } catch (error) { next(error); }
}
