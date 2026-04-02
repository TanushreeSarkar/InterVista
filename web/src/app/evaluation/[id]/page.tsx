"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Share2, TrendingUp, TrendingDown, Star, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { getEvaluation, type EvaluationResult } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

function getRecommendationColor(rec: string) {
  switch (rec) {
    case "Strong Hire": return "bg-green-500 text-white";
    case "Hire": return "bg-emerald-500 text-white";
    case "Consider": return "bg-yellow-500 text-white";
    case "No Hire": return "bg-red-500 text-white";
    default: return "bg-gray-500 text-white";
  }
}

function getRecommendationIcon(rec: string) {
  switch (rec) {
    case "Strong Hire": return <Star className="w-5 h-5" />;
    case "Hire": return <CheckCircle className="w-5 h-5" />;
    case "Consider": return <AlertTriangle className="w-5 h-5" />;
    case "No Hire": return <XCircle className="w-5 h-5" />;
    default: return null;
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getEvaluation(id as string);
      setEvaluation(data);
    } catch (err) {
      setError("Failed to load evaluation. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated && id) {
      loadEvaluation();
    }
  }, [authLoading, isAuthenticated, id, loadEvaluation, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">AI is evaluating your answers...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  if (!evaluation) return null;

  const skills = evaluation.skillsAssessment;
  const skillEntries = [
    { name: "Communication", value: skills.communication, icon: "💬" },
    { name: "Technical Knowledge", value: skills.technicalKnowledge, icon: "🧠" },
    { name: "Problem Solving", value: skills.problemSolving, icon: "🔧" },
    { name: "Confidence", value: skills.confidence, icon: "💪" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
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
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => router.push("/dashboard")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          {/* Top Row: Score + Recommendation + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Overall Score */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="text-center h-full">
                <CardContent className="pt-8 pb-8">
                  <div className="relative inline-flex items-center justify-center mb-4">
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60" cy="60" r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="60" cy="60" r="50"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(evaluation.overallScore / 100) * 314} 314`}
                        strokeLinecap="round"
                        className={getScoreColor(evaluation.overallScore)}
                      />
                    </svg>
                    <span className={`absolute text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                      {evaluation.overallScore}
                    </span>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getRecommendationColor(evaluation.recommendation)}`}>
                    {getRecommendationIcon(evaluation.recommendation)}
                    {evaluation.recommendation}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills Assessment */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Skills Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {skillEntries.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <span>{skill.icon}</span>
                          {skill.name}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(skill.value)}`}>
                          {skill.value}/100
                        </span>
                      </div>
                      <Progress value={skill.value} className="h-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{evaluation.summary}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Per-question Feedback */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Question-by-Question Feedback</h2>
            {evaluation.feedback.map((fb, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Badge variant="outline" className="shrink-0 mt-1">
                          Q{fb.questionIndex + 1}
                        </Badge>
                        <div className="space-y-1">
                          <CardTitle className="text-base leading-relaxed">{fb.question}</CardTitle>
                          <p className="text-sm text-muted-foreground italic">
                            &quot;{fb.answer}&quot;
                          </p>
                        </div>
                      </div>
                      <Badge className={`shrink-0 ml-4 ${fb.score >= 7 ? 'bg-green-500' : fb.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                        {fb.score}/10
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{fb.detailedFeedback}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Strengths
                        </div>
                        <ul className="space-y-1">
                          {fb.strengths.map((s, si) => (
                            <li key={si} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <TrendingDown className="w-4 h-4 text-yellow-500" />
                          Areas for Improvement
                        </div>
                        <ul className="space-y-1">
                          {fb.improvements.map((imp, ii) => (
                            <li key={ii} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">→</span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center gap-4 mt-12 mb-8"
          >
            <Button variant="outline" size="lg" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
            <Button size="lg" onClick={() => router.push("/dashboard")}>
              Start New Interview
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
