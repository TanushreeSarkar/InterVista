"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowRight, CheckCircle, MessageSquare } from "lucide-react";
import { getSessionQuestions, submitAnswer, type Question } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSessionQuestions(sessionId);
      setQuestions(data);
    } catch (err: unknown) {
      console.error("Failed to load questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated && sessionId) {
      loadQuestions();
    }
  }, [authLoading, isAuthenticated, sessionId, loadQuestions, router]);

  async function handleSubmitAnswer() {
    if (!currentAnswer.trim()) return;

    const question = questions[currentQuestionIndex];

    try {
      setSubmitting(true);
      setError("");

      await submitAnswer({
        sessionId,
        questionId: question.id,
        questionIndex: currentQuestionIndex,
        text: currentAnswer.trim(),
      });

      // Move to next question or evaluation
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentAnswer("");
      } else {
        // All questions answered — go to evaluation
        router.push(`/evaluation/${sessionId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No questions found for this session</p>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Interview Session</h1>
            </div>
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary shrink-0">
                  <span className="text-lg font-bold">{currentQuestionIndex + 1}</span>
                </div>
                <CardTitle className="text-xl leading-relaxed pt-1">
                  {currentQuestion.text}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="answer" className="text-sm font-medium text-muted-foreground">
                    Your Answer
                  </label>
                  <textarea
                    id="answer"
                    className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    placeholder="Type your answer here... Be as detailed as you can."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {currentAnswer.length > 0
                      ? `${currentAnswer.split(/\s+/).filter(Boolean).length} words`
                      : "Start typing your answer"}
                  </p>
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || submitting}
                    size="lg"
                    className="min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : isLastQuestion ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finish Interview
                      </>
                    ) : (
                      <>
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Navigator Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentQuestionIndex
                  ? "bg-green-500"
                  : i === currentQuestionIndex
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
