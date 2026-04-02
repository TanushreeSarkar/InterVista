// web/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Core fetch wrapper ────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies with every request
    cache: 'no-store',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  const json = await res.json();
  // Backend wraps responses in { data: ... }
  return json.data !== undefined ? json.data : json;
}

// ─── Types ─────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  index: number;
}

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
  id: string;
  sessionId: string;
  overallScore: number;
  summary: string;
  recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  skillsAssessment: SkillsAssessment;
  feedback: QuestionFeedback[];
}

export interface CreateSessionResponse {
  session: InterviewSession;
  questions: Question[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  targetRole: string;
  targetCompany: string;
  createdAt: string | null;
}

export interface AnalyticsOverview {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  scoreHistory: Array<{ date: string; score: number; role: string }>;
  skillsProgress: {
    communication: number[];
    technicalKnowledge: number[];
    problemSolving: number[];
    confidence: number[];
  };
  topRoles: Array<{ role: string; count: number; avgScore: number }>;
  improvementRate: number;
  streak: number;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  bio: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  questions: string[];
}

export interface TranscriptItem {
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export type Transcript = TranscriptItem[];

// ─── Auth API ──────────────────────────────────────────────
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function signOut(): Promise<void> {
  await apiFetch<{ message: string }>('/api/auth/signout', {
    method: 'POST',
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me');
}

export async function resetPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyReset(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/verify-reset', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
}

// ─── Sessions API ──────────────────────────────────────────
export async function createSession(data: {
  role: string;
  company: string;
  difficulty: string;
  personaId?: string;
  questionBankId?: string;
}): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSessions(): Promise<InterviewSession[]> {
  return apiFetch<InterviewSession[]>('/api/sessions');
}

export async function getSession(sessionId: string): Promise<InterviewSession> {
  return apiFetch<InterviewSession>(`/api/sessions/${encodeURIComponent(sessionId)}`);
}

export async function getSessionQuestions(sessionId: string): Promise<Question[]> {
  return apiFetch<Question[]>(`/api/sessions/${encodeURIComponent(sessionId)}/questions`);
}

export async function getSessionTranscript(sessionId: string): Promise<Transcript> {
  return apiFetch<Transcript>(`/api/sessions/${encodeURIComponent(sessionId)}/transcript`);
}

export async function exportSession(sessionId: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(`/api/sessions/${encodeURIComponent(sessionId)}/export`);
}

// ─── Answers API ───────────────────────────────────────────
export async function submitAnswer(data: {
  sessionId: string;
  questionId: string;
  questionIndex: number;
  text: string;
  audioBlob?: Blob;
}): Promise<void> {
  const formData = new FormData();
  formData.append('sessionId', data.sessionId);
  formData.append('questionId', data.questionId);
  formData.append('questionIndex', data.questionIndex.toString());
  formData.append('text', data.text);

  if (data.audioBlob) {
    formData.append('audio', data.audioBlob, 'answer.webm');
  }

  await apiFetch<{ success: boolean }>('/api/answers', {
    method: 'POST',
    body: formData,
  });
}

export async function getEvaluation(sessionId: string): Promise<EvaluationResult> {
  return apiFetch<EvaluationResult>(`/api/answers/evaluation/${encodeURIComponent(sessionId)}`);
}

// ─── Users API ─────────────────────────────────────────────
export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/users/profile');
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  targetRole?: string;
  targetCompany?: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/users/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/users/account', {
    method: 'DELETE',
  });
}

// ─── Question Banks API ────────────────────────────────────
export async function getQuestionBanks(): Promise<QuestionBank[]> {
  return apiFetch<QuestionBank[]>('/api/question-banks');
}

export async function createQuestionBank(data: {
  name: string;
  description?: string;
  questions: string[];
}): Promise<QuestionBank> {
  return apiFetch<QuestionBank>('/api/question-banks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Analytics API ─────────────────────────────────────────
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>('/api/analytics/overview');
}

export async function getSkillsRadar(): Promise<SkillsAssessment> {
  return apiFetch<SkillsAssessment>('/api/analytics/skills-radar');
}

export async function getRecommendations(): Promise<string[]> {
  return apiFetch<string[]>('/api/analytics/recommendations');
}

// ─── Personas API ──────────────────────────────────────────
export async function getPersonas(): Promise<Persona[]> {
  return apiFetch<Persona[]>('/api/sessions/personas');
}
