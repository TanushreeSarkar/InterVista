"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Volume2,
  VolumeX,
  Maximize2,
  User,
} from "lucide-react";
import { submitAnswer } from "@/lib/api";

interface VideoCallInterfaceProps {
  sessionId: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onEndInterview: () => void;
}

export function VideoCallInterface({
  sessionId,
  question,
  questionNumber,
  totalQuestions,
  onNextQuestion,
  onEndInterview,
}: VideoCallInterfaceProps) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleSubmitAnswer(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsMicOn(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start monitoring audio levels and silence
      monitorAudioLevels();
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check your permissions.");
    }
  }

  function monitorAudioLevels() {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudio = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);

      // Silence detection (threshold: 5)
      if (average < 5) {
        setSilenceTimer((prev) => {
          const newValue = prev + 0.1;
          
          // Auto-advance after 6 seconds of silence
          if (newValue >= 6) {
            stopRecording();
            return 0;
          }
          return newValue;
        });
      } else {
        setSilenceTimer(0);
      }

      requestAnimationFrame(checkAudio);
    };

    checkAudio();
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsMicOn(false);
      setSilenceTimer(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }

  async function handleSubmitAnswer(audioBlob: Blob) {
    try {
      await submitAnswer({
        sessionId,
        questionId: `q${questionNumber}`,
        audioBlob,
      });
      
      // Wait a moment then move to next question
      setTimeout(() => {
        if (questionNumber < totalQuestions) {
          onNextQuestion();
        } else {
          onEndInterview();
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      // Still advance even if submission fails
      setTimeout(() => {
        if (questionNumber < totalQuestions) {
          onNextQuestion();
        } else {
          onEndInterview();
        }
      }, 1000);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={isRecording ? "destructive" : "secondary"} className={isRecording ? "animate-pulse" : ""}>
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full mr-2" />
                  Recording
                </>
              ) : (
                "Ready"
              )}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </div>
            {isRecording && (
              <div className="text-sm font-mono">{formatTime(recordingTime)}</div>
            )}
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="w-48" />
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Interviewer - Large */}
        <div className="lg:col-span-2">
          <Card className="h-full bg-black overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isSpeakerOn ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
              >
                <User className="w-24 h-24 text-white" />
              </motion.div>
            </div>
            
            {/* AI Label */}
            <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white font-medium">AI Interviewer</span>
            </div>

            {/* Audio Indicator */}
            {isSpeakerOn && (
              <div className="absolute top-6 right-6">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Volume2 className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            )}
          </Card>
        </div>

        {/* User Video - Small */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-muted overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideoOn ? (
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 flex items-center justify-center mb-4 mx-auto">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Camera Preview</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                  <p className="text-sm text-muted-foreground">Camera Off</p>
                </div>
              )}
            </div>

            {/* User Label */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2">
              <span className="text-white text-sm">You</span>
              {isMicOn ? (
                <Mic className="w-3 h-3 text-green-500" />
              ) : (
                <MicOff className="w-3 h-3 text-red-500" />
              )}
            </div>

            {/* Audio Level Indicator */}
            {isRecording && audioLevel > 0 && (
              <div className="absolute top-4 left-4 right-4">
                <div className="h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Question Display */}
      <div className="bg-card border-t border-border p-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-center">{question}</h3>
            
            {isRecording && silenceTimer > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Silence detected: {Math.floor(silenceTimer)}s / 6s
                </p>
                <Progress value={(silenceTimer / 6) * 100} className="w-64 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-card border-t border-border p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center space-x-4">
            <Button
              size="lg"
              variant={isMicOn ? "secondary" : "destructive"}
              className="rounded-full w-14 h-14"
              onClick={() => {
                if (!isRecording) {
                  startRecording();
                } else {
                  stopRecording();
                }
              }}
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              variant={isVideoOn ? "secondary" : "outline"}
              className="rounded-full w-14 h-14"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              variant={isSpeakerOn ? "secondary" : "outline"}
              className="rounded-full w-14 h-14"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-14 h-14"
              onClick={onEndInterview}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            {!isRecording ? (
              <p>Click the microphone to start answering</p>
            ) : (
              <p>Speak your answer. Interview will auto-advance after 6 seconds of silence.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}