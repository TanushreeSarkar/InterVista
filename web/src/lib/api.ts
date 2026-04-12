// web/src/lib/api.ts

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

// Warn loudly in production if API URL is not configured
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
  console.error('[InterVista] NEXT_PUBLIC_API_URL is not set! API calls will fail in production.');
}

// ─── Core fetch wrapper ────────────────────────────────────
export async function apiFetch<T>(
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

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const minutes = Math.ceil((data.retryAfter || 900) / 60);
    throw new Error(`Rate limit reached. Try again in ${minutes} minutes.`);
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      const isAuthPage = ['/sign-in', '/sign-up', '/reset-password'].some(p => window.location.pathname.startsWith(p));
      if (!isAuthPage) {
        window.location.href = '/sign-in';
      }
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
  personaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  index: number;
}

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
  id: string;
  sessionId: string;
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

export interface ExportData {
  session: {
    id: string
    role: string
    company: string
    difficulty: string
    personaId: string
    status: string
    createdAt: string
  }
  questions: Array<{
    id: string
    text: string
    order: number
  }>
  evaluation: {
    overallScore: number
    recommendation: string
    summary: string
    skillsAssessment: {
      communication: number
      technicalKnowledge: number
      problemSolving: number
      confidence: number
    }
    feedback: Array<{
      questionIndex: number
      question: string
      answer: string
      score: number
      strengths: string[]
      improvements: string[]
      detailedFeedback: string
    }>
  }
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
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
    timezone: string;
  };
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
// Removed signIn and signUp as they are now handled client-side via Firebase Auth + /api/auth/verify-firebase

export async function signOut(): Promise<void> {
  await apiFetch<{ message: string }>('/api/auth/signout', {
    method: 'POST',
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me');
}

// Removed manual resetPassword and verifyReset functions because Firebase natively handles password resets.

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

export async function exportSession(sessionId: string): Promise<ExportData> {
  return apiFetch<ExportData>(`/api/sessions/${encodeURIComponent(sessionId)}/export`);
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

export async function getEvaluation(sessionId: string): Promise<EvaluationResult | { status: 'evaluating' }> {
  return apiFetch<EvaluationResult | { status: 'evaluating' }>(`/api/answers/evaluation/${encodeURIComponent(sessionId)}`);
}

export async function getTtsAudio(text: string, sessionId?: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/tts/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId }),
  });
  if (!res.ok) throw new Error('Failed to fetch TTS audio');
  return res.blob();
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

export async function updatePreferences(data: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  language?: string;
  timezone?: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/users/preferences', {
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

export async function deleteSession(sessionId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

// ─── Reports API ───────────────────────────────────────────
export async function getReports(): Promise<any[]> {
  return apiFetch<any[]>('/api/reports');
}

export async function getReportById(reportId: string): Promise<any> {
  return apiFetch<any>(`/api/reports/${encodeURIComponent(reportId)}`);
}

// ─── Subscription API ──────────────────────────────────────
export async function getSubscriptionStatus(): Promise<any> {
  return apiFetch<any>('/api/subscription/status');
}

export async function createCheckoutSession(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/api/subscription/checkout', {
    method: 'POST',
  });
}

export async function createPortalSession(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/api/subscription/portal', {
    method: 'POST',
  });
}

// ─── Public API ────────────────────────────────────────────
export async function subscribeNewsletter(email: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/public/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function submitContactForm(data: { name: string; email: string; message: string }): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/public/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Advanced Analytics API ────────────────────────────────
export async function getAnalyticsTrend(): Promise<unknown> {
  return apiFetch<unknown>('/api/analytics/trend');
}

export async function getAnalyticsWeaknesses(): Promise<unknown> {
  return apiFetch<unknown>('/api/analytics/weaknesses');
}

export async function getAnalyticsImprovement(): Promise<unknown> {
  return apiFetch<unknown>('/api/analytics/improvement');
}

// ─── Auth Refresh API ──────────────────────────────────────
export async function refreshSession(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/refresh', {
    method: 'POST',
  });
}

