import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, animated = false, className }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  const textClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <div className={cn(
        "text-indigo-600 dark:text-[#6366F1]", 
        sizeClasses[size],
        animated && "transition-transform hover:scale-105"
      )}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
          <path d="M10 5L8 3"/>
          <path d="M14 5l2-2"/>
          <path d="m3 9 2-2"/>
          <path d="m21 9-2-2"/>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-['DM_Sans',sans-serif] font-bold text-gray-900 dark:text-[#F4F4F5]", textClasses[size])}>
          InterVista
        </span>
      )}
    </div>
  );
}
