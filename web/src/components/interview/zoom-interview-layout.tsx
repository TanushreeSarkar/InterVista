"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIAvatarVideo } from "./ai-avatar-video";
import { ControlBar } from "./control-bar";
import { TranscriptPanel } from "./transcript-panel";
import { ConnectionIndicator } from "./connection-indicator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";

interface ZoomInterviewLayoutProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  onEndInterview: () => void;
}

export function ZoomInterviewLayout({
  question,
  questionNumber,
  totalQuestions,
  onEndInterview,
}: ZoomInterviewLayoutProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; timestamp: string }>>([
    {
      speaker: "AI Interviewer",
      text: question,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              Recording
            </Badge>
            <div className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </div>
          </div>
          <ConnectionIndicator quality="excellent" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Interviewer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Card className="h-full overflow-hidden bg-black">
              <AIAvatarVideo isActive={true} />
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">AI Interviewer</span>
              </div>
            </Card>
          </motion.div>

          {/* User Video (Self View) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <Card className="h-full overflow-hidden bg-muted flex items-center justify-center">
              {isVideoOn ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-4xl text-white font-bold">You</span>
                  </div>
                  <p className="text-muted-foreground">Camera is on</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-muted-foreground/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-4xl text-muted-foreground font-bold">You</span>
                  </div>
                  <p className="text-muted-foreground">Camera is off</p>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2">
                <span className="text-white text-sm font-medium">You</span>
                {isMicOn ? (
                  <Mic className="w-4 h-4 text-green-500" />
                ) : (
                  <MicOff className="w-4 h-4 text-red-500" />
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Transcript Panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-96 border-l border-border"
            >
              <TranscriptPanel
                transcript={transcript}
                onClose={() => setShowTranscript(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question Display */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border-t border-border p-6 mb-20"
      >
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">{question}</h3>
            <p className="text-muted-foreground">
              Take your time to think and provide a comprehensive answer
            </p>
          </div>
        </div>
      </motion.div>

      {/* Control Bar */}
      <ControlBar
        isMicOn={isMicOn}
        isVideoOn={isVideoOn}
        onToggleMic={() => setIsMicOn(!isMicOn)}
        onToggleVideo={() => setIsVideoOn(!isVideoOn)}
        onEndInterview={onEndInterview}
        onToggleTranscript={() => setShowTranscript(!showTranscript)}
      />
    </div>
  );
}