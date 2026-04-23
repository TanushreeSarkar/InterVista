"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessions, deleteSession, type InterviewSession } from "@/lib/api";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, Trash2, Video, Calendar, BarChart2, ArrowRight } from "lucide-react";

export default function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this interview session?")) return;
    try {
      setDeletingId(sessionId);
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const completed = sessions.filter(s => s.status === "completed");
  const inProgress = sessions.filter(s => s.status !== "completed");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] text-gray-900 dark:text-[#F4F4F5] font-['Inter',sans-serif]">
      <Sidebar
        mobileOpen={showSidebarMobile}
        setMobileOpen={setShowSidebarMobile}
      />

      <div className="md:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="font-['DM_Sans',sans-serif] text-3xl font-bold tracking-tight">My Interviews</h1>
            <p className="text-gray-500 dark:text-[#71717A] mt-1">View and manage all your practice sessions</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5">
              <div className="text-sm text-gray-500 dark:text-[#71717A] mb-1">Total Sessions</div>
              <div className="text-2xl font-bold font-['DM_Sans',sans-serif]">{sessions.length}</div>
            </div>
            <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5">
              <div className="text-sm text-gray-500 dark:text-[#71717A] mb-1">Completed</div>
              <div className="text-2xl font-bold font-['DM_Sans',sans-serif] text-green-500">{completed.length}</div>
            </div>
            <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5">
              <div className="text-sm text-gray-500 dark:text-[#71717A] mb-1">In Progress</div>
              <div className="text-2xl font-bold font-['DM_Sans',sans-serif] text-yellow-500">{inProgress.length}</div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-2xl">
              <Video className="w-12 h-12 mx-auto text-gray-400 dark:text-[#3F3F46] mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
              <p className="text-gray-500 dark:text-[#71717A] mb-6">Start a practice session from the dashboard!</p>
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-5 flex items-center gap-4 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{session.role} at {session.company}</h3>
                      <Badge
                        variant={session.status === "completed" ? "default" : "secondary"}
                        className={session.status === "completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                      >
                        {session.status === "completed" ? "Completed" : session.status === "in_progress" ? "In Progress" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-[#71717A]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5" />
                        {session.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(session.id); }}
                      disabled={deletingId === session.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      {deletingId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    <Link
                      href={session.status === "completed" ? `/evaluation/${session.id}` : `/interview/${session.id}`}
                      className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {session.status === "completed" ? "View Results" : "Continue"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
