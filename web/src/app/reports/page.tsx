"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target, Award } from "lucide-react";
import Link from "next/link";
import { getSessions, type InterviewSession } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { PerformanceChart } from "@/components/reports/performance-chart";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await getSessions("user-123");
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      // Mock data for demo
      setSessions([
        {
          id: "1",
          userId: "user-123",
          role: "Software Engineer",
          level: "Senior",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 7 + 3600000).toISOString(),
          score: 75,
        },
        {
          id: "2",
          userId: "user-123",
          role: "Software Engineer",
          level: "Senior",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(),
          score: 82,
        },
        {
          id: "3",
          userId: "user-123",
          role: "Product Manager",
          level: "Mid-Level",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 3 + 3600000).toISOString(),
          score: 78,
        },
        {
          id: "4",
          userId: "user-123",
          role: "Software Engineer",
          level: "Senior",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
          score: 88,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const averageScore = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) /
          completedSessions.length
      )
    : 0;
  
  const improvement = completedSessions.length >= 2
    ? (completedSessions[completedSessions.length - 1].score || 0) -
      (completedSessions[0].score || 0)
    : 0;

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
              <h1 className="text-4xl font-bold mb-2">Performance Reports</h1>
              <p className="text-muted-foreground">
                Track your progress and identify areas for improvement
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Interviews</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {completedSessions.length}
                      <Calendar className="w-5 h-5 ml-2 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Average Score</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {averageScore}
                      <Target className="w-5 h-5 ml-2 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Improvement</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {improvement > 0 ? "+" : ""}
                      {improvement}
                      <TrendingUp
                        className={`w-5 h-5 ml-2 ${
                          improvement > 0 ? "text-green-500" : "text-muted-foreground"
                        }`}
                      />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Best Score</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {Math.max(...completedSessions.map((s) => s.score || 0))}
                      <Award className="w-5 h-5 ml-2 text-yellow-500" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-12"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                  <CardDescription>
                    Your interview scores across different sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : (
                    <PerformanceChart sessions={completedSessions} />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Session History */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Session History</h2>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {completedSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link href={`/evaluation/${session.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-xl mb-2">
                                  {session.role} - {session.level}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(session.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="text-4xl font-bold text-primary mb-1">
                                  {session.score}
                                </div>
                                <Badge
                                  variant={
                                    (session.score || 0) >= 80 ? "default" : "secondary"
                                  }
                                >
                                  {(session.score || 0) >= 90
                                    ? "Excellent"
                                    : (session.score || 0) >= 80
                                    ? "Very Good"
                                    : (session.score || 0) >= 70
                                    ? "Good"
                                    : "Fair"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}