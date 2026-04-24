"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, X, Zap, Crown, Sparkles, Mic, ChevronDown } from "lucide-react";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/contexts/subscription-context";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import { useRouter } from "next/navigation";

// Razorpay type
declare global { interface Window { Razorpay: any; } }

const FREE_FEATURES = [
  { text: "3 interviews per month", included: true },
  { text: "Basic AI feedback", included: true },
  { text: "Standard question bank", included: true },
  { text: "Score overview", included: true },
  { text: "Unlimited interviews", included: false },
  { text: "Per-question AI scoring", included: false },
  { text: "Detailed analytics", included: false },
  { text: "PDF reports", included: false },
  { text: "Custom question banks", included: false },
  { text: "Filler word tracking", included: false },
];

const PREMIUM_FEATURES = [
  { text: "Unlimited AI interviews", included: true },
  { text: "Per-question AI feedback & scoring", included: true },
  { text: "Detailed analytics dashboard", included: true },
  { text: "Downloadable PDF reports", included: true },
  { text: "Custom question banks", included: true },
  { text: "Filler word detection", included: true },
  { text: "Confidence & communication scoring", included: true },
  { text: "Interview history & reports", included: true },
  { text: "Custom roles & difficulty", included: true },
  { text: "Priority AI response quality", included: true },
];

const DEMO_SCORES = [
  { label: "Communication", score: 88, color: "from-green-500 to-emerald-400" },
  { label: "Technical", score: 76, color: "from-blue-500 to-cyan-400" },
  { label: "Problem Solving", score: 92, color: "from-purple-500 to-indigo-400" },
  { label: "Confidence", score: 81, color: "from-amber-500 to-yellow-400" },
];

const FILLER_WORDS_DEMO = [
  { word: "um", count: 3, severity: "low" },
  { word: "like", count: 7, severity: "high" },
  { word: "you know", count: 2, severity: "low" },
  { word: "basically", count: 5, severity: "medium" },
];

const FAQS = [
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your Premium subscription at any time. You'll continue to have access until the end of your billing period." },
  { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway." },
  { q: "What happens when my subscription expires?", a: "You'll automatically be moved to the Free plan. Your interview history is preserved, but you'll be limited to 3 interviews per month." },
  { q: "Is my payment information secure?", a: "Absolutely. All payments are processed through Razorpay's PCI-DSS compliant gateway. We never store your card details." },
];

function AnimatedScore({ score, delay = 0 }: { score: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const start = 0;
      const duration = 1200;
      const startTime = performance.now();
      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.floor(start + (score - start) * ease));
        if (progress < 1) requestAnimationFrame(animate);
        else setDisplay(score);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, score, delay]);

  return <span ref={ref}>{display}</span>;
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { isPremium, refresh } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const demoRef = useRef(null);
  const demoInView = useInView(demoRef, { once: true, margin: "-50px" });

  // Load Razorpay script
  useEffect(() => {
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  async function handleUpgrade() {
    if (!isAuthenticated) { router.push("/sign-in?redirect=/pricing"); return; }
    if (isPremium) return;

    setLoading(true);
    try {
      const order = await createRazorpayOrder();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "InterVista",
        description: "Premium Subscription — 30 days",
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refresh();
            router.push("/dashboard?upgraded=true");
          } catch { alert("Payment verification failed. Please contact support."); }
        },
        prefill: { email: user?.email || "" },
        theme: { color: "#6366F1" },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-zinc-100 font-['Inter',sans-serif]">
      <EnhancedNavbar />

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#6366F1_0%,_transparent_50%)] opacity-10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">Premium Interview Preparation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-['DM_Sans',sans-serif] tracking-tight">
              Unlock Your Full{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Interview Potential
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
              AI-powered mock interviews with real-time scoring, filler word tracking, and detailed per-question coaching.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE DEMO STRIP ─── */}
      <section ref={demoRef} className="py-16 border-y border-[#1E1E2E] bg-[#0D0D14]">
        <div className="container mx-auto px-4">
          <motion.h2 initial={{ opacity: 0 }} animate={demoInView ? { opacity: 1 } : {}} className="text-center text-2xl font-bold mb-12 text-zinc-300">
            See What Premium Unlocks
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Score Cards */}
            {DEMO_SCORES.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={demoInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
                className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-zinc-400">{s.label}</span>
                  <span className="text-2xl font-bold text-white"><AnimatedScore score={s.score} delay={i * 200} /></span>
                </div>
                <div className="h-2 bg-[#1A1A24] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={demoInView ? { width: `${s.score}%` } : {}} transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                    className={`h-full rounded-full bg-gradient-to-r ${s.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filler Word Demo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={demoInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto mt-8 bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-zinc-300">Filler Word Detection</span>
              <PremiumBadgeInline />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FILLER_WORDS_DEMO.map((fw, i) => (
                <motion.div key={fw.word} initial={{ opacity: 0, scale: 0.8 }} animate={demoInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.8 + i * 0.1 }}
                  className={`px-3 py-2 rounded-lg border text-center ${fw.severity === "high" ? "border-red-500/30 bg-red-500/5" : fw.severity === "medium" ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-700 bg-zinc-800/50"}`}>
                  <div className="text-sm font-mono font-semibold text-zinc-200">&quot;{fw.word}&quot;</div>
                  <div className={`text-xs mt-1 ${fw.severity === "high" ? "text-red-400" : fw.severity === "medium" ? "text-amber-400" : "text-zinc-500"}`}>
                    {fw.count}× detected
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PLAN CARDS ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-zinc-200 mb-1">Free</h3>
                <p className="text-sm text-zinc-500">Get started with the basics</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">₹0</span>
                <span className="text-zinc-500 ml-1">/month</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={f.included ? "text-zinc-300" : "text-zinc-600"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isAuthenticated ? router.push("/sign-up") : router.push("/dashboard")}
                className="w-full py-3 rounded-xl border border-[#2E2E3E] text-zinc-300 font-semibold hover:bg-[#1A1A24] transition-colors"
              >
                {isAuthenticated ? "Current Plan" : "Get Started Free"}
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative bg-[#111118] border-2 border-indigo-500/50 rounded-2xl p-8 flex flex-col shadow-[0_0_60px_rgba(99,102,241,0.1)]">
              {/* Popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Crown className="w-3 h-3" /> MOST POPULAR
                </div>
              </div>
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

              <div className="mb-6 relative">
                <h3 className="text-xl font-bold text-white mb-1">Premium</h3>
                <p className="text-sm text-indigo-300">Everything you need to ace interviews</p>
              </div>
              <div className="mb-8 relative">
                <span className="text-5xl font-bold text-white">₹499</span>
                <span className="text-zinc-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8 relative">
                {PREMIUM_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-200">{f.text}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={loading || isPremium}
                className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPremium ? (
                  <>✓ You&apos;re Premium</>
                ) : loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Upgrade Now</>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 border-t border-[#1E1E2E]">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-12 font-['DM_Sans',sans-serif]">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#151520] transition-colors">
                  <span className="font-medium text-zinc-200">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PremiumBadgeInline() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
      <Sparkles className="w-2.5 h-2.5" /> PRO
    </span>
  );
}