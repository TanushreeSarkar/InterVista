// web/src/lib/api.ts

// API base (use NEXT_PUBLIC_API_URL in Vercel / env)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Helpers
 */

// Get auth token from localStorage (only available in client runtime)
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

// Build headers for fetch (JSON requests)
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Types
 */
export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  level: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  score?: number;
}

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  order: number;
  answer?: string;
  audioUrl?: string;
  score?: number;
  feedback?: string;
}

export interface Evaluation {
  sessionId: string;
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  overallScore?: number;
}

/**
 * API functions
 */

export async function createSession(data: {
  role: string;
  level: string;
}): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`createSession failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getSession(sessionId: string): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}`, {
    headers: getAuthHeaders(),
    // no-store prevents caching during dev/SSR; adjust if needed
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`getSession failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch sessions.
 * If userId is provided, it is sent as ?userId=...
 */
export async function getSessions(userId?: string): Promise<InterviewSession[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/sessions${query}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`getSessions failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getQuestions(sessionId: string): Promise<Question[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/questions`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`getQuestions failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Submit audio answer as multipart/form-data
 */
export async function submitAnswer(data: {
  sessionId: string;
  questionId: string;
  audioBlob: Blob;
  transcript?: string;
}): Promise<void> {
  const formData = new FormData();
  formData.append("audio", data.audioBlob, "answer.webm");
  formData.append("sessionId", data.sessionId);
  formData.append("questionId", data.questionId);
  if (data.transcript) {
    formData.append("transcript", data.transcript);
  }

  const token = getAuthToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}/api/answers`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`submitAnswer failed: ${res.status} ${res.statusText}`);
  }
}

export async function getEvaluation(sessionId: string): Promise<Evaluation[]> {
  const res = await fetch(`${API_BASE_URL}/api/answers/evaluation/${encodeURIComponent(sessionId)}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`getEvaluation failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Real-time evaluation stream (WebSocket)
 * Note: API_BASE_URL must be http(s) — we replace protocol for ws.
 */
export function connectEvaluationStream(
  sessionId: string,
  onMessage: (data: Partial<Evaluation>) => void,
  onError?: (error: Error) => void
): WebSocket {
  // Convert http(s) to ws(s)
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/api/sessions/${encodeURIComponent(sessionId)}/stream`);

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (err) {
      console.error("Failed to parse WS message", err);
    }
  };

  ws.onerror = (ev) => {
    const error = new Error("WebSocket error");
    console.error("WebSocket error", ev);
    onError?.(error);
  };

  return ws;
}
