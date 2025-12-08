"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  animated?: boolean;
}

export function Logo({ size = "md", showText = true, animated = true }: LogoProps) {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-lg", container: "w-8 h-8" },
    md: { icon: "w-10 h-10", text: "text-xl", container: "w-10 h-10" },
    lg: { icon: "w-16 h-16", text: "text-3xl", container: "w-16 h-16" },
  };

  const LogoIcon = animated ? motion.div : "div";
  const iconProps = animated
    ? {
        whileHover: { scale: 1.05, rotate: 5 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <div className="flex items-center space-x-3">
      <LogoIcon {...iconProps} className="relative">
        <div
          className={`${sizes[size].container} bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Mic className={`${sizes[size].icon} text-white`} />
        </div>
        {animated && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </LogoIcon>
      {showText && (
        <div>
          <span
            className={`${sizes[size].text} font-bold text-gradient`}
          >
            InterVista
          </span>
          <div className="text-[10px] text-muted-foreground -mt-1">
            AI Interview Coach
          </div>
        </div>
      )}
    </div>
  );
}