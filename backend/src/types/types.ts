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
  jti?: string;
  exp?: number;
  iat?: number;
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
export interface SkillScore {
  score: number;
  observation: string;
}

export interface SkillsAssessment {
  communication: SkillScore;
  technicalKnowledge: SkillScore;
  problemSolving: SkillScore;
  confidence: SkillScore;
  structuredThinking: SkillScore;
  relevantExperience: SkillScore;
}

export interface QuestionFeedback {
  questionIndex: number;
  question: string;
  answer: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  whatWentWell: string[];
  whatToImprove: string[];
  idealAnswerOutline: string;
  detailedFeedback: string;
}

export interface ImprovementPlanItem {
  priority: 'High' | 'Medium' | 'Low';
  area: string;
  action: string;
  resource: string;
}

export interface EvaluationResult {
  overallScore: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  executiveSummary: string;
  skillsAssessment: SkillsAssessment;
  questionFeedback: QuestionFeedback[];
  overallStrengths: string[];
  overallWeaknesses: string[];
  improvementPlan: ImprovementPlanItem[];
  interviewTips: string[];
  hiringManagerNote: string;
}

export interface StoredEvaluation extends EvaluationResult {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
