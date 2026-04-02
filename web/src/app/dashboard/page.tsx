"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle, Search, Chrome, Briefcase, Zap, Terminal } from "lucide-react";
import Link from "next/link";
import { NewSessionDialog } from "@/components/dashboard/new-session-dialog";
import { getSessions, type InterviewSession } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [, setLoading] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);
  const [activeTab, setActiveTab] = useState("Behavioral");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated) {
      loadSessions();
    }
  }, [authLoading, isAuthenticated, router]);

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

  function handleNewSessionCreated(sessionId: string) {
    router.push(`/interview/${sessionId}`);
  }



  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen">
        <div className="container mx-auto px-6 py-8">

          {/* Header / Welcome */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome Back, {user?.name || "User"}!</h1>
              <p className="text-gray-500">Ready to ace your next interview?</p>
            </div>
            {/* Search Bar Placeholder */}
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Search interviews..."
              />
            </div>
          </div>

          {/* Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white mb-10 shadow-lg relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Create Custom Interviews</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Practice specifically for your target role. Choose a role, company, and difficulty level.
              </p>
              <Button onClick={() => setShowNewSession(true)} className="bg-white text-blue-600 hover:bg-gray-100 font-semibold border-none">
                <Plus className="w-5 h-5 mr-2" />
                Start Custom Session
              </Button>
            </div>
            {/* Abstract Background Decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-left" />
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Chrome Extension Card */}
            <Card className="border-none shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-start h-full">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <Chrome className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">Chrome Extension</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1">
                  Analyze job descriptions directly from LinkedIn or Indeed to generate questions.
                </p>
                <Button variant="outline" className="w-full text-purple-600 border-purple-200 hover:bg-purple-50">
                  Install Now
                </Button>
              </CardContent>
            </Card>

            {/* Create Your Own Card */}
            <Card className="border-none shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-start h-full">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">Custom Challenge</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1">
                  Define specific skills, difficulty, and topics to challenge yourself.
                </p>
                <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50" onClick={() => setShowNewSession(true)}>
                  Create
                </Button>
              </CardContent>
            </Card>

            {/* Empty State / Add New */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-gray-400 hover:text-primary group h-full min-h-[200px]"
              onClick={() => setShowNewSession(true)}
            >
              <div className="p-4 rounded-full bg-gray-100 group-hover:bg-white mb-3 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-medium">Your Custom Interviews</span>
            </div>
          </div>

          {/* Mock Interviews Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Mock Interviews</h2>
              {/* Categories/Tabs */}
              <div className="flex gap-2">
                {["Behavioral", "Software Engineering", "Marketing", "Agriculture"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Demo Cards based on Active Tab */}
              {[1, 2, 3, 4].map((i) => {
                
                const level = i === 1 ? "Entry Level" : i === 2 ? "Mid-Level" : i === 3 ? "Senior" : "Lead";
                return (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg ${activeTab === "Software Engineering" ? "bg-blue-100 text-blue-600" :
                            activeTab === "Marketing" ? "bg-pink-100 text-pink-600" :
                              "bg-primary/10 text-primary"
                          }`}>
                          {activeTab === "Software Engineering" ? <Terminal className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                        </div>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                          30 min
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {activeTab} {i === 1 ? "Basics" : i === 2 ? "Intermediate" : "Advanced"}
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        5 questions • {level}
                      </p>
                      <Button
                        className="w-full bg-gray-50 text-gray-900 hover:bg-primary hover:text-white border border-gray-100 transition-all shadow-none"
                        onClick={() => setShowNewSession(true)}
                      >
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent History */}
          {sessions.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent History</h2>
              <div className="bg-white rounded-xl shadow-sm border p-1">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {session.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{session.role} at {session.company}</h4>
                        <p className="text-xs text-gray-500">
                          {session.difficulty} • {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={session.status === 'completed' ? `/evaluation/${session.id}` : `/interview/${session.id}`}>
                          {session.status === 'completed' ? 'View Results' : 'Continue'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <NewSessionDialog
        open={showNewSession}
        onOpenChange={setShowNewSession}
        onSessionCreated={handleNewSessionCreated}
      />
    </div>
  );
}