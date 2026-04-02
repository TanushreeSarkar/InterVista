import { Request } from 'express';

// ─── User ────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ─── Auth ────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;   // user id
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Session ─────────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  role: string;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ─── Question ────────────────────────────────────────────
export interface Question {
  id: string;
  sessionId: string;
  text: string;
  index: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ─── Answer ──────────────────────────────────────────────
export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  questionIndex: number;
  text: string;
  audioPath?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// ─── Evaluation ──────────────────────────────────────────
export interface SkillsAssessment {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  confidence: number;
}

export interface QuestionFeedback {
  questionIndex: number;
  question: string;
  answer: string;
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
}

export interface EvaluationResult {
  overallScore: number;
  summary: string;
  recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  skillsAssessment: SkillsAssessment;
  feedback: QuestionFeedback[];
}

export interface StoredEvaluation extends EvaluationResult {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
