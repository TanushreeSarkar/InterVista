"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AudioRecorder } from "@/components/interview/audio-recorder";
import { QuestionCard } from "@/components/interview/question-card";
import { getSession, getQuestions, type Question } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Blob>>({});

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
      // Use mock questions for demo
      setQuestions([
        {
          id: "q1",
          sessionId,
          text: "Tell me about yourself and your background in software development.",
          order: 1,
        },
        {
          id: "q2",
          sessionId,
          text: "Describe a challenging project you worked on and how you overcame the obstacles.",
          order: 2,
        },
        {
          id: "q3",
          sessionId,
          text: "How do you stay updated with the latest technologies and industry trends?",
          order: 3,
        },
        {
          id: "q4",
          sessionId,
          text: "Describe your experience with team collaboration and conflict resolution.",
          order: 4,
        },
        {
          id: "q5",
          sessionId,
          text: "Where do you see yourself in the next 3-5 years in your career?",
          order: 5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  function handleAnswerRecorded(questionId: string, audioBlob: Blob) {
    setAnswers((prev) => ({ ...prev, [questionId]: audioBlob }));
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // All questions answered, go to evaluation
      router.push(`/evaluation/${sessionId}`);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 bg-background">
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-8 w-64 mb-8" />
            <Skeleton className="h-2 w-full mb-12" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h1>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Interview
                </Button>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {currentQuestion && (
                  <>
                    <QuestionCard question={currentQuestion} />

                    <div className="mt-8">
                      <AudioRecorder
                        questionId={currentQuestion.id}
                        sessionId={sessionId}
                        onRecordingComplete={handleAnswerRecorded}
                        hasRecording={!!answers[currentQuestion.id]}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>

                      <Button
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id]}
                      >
                        {currentQuestionIndex === questions.length - 1
                          ? "Complete Interview"
                          : "Next Question"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
}