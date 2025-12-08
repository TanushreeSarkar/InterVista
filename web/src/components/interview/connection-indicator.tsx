"use client";

import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionIndicatorProps {
  quality: "excellent" | "good" | "poor";
}

export function ConnectionIndicator({ quality }: ConnectionIndicatorProps) {
  const getColor = () => {
    switch (quality) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
    }
  };

  const getLabel = () => {
    switch (quality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "poor":
        return "Poor";
    }
  };

  return (
    <Badge variant="outline" className="gap-2">
      {quality === "poor" ? (
        <WifiOff className={`w-3 h-3 ${getColor()}`} />
      ) : (
        <Wifi className={`w-3 h-3 ${getColor()}`} />
      )}
      <span className="text-xs">{getLabel()} Connection</span>
    </Badge>
  );
}