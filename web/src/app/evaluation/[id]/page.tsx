"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Star, Download, RefreshCcw, ArrowLeft, ChevronDown, MessageSquare, TrendingUp, TrendingDown, Target, Lightbulb, Users, TerminalSquare, Search, Award } from "lucide-react";
import { getEvaluation, type EvaluationResult, type QuestionFeedback } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import jsPDF from "jspdf";

const LOADING_TIPS = [
  "Evaluating communication skills...",
  "Analyzing technical depth...",
  "Reviewing problem-solving approach...",
  "Generating personalized feedback...",
  "Comparing with ideal candidate profiles..."
];

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading animations state
  const [tipIndex, setTipIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Tabs State
  const [activeTab, setActiveTab] = useState(0);
  const [expandedQs, setExpandedQs] = useState<number[]>([]);

  // Score counter state
  const [displayScore, setDisplayScore] = useState(0);

  // Poll Evaluation
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchEval = async () => {
      try {
        const data = await getEvaluation(id);
        if ('status' in data && data.status === 'evaluating') {
          // keep polling
        } else {
          setEvaluation(data as EvaluationResult);
          setLoading(false);
        }
      } catch (err) {
        // Stop polling on actual failure or let it retry for a bit then fail
        console.error("Evaluation poll error:", err);
      }
    };

    fetchEval(); // initial

    const poller = setInterval(() => {
      if (loading) fetchEval();
      else clearInterval(poller);
    }, 3000);

    return () => clearInterval(poller);
  }, [isAuthenticated, id, loading]);

  // Loading Fake Progress & Tips
  useEffect(() => {
    if (!loading) return;

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setFakeProgress((prev) => {
        // Slows down as it approaches 95
        const remaining = 95 - prev;
        const jump = Math.max(0.5, remaining * 0.1);
        return prev >= 95 ? 95 : prev + jump;
      });
    }, 800);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  // Score Counter Animation
  useEffect(() => {
    if (evaluation && !loading) {
      const start = 0;
      const end = evaluation.overallScore;
      const duration = 1500;
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function (easeOutQuart)
        const ease = 1 - Math.pow(1 - progress, 4);
        setDisplayScore(Math.floor(start + (end - start) * ease));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayScore(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [evaluation, loading]);

  const toggleQuestion = (idx: number) => {
    setExpandedQs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleExportPDF = () => {
    if (!evaluation) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text("InterVista Candidate Report", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Score: ${evaluation.overallScore}/100`, 20, 30);
    doc.text(`Recommendation: ${evaluation.recommendation}`, 20, 38);

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Executive Summary", 20, 50);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const splitSummary = doc.splitTextToSize(evaluation.executiveSummary || "", 170);
    doc.text(splitSummary, 20, 58);

    // Skills
    let y = 65 + (splitSummary.length * 5);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Skills Assessment", 20, y);
    y += 8;

    const skills = evaluation.skillsAssessment;
    const skillList = [
      { name: "Communication", val: skills?.communication },
      { name: "Technical Knowledge", val: skills?.technicalKnowledge },
      { name: "Problem Solving", val: skills?.problemSolving },
      { name: "Confidence", val: skills?.confidence },
      { name: "Structured Thinking", val: skills?.structuredThinking },
      { name: "Relevant Experience", val: skills?.relevantExperience },
    ];

    doc.setFontSize(10);
    skillList.forEach(s => {
      if (s.val) {
        doc.setTextColor(50, 50, 50);
        doc.text(`${s.name}: ${s.val.score}/100`, 20, y);
        doc.setTextColor(100, 100, 100);
        const splitObs = doc.splitTextToSize(s.val.observation || "", 170);
        doc.text(splitObs, 20, y + 5);
        y += 10 + (splitObs.length * 5);

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }
    });

    doc.save(`InterVista-Report-${Date.now()}.pdf`);
  };

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0F]" />;

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] font-['Inter',sans-serif]">
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
          {/* Spinning gradient ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-cyan-400 opacity-80"
          />
          {/* Inner pulse */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-32 h-32 rounded-full bg-indigo-500/20 blur-xl"
          />
          <div className="absolute text-zinc-100 font-bold text-xl">{Math.floor(fakeProgress)}%</div>
        </div>

        <h2 className="text-2xl font-bold font-['DM_Sans',sans-serif] text-white mb-3">Analyzing your interview...</h2>

        <div className="h-6 relative w-80 text-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="text-zinc-400 absolute w-full font-medium"
            >
              {LOADING_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 h-1.5 bg-zinc-800 rounded-full mt-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
            animate={{ width: `\${fakeProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="mb-4">{error || "Failed to load evaluation."}</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  const getColorScheme = (score: number) => {
    if (score >= 80) return { text: "text-green-400", bg: "bg-green-500", border: "border-green-500/30", bgLight: "bg-green-500/10" };
    if (score >= 60) return { text: "text-yellow-400", bg: "bg-yellow-500", border: "border-yellow-500/30", bgLight: "bg-yellow-500/10" };
    return { text: "text-red-400", bg: "bg-red-500", border: "border-red-500/30", bgLight: "bg-red-500/10" };
  };

  const getRecommendationDetails = (rec: string) => {
    switch (rec) {
      case "Strong Hire": return { icon: <Star className="w-5 h-5" />, color: "text-green-400 bg-green-500/20 border-green-500/30" };
      case "Hire": return { icon: <CheckCircle className="w-5 h-5" />, color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30" };
      case "Consider": return { icon: <AlertTriangle className="w-5 h-5" />, color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" };
      case "No Hire": return { icon: <XCircle className="w-5 h-5" />, color: "text-red-400 bg-red-500/20 border-red-500/30" };
      default: return { icon: <Target className="w-5 h-5" />, color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
    }
  };

  const scoreColors = getColorScheme(evaluation.overallScore);
  const recDetails = getRecommendationDetails(evaluation.recommendation);

  const skills = evaluation.skillsAssessment || {};
  const skillList = [
    { name: "Communication", key: "communication", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "Technical Knowledge", key: "technicalKnowledge", icon: <TerminalSquare className="w-5 h-5" /> },
    { name: "Problem Solving", key: "problemSolving", icon: <Search className="w-5 h-5" /> },
    { name: "Confidence", key: "confidence", icon: <Award className="w-5 h-5" /> },
    { name: "Structured Thinking", key: "structuredThinking", icon: <Target className="w-5 h-5" /> },
    { name: "Relevant Experience", key: "relevantExperience", icon: <Users className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-['Inter',sans-serif] text-zinc-100 pb-20 selection:bg-indigo-500/30">

      {/* ----------------- TOP NAVBAR ----------------- */}
      <nav className="h-16 border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="p-2 rounded-lg hover:bg-[#1E1E2E] transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-['DM_Sans',sans-serif] font-bold text-lg hidden sm:block">Evaluation Report</div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-[#1E1E2E] text-zinc-300 hover:text-white hover:bg-[#1E1E2E]">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button size="sm" onClick={() => router.push("/dashboard")} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <RefreshCcw className="w-4 h-4 mr-2" /> Retake
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">

        {/* ----------------- HERO SECTION ----------------- */}
        <section className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-8 sm:p-12 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">

            {/* Score Ring */}
            <div className="shrink-0 relative">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#1E1E2E" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
                  className={scoreColors.text}
                  initial={{ strokeDasharray: "0 340" }}
                  animate={{ strokeDasharray: `\${(evaluation.overallScore / 100) * 339.29} 340` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-black font-['DM_Sans',sans-serif] \${scoreColors.text}`}>{displayScore}</span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">Overall</span>
              </div>
            </div>

            {/* Summary text */}
            <div className="text-center md:text-left flex-1 pt-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border \${recDetails.color} mb-6`}>
                {recDetails.icon}
                <span className="font-bold tracking-wide">{evaluation.recommendation}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-['DM_Sans',sans-serif] mb-4 text-white leading-tight">
                Executive Summary
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                {evaluation.executiveSummary || "No executive summary provided."}
              </p>
            </div>
          </div>
        </section>

        {/* ----------------- SKILLS GRID ----------------- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold font-['DM_Sans',sans-serif] mb-6 px-2">Detailed Skills Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {skillList.map(skill => {
              const data = (skills as any)[skill.key];
              if (!data) return null;
              const sColor = getColorScheme(data.score);

              return (
                <motion.div
                  key={skill.key}
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 transition-all hover:border-[#3F3F46]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#1A1A24] p-2 rounded-lg text-indigo-400">{skill.icon}</div>
                      <h3 className="font-semibold text-zinc-200">{skill.name}</h3>
                    </div>
                    <span className={`font-bold \${sColor.text}`}>{data.score}</span>
                  </div>

                  <div className="h-1.5 w-full bg-[#1A1A24] rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `\${data.score}%` }} viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full \${sColor.bg} rounded-full`}
                    />
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed">{data.observation}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ----------------- TABS NAVIGATION ----------------- */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-[#1E1E2E] pb-4 px-2">
          {["Question by Question", "Improvement Plan", "Interview Tips", "Hiring Manager Note"].map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all \${activeTab === i ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-[#1E1E2E] hover:text-zinc-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ----------------- TAB CONTENTS ----------------- */}
        <div className="min-h-[400px]">

          {/* TAB 0: Question by Question */}
          {activeTab === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {evaluation.questionFeedback?.map((q: QuestionFeedback, idx: number) => {
                const isExp = expandedQs.includes(idx);
                return (
                  <div key={idx} className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden transition-all">

                    {/* Collapsed Header */}
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className="w-full text-left p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-[#151520] transition-colors"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2E2E3E] flex items-center justify-center font-bold text-zinc-300">
                          {idx + 1}
                        </div>
                        <div className="px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-bold font-mono tracking-widest text-zinc-300">
                          GRADE {q.grade || 'N/A'}
                        </div>
                      </div>

                      <h4 className="flex-1 text-[15px] font-medium text-zinc-200 line-clamp-2">{q.question}</h4>

                      <div className="flex items-center gap-4 shrink-0 sm:ml-auto">
                        <div className={`font-mono font-bold \${getColorScheme(q.score * 10).text}`}>
                          {q.score}/10
                        </div>
                        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform \${isExp ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Expanded Body */}
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[#1E1E2E] bg-[#0D0D14]"
                        >
                          <div className="p-6 sm:p-8 space-y-8">

                            <div>
                              <h5 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">Your Answer</h5>
                              <div className="p-5 rounded-xl bg-[#1A1A24] border-l-2 border-indigo-500 text-zinc-300 text-sm leading-relaxed italic">
                                &quot;{q.answer}&quot;
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <h5 className="flex items-center gap-2 text-sm font-semibold text-green-400">
                                  <TrendingUp className="w-4 h-4" /> What Went Well
                                </h5>
                                <ul className="space-y-2">
                                  {q.whatWentWell?.map((item: string, j: number) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-zinc-400">
                                      <span className="text-green-500 mt-1">✓</span> {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-3">
                                <h5 className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
                                  <TrendingDown className="w-4 h-4" /> What to Improve
                                </h5>
                                <ul className="space-y-2">
                                  {q.whatToImprove?.map((item: string, j: number) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-zinc-400">
                                      <span className="text-yellow-500 mt-0.5">→</span> {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <h5 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">Ideal Answer Outline</h5>
                                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm leading-relaxed">
                                  {q.idealAnswerOutline || "Structured approach incorporating STAR method focusing on metrics."}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">Detailed Coaching</h5>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                  {q.detailedFeedback}
                                </p>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 1: Improvement Plan */}
          {activeTab === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {evaluation.improvementPlan?.map((plan: any, i: number) => {
                const colors = plan.priority === 'High' ? 'border-red-500/50 bg-red-500/5' : plan.priority === 'Medium' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-blue-500/50 bg-blue-500/5';
                const textColors = plan.priority === 'High' ? 'text-red-400' : plan.priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400';

                return (
                  <div key={i} className={`p-6 rounded-2xl border \${colors} backdrop-blur-sm relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold \${textColors} bg-[#0A0A0F]/50`}>
                      {plan.priority} Priority
                    </div>
                    <div className="mt-4 mb-2">
                      <h3 className="font-bold text-lg text-zinc-100">{plan.area}</h3>
                    </div>
                    <div className="space-y-4 pt-4 text-sm mt-4 border-t border-zinc-800">
                      <div>
                        <span className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Action</span>
                        <p className="text-zinc-300">{plan.action}</p>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">Resource / Practice</span>
                        <p className="text-zinc-400 italic">{plan.resource}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!evaluation.improvementPlan || evaluation.improvementPlan.length === 0) && (
                <div className="col-span-3 text-center py-10 text-zinc-500">No specific improvement plan generated.</div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Interview Tips */}
          {activeTab === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-4">
              {evaluation.interviewTips?.map((tip: string, i: number) => (
                <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 flex gap-5 items-start">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 mt-1 shrink-0">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-lg pt-1">{tip}</p>
                </div>
              ))}
              {(!evaluation.interviewTips || evaluation.interviewTips.length === 0) && (
                <div className="text-center py-10 text-zinc-500">No specific tips available.</div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Hiring Manager Note */}
          {activeTab === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Left Note Card */}
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                <h3 className="flex items-center gap-3 text-xl font-bold font-['DM_Sans',sans-serif] text-zinc-100 mb-6">
                  <Target className="text-indigo-400 w-6 h-6" /> Hiring Manager&apos;s Assessment
                </h3>
                <p className="text-zinc-300 text-lg leading-relaxed italic border-l-4 border-indigo-500/50 pl-6 py-2 bg-[#1A1A24] rounded-r-xl">
                  &quot;{evaluation.hiringManagerNote || 'The candidate showed great potential but needs more refinement.'}&quot;
                </p>
              </div>

              {/* Right Summary Grid */}
              <div className="space-y-8">
                <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8">
                  <h4 className="font-bold text-green-400 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Key Strengths</h4>
                  <ul className="space-y-3">
                    {evaluation.overallStrengths?.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-zinc-300 bg-[#0A0A0F]/30 p-3 rounded-xl border border-green-500/10">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
                  <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5" /> Critical Weaknesses</h4>
                  <ul className="space-y-3">
                    {evaluation.overallWeaknesses?.map((w: string, i: number) => (
                      <li key={i} className="flex gap-3 text-zinc-300 bg-[#0A0A0F]/30 p-3 rounded-xl border border-red-500/10">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
