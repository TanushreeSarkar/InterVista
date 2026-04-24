"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSubscriptionStatus, type SubscriptionStatus } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface SubscriptionContextType {
  plan: "free" | "premium";
  isPremium: boolean;
  isLoading: boolean;
  status: SubscriptionStatus | null;
  sessionsUsed: number;
  sessionsLimit: number;
  sessionsRemaining: number;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSubscriptionStatus();
      setStatus(data);
    } catch (err) {
      // If fetch fails, assume free plan
      setStatus({
        plan: "free",
        status: "active",
        expiresAt: null,
        sessionsUsed: 0,
        sessionsLimit: 3,
        razorpayKeyId: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchStatus();
    } else if (!authLoading && !isAuthenticated) {
      setStatus(null);
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchStatus]);

  const plan = status?.plan || "free";
  const isPremium = plan === "premium";
  const sessionsUsed = status?.sessionsUsed || 0;
  const sessionsLimit = status?.sessionsLimit || 3;
  const sessionsRemaining = sessionsLimit === -1 ? Infinity : Math.max(0, sessionsLimit - sessionsUsed);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        isPremium,
        isLoading,
        status,
        sessionsUsed,
        sessionsLimit,
        sessionsRemaining,
        refresh: fetchStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
