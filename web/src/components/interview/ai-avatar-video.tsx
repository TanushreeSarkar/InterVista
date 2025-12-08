"use client";

import { motion } from "framer-motion";
import { User, Sparkles } from "lucide-react";

interface AIAvatarVideoProps {
  isActive: boolean;
}

export function AIAvatarVideo({ isActive }: AIAvatarVideoProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

      {/* Avatar Circle */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
          <User className="w-32 h-32 text-primary-foreground" />
        </div>

        {/* Pulse Rings */}
        {isActive && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full border-4 border-primary"
            />
            <motion.div
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
              className="absolute inset-0 rounded-full border-4 border-primary"
            />
          </>
        )}

        {/* AI Badge */}
        <div className="absolute -top-2 -right-2 bg-background border-2 border-primary rounded-full p-2">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
      </motion.div>

      {/* Name Label */}
      <div className="absolute bottom-8 bg-background/95 backdrop-blur px-6 py-3 rounded-full border border-border">
        <p className="text-sm font-medium">AI Interviewer</p>
      </div>
    </div>
  );
}