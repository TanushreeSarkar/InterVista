import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { evaluateAnswers } from '../lib/ai';
import { submitAnswerSchema } from '../validators';
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

import { unlinkSync } from 'fs';

function validateAudioMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toUpperCase();

    const allowedSignatures = [
      '1A45DFA3', // WebM or MKV
      '000000', // Start of MP4 (often 00 00 00 18 or 00 00 00 20) with ftyp
      '494433', // MP3 with ID3
      'FFFB', // MP3 without ID3
      'FFF3', // MP3 without ID3
      'FFF2', // MP3 without ID3
      '52494646', // WAV (RIFF)
      '4F676753', // OGG
    ];

    return allowedSignatures.some(sig => hex.startsWith(sig)) || buffer.toString('ascii').includes('ftyp');
  } catch (err) {
    logger.error('Magic byte validation error', err);
    return false;
  }
}

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

    const validatedData = submitAnswerSchema.parse(req.body);
    const { sessionId, questionId, questionIndex, text } = validatedData;

    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    let answerText = text || '';
    // Sanitize text input
    if (answerText) {
      answerText = sanitizeFields({ text: answerText }, ['text']).text;
    }

    const answerData: Record<string, any> = {
      sessionId, questionId, questionIndex,
      userId, text: answerText,
      createdAt: getFieldValue().serverTimestamp(), updatedAt: getFieldValue().serverTimestamp(),
    };

    // If audio uploaded, save path and auto-transcribe if no text provided
    if (req.file) {
      if (!validateAudioMagicBytes(req.file.path)) {
        unlinkSync(req.file.path);
        res.status(415).json({ error: 'Invalid file content: Magic byte mismatch.' });
        return;
      }

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
    emitAnswerFeedback(userId, sessionId, questionText, answerText, questionIndex, personaId).catch(() => { });

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

    const status = sessionDoc.data()!.status;

    // Check if evaluation exists
    const existingEval = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();
    if (!existingEval.empty) {
      const evalDoc = existingEval.docs[0];
      const evalData = evalDoc.data();
      res.json({ data: { id: evalDoc.id, ...evalData, createdAt: evalData.createdAt?.toDate?.()?.toISOString?.() || null, updatedAt: evalData.updatedAt?.toDate?.()?.toISOString?.() || null } });
      return;
    }

    if (status === 'evaluating') {
      res.status(202).json({ status: 'evaluating', message: 'Evaluation in progress' });
      return;
    }

    if (status === 'evaluation_failed') {
      res.status(500).json({ error: 'Evaluation failed, please retry' });
      return;
    }

    // Set to evaluating and start background processing
    await getDb().collection('sessions').doc(sessionId).update({ status: 'evaluating', updatedAt: getFieldValue().serverTimestamp() });

    const questionsSnapshot = await getDb().collection('questions').where('sessionId', '==', sessionId).orderBy('index', 'asc').get();
    const questions = questionsSnapshot.docs.map((doc) => doc.data().text as string);

    const answersSnapshot = await getDb().collection('answers').where('sessionId', '==', sessionId).orderBy('questionIndex', 'asc').get();
    const answers = answersSnapshot.docs.map((doc) => doc.data().text as string);

    const personaId = sessionDoc.data()!.personaId;
    const role = sessionDoc.data()!.role || 'Candidate';
    const company = sessionDoc.data()!.company || 'Company';
    const difficulty = sessionDoc.data()!.difficulty || 'Medium';

    // Background execution
    evaluateAnswers(questions, answers, role, company, difficulty, personaId)
      .then(async (evaluation) => {
        const evalRef = getDb().collection('evaluations').doc();
        const evalData = {
          sessionId, userId, ...evaluation,
          createdAt: getFieldValue().serverTimestamp(), updatedAt: getFieldValue().serverTimestamp(),
        };
        await evalRef.set(evalData);
        await getDb().collection('sessions').doc(sessionId).update({ status: 'completed', updatedAt: getFieldValue().serverTimestamp() });
        emitEvaluationReady(userId, sessionId, evaluation.overallScore);

        // Send email
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
      })
      .catch(async (err) => {
        logger.error('Evaluation failed in background', err);
        await getDb().collection('sessions').doc(sessionId).update({ status: 'evaluation_failed', updatedAt: getFieldValue().serverTimestamp() });
      });

    res.status(202).json({ status: 'evaluating', message: 'Evaluation in progress' });
  } catch (error) { next(error); }
}

/**
 * POST /api/answers/evaluation/:sessionId/retry
 */
export async function retryEvaluation(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.sessionId as string;

    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    await getDb().collection('sessions').doc(sessionId).update({ status: 'pending', updatedAt: getFieldValue().serverTimestamp() });
    res.json({ data: { message: 'Evaluation retry triggered' } });
  } catch (error) { next(error); }
}
