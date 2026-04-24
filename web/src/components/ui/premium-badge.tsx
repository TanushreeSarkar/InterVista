"use client";

import { Lock, Sparkles } from "lucide-react";

/**
 * Small "PRO" badge to indicate premium features.
 */
export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 ${className}`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      PRO
    </span>
  );
}

/**
 * Lock overlay for premium features shown to free users.
 * Wrap the premium content with this component.
 */
export function PremiumLock({
  children,
  locked,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  locked: boolean;
  onClick?: () => void;
  className?: string;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Blurred content */}
      <div className="opacity-50 pointer-events-none select-none blur-[1px]">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-xl backdrop-blur-[2px] transition-all group-hover:bg-black/40">
        <div className="w-10 h-10 rounded-full bg-[#1A1A24] border border-[#2E2E3E] flex items-center justify-center mb-2 group-hover:border-indigo-500/50 transition-colors">
          <Lock className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
        </div>
        <span className="text-xs font-semibold text-zinc-400 group-hover:text-indigo-300 transition-colors">
          Premium Feature
        </span>
      </div>
    </div>
  );
}
