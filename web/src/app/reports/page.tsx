"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target } from "lucide-react";
import Link from "next/link";
import { getSessions, type InterviewSession } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";

export default function ReportsPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

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
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Interviews</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {sessions.length}
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
                    <CardDescription>Completed</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {completedSessions.length}
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
                    <CardDescription>In Progress</CardDescription>
                    <CardTitle className="text-3xl flex items-center">
                      {sessions.filter(s => s.status === 'in_progress').length}
                      <TrendingUp className="w-5 h-5 ml-2 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>

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
              ) : sessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No interviews yet. Start a practice session from the dashboard!
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
                      <Link href={session.status === 'completed' ? `/evaluation/${session.id}` : `/interview/${session.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-xl mb-2">
                                  {session.role} at {session.company}
                                </CardTitle>
                                <CardDescription>
                                  {session.difficulty} • {new Date(session.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </CardDescription>
                              </div>
                              <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                                {session.status}
                              </Badge>
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