"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";
import { getSessions, type InterviewSession } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      // Use mock data for demo
      setSessions([
        {
          id: "1",
          userId: "user-123",
          role: "Software Engineer",
          level: "Senior",
          status: "completed",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 82800000).toISOString(),
          score: 85,
        },
        {
          id: "2",
          userId: "user-123",
          role: "Product Manager",
          level: "Mid-Level",
          status: "completed",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          completedAt: new Date(Date.now() - 169200000).toISOString(),
          score: 78,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: InterviewSession["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: InterviewSession["status"]) => {
    const variants: Record<InterviewSession["status"], "default" | "secondary" | "destructive"> = {
      completed: "default",
      in_progress: "secondary",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status]}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

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
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your interview sessions and track your progress
                </p>
              </div>
              <Button size="lg" onClick={() => setShowNewSession(true)}>
                <Plus className="w-5 h-5 mr-2" />
                New Interview
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {sessions.filter((s) => s.status === "completed").length}
                    </CardTitle>
                    <CardDescription>Completed Interviews</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                      {sessions.length > 0
                        ? Math.round(
                            sessions
                              .filter((s) => s.score)
                              .reduce((acc, s) => acc + (s.score || 0), 0) /
                              sessions.filter((s) => s.score).length
                          )
                        : 0}
                      <TrendingUp className="w-5 h-5 ml-2 text-green-500" />
                    </CardTitle>
                    <CardDescription>Average Score</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {sessions.filter((s) => s.status === "in_progress").length}
                    </CardTitle>
                    <CardDescription>In Progress</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Recent Sessions</h2>

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
              ) : sessions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No interview sessions yet. Start your first practice!
                    </p>
                    <Button onClick={() => setShowNewSession(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Interview
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={`/interview/${session.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {getStatusIcon(session.status)}
                                  <CardTitle className="text-xl">
                                    {session.role} - {session.level}
                                  </CardTitle>
                                </div>
                                <CardDescription>
                                  Started{" "}
                                  {new Date(session.createdAt).toLocaleDateString()}
                                  {session.completedAt &&
                                    ` • Completed ${new Date(
                                      session.completedAt
                                    ).toLocaleDateString()}`}
                                </CardDescription>
                              </div>
                              <div className="flex items-center space-x-4">
                                {session.score !== undefined && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                      {session.score}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Score
                                    </div>
                                  </div>
                                )}
                                {getStatusBadge(session.status)}
                              </div>
                            </div>
                          </CardHeader>
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <NewSessionDialog
          open={showNewSession}
          onOpenChange={setShowNewSession}
          onSessionCreated={loadSessions}
        />
      </div>
    </>
  );
}