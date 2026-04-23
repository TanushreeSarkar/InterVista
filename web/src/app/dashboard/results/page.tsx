"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { getSessions, getAnalyticsOverview, type InterviewSession, type AnalyticsOverview } from "@/lib/api";
import { getPersistedInterviewData } from "@/contexts/InterviewContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, BarChart2, Target, Activity, Clock } from "lucide-react";

export default function ResultsPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const interviewData = getPersistedInterviewData();

  useEffect(() => {
    async function load() {
      try {
        const [sessionsData, analyticsData] = await Promise.all([
          getSessions(),
          getAnalyticsOverview().catch(() => null),
        ]);
        setSessions(sessionsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedSessions = sessions.filter(s => s.status === "completed");
  const totalFillers = interviewData?.perQuestionData?.reduce((sum, q) => sum + q.fillerCount, 0) || 0;
  const avgResponseTime = interviewData?.perQuestionData?.length
    ? Math.round(interviewData.perQuestionData.reduce((sum, q) => sum + q.responseTimeMs, 0) / interviewData.perQuestionData.length / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] text-gray-900 dark:text-[#F4F4F5] font-['Inter',sans-serif]">
      <Sidebar mobileOpen={showSidebarMobile} setMobileOpen={setShowSidebarMobile} />

      <div className="md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="font-['DM_Sans',sans-serif] text-3xl font-bold tracking-tight">Progress & Results</h1>
            <p className="text-gray-500 dark:text-[#71717A] mt-1">Track your improvement over time</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: "Completed", value: completedSessions.length.toString(), icon: <Target className="w-5 h-5" />, color: "text-green-500" },
                  { label: "Avg. Score", value: analytics && analytics.averageScore > 0 ? `${analytics.averageScore}%` : "N/A", icon: <BarChart2 className="w-5 h-5" />, color: "text-cyan-500" },
                  { label: "Filler Words (Last Session)", value: totalFillers.toString(), icon: <Activity className="w-5 h-5" />, color: totalFillers > 10 ? "text-red-400" : "text-green-400" },
                  { label: "Avg Response Time", value: avgResponseTime > 0 ? `${avgResponseTime}s` : "N/A", icon: <Clock className="w-5 h-5" />, color: "text-indigo-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={stat.color}>{stat.icon}</div>
                      <span className="text-sm text-gray-500 dark:text-[#71717A]">{stat.label}</span>
                    </div>
                    <div className={`text-3xl font-bold font-['DM_Sans',sans-serif] ${stat.color}`}>{stat.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Score Trend (simple bar chart) */}
              {analytics && analytics.scoreHistory && analytics.scoreHistory.length > 0 && (
                <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-2xl p-6 mb-10">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" /> Score Trend
                  </h2>
                  <div className="flex items-end gap-2 h-40">
                    {analytics.scoreHistory.slice(-12).map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${entry.score}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 relative group cursor-pointer min-w-[20px]"
                        title={`${entry.role}: ${entry.score}%`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {entry.score}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {analytics.scoreHistory.slice(-12).map((entry, i) => (
                      <div key={i} className="flex-1 text-[10px] text-center text-zinc-500 truncate min-w-[20px]">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-question filler breakdown from last session */}
              {interviewData && interviewData.perQuestionData.length > 0 && (
                <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-2xl p-6 mb-10">
                  <h2 className="text-lg font-bold mb-4">Last Session Breakdown</h2>
                  <div className="space-y-3">
                    {interviewData.perQuestionData.map((q, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0D0D14] rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{q.questionText}</p>
                        </div>
                        <div className="flex gap-4 text-sm shrink-0">
                          <span className={`font-mono ${q.fillerCount > 3 ? "text-red-400" : "text-green-400"}`}>
                            {q.fillerCount} fillers
                          </span>
                          <span className="text-zinc-400">
                            {Math.round(q.responseTimeMs / 1000)}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session History */}
              <div>
                <h2 className="text-lg font-bold mb-4">Completed Sessions</h2>
                {completedSessions.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-[#71717A] bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl">
                    No completed sessions yet. Start practicing!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={`/evaluation/${session.id}`}>
                          <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5 hover:border-indigo-500/50 transition-all flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold mb-1">{session.role} at {session.company}</h3>
                              <p className="text-sm text-gray-500 dark:text-[#71717A]">
                                {session.difficulty} • {new Date(session.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              Completed
                            </Badge>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
