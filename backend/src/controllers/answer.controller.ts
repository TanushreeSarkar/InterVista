import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, collections } from '../db/firestore';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error-handler';

export async function submitAnswer(req: AuthRequest, res: Response) {
  try {
    const { sessionId, questionId } = req.body;
    const audioFile = req.file;

    if (!sessionId || !questionId || !audioFile) {
      throw new AppError('Session ID, question ID, and audio file are required', 400);
    }

    const db = getFirestore();
    const answerId = uuidv4();

    // In production, upload to Firebase Storage or S3
    // For now, just store metadata
    const answer = {
      id: answerId,
      sessionId,
      questionId,
      audioUrl: `/uploads/${audioFile.filename}`,
      transcript: '', // Will be filled by STT service
      createdAt: new Date(),
    };

    await db.collection(collections.answers).doc(answerId).set(answer);

    // Update session status
    await db.collection(collections.sessions).doc(sessionId).update({
      status: 'in_progress',
      updatedAt: new Date(),
    });

    // Generate mock evaluation
    const evaluation = {
      id: uuidv4(),
      sessionId,
      questionId,
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      feedback: 'Your answer demonstrates good understanding of the topic. Consider providing more specific examples to strengthen your response.',
      strengths: [
        'Clear communication',
        'Good structure',
        'Relevant examples',
      ],
      improvements: [
        'Add more technical depth',
        'Provide quantifiable results',
      ],
      createdAt: new Date(),
    };

    await db.collection(collections.evaluations).doc(evaluation.id).set(evaluation);

    res.status(201).json({ answer, evaluation });
  } catch (error) {
    throw error;
  }
}

export async function getEvaluation(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const db = getFirestore();

    const evaluationsSnapshot = await db
      .collection(collections.evaluations)
      .where('sessionId', '==', sessionId)
      .get();

    const evaluations = evaluationsSnapshot.docs.map((doc) => doc.data());

    // Calculate overall score
    const overallScore = evaluations.length > 0
      ? Math.round(
          evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
        )
      : 0;

    // Update session
    await db.collection(collections.sessions).doc(sessionId).update({
      status: 'completed',
      completedAt: new Date(),
      score: overallScore,
      updatedAt: new Date(),
    });

    res.json(evaluations);
  } catch (error) {
    throw error;
  }
}