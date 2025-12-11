"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { VideoCallInterface } from "@/components/interview/video-call-interface";
import { getQuestions, type Question } from "@/lib/api";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [sessionId]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const data = await getQuestions(sessionId);
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleEndInterview();
    }
  }

  function handleEndInterview() {
    router.push(`/evaluation/${sessionId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No questions found</p>
          <button onClick={() => router.push("/dashboard")} className="text-primary hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <VideoCallInterface
      sessionId={sessionId}
      question={currentQuestion.text}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      onNextQuestion={handleNextQuestion}
      onEndInterview={handleEndInterview}
    />
  );
}