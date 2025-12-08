// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Helper to get auth token
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Types
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

// API Functions
export async function createSession(data: {
  role: string;
  level: string;
}): Promise<InterviewSession> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create session");
  }

  return response.json();
}

export async function getSession(sessionId: string): Promise<InterviewSession> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch session");
  }

  return response.json();
}

export async function getSessions(): Promise<InterviewSession[]> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }

  return response.json();
}

export async function getQuestions(sessionId: string): Promise<Question[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sessions/${sessionId}/questions`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  return response.json();
}

export async function submitAnswer(data: {
  sessionId: string;
  questionId: string;
  audioBlob: Blob;
}): Promise<void> {
  const formData = new FormData();
  formData.append("audio", data.audioBlob, "answer.webm");
  formData.append("sessionId", data.sessionId);
  formData.append("questionId", data.questionId);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/answers`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to submit answer");
  }
}

export async function getEvaluation(
  sessionId: string
): Promise<Evaluation[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/answers/evaluation/${sessionId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch evaluation");
  }

  return response.json();
}

// WebSocket for real-time evaluation
export function connectEvaluationStream(
  sessionId: string,
  onMessage: (data: Partial<Evaluation>) => void,
  onError?: (error: Error) => void
): WebSocket {
  const ws = new WebSocket(
    `${API_BASE_URL.replace("http", "ws")}/api/sessions/${sessionId}/stream`
  );

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  ws.onerror = (event) => {
    const error = new Error("WebSocket error");
    console.error("WebSocket error:", event);
    onError?.(error);
  };

  return ws;
}