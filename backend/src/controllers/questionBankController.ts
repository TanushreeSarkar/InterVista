import { Response, NextFunction } from 'express';
import { getDb, getFieldValue } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { sanitizeFields } from '../lib/sanitize';

/**
 * POST /api/question-banks
 */
export async function createQuestionBank(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { name, description, questions } = req.body;

    // Sanitize string inputs
    const sanitized = sanitizeFields({ name, description }, ['name', 'description']);
    const sanitizedQuestions = questions
      .map((q: string) => sanitizeFields({ q }, ['q']).q)
      .filter((q: string) => q.trim());

    const ref = getDb().collection('questionBanks').doc();
    const data = {
      userId, name: sanitized.name, description: sanitized.description,
      questions: sanitizedQuestions,
      createdAt: getFieldValue().serverTimestamp(),
      updatedAt: getFieldValue().serverTimestamp(),
    };
    await ref.set(data);

    res.status(201).json({ data: { id: ref.id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
  } catch (error) { next(error); }
}

/**
 * GET /api/question-banks
 */
export async function getQuestionBanks(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const snapshot = await getDb().collection('questionBanks').where('userId', '==', userId).get();
    const banks = snapshot.docs.map((doc) => ({
      id: doc.id, ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null,
    })).sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    res.json({ data: banks });
  } catch (error) { next(error); }
}

/**
 * GET /api/question-banks/:id
 */
export async function getQuestionBank(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const id = req.params.id as string;
    const doc = await getDb().collection('questionBanks').doc(id).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found.' }); return; }
    if (doc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }
    res.json({ data: { id: doc.id, ...doc.data(), createdAt: doc.data()!.createdAt?.toDate?.()?.toISOString?.() || null, updatedAt: doc.data()!.updatedAt?.toDate?.()?.toISOString?.() || null } });
  } catch (error) { next(error); }
}

/**
 * PUT /api/question-banks/:id
 */
export async function updateQuestionBank(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const id = req.params.id as string;
    const doc = await getDb().collection('questionBanks').doc(id).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found.' }); return; }
    if (doc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    const { name, description, questions } = req.body;
    const updates: Record<string, any> = { updatedAt: getFieldValue().serverTimestamp() };

    if (name) {
      updates.name = sanitizeFields({ name }, ['name']).name;
    }
    if (description !== undefined) {
      updates.description = sanitizeFields({ description }, ['description']).description;
    }
    if (Array.isArray(questions)) {
      updates.questions = questions
        .map((q: string) => sanitizeFields({ q }, ['q']).q)
        .filter((q: string) => q.trim());
    }

    await getDb().collection('questionBanks').doc(id).update(updates);
    res.json({ data: { id, ...doc.data(), ...updates, updatedAt: new Date().toISOString() } });
  } catch (error) { next(error); }
}

/**
 * DELETE /api/question-banks/:id
 */
export async function deleteQuestionBank(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const id = req.params.id as string;
    const doc = await getDb().collection('questionBanks').doc(id).get();
    if (!doc.exists) { res.status(404).json({ error: 'Not found.' }); return; }
    if (doc.data()!.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }
    await getDb().collection('questionBanks').doc(id).delete();
    res.json({ data: { message: 'Question bank deleted.' } });
  } catch (error) { next(error); }
}
