import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, collections } from '../db/firestore';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error-handler';

const questionTemplates: Record<string, string[]> = {
  'Software Engineer': [
    'Tell me about yourself and your background in software development.',
    'Describe a challenging technical problem you solved and your approach.',
    'How do you stay updated with the latest technologies and best practices?',
    'Explain your experience with version control and collaborative development.',
    'Where do you see yourself in the next 3-5 years in your career?',
  ],
  'Product Manager': [
    'Tell me about your experience in product management.',
    'How do you prioritize features when building a product roadmap?',
    'Describe a time when you had to make a difficult product decision.',
    'How do you gather and incorporate user feedback?',
    'What metrics do you use to measure product success?',
  ],
  'Data Scientist': [
    'Walk me through your background in data science.',
    'Describe a complex data analysis project you worked on.',
    'How do you approach feature engineering and model selection?',
    'Explain how you communicate technical findings to non-technical stakeholders.',
    'What are your thoughts on the ethical implications of AI and machine learning?',
  ],
};

export async function createSession(req: AuthRequest, res: Response) {
  try {
    const { role, level } = req.body;
    const userId = req.user?.id;

    if (!role || !level) {
      throw new AppError('Role and level are required', 400);
    }

    const sessionId = uuidv4();

    // Create session
    const session = {
      id: sessionId,
      userId,
      role,
      level,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate questions
    const questions = (questionTemplates[role] || questionTemplates['Software Engineer']).map(
      (text, index) => ({
        id: uuidv4(),
        sessionId,
        text,
        order: index + 1,
        createdAt: new Date(),
      })
    );

    // Try to save to database, but continue even if it fails
    try {
      const db = getFirestore();
      await db.collection(collections.sessions).doc(sessionId).set(session);
      
      const batch = db.batch();
      questions.forEach((question) => {
        const ref = db.collection(collections.questions).doc(question.id);
        batch.set(ref, question);
      });
      await batch.commit();
    } catch (dbError) {
      console.warn('Database save failed, using in-memory storage:', dbError);
      // Store in memory for mock mode
      if (!global.mockSessions) global.mockSessions = {};
      if (!global.mockQuestions) global.mockQuestions = {};
      global.mockSessions[sessionId] = session;
      global.mockQuestions[sessionId] = questions;
    }

    res.status(201).json(session);
  } catch (error) {
    throw error;
  }
}

export async function getSession(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;

    // Try database first
    try {
      const db = getFirestore();
      const sessionDoc = await db.collection(collections.sessions).doc(sessionId).get();

      if (sessionDoc.exists) {
        return res.json(sessionDoc.data());
      }
    } catch (dbError) {
      console.warn('Database read failed, checking mock storage');
    }

    // Fall back to mock storage
    if (global.mockSessions && global.mockSessions[sessionId]) {
      return res.json(global.mockSessions[sessionId]);
    }

    throw new AppError('Session not found', 404);
  } catch (error) {
    throw error;
  }
}

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;

    // Try database first
    try {
      const db = getFirestore();
      const sessionsSnapshot = await db
        .collection(collections.sessions)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const sessions = sessionsSnapshot.docs.map((doc) => doc.data());
      return res.json(sessions);
    } catch (dbError) {
      console.warn('Database read failed, checking mock storage');
    }

    // Fall back to mock storage
    if (global.mockSessions) {
      const sessions = Object.values(global.mockSessions).filter(
        (s: any) => s.userId === userId
      );
      return res.json(sessions);
    }

    res.json([]);
  } catch (error) {
    throw error;
  }
}

export async function getQuestions(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;

    // Try database first
    try {
      const db = getFirestore();
      const questionsSnapshot = await db
        .collection(collections.questions)
        .where('sessionId', '==', sessionId)
        .orderBy('order', 'asc')
        .get();

      const questions = questionsSnapshot.docs.map((doc) => doc.data());
      if (questions.length > 0) {
        return res.json(questions);
      }
    } catch (dbError) {
      console.warn('Database read failed, checking mock storage');
    }

    // Fall back to mock storage
    if (global.mockQuestions && global.mockQuestions[sessionId]) {
      return res.json(global.mockQuestions[sessionId]);
    }

    res.json([]);
  } catch (error) {
    throw error;
  }
}