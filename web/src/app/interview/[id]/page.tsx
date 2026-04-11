"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff, AlertCircle, PlaySquare, SkipForward, Send, PhoneOff, Video, VideoOff, Wifi, WifiOff, CheckCircle2, Camera, Volume2 } from "lucide-react";
import { getSessionQuestions, getSession as getSessionData, submitAnswer, getTtsAudio, type Question } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// ─── Filler Word Detection ──────────────────────────────────────
const FILLER_WORDS = [
  "um", "uh", "uhh", "umm", "hmm", "hm",
  "like", "basically", "actually", "literally",
  "you know", "i mean", "sort of", "kind of",
  "right", "so yeah", "and stuff", "or whatever",
];

function countFillers(text: string): { total: number; breakdown: Record<string, number> } {
  const lower = text.toLowerCase();
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const filler of FILLER_WORDS) {
    // Use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${filler.replace(/\s+/g, "\\s+")}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      breakdown[filler] = matches.length;
      total += matches.length;
    }
  }
  return { total, breakdown };
}

// ─── Cross-browser SpeechRecognition ────────────────────────────
const getSpeechRecognition = () => {
  if (typeof window !== "undefined") {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};

// ─── Types ──────────────────────────────────────────────────────
type InterviewPhase = "lobby" | "interview" | "ending";
type InterviewStatus = "Starting..." | "Processing..." | "Speaking..." | "Listening...";

interface DeviceCheck {
  camera: "checking" | "granted" | "denied";
  microphone: "checking" | "granted" | "denied";
  connection: "checking" | "good" | "poor" | "offline";
}

// ─── Session Metadata ───────────────────────────────────────────
interface SessionMeta {
  role: string;
  company: string;
  difficulty: string;
  personaId?: string;
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const sessionId = params.id as string;

  // ─── Phase ────────────────────────────────────────────────────
  const [phase, setPhase] = useState<InterviewPhase>("lobby");

  // ─── Device Checks ────────────────────────────────────────────
  const [deviceCheck, setDeviceCheck] = useState<DeviceCheck>({
    camera: "checking",
    microphone: "checking",
    connection: "checking",
  });

  // ─── Session Metadata ─────────────────────────────────────────
  const [sessionMeta, setSessionMeta] = useState<SessionMeta>({ role: "Loading...", company: "...", difficulty: "Medium" });

  // ─── Data State ───────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Interview State ──────────────────────────────────────────
  const [status, setStatus] = useState<InterviewStatus>("Starting...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ─── Filler Word Tracking ─────────────────────────────────────
  const [fillerCount, setFillerCount] = useState(0);
  const [fillerBreakdown, setFillerBreakdown] = useState<Record<string, number>>({});
  const [sessionFillerTotal, setSessionFillerTotal] = useState(0);

  // ─── Fallback ─────────────────────────────────────────────────
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(true);
  const [fallbackText, setFallbackText] = useState("");

  // ─── Refs ─────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef(transcript);
  const fallbackTextRef = useRef(fallbackText);

  // ─── Typewriter ───────────────────────────────────────────────
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const typeWriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { fallbackTextRef.current = fallbackText; }, [fallbackText]);

  // ─── Update filler count whenever transcript changes ──────────
  useEffect(() => {
    if (transcript) {
      const { total, breakdown } = countFillers(transcript);
      setFillerCount(total);
      setFillerBreakdown(breakdown);
    }
  }, [transcript]);

  // ═══════════════════════════════════════════════════════════════
  // LOBBY: Device Checks
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== "lobby") return;

    // Connection check
    const checkConnection = () => {
      if (!navigator.onLine) {
        setDeviceCheck(prev => ({ ...prev, connection: "offline" }));
      } else {
        setDeviceCheck(prev => ({ ...prev, connection: "good" }));
      }
    };
    checkConnection();
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    // Camera + Mic check
    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setDeviceCheck(prev => ({ ...prev, camera: "granted", microphone: "granted" }));
      } catch (err: any) {
        console.warn("Device access error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setDeviceCheck(prev => ({ ...prev, camera: "denied", microphone: "denied" }));
        } else {
          // Might be only one device failing, try individually
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setDeviceCheck(prev => ({ ...prev, microphone: "granted" }));
          } catch { setDeviceCheck(prev => ({ ...prev, microphone: "denied" })); }
          try {
            const vs = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = vs;
            if (videoRef.current) videoRef.current.srcObject = vs;
            setDeviceCheck(prev => ({ ...prev, camera: "granted" }));
          } catch { setDeviceCheck(prev => ({ ...prev, camera: "denied" })); }
        }
      }
    }
    checkDevices();

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, [phase]);

  // ═══════════════════════════════════════════════════════════════
  // LOBBY: Fetch Session Metadata + Questions
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated && sessionId) {
      loadSessionData();
    }
  }, [authLoading, isAuthenticated, sessionId, router]);

  async function loadSessionData() {
    try {
      setLoading(true);
      const [sessionInfo, questionsData] = await Promise.all([
        getSessionData(sessionId),
        getSessionQuestions(sessionId),
      ]);
      setSessionMeta({
        role: sessionInfo.role || "Candidate",
        company: sessionInfo.company || "Company",
        difficulty: sessionInfo.difficulty || "Medium",
        personaId: sessionInfo.personaId,
      });
      setQuestions(questionsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERVIEW: Question Flow
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (phase !== "interview" || loading || questions.length === 0 || currentQuestionIndex >= questions.length) return;
    startQuestion(questions[currentQuestionIndex].text);
    return () => { stopCurrentAction(); };
  }, [phase, currentQuestionIndex, loading, questions]);

  function stopCurrentAction() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (typeWriterIntervalRef.current) clearInterval(typeWriterIntervalRef.current);
  }

  async function startQuestion(text: string) {
    stopCurrentAction();
    setTranscript("");
    setFallbackText("");
    setTimeLeft(120);
    setDisplayedQuestion("");
    setFillerCount(0);
    setFillerBreakdown({});
    setStatus("Processing...");

    // Typewriter effect
    let cursor = 0;
    typeWriterIntervalRef.current = setInterval(() => {
      if (cursor <= text.length) {
        setDisplayedQuestion(text.substring(0, cursor));
        cursor++;
      } else {
        if (typeWriterIntervalRef.current) clearInterval(typeWriterIntervalRef.current);
      }
    }, 40);

    // TTS
    try {
      const blob = await getTtsAudio(text, sessionId);
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) return;
      audioRef.current.src = url;
      await audioRef.current.play();
      setStatus("Speaking...");
      setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        startListening();
      };
    } catch {
      setIsSpeaking(false);
      if (typeWriterIntervalRef.current) clearInterval(typeWriterIntervalRef.current);
      setDisplayedQuestion(text);
      startListening();
    }
  }

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setHasSpeechRecognition(false);
      setStatus("Listening...");
      startCountdown();
      return;
    }

    setStatus("Listening...");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const tr = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += tr + " ";
        else interimTranscript += tr;
      }
      const fullText = finalTranscript + interimTranscript;
      setTranscript(fullText);
      resetSilenceTimer(fullText);
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      // Auto-restart if still in listening phase
      try { if (recognitionRef.current === recognition) recognition.start(); } catch {}
    };

    try { recognition.start(); } catch {}
    resetSilenceTimer("");
    startCountdown();
  }, []);

  function resetSilenceTimer(currentText: string) {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!currentText.trim()) return;
    silenceTimerRef.current = setTimeout(() => {
      handleAdvanceQuestion(currentText);
    }, 6000);
  }

  function startCountdown() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => document.getElementById("auto-submit-btn")?.click(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleAdvanceQuestion(finalTextToSubmit?: string) {
    if (isSubmitting) return;
    stopCurrentAction();
    setIsSubmitting(true);

    const question = questions[currentQuestionIndex];
    const textToSubmit = finalTextToSubmit !== undefined ? finalTextToSubmit : (hasSpeechRecognition ? transcriptRef.current : fallbackTextRef.current);

    // Accumulate filler count for the session
    const { total } = countFillers(textToSubmit);
    setSessionFillerTotal(prev => prev + total);

    try {
      await submitAnswer({
        sessionId,
        questionId: question.id,
        questionIndex: currentQuestionIndex,
        text: textToSubmit.trim(),
      });

      setShowSavedMsg(true);
      setTimeout(() => {
        setShowSavedMsg(false);
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          router.push(`/evaluation/${sessionId}`);
        }
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  // ─── End Call ──────────────────────────────────────────────────
  function handleEndCall() {
    stopCurrentAction();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    // If at least one answer was submitted, go to evaluation
    if (currentQuestionIndex > 0) {
      router.push(`/evaluation/${sessionId}`);
    } else {
      router.push("/dashboard");
    }
  }

  // ─── Toggle Mute / Camera ─────────────────────────────────────
  function toggleMute() {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  }
  function toggleCamera() {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(prev => !prev);
    }
  }

  // ─── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCurrentAction();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ─── UI Helpers ───────────────────────────────────────────────
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
  const timerColor = timeLeft > 60 ? "text-green-400" : timeLeft > 30 ? "text-yellow-400" : "text-red-500 animate-pulse";

  const allChecksOk = deviceCheck.camera === "granted" && deviceCheck.microphone === "granted" && deviceCheck.connection === "good";

  // ─── Loading ──────────────────────────────────────────────────
  if (loading || authLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#09090b]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );
  if (error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-red-500 gap-4">
      <AlertCircle className="w-10 h-10" />
      <p>{error}</p>
      <Button onClick={() => router.push("/dashboard")} variant="outline">Back to Dashboard</Button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: PRE-CALL LOBBY
  // ═══════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    return (
      <div className="h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center font-['Inter',sans-serif] p-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-['DM_Sans',sans-serif]">Ready to Interview?</h1>
            <p className="text-zinc-400">
              {sessionMeta.role} at {sessionMeta.company} • {sessionMeta.difficulty} Difficulty
            </p>
          </div>

          {/* Camera Preview */}
          <div className="relative aspect-video max-w-md mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {deviceCheck.camera === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-3">
                <VideoOff className="w-12 h-12 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Camera access denied</p>
              </div>
            )}
            {deviceCheck.camera === "checking" && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            {/* User name overlay */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-medium text-zinc-200">
              {user?.name || "You"}
            </div>
          </div>

          {/* Device Check Status Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Camera */}
            <div className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
              deviceCheck.camera === "granted" ? "border-green-500/40 bg-green-500/5" :
              deviceCheck.camera === "denied" ? "border-red-500/40 bg-red-500/5" :
              "border-zinc-800 bg-zinc-900"
            }`}>
              <Camera className={`w-6 h-6 mx-auto ${
                deviceCheck.camera === "granted" ? "text-green-400" :
                deviceCheck.camera === "denied" ? "text-red-400" : "text-zinc-500"
              }`} />
              <p className="text-xs font-medium text-zinc-300">Camera</p>
              <p className={`text-xs font-bold ${
                deviceCheck.camera === "granted" ? "text-green-400" :
                deviceCheck.camera === "denied" ? "text-red-400" : "text-zinc-500"
              }`}>
                {deviceCheck.camera === "granted" ? "Ready" : deviceCheck.camera === "denied" ? "Blocked" : "Checking..."}
              </p>
            </div>

            {/* Microphone */}
            <div className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
              deviceCheck.microphone === "granted" ? "border-green-500/40 bg-green-500/5" :
              deviceCheck.microphone === "denied" ? "border-red-500/40 bg-red-500/5" :
              "border-zinc-800 bg-zinc-900"
            }`}>
              <Volume2 className={`w-6 h-6 mx-auto ${
                deviceCheck.microphone === "granted" ? "text-green-400" :
                deviceCheck.microphone === "denied" ? "text-red-400" : "text-zinc-500"
              }`} />
              <p className="text-xs font-medium text-zinc-300">Microphone</p>
              <p className={`text-xs font-bold ${
                deviceCheck.microphone === "granted" ? "text-green-400" :
                deviceCheck.microphone === "denied" ? "text-red-400" : "text-zinc-500"
              }`}>
                {deviceCheck.microphone === "granted" ? "Ready" : deviceCheck.microphone === "denied" ? "Blocked" : "Checking..."}
              </p>
            </div>

            {/* Connection */}
            <div className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
              deviceCheck.connection === "good" ? "border-green-500/40 bg-green-500/5" :
              deviceCheck.connection === "offline" ? "border-red-500/40 bg-red-500/5" :
              "border-zinc-800 bg-zinc-900"
            }`}>
              {deviceCheck.connection === "good" ? (
                <Wifi className="w-6 h-6 mx-auto text-green-400" />
              ) : deviceCheck.connection === "offline" ? (
                <WifiOff className="w-6 h-6 mx-auto text-red-400" />
              ) : (
                <Wifi className="w-6 h-6 mx-auto text-zinc-500" />
              )}
              <p className="text-xs font-medium text-zinc-300">Connection</p>
              <p className={`text-xs font-bold ${
                deviceCheck.connection === "good" ? "text-green-400" :
                deviceCheck.connection === "offline" ? "text-red-400" : "text-zinc-500"
              }`}>
                {deviceCheck.connection === "good" ? "Stable" : deviceCheck.connection === "offline" ? "Offline" : "Checking..."}
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-200 space-y-1">
            <p className="font-semibold text-indigo-300">Before you start:</p>
            <ul className="list-disc list-inside space-y-0.5 text-indigo-300/80">
              <li>{questions.length} questions will be asked by the AI interviewer</li>
              <li>Each question has a 2-minute time limit</li>
              <li>Your filler words (um, uh, like...) are tracked for feedback</li>
              <li>Speak clearly and naturally — the AI will listen and transcribe</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="border-zinc-700 text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={() => setPhase("interview")}
              disabled={!allChecksOk || questions.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allChecksOk ? (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Join Interview</>
              ) : (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking Devices...</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: LIVE INTERVIEW (Zoom-style)
  // ═══════════════════════════════════════════════════════════════
  if (!questions.length) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#09090b] text-white">No questions found.</div>
  );

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col font-['Inter',sans-serif] overflow-hidden select-none">
      <audio ref={audioRef} className="hidden" />
      <button id="auto-submit-btn" className="hidden" onClick={() => handleAdvanceQuestion()} />

      {/* ─── TOP BAR ─────────────────────────────────────────── */}
      <header className="h-16 shrink-0 border-b border-zinc-800/50 px-6 flex items-center justify-between bg-[#09090b]/90 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <PlaySquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">{sessionMeta.role}</div>
            <div className="text-xs text-zinc-500">{sessionMeta.company} • {sessionMeta.difficulty}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-zinc-300 font-['DM_Sans',sans-serif]">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="w-48 h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Filler Word Counter */}
          {status === "Listening..." && fillerCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-yellow-500/15 border border-yellow-500/30 px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-yellow-400 text-xs font-bold">Fillers: {fillerCount}</span>
            </motion.div>
          )}

          <div className={`font-mono text-xl font-bold w-24 text-right ${timerColor}`}>
            {status === "Listening..." ? formatTime(timeLeft) : "2:00"}
          </div>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL: AI INTERVIEWER (70%) */}
        <div className="flex-[7] relative flex flex-col items-center justify-center border-r border-zinc-800/50 overflow-hidden"
          style={{ background: 'radial-gradient(circle at center, #181926 0%, #09090b 100%)' }}>

          {/* AI Avatar */}
          <div className="relative mb-8">
            <AnimatePresence>
              {isSpeaking && (
                <>
                  <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-indigo-500/50" />
                  <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-cyan-400/30" />
                </>
              )}
            </AnimatePresence>

            <div className="w-32 h-32 rounded-full bg-zinc-900 border border-zinc-700 shadow-2xl relative z-10 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-zinc-900 opacity-80" />
              <svg className="w-12 h-12 text-indigo-400 absolute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
          </div>

          <div className="text-xl font-bold font-['DM_Sans',sans-serif] text-zinc-100 mb-1">AI Interviewer</div>
          <div className={`text-sm font-medium px-3 py-1 rounded-full mb-10 transition-colors ${status === 'Listening...' ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {status}
          </div>

          {/* Question Text */}
          <div className="max-w-xl text-center px-6">
            <p className="text-xl md:text-2xl font-light text-zinc-200 leading-relaxed min-h-[120px]">
              {displayedQuestion}
              {status === "Speaking..." && <span className="inline-block w-0.5 h-6 bg-indigo-400 ml-1 animate-pulse" />}
            </p>
          </div>

          {/* Transcript / Fallback Textarea */}
          <div className="absolute bottom-10 left-10 right-10 flex justify-center">
            {status === "Listening..." && hasSpeechRecognition ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full p-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-green-400 font-medium uppercase tracking-wider">
                    <Mic className="w-3 h-3 animate-pulse" /> Live Transcript
                  </div>
                  {/* Live filler breakdown */}
                  {fillerCount > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(fillerBreakdown).slice(0, 3).map(([word, count]) => (
                        <span key={word} className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                          &quot;{word}&quot; ×{count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed h-16 overflow-y-auto custom-scrollbar">
                  {transcript || <span className="text-zinc-600 italic">Listening to your response...</span>}
                </p>
              </motion.div>
            ) : status === "Listening..." && !hasSpeechRecognition ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full">
                <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Type your answer</label>
                <textarea
                  autoFocus
                  className="w-full h-32 bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none text-sm"
                  placeholder="Speech recognition not supported. Please type your answer..."
                  value={fallbackText}
                  onChange={e => setFallbackText(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" onClick={() => handleAdvanceQuestion()} className="bg-indigo-600 hover:bg-indigo-700">
                    Submit & Next <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* RIGHT PANEL: USER CAMERA (30%) */}
        <div className="flex-[3] bg-[#09090b] border-l border-zinc-800/50 p-6 flex flex-col relative">
          <div className="flex-1 rounded-2xl bg-zinc-900 overflow-hidden relative border border-zinc-800 shadow-inner">
            <video
              ref={phase === "interview" ? undefined : videoRef}
              autoPlay playsInline muted
              className={`w-full h-full object-cover transform -scale-x-100 ${isCameraOff ? 'hidden' : ''}`}
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-2">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 border border-zinc-700">
                  <VideoOff className="w-8 h-8" />
                </div>
                <p className="text-zinc-600 text-xs">Camera Off</p>
              </div>
            )}

            {/* Name + mic indicator */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-zinc-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-2">
                <div className="text-xs font-semibold text-zinc-200">{user?.name || "You"}</div>
              </div>
              {status === "Listening..." && !isMuted && (
                <div className="flex gap-[3px] items-end h-4 w-6">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: ["30%", "100%", "30%"] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 bg-green-500 rounded-full"
                    />
                  ))}
                </div>
              )}
              {isMuted && (
                <div className="bg-red-500/20 p-1.5 rounded-lg">
                  <MicOff className="w-3 h-3 text-red-400" />
                </div>
              )}
            </div>
          </div>

          {/* Session Filler Summary */}
          <div className="mt-4 bg-zinc-900/50 rounded-xl border border-zinc-800 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Session Filler Words</p>
            <p className={`text-2xl font-bold font-mono ${sessionFillerTotal > 10 ? 'text-red-400' : sessionFillerTotal > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {sessionFillerTotal}
            </p>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM BAR (Zoom-style controls) ────────────────── */}
      <footer className="h-20 shrink-0 border-t border-zinc-800/50 px-6 flex items-center justify-center bg-[#111118] gap-4">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isCameraOff ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Skip Question */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAdvanceQuestion(hasSpeechRecognition ? transcript : fallbackText)}
          disabled={isSubmitting || status === "Starting..." || status === "Processing..."}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-12 px-5"
        >
          <SkipForward className="w-4 h-4 mr-2" /> Skip
        </Button>

        {/* END CALL BUTTON */}
        <button
          onClick={handleEndCall}
          className="w-14 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
          title="End Interview"
        >
          <PhoneOff className="w-5 h-5 text-white" />
        </button>
      </footer>

      {/* ─── Submission Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            {showSavedMsg ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-green-500/20 text-green-400 px-6 py-3 rounded-2xl flex items-center gap-3 font-semibold text-lg border border-green-500/30 shadow-2xl">
                <CheckCircle2 className="w-5 h-5" /> Answer saved ✓
              </motion.div>
            ) : (
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
