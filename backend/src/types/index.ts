export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  level: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  score?: number;
}

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  order: number;
  createdAt: Date;
}

export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  audioUrl: string;
  transcript?: string;
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  sessionId: string;
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  createdAt: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}