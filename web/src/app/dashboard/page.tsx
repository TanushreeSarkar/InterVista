"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Bell, Chrome, Zap, Terminal, Briefcase, BellOff, ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";
import { getSessions, getAnalyticsOverview, type InterviewSession, type AnalyticsOverview } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [activeTab, setActiveTab] = useState("Software Engineering");
  const [sessionDefaults, setSessionDefaults] = useState<{ role?: string, difficulty?: string, personaId?: string }>({});

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Close dropdowns on outside click (simplified)
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        getAnalyticsOverview()
      ]);
      setSessions(sessionsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleNewSessionCreated(sessionId: string) {
    router.push(`/interview/${sessionId}`);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0F]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0A0A0F] dark:text-[#F4F4F5] font-['Inter',sans-serif] transition-colors duration-200">

      {/* Sidebar for Desktop, and Mobile Overlay */}
      <Sidebar
        mobileOpen={showSidebarMobile}
        setMobileOpen={setShowSidebarMobile}
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      <div className="md:pl-64 min-h-screen flex flex-col">
        {/* TOP HEADER BAR */}
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30 bg-white border-b border-gray-200 dark:bg-[#0A0A0F] dark:border-[#1E1E2E] transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setShowSidebarMobile(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              {/* Fake back button for demo per requirements */}
              {false && (
                <button className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <span className="font-['DM_Sans',sans-serif] text-xl font-bold text-gray-900 dark:text-[#F4F4F5]">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative" ref={menuRef}>
            {/* Search Bar */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                className="w-64 rounded-full border border-gray-200 bg-gray-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder-gray-500 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:border-[#1E1E2E] dark:bg-[#111118] dark:text-[#F4F4F5] dark:placeholder-[#71717A] dark:focus:border-[#6366F1] dark:focus:shadow-[0_0_0_1px_#6366F1]"
                placeholder="Search interviews..."
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowAvatarMenu(false); }}
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] dark:hover:bg-[#1E1E2E] rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0A0A0F]" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] shadow-lg rounded-xl overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 dark:bg-[#1A1A24] dark:border-[#1E1E2E] text-sm font-semibold">
                    Notifications
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center text-center text-gray-500 dark:text-[#71717A]">
                    <BellOff className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade Button */}
            <Link href="/pricing" className="hidden sm:inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
              Upgrade to Pro
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowAvatarMenu(!showAvatarMenu); setShowNotifications(false); }}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-gray-100 dark:border-[#1E1E2E] dark:bg-[#1E1E2E] text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:ring-2 hover:ring-indigo-500 transition-all"
              >
                {user?.name?.charAt(0) || "T"}
              </button>
              {showAvatarMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] shadow-xl rounded-xl py-1 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-150">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-[#F4F4F5] dark:hover:bg-[#1E1E2E] transition-colors">👤 Profile</Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-[#F4F4F5] dark:hover:bg-[#1E1E2E] transition-colors">⚙️ Settings</Link>
                  <div className="h-px bg-gray-200 dark:bg-[#1E1E2E] my-1" />
                  <button
                    onClick={() => { setShowAvatarMenu(false); setIsSignOutModalOpen(true); }}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-8 space-y-10 max-w-7xl mx-auto w-full">

          {/* Section 1: Welcome + Stats Row */}
          <section className="space-y-6">
            <div>
              <h1 className="font-['DM_Sans',sans-serif] text-3xl font-bold text-gray-900 dark:text-[#F4F4F5] tracking-tight">
                Welcome back, {user?.name || "Tanu"} 👋
              </h1>
              <p className="text-gray-500 dark:text-[#71717A] mt-1">Ready to ace your next interview?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Interviews Completed", value: analytics ? analytics.totalSessions.toString() : "0", icon: "✓", color: "10B981", bgHover: "hover:-translate-y-0.5 hover:border-[#10B981]/50" },
                { label: "Avg. Score", value: analytics && analytics.averageScore > 0 ? `${analytics.averageScore}%` : "N/A", icon: "📊", color: "22D3EE", bgHover: "hover:-translate-y-0.5 hover:border-[#22D3EE]/50" },
                { label: "Streak", value: analytics ? `${analytics.streak} days 🔥` : "0 days 🔥", icon: "🔥", color: "F59E0B", bgHover: "hover:-translate-y-0.5 hover:border-[#F59E0B]/50" },
                { label: "Questions Practiced", value: analytics ? (analytics.totalSessions * 5).toString() : "0", icon: "⚡", color: "6366F1", bgHover: "hover:-translate-y-0.5 hover:border-[#6366F1]/50" }
              ].map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  key={i}
                  className={`bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] rounded-xl p-5 shadow-sm transition-all duration-200 ${stat.bgHover}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] font-medium text-gray-500 dark:text-[#3F3F46]">{stat.label}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center dark:bg-opacity-10 dark:bg-[currentColor]" style={{ color: `#${stat.color}` }}>
                      {stat.icon === "✓" ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : stat.icon === "📊" ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                      ) : stat.icon === "🔥" ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></svg>
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="font-['DM_Sans',sans-serif] text-3xl font-bold text-gray-900 dark:text-[#F4F4F5] tracking-tight">{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Section 2: Hero CTA Banner */}
          <section>
            <div className="rounded-2xl p-8 min-h-[160px] relative overflow-hidden flex items-center shadow-lg transition-transform hover:-translate-y-1 duration-300"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5, #0EA5E9)' }}>
              <div className="relative z-10 max-w-xl text-white">
                <h2 className="font-['DM_Sans',sans-serif] text-2xl md:text-3xl font-bold mb-2">Create Custom Interviews</h2>
                <p className="text-white/80 mb-6 text-sm md:text-base leading-relaxed">
                  Tailor your practice sessions to your exact needs. Choose your target role, define the difficulty, and focus on the skills that matter most.
                </p>
                <button
                  onClick={() => { setSessionDefaults({}); setShowNewSession(true); }}
                  className="bg-white text-[#4F46E5] font-semibold px-6 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 active:scale-97 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Start Custom Session
                </button>
              </div>
              {/* Abstract decorative elements */}
              <div className="absolute right-0 bottom-0 top-0 w-1/2 pointer-events-none overflow-hidden">
                <div className="absolute right-[-10%] top-[-20%] w-[80%] h-[150%] border-[20px] border-white/10 rounded-full mix-blend-overlay"></div>
                <div className="absolute right-[20%] bottom-[-10%] w-[50%] h-[100%] border-[10px] border-white/10 rounded-full mix-blend-overlay"></div>
              </div>
            </div>
          </section>

          {/* Section 3: Quick Access Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card A */}
            <div className="bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:hover:border-[#6366F1]/50 group flex flex-col h-full">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Chrome className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-[#F4F4F5] mb-2">Chrome Extension</h3>
              <p className="text-sm text-gray-500 dark:text-[#71717A] mb-6 flex-1">
                Analyze job descriptions directly from LinkedIn or Indeed.
              </p>
              <button className="w-full text-center py-2 px-4 rounded-lg bg-transparent border border-purple-200 text-purple-600 font-medium hover:bg-purple-50 active:scale-97 transition-all dark:border-purple-500/30 dark:text-purple-400 dark:hover:bg-purple-500/10">
                Install Now
              </button>
            </div>

            {/* Card B */}
            <div className="bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] rounded-xl p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:hover:border-[#10B981]/50 group flex flex-col h-full">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-[#10B981] flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-[#F4F4F5] mb-2">Custom Challenge</h3>
              <p className="text-sm text-gray-500 dark:text-[#71717A] mb-6 flex-1">
                Define specific skills, difficulty, and topics.
              </p>
              <button onClick={() => setShowNewSession(true)} className="w-full text-center py-2 px-4 rounded-lg bg-transparent border border-green-200 text-green-600 font-medium hover:bg-green-50 active:scale-97 transition-all dark:border-[#10B981]/30 dark:text-[#10B981] dark:hover:bg-[#10B981]/10">
                Create
              </button>
            </div>

            {/* Card C (Empty State) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => { setSessionDefaults({}); setShowNewSession(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter') setShowNewSession(true); }}
              className="border-2 border-dashed border-gray-300 dark:border-[#2E2E3E] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-indigo-50/50 hover:border-indigo-300 dark:hover:bg-[#6366F1]/5 dark:hover:border-[#6366F1]/50 group h-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1A1A24] text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-[#6366F1] flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium text-gray-600 dark:text-[#A1A1AA] group-hover:text-indigo-700 dark:group-hover:text-[#F4F4F5] transition-colors">Create Your First Interview</span>
            </div>
          </section>

          {/* Section 4: Mock Interviews */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="font-['DM_Sans',sans-serif] text-xl font-bold text-gray-900 dark:text-[#F4F4F5]">Mock Interviews</h2>
              <div className="flex flex-wrap gap-2">
                {["Behavioral", "Software Engineering", "Product Manager", "Marketing", "Sales", "Data Science", "Design"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${activeTab === tab
                        ? "bg-indigo-600 text-white dark:bg-[#6366F1] shadow-sm"
                        : "bg-transparent text-gray-600 hover:text-gray-900 dark:text-[#71717A] dark:hover:text-[#F4F4F5]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Behavioral Basics", role: "Any Role", difficulty: "Easy", icon: <Briefcase className="w-5 h-5" />, colorClass: "text-[#10B981]", bgClass: "bg-[#10B981]/10", diffColor: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20", personaId: "casey" },
                { title: "Software Engineering", role: "Software Engineer", difficulty: "Hard", icon: <Terminal className="w-5 h-5" />, colorClass: "text-[#6366F1]", bgClass: "bg-[#6366F1]/10", diffColor: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20", personaId: "morgan" },
                { title: "Product Manager", role: "Product Manager", difficulty: "Medium", icon: <Briefcase className="w-5 h-5" />, colorClass: "text-purple-500", bgClass: "bg-purple-500/10", diffColor: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20", personaId: "alex" },
                { title: "Marketing Strategy", role: "Marketing Manager", difficulty: "Medium", icon: <Chrome className="w-5 h-5" />, colorClass: "text-[#22D3EE]", bgClass: "bg-[#22D3EE]/10", diffColor: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20", personaId: "jordan" },
                { title: "Sales Pitch", role: "Sales Representative", difficulty: "Hard", icon: <Zap className="w-5 h-5" />, colorClass: "text-orange-500", bgClass: "bg-orange-500/10", diffColor: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20", personaId: "morgan" },
                { title: "Data Scientist", role: "Data Scientist", difficulty: "Hard", icon: <Terminal className="w-5 h-5" />, colorClass: "text-indigo-400", bgClass: "bg-indigo-400/10", diffColor: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20", personaId: "alex" },
                { title: "UI/UX Design", role: "UI/UX Designer", difficulty: "Medium", icon: <Chrome className="w-5 h-5" />, colorClass: "text-pink-500", bgClass: "bg-pink-500/10", diffColor: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20", personaId: "casey" }
              ].map((preset, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 dark:bg-[#111118] dark:border-[#1E1E2E] rounded-xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:hover:border-[#6366F1] dark:hover:shadow-[0_0_0_1px_#6366F1] flex flex-col cursor-pointer group"
                  onClick={() => {
                    setSessionDefaults({ role: preset.role, difficulty: preset.difficulty, personaId: preset.personaId });
                    setShowNewSession(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${preset.colorClass} ${preset.bgClass}`}>
                      {preset.icon}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${preset.diffColor}`}>
                      {preset.difficulty}
                    </span>
                  </div>
                  <div className="mb-6 flex-1">
                    <h4 className="font-['Inter',sans-serif] font-bold text-gray-900 dark:text-white text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{preset.title}</h4>
                    <p className="text-[13px] text-gray-500 dark:text-[#71717A]">
                      5 questions • {preset.role === 'Any Role' ? 'Any Role' : preset.role}
                    </p>
                  </div>
                  <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:scale-97 transition-all dark:bg-[#6366F1] dark:hover:bg-[#4F46E5] mt-auto">
                    Start Practice
                  </button>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      <NewSessionDialog
        open={showNewSession}
        onOpenChange={setShowNewSession}
        onSessionCreated={handleNewSessionCreated}
        initialRole={sessionDefaults.role}
        initialDifficulty={sessionDefaults.difficulty}
        initialPersonaId={sessionDefaults.personaId}
      />

      {/* Global Sign Out Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111118] border border-gray-200 dark:border-[#1E1E2E] shadow-2xl rounded-xl p-6 w-full max-w-sm transform animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">Sign Out</h3>
            <p className="text-gray-500 dark:text-[#A1A1AA] text-sm text-center mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-[#2E2E3E] text-gray-700 dark:text-[#A1A1AA] hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  /* Assume auto signout logic here, for demo just route to sign in */
                  router.push("/sign-in");
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-[#EF4444] dark:hover:bg-[#DC2626] text-white transition-colors font-medium text-sm active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}