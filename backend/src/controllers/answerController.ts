import { Response, NextFunction } from 'express';
import os from 'os';
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
import { uploadAudioToStorage } from '../lib/storage';
import logger from '../lib/logger';

// ─── Allowed audio MIME types ──────────────────────────────
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
];

// ─── Multer setup (memory storage for cloud upload) ────────
const memoryStorage = multer.memoryStorage();

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

function validateAudioMagicBytes(buffer: Buffer): boolean {
  try {
    if (buffer.length < 12) return false;
    const hex = buffer.subarray(0, 12).toString('hex').toUpperCase();

    const allowedSignatures = [
      '1A45DFA3', // WebM or MKV
      '000000',   // Start of MP4 (often 00 00 00 18 or 00 00 00 20) with ftyp
      '494433',   // MP3 with ID3
      'FFFB',     // MP3 without ID3
      'FFF3',     // MP3 without ID3
      'FFF2',     // MP3 without ID3
      '52494646', // WAV (RIFF)
      '4F676753', // OGG
    ];

    return allowedSignatures.some(sig => hex.startsWith(sig)) || buffer.toString('ascii', 0, 12).includes('ftyp');
  } catch (err) {
    logger.error('Magic byte validation error', err);
    return false;
  }
}

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter,
});

// ─── Streak / Score / Badge helpers ────────────────────────

const STREAK_BADGE_MILESTONES: Record<number, string> = {
  3: '3-Day Streak 🔥',
  7: '7-Day Streak 🔥🔥',
  14: '14-Day Streak 🔥🔥🔥',
  30: '30-Day Streak 🏆',
};

/**
 * Calculate the current streak (consecutive days with completed interviews)
 * and determine badges earned.
 */
function calculateStreak(completedDates: Date[]): { streak: number; badges: string[] } {
  if (completedDates.length === 0) return { streak: 0, badges: [] };

  // Normalize to YYYY-MM-DD and deduplicate
  const dateSet = new Set<string>();
  for (const d of completedDates) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateSet.add(key);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dateSet.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow today to be missing (user hasn't done today's interview yet)
      break;
    }
  }

  // Determine badges
  const badges: string[] = [];
  for (const [milestone, badge] of Object.entries(STREAK_BADGE_MILESTONES)) {
    if (streak >= parseInt(milestone)) {
      badges.push(badge);
    }
  }

  return { streak, badges };
}

/**
 * Recalculate and persist user stats after an evaluation completes.
 */
async function updateUserStats(userId: string): Promise<void> {
  try {
    const db = getDb();

    // Get all evaluations for this user
    const evalsSnap = await db.collection('evaluations').where('userId', '==', userId).get();
    const scores = evalsSnap.docs.map(d => d.data().overallScore as number).filter(s => typeof s === 'number');
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Get all completed sessions for streak calculation
    const sessionsSnap = await db.collection('sessions')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    const completedDates = sessionsSnap.docs
      .map(d => d.data().createdAt?.toDate?.())
      .filter((d): d is Date => d instanceof Date);

    const { streak, badges } = calculateStreak(completedDates);

    // Persist to user record
    await db.collection('users').doc(userId).update({
      averageScore,
      streak,
      badges,
      totalInterviews: evalsSnap.size,
      lastInterviewDate: getFieldValue().serverTimestamp(),
      updatedAt: getFieldValue().serverTimestamp(),
    });

    logger.info(`Updated user stats for ${userId}: avgScore=${averageScore}, streak=${streak}, badges=${badges.length}`);
  } catch (err) {
    logger.error('Failed to update user stats', err);
  }
}

// ─── Staleness threshold for stuck evaluations ─────────────
const EVALUATION_STALENESS_MS = 5 * 60 * 1000; // 5 minutes

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

    // If audio uploaded, upload to cloud storage and auto-transcribe if no text provided
    if (req.file) {
      if (!validateAudioMagicBytes(req.file.buffer)) {
        res.status(415).json({ error: 'Invalid file content: Magic byte mismatch.' });
        return;
      }

      const cloudFilename = `${sessionId}/${Date.now()}-${req.file.originalname}`;

      try {
        const audioUrl = await uploadAudioToStorage(req.file.buffer, cloudFilename, req.file.mimetype);
        answerData.audioUrl = audioUrl;
        answerData.audioFilename = cloudFilename;
      } catch (uploadErr) {
        logger.error('Cloud upload failed', uploadErr);
        // Non-fatal: continue without audio URL
      }

      if (!answerText && process.env.OPENAI_API_KEY) {
        try {
          // Whisper API needs a file stream, so write buffer to temp file
          const tmpPath = path.join(os.tmpdir(), `intervista-${Date.now()}-${req.file.originalname}`);
          fs.writeFileSync(tmpPath, req.file.buffer);
          try {
            const transcript = await transcribeAudio(tmpPath);
            answerData.text = sanitizeFields({ text: transcript }, ['text']).text;
            answerText = answerData.text;
          } finally {
            // Always clean up temp file
            fs.unlinkSync(tmpPath);
          }
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
      // Check for staleness — if stuck evaluating for >5 min, auto-reset
      const updatedAt = sessionDoc.data()!.updatedAt?.toDate?.();
      if (updatedAt && (Date.now() - updatedAt.getTime()) > EVALUATION_STALENESS_MS) {
        logger.warn(`Evaluation for session ${sessionId} is stale (>5 min). Resetting to pending.`);
        await getDb().collection('sessions').doc(sessionId).update({ status: 'pending', updatedAt: getFieldValue().serverTimestamp() });
        // Fall through to re-trigger evaluation below
      } else {
        res.status(202).json({ status: 'evaluating', jobId: sessionId, message: 'Evaluation in progress' });
        return;
      }
    }

    if (status === 'evaluation_failed') {
      res.status(500).json({ error: 'Evaluation failed, please retry' });
      return;
    }

    // Set to evaluating and start background processing
    await getDb().collection('sessions').doc(sessionId).update({ status: 'evaluating', updatedAt: getFieldValue().serverTimestamp() });

    const questionsSnapshot = await getDb().collection('questions').where('sessionId', '==', sessionId).get();
    const questionsDocs = questionsSnapshot.docs.sort((a, b) => (a.data().index || 0) - (b.data().index || 0));
    const questions = questionsDocs.map((doc) => doc.data().text as string);

    const answersSnapshot = await getDb().collection('answers').where('sessionId', '==', sessionId).get();
    const answersDocs = answersSnapshot.docs.sort((a, b) => (a.data().questionIndex || 0) - (b.data().questionIndex || 0));
    const answers = answersDocs.map((doc) => doc.data().text as string);

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

        // Update user stats (streak, average score, badges)
        await updateUserStats(userId);

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

    res.status(202).json({ status: 'evaluating', jobId: sessionId, message: 'Evaluation in progress' });
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
