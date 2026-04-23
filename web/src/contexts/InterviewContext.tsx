"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────
export interface PerQuestionData {
  questionIndex: number;
  questionText: string;
  answerText: string;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  responseTimeMs: number;
  submittedAt: string;
}

export interface InterviewSessionData {
  sessionId: string;
  role: string;
  company: string;
  difficulty: string;
  personaId?: string;
  phase: "lobby" | "interview" | "ending";
  currentQuestionIndex: number;
  totalQuestions: number;
  sessionFillerTotal: number;
  perQuestionData: PerQuestionData[];
  startedAt: string | null;
}

interface InterviewContextType {
  sessionData: InterviewSessionData | null;
  setSessionData: (data: InterviewSessionData | null) => void;
  updateSessionData: (partial: Partial<InterviewSessionData>) => void;
  addQuestionResult: (result: PerQuestionData) => void;
  resetSession: () => void;
}

const STORAGE_KEY = "intervista_interview_session";

const defaultSessionData: InterviewSessionData = {
  sessionId: "",
  role: "",
  company: "",
  difficulty: "Medium",
  phase: "lobby",
  currentQuestionIndex: 0,
  totalQuestions: 0,
  sessionFillerTotal: 0,
  perQuestionData: [],
  startedAt: null,
};

// ─── Context ────────────────────────────────────────────────
const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

function loadFromStorage(): InterviewSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted data — ignore
  }
  return null;
}

function saveToStorage(data: InterviewSessionData | null) {
  if (typeof window === "undefined") return;
  try {
    if (data) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [sessionData, setSessionDataRaw] = useState<InterviewSessionData | null>(
    () => loadFromStorage()
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Persist to sessionStorage whenever data changes
  useEffect(() => {
    saveToStorage(sessionData);
  }, [sessionData]);

  const setSessionData = useCallback((data: InterviewSessionData | null) => {
    if (!mountedRef.current) return;
    setSessionDataRaw(data);
  }, []);

  const updateSessionData = useCallback((partial: Partial<InterviewSessionData>) => {
    if (!mountedRef.current) return;
    setSessionDataRaw(prev => {
      if (!prev) return { ...defaultSessionData, ...partial };
      return { ...prev, ...partial };
    });
  }, []);

  const addQuestionResult = useCallback((result: PerQuestionData) => {
    if (!mountedRef.current) return;
    setSessionDataRaw(prev => {
      if (!prev) return prev;
      const existing = prev.perQuestionData.filter(
        q => q.questionIndex !== result.questionIndex
      );
      return {
        ...prev,
        perQuestionData: [...existing, result],
        sessionFillerTotal: prev.sessionFillerTotal + result.fillerCount,
      };
    });
  }, []);

  const resetSession = useCallback(() => {
    if (!mountedRef.current) return;
    setSessionDataRaw(null);
    saveToStorage(null);
  }, []);

  return (
    <InterviewContext.Provider
      value={{ sessionData, setSessionData, updateSessionData, addQuestionResult, resetSession }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}

/**
 * Helper to read persisted interview data (e.g. from evaluation page)
 * without needing the provider — reads directly from sessionStorage.
 */
export function getPersistedInterviewData(): InterviewSessionData | null {
  return loadFromStorage();
}
