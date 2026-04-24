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
    const snapshot = await getDb().collection('sessions').where('userId', '==', userId).get();
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    })).sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // desc
    });
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

    const snapshot = await getDb().collection('questions').where('sessionId', '==', sessionId).get();
    const questions = snapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    })).sort((a: any, b: any) => (a.index || 0) - (b.index || 0));
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

    const questionsSnap = await getDb().collection('questions').where('sessionId', '==', sessionId).get();
    const answersSnap = await getDb().collection('answers').where('sessionId', '==', sessionId).get();
    const answersMap = new Map(answersSnap.docs.map((d) => [d.data().questionIndex, d.data()]));

    // Get evaluation if exists
    const evalSnap = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();
    const evaluation = evalSnap.empty ? null : evalSnap.docs[0].data();

    const questionsDocs = questionsSnap.docs.sort((a, b) => (a.data().index || 0) - (b.data().index || 0));

    const transcript = questionsDocs.map((qDoc, i) => {
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

    const questionsSnap = await getDb().collection('questions').where('sessionId', '==', sessionId).get();
    const answersSnap = await getDb().collection('answers').where('sessionId', '==', sessionId).get();
    const evalSnap = await getDb().collection('evaluations').where('sessionId', '==', sessionId).limit(1).get();

    const sessionData = sessionDoc.data()!;
    const answersMap = new Map(answersSnap.docs.map((d) => [d.data().questionIndex, d.data()]));
    const evaluation = evalSnap.empty ? null : evalSnap.docs[0].data();

    const exportData = {
      session: { id: sessionId, role: sessionData.role, company: sessionData.company, difficulty: sessionData.difficulty, createdAt: sessionData.createdAt?.toDate?.()?.toISOString?.() },
      questions: questionsSnap.docs
        .sort((a, b) => (a.data().index || 0) - (b.data().index || 0))
        .map((qDoc, i) => ({
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

import { successResponse, errorResponse } from '../lib/apiResponse';

/**
 * DELETE /api/sessions/:id
 */
export async function deleteSession(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const sessionId = req.params.id as string;
    const sessionRef = getDb().collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) { 
      res.status(404).json(errorResponse('NOT_FOUND', 'Session not found.')); 
      return; 
    }
    if (sessionDoc.data()!.userId !== userId) { 
      res.status(403).json(errorResponse('FORBIDDEN', 'Forbidden.')); 
      return; 
    }

    // Delete associated questions, answers, and evaluations using batch
    const batch = getDb().batch();
    batch.delete(sessionRef);

    const questionsSnap = await getDb().collection('questions').where('sessionId', '==', sessionId).get();
    questionsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    const answersSnap = await getDb().collection('answers').where('sessionId', '==', sessionId).get();
    answersSnap.docs.forEach((doc) => batch.delete(doc.ref));

    const evalSnap = await getDb().collection('evaluations').where('sessionId', '==', sessionId).get();
    evalSnap.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    res.status(200).json(successResponse({ success: true }));
  } catch (error: any) { 
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to delete session', error.message));
  }
}

