"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Bot, X } from "lucide-react";

interface TranscriptMessage {
  speaker: string;
  text: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  transcript: TranscriptMessage[];
  onClose?: () => void;
}

export function TranscriptPanel({ transcript, onClose }: TranscriptPanelProps) {

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            Live Transcript
            <Badge variant="secondary" className="text-xs">
              Auto-transcribing
            </Badge>
          </h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {transcript.map((message, index) => {
            const isAI = message.speaker.toLowerCase().includes("ai") || message.speaker.toLowerCase().includes("interviewer");
            return (
              <div
                key={index}
                className={`flex items-start space-x-2 ${
                  !isAI ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isAI
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {isAI ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`flex-1 ${
                    !isAI ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      isAI
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}