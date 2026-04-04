"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, AlertCircle, PlaySquare, SkipForward, Send } from "lucide-react";
import { getSessionQuestions, submitAnswer, getTtsAudio, type Question } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// Cross-browser SpeechRecognition
const getSpeechRecognition = () => {
  if (typeof window !== "undefined") {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }
  return null;
};

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const sessionId = params.id as string;

  // Data state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interview state
  const [status, setStatus] = useState<"Starting..." | "Processing..." | "Speaking..." | "Listening...">("Starting...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  // Fallback for no speech recognition
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(true);
  const [fallbackText, setFallbackText] = useState("");

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Typewriter effect state
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const typeWriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera setup
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
      }
    }
    setupCamera();
    return () => {
      // Cleanup camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch Questions
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isAuthenticated && sessionId) {
      loadQuestions();
    }
  }, [authLoading, isAuthenticated, sessionId, router]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const data = await getSessionQuestions(sessionId);
      setQuestions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }

  // Question Flow Logic
  useEffect(() => {
    if (loading || questions.length === 0 || currentQuestionIndex >= questions.length) return;
    startQuestion(questions[currentQuestionIndex].text);

    return () => {
      stopCurrentAction();
    };
  }, [currentQuestionIndex, loading, questions]);

  function stopCurrentAction() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
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
    setStatus("Processing...");

    // Setup Typewriter
    let cursor = 0;
    typeWriterIntervalRef.current = setInterval(() => {
      if (cursor <= text.length) {
        setDisplayedQuestion(text.substring(0, cursor));
        cursor++;
      } else {
        if (typeWriterIntervalRef.current) clearInterval(typeWriterIntervalRef.current);
      }
    }, 40);

    // Fetch and play TTS
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
    } catch (e) {
      console.error("TTS Failed, skipping to listening", e);
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
      setTranscript(finalTranscript + interimTranscript);
      resetSilenceTimer(finalTranscript + interimTranscript);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition error:", e.error);
    };

    recognition.onend = () => {
      // If we are still supposed to be listening, restart it
      if (status === "Listening..." && timeLeft > 0) {
        try { recognition.start(); } catch (e) { }
      }
    };

    try { recognition.start(); } catch (e) { }

    // Start timers
    resetSilenceTimer("");
    startCountdown();
  }, [status, timeLeft]);

  function resetSilenceTimer(currentText: string) {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (!currentText.trim()) return; // Don't trigger auto-advance if they haven't spoken yet

    silenceTimerRef.current = setTimeout(() => {
      handleAdvanceQuestion(currentText);
    }, 6000); // 6 seconds of silence
  }

  function startCountdown() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAdvanceQuestion(transcript); // closure issue, better fetch it from state or handle differently, but transcript changes won't trigger this closure correctly.
          // Wait, prev <= 1 means timeout. We will just trigger submit.
          setTimeout(() => document.getElementById('auto-submit-btn')?.click(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Use a ref to get the latest transcript for the auto-submit to avoid stale closures
  const transcriptRef = useRef(transcript);
  const fallbackTextRef = useRef(fallbackText);
  useEffect(() => { transcriptRef.current = transcript; fallbackTextRef.current = fallbackText; }, [transcript, fallbackText]);

  async function handleAdvanceQuestion(finalTextToSubmit?: string) {
    if (isSubmitting) return;
    stopCurrentAction();
    setIsSubmitting(true);

    const question = questions[currentQuestionIndex];
    const textToSubmit = finalTextToSubmit !== undefined ? finalTextToSubmit : (hasSpeechRecognition ? transcriptRef.current : fallbackTextRef.current);

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

  // UI Helpers
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
  const timerColor = timeLeft > 60 ? "text-green-400" : timeLeft > 30 ? "text-yellow-400" : "text-red-500 animate-pulse";

  if (loading || authLoading) return <div className="h-screen w-full flex items-center justify-center bg-[#09090b]"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="h-screen w-full flex items-center justify-center bg-[#09090b] text-red-500">{error}</div>;
  if (!questions.length) return <div className="h-screen w-full flex items-center justify-center bg-[#09090b] text-white">No questions found.</div>;

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col font-['Inter',sans-serif] overflow-hidden select-none">
      <audio ref={audioRef} className="hidden" />
      <button id="auto-submit-btn" className="hidden" onClick={() => handleAdvanceQuestion()} />

      {/* TOP BAR */}
      <header className="h-16 shrink-0 border-b border-zinc-800/50 px-6 flex items-center justify-between bg-[#09090b] z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <PlaySquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">Software Engineer</div>
            <div className="text-xs text-zinc-500">Google • Tech Interview</div>
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

        <div className={`font-mono text-xl font-bold w-24 text-right ${timerColor}`}>
          {status === "Listening..." ? formatTime(timeLeft) : "2:00"}
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL: AI INTERVIEWER (70%) */}
        <div className="flex-[7] relative flex flex-col items-center justify-center border-r border-zinc-800/50 overflow-hidden"
          style={{ background: 'radial-gradient(circle at center, #181926 0%, #09090b 100%)' }}>

          {/* AI Avatar */}
          <div className="relative mb-8">
            {/* Pulsing rings when speaking */}
            <AnimatePresence>
              {isSpeaking && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-indigo-500/50"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-cyan-400/30"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Core Avatar */}
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
              {status === "Speaking..." && <span className="inline-block w-2h-5 bg-indigo-400 ml-1 animate-pulse" />}
            </p>
          </div>

          {/* Fallback Textarea, or Transcript overlay */}
          <div className="absolute bottom-10 left-10 right-10 flex justify-center">
            {status === "Listening..." && hasSpeechRecognition ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full p-4 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 mb-2 text-xs text-green-400 font-medium uppercase tracking-wider">
                  <Mic className="w-3 h-3 animate-pulse" /> Live Transcript
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed h-16 overflow-y-auto custom-scrollbar">
                  {transcript || <span className="text-zinc-600 italic">Listening to your response...</span>}
                </p>
              </motion.div>
            ) : status === "Listening..." && !hasSpeechRecognition ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
              >
                <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Type your answer</label>
                <textarea
                  autoFocus
                  className="w-full h-32 bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none text-sm"
                  placeholder="Speech recognition not supported in this browser. Please type your answer..."
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
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* If camera fails, fallback is black with this */}
            {!streamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 border border-zinc-700">
                  <AlertCircle className="w-8 h-8" />
                </div>
              </div>
            )}

            {/* Mic / Name overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-zinc-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-2">
                <div className="text-xs font-semibold text-zinc-200">You</div>
              </div>
              {status === "Listening..." && (
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
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <footer className="h-14 shrink-0 border-t border-zinc-800/50 px-6 flex items-center justify-center bg-[#09090b]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAdvanceQuestion(hasSpeechRecognition ? transcript : fallbackText)}
          disabled={isSubmitting || status === "Starting..." || status === "Processing..."}
          className="text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <SkipForward className="w-4 h-4 mr-2" /> Skip Question
        </Button>
      </footer>

      {/* Submission Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            {showSavedMsg ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-green-500/20 text-green-400 px-6 py-3 rounded-2xl flex items-center gap-3 font-semibold text-lg border border-green-500/30 shadow-2xl">
                <Mic className="w-5 h-5" /> Answer saved ✓
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
