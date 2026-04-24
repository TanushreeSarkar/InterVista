"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSubscription } from "@/contexts/subscription-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Crown, Check, Sparkles, Calendar, CreditCard, Shield } from "lucide-react";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/api";
import Link from "next/link";

declare global { interface Window { Razorpay: any; } }

export default function BillingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { plan, isPremium, status, refresh } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/sign-in");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  async function handleUpgrade() {
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
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
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

  const expiresAt = status?.expiresAt ? new Date(status.expiresAt) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] font-['Inter',sans-serif]">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen">
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Billing & Plans</h1>
          <p className="text-gray-500 dark:text-zinc-500 mb-8">Manage your subscription and billing details.</p>

          {/* Current Plan Card */}
          <div className={`rounded-2xl border p-6 mb-6 ${
            isPremium
              ? "bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/30"
              : "bg-white dark:bg-[#111118] border-gray-200 dark:border-[#1E1E2E]"
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isPremium && <Crown className="w-5 h-5 text-indigo-400" />}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isPremium ? "Premium Plan" : "Free Plan"}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  {isPremium ? "You have access to all premium features." : "Upgrade to unlock unlimited interviews and more."}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isPremium ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"
              }`}>
                {isPremium ? "Active" : "Free"}
              </span>
            </div>

            {isPremium && expiresAt && (
              <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Expires {expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${daysLeft <= 7 ? "text-amber-400" : "text-green-400"}`}>
                    {daysLeft} days remaining
                  </span>
                </div>
              </div>
            )}

            {!isPremium && (
              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                <span>{status?.sessionsUsed || 0} / {status?.sessionsLimit || 3} interviews used this month</span>
              </div>
            )}

            {!isPremium ? (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Upgrade to Premium — ₹499/month</>
                )}
              </button>
            ) : (
              <p className="text-xs text-zinc-600 text-center">
                Your subscription will auto-expire. Renew anytime from this page.
              </p>
            )}
          </div>

          {/* Premium Benefits */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#1E1E2E] bg-white dark:bg-[#111118] p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Premium Benefits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Unlimited AI interviews",
                "Per-question AI scoring",
                "Detailed analytics",
                "PDF report downloads",
                "Custom question banks",
                "Filler word tracking",
                "Confidence scoring",
                "Priority AI quality",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className={`w-4 h-4 flex-shrink-0 ${isPremium ? "text-green-500" : "text-zinc-600"}`} />
                  <span className={isPremium ? "text-zinc-300" : "text-zinc-500"}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-green-500/5 border border-green-500/20">
            <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">Secure Payments</p>
              <p className="text-xs text-zinc-500">All payments processed securely through Razorpay. PCI-DSS compliant. We never store your card details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
