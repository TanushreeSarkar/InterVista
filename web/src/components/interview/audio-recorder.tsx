"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
import { WaveformVisualizer } from "./waveform-visualizer";
import { submitAnswer } from "@/lib/api";
import { useSpeech } from "@/contexts/SpeechContext";

interface AudioRecorderProps {
  questionId: string;
  sessionId: string;
  onRecordingComplete: (questionId: string, audioBlob: Blob) => void;
  hasRecording: boolean;
}

export function AudioRecorder({
  questionId,
  sessionId,
  onRecordingComplete,
  hasRecording,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const {
    startListening,
    stopListening,
    resetTranscript,
    transcript,
    isListening: isListeningSpeech,
  } = useSpeech();

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        stopListening(); // Stop STT
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      resetTranscript(); // Clear previous transcript
      startListening(); // Start STT

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check your permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startListening(); // Resume STT
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        stopListening(); // Pause STT
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  }

  function playRecording() {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }

  function deleteRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    resetTranscript();
  }

  async function handleSubmit() {
    if (!audioBlob) return;

    try {
      setIsSubmitting(true);
      await submitAnswer({
        sessionId,
        questionId,
        audioBlob,
        transcript, // Send transcript
      });
      onRecordingComplete(questionId, audioBlob);
      resetTranscript();
    } catch (error) {
      console.error("Failed to submit answer:", error);
      // For demo, just mark as complete
      onRecordingComplete(questionId, audioBlob);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2" />
                  Recording
                </Badge>
              )}
              {audioBlob && !isRecording && (
                <Badge variant="secondary">
                  <Check className="w-3 h-3 mr-1" />
                  Recorded
                </Badge>
              )}
            </div>
            {(isRecording || audioBlob) && (
              <div className="text-2xl font-mono font-bold">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Waveform Visualizer */}
          <div className="relative h-32 bg-muted/30 rounded-lg overflow-hidden">
            {isRecording && streamRef.current && (
              <WaveformVisualizer stream={streamRef.current} isActive={!isPaused} />
            )}
            {!isRecording && !audioBlob && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Mic className="w-12 h-12 opacity-20" />
              </div>
            )}
            {audioBlob && !isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Click play to review your answer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <AnimatePresence mode="wait">
              {!isRecording && !audioBlob && (
                <motion.div
                  key="start"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16"
                    onClick={startRecording}
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}

              {isRecording && (
                <motion.div
                  key="recording"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center space-x-4"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full w-12 h-12"
                    onClick={pauseRecording}
                  >
                    {isPaused ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Pause className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full w-16 h-16"
                    onClick={stopRecording}
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}

              {audioBlob && !isRecording && (
                <motion.div
                  key="playback"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center space-x-4"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full w-12 h-12"
                    onClick={deleteRecording}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full w-16 h-16"
                    onClick={playRecording}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-full px-8"
                    onClick={handleSubmit}
                    disabled={isSubmitting || hasRecording}
                  >
                    {hasRecording ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Submitted
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hidden audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}