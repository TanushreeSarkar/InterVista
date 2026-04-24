"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1E1E2E] transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                <Crown className="w-8 h-8 text-indigo-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 font-['DM_Sans',sans-serif]">
                Upgrade to Premium
              </h2>

              {feature && (
                <p className="text-zinc-400 mb-6">
                  <span className="text-indigo-400 font-semibold">{feature}</span>{" "}
                  is a Premium feature. Unlock it and much more.
                </p>
              )}

              {!feature && (
                <p className="text-zinc-400 mb-6">
                  Get unlimited interviews, detailed AI feedback, and more.
                </p>
              )}

              {/* Features list */}
              <div className="space-y-3 mb-8 text-left">
                {[
                  "Unlimited AI interviews",
                  "Per-question AI feedback & scoring",
                  "Detailed analytics & reports",
                  "Downloadable PDF reports",
                  "Custom question banks",
                  "Filler word tracking",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-zinc-300">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  onClose();
                  router.push("/pricing");
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Upgrade Now — ₹499/month
              </button>

              <p className="text-xs text-zinc-600 mt-3">
                Cancel anytime. No hidden fees.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
