import { Response, NextFunction } from 'express';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { generateQuestions } from '../lib/ai';
import { emitSessionUpdated } from '../lib/socketHandler';
import { getAllPersonas } from '../lib/personas';
import { sanitizeFields } from '../lib/sanitize';

/**
 * POST /api/sessions
 */
export async function createSession(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { role, company, difficulty, personaId, questionBankId } = req.body;

    // Sanitize string inputs (validated by zod, now sanitize HTML)
    const sanitized = sanitizeFields({ role, company }, ['role', 'company']);

    let questionTexts: string[];

    // Use custom question bank if provided
    if (questionBankId) {
      const bankDoc = await getDb().collection('questionBanks').doc(questionBankId).get();
      if (!bankDoc.exists) {
        res.status(404).json({ error: 'Question bank not found.' });
        return;
      }
      if (bankDoc.data()!.userId !== userId) {
        res.status(403).json({ error: 'You do not own this question bank.' });
        return;
      }
      questionTexts = bankDoc.data()!.questions as string[];
    } else {
      questionTexts = await generateQuestions(sanitized.role, sanitized.company, difficulty, personaId);
    }

    const sessionRef = getDb().collection('sessions').doc();
    const sessionData: Record<string, any> = {
      userId, role: sanitized.role, company: sanitized.company, difficulty,
      status: 'in_progress',
      personaId: personaId || 'morgan',
      questionBankId: questionBankId || null,
      createdAt: getFieldValue().serverTimestamp(),
      updatedAt: getFieldValue().serverTimestamp(),
    };
    await sessionRef.set(sessionData);

    const batch = getDb().batch();
    const questions: Array<{ id: string; sessionId: string; text: string; index: number }> = [];

    for (let i = 0; i < questionTexts.length; i++) {
      const questionRef = getDb().collection('questions').doc();
      batch.set(questionRef, {
        sessionId: sessionRef.id, text: questionTexts[i], index: i, userId,
        createdAt: getFieldValue().serverTimestamp(), updatedAt: getFieldValue().serverTimestamp(),
      });
      questions.push({ id: questionRef.id, sessionId: sessionRef.id, text: questionTexts[i], index: i });
    }
    await batch.commit();

    res.status(201).json({
      data: {
        session: { id: sessionRef.id, ...sessionData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        questions,
      },
    });
  } catch (error) { next(error); }
}

/**
 * GET /api/sessions
 */
export async function getSessions(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const snapshot = await getDb().collection('sessions').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    }));
    res.json({ data: sessions });
  } catch (error) { next(error); }
}

/**
 * GET /api/sessions/:id
 */
export async function getSession(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.id as string;
    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }
    const d = sessionDoc.data()!;
    res.json({ data: { id: sessionDoc.id, ...d, createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null, updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || null } });
  } catch (error) { next(error); }
}

/**
 * GET /api/sessions/:id/questions
 */
export async function getSessionQuestions(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.id as string;
    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    const snapshot = await getDb().collection('questions').where('sessionId', '==', sessionId).orderBy('index', 'asc').get();
    const questions = snapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    }));
    res.json({ data: questions });
  } catch (error) { next(error); }
}

/**
 * GET /api/sessions/:id/transcript
 */
export async function getSessionTranscript(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.id as string;
    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    const questionsSnap = await getDb().collection('questions').where('sessionId', '==', sessionId).orderBy('index', 'asc').get();
    const answersSnap = await getDb().collection('answers').where('sessionId', '==', sessionId).orderBy('questionIndex', 'asc').get();
    const answersMap = new Map(answersSnap.docs.map((d) => [d.data().questionIndex, d.data()]));

    // Get evaluation if exists
    const evalSnap = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();
    const evaluation = evalSnap.empty ? null : evalSnap.docs[0].data();

    const transcript = questionsSnap.docs.map((qDoc, i) => {
      const answer = answersMap.get(i);
      const feedback = evaluation?.feedback?.[i];
      return {
        index: i,
        question: qDoc.data().text,
        answer: answer?.text || '(No answer)',
        score: feedback?.score || null,
        feedback: feedback?.detailedFeedback || null,
      };
    });

    res.json({ data: { sessionId, role: sessionDoc.data()!.role, company: sessionDoc.data()!.company, transcript } });
  } catch (error) { next(error); }
}

/**
 * GET /api/sessions/:id/export
 */
export async function exportSession(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.id as string;
    const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) { res.status(404).json({ error: 'Session not found.' }); return; }
    if (sessionDoc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    const questionsSnap = await getDb().collection('questions').where('sessionId', '==', sessionId).orderBy('index', 'asc').get();
    const answersSnap = await getDb().collection('answers').where('sessionId', '==', sessionId).orderBy('questionIndex', 'asc').get();
    const evalSnap = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();

    const sessionData = sessionDoc.data()!;
    const answersMap = new Map(answersSnap.docs.map((d) => [d.data().questionIndex, d.data()]));
    const evaluation = evalSnap.empty ? null : evalSnap.docs[0].data();

    const exportData = {
      session: { id: sessionId, role: sessionData.role, company: sessionData.company, difficulty: sessionData.difficulty, createdAt: sessionData.createdAt?.toDate?.()?.toISOString?.() },
      questions: questionsSnap.docs.map((qDoc, i) => ({
        index: i, text: qDoc.data().text, answer: answersMap.get(i)?.text || '',
      })),
      evaluation: evaluation ? {
        overallScore: evaluation.overallScore, summary: evaluation.summary, recommendation: evaluation.recommendation,
        skillsAssessment: evaluation.skillsAssessment, feedback: evaluation.feedback,
      } : null,
    };

    res.json({ data: exportData });
  } catch (error) { next(error); }
}

/**
 * GET /api/personas
 */
export async function listPersonas(
  _req: AuthRequest, res: Response, _next: NextFunction
): Promise<void> {
  res.json({ data: getAllPersonas() });
}
