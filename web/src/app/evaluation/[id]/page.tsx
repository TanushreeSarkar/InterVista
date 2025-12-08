"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Share2, TrendingUp, TrendingDown } from "lucide-react";
import { ScoreRing } from "@/components/evaluation/score-ring";
import { FeedbackCard } from "@/components/evaluation/feedback-card";
import { getEvaluation, connectEvaluationStream, type Evaluation } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [streamingEval, setStreamingEval] = useState<Partial<Evaluation> | null>(null);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    loadEvaluation();
  }, [sessionId]);

  async function loadEvaluation() {
    try {
      setLoading(true);

      // Try to connect to WebSocket for real-time evaluation
      const ws = connectEvaluationStream(
        sessionId,
        (data) => {
          setStreamingEval(data);
          if (data.overallScore !== undefined) {
            setOverallScore(data.overallScore);
          }
        },
        (error) => {
          console.error("WebSocket error:", error);
        }
      );

      // Also fetch existing evaluation
      try {
        const data = await getEvaluation(sessionId);
        setEvaluations(data);
        if (data.length > 0 && data[0].overallScore) {
          setOverallScore(data[0].overallScore);
        }
      } catch (error) {
        console.error("Failed to fetch evaluation:", error);
        // Use mock data for demo
        setTimeout(() => {
          const mockEvals: Evaluation[] = [
            {
              sessionId,
              questionId: "q1",
              score: 85,
              feedback: "Great introduction! You provided a clear overview of your background and highlighted relevant experience.",
              strengths: [
                "Clear communication",
                "Relevant examples",
                "Confident delivery",
              ],
              improvements: [
                "Could add more specific metrics",
                "Consider mentioning recent projects",
              ],
            },
            {
              sessionId,
              questionId: "q2",
              score: 78,
              feedback: "Good description of the challenge, but could benefit from more details about the specific technical solutions you implemented.",
              strengths: [
                "Problem-solving approach",
                "Team collaboration mentioned",
              ],
              improvements: [
                "More technical depth needed",
                "Quantify the impact",
                "Discuss lessons learned",
              ],
            },
            {
              sessionId,
              questionId: "q3",
              score: 92,
              feedback: "Excellent answer! You demonstrated a strong commitment to continuous learning and provided specific examples of how you stay current.",
              strengths: [
                "Specific learning resources mentioned",
                "Active community involvement",
                "Practical application of knowledge",
              ],
              improvements: [
                "Could mention mentoring others",
              ],
            },
          ];
          setEvaluations(mockEvals);
          setOverallScore(85);
          setLoading(false);
        }, 2000);
        return;
      }

      setLoading(false);

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error("Failed to load evaluation:", error);
      setLoading(false);
    }
  }

  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((acc, e) => acc + e.score, 0) / evaluations.length)
    : overallScore;

  const allStrengths = evaluations.flatMap((e) => e.strengths);
  const allImprovements = evaluations.flatMap((e) => e.improvements);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 bg-background">
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-96 lg:col-span-2" />
            </div>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Interview Evaluation</h1>
                <p className="text-muted-foreground">
                  Detailed analysis of your performance
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Overall Score */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScoreRing score={averageScore} size={200} />
                    <div className="mt-6">
                      <Badge
                        variant={averageScore >= 80 ? "default" : "secondary"}
                        className="text-lg px-4 py-1"
                      >
                        {averageScore >= 90
                          ? "Excellent"
                          : averageScore >= 80
                          ? "Very Good"
                          : averageScore >= 70
                          ? "Good"
                          : "Needs Improvement"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Key Insights */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                          Top Strengths
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {allStrengths.length} identified
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allStrengths.slice(0, 5).map((strength, index) => (
                          <Badge key={index} variant="secondary">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center">
                          <TrendingDown className="w-4 h-4 mr-2 text-yellow-500" />
                          Areas for Improvement
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {allImprovements.length} identified
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allImprovements.slice(0, 5).map((improvement, index) => (
                          <Badge key={index} variant="outline">
                            {improvement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Question-by-Question Feedback */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Question Feedback</h2>
              {evaluations.map((evaluation, index) => (
                <motion.div
                  key={evaluation.questionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <FeedbackCard
                    evaluation={evaluation}
                    questionNumber={index + 1}
                  />
                </motion.div>
              ))}
            </div>

            {/* Streaming Evaluation Indicator */}
            {streamingEval && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 right-8"
              >
                <Card className="p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      Receiving real-time evaluation...
                    </span>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}