"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { Loader2, TrendingUp, Calendar, Target, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getSessions, getAnalyticsOverview, type InterviewSession, type AnalyticsOverview } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [sessionsData, analyticsData] = await Promise.all([
        getSessions(),
        getAnalyticsOverview().catch(() => null),
      ]);
      setSessions(sessionsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load reports data:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0F]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const inProgressSessions = sessions.filter(s => s.status === "in_progress");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] text-gray-900 dark:text-[#F4F4F5] font-['Inter',sans-serif]">
      <Sidebar mobileOpen={showSidebarMobile} setMobileOpen={setShowSidebarMobile} />

      <div className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="font-['DM_Sans',sans-serif] text-3xl font-bold tracking-tight flex items-center gap-3">
                <FileText className="w-8 h-8 text-indigo-500" /> Performance Reports
              </h1>
              <p className="text-gray-500 dark:text-[#71717A] mt-1">
                Track your progress and identify areas for improvement
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-[#71717A]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Total Interviews</span>
                </div>
                <div className="text-3xl font-bold font-['DM_Sans',sans-serif]">{sessions.length}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-[#71717A]">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Completed</span>
                </div>
                <div className="text-3xl font-bold font-['DM_Sans',sans-serif] text-green-500">
                  {completedSessions.length}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-[#71717A]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Avg. Score</span>
                </div>
                <div className="text-3xl font-bold font-['DM_Sans',sans-serif] text-indigo-500">
                  {analytics && analytics.averageScore > 0 ? `${analytics.averageScore}%` : "N/A"}
                </div>
              </motion.div>
            </div>

            {/* Session History */}
            <div>
              <h2 className="text-xl font-bold font-['DM_Sans',sans-serif] mb-4">Session History</h2>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-10 text-center text-gray-500 dark:text-[#71717A]">
                  No interviews yet. Start a practice session from the dashboard!
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={session.status === "completed" ? `/evaluation/${session.id}` : `/interview/${session.id}`}>
                        <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-md transition-all flex items-center justify-between group">
                          <div>
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-500 transition-colors">
                              {session.role} at {session.company}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-[#71717A]">
                              {session.difficulty} • {new Date(session.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={session.status === "completed" ? "default" : "secondary"}
                              className={session.status === "completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                            >
                              {session.status === "completed" ? "Completed" : session.status === "in_progress" ? "In Progress" : "Pending"}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}