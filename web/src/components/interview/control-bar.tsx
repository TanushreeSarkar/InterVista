"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  PhoneOff,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ControlBarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndInterview: () => void;
  onToggleTranscript: () => void;
}

export function ControlBar({
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  onEndInterview,
  onToggleTranscript,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-50"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Left Section - Info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <div className="font-medium">AI Interview Session</div>
              <div className="text-xs">Recording in progress</div>
            </div>
          </div>

          {/* Center Section - Main Controls */}
          <div className="flex items-center space-x-2">
            <Button
              size="lg"
              variant={isMicOn ? "secondary" : "destructive"}
              className="rounded-full w-14 h-14"
              onClick={onToggleMic}
            >
              {isMicOn ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant={isVideoOn ? "secondary" : "destructive"}
              className="rounded-full w-14 h-14"
              onClick={onToggleVideo}
            >
              {isVideoOn ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-14 h-14"
              onClick={onToggleTranscript}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="rounded-full w-14 h-14"
            >
              <Settings className="w-6 h-6" />
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

          {/* Right Section - More Options */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Full Screen</DropdownMenuItem>
                <DropdownMenuItem>Speaker Settings</DropdownMenuItem>
                <DropdownMenuItem>Report Issue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}