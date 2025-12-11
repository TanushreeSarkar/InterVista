"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TranscriptMessage } from "@/components/interview/transcript-panel";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Settings,
  MessageSquare,
  Users,
  MoreVertical,
  Maximize,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AIAvatarVideo } from "@/components/interview/ai-avatar-video";
import { TranscriptPanel } from "@/components/interview/transcript-panel";
import { ConnectionIndicator } from "@/components/interview/connection-indicator";

interface ZoomStyleInterviewProps {
  sessionId: string;
  questionText: string;
  onEndInterview: () => void;
}

export function ZoomStyleInterview({
  sessionId,
  questionText,
  onEndInterview,
}: ZoomStyleInterviewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor"
  >("excellent");

  // transcript state is an array of messages (matches TranscriptPanel prop)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Interview
          </Badge>
          <ConnectionIndicator quality={connectionQuality} />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Session: {sessionId}</span>
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black/5">
          {/* AI Interviewer Video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AIAvatarVideo isActive={!isMuted} />
          </div>

          {/* Question Overlay */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4"
          >
            <Card className="p-6 bg-background/95 backdrop-blur">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Current Question:</h3>
                  <p className="text-foreground">{questionText}</p>
                </div>
                <Badge variant={isRecording ? "destructive" : "secondary"}>
                  {isRecording ? `Recording ${formatTime(recordingTime)}` : "Ready"}
                </Badge>
              </div>
            </Card>
          </motion.div>

          {/* Self View (Picture-in-Picture) */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute bottom-20 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-primary shadow-lg cursor-move"
          >
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {isVideoOn ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">You</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="w-8 h-8 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-xs text-muted-foreground">Camera Off</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recording Indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-4 right-4"
              >
                <div className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcript Panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border bg-card"
            >
              <TranscriptPanel transcript={transcript} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="h-20 border-t border-border bg-card/50 backdrop-blur flex items-center justify-between px-8">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {formatTime(recordingTime)}
          </span>
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={onEndInterview}
          >
            <Phone className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
        </div>
      </div>
    </div>
  );
}
