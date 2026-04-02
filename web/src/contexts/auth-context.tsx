"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, hydrate user from cookie-based session
  useEffect(() => {
    async function hydrate() {
      try {
        // Cookie sent automatically with credentials: 'include'
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        // No valid session — user needs to sign in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    hydrate();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: userData } = await api.signIn(email, password);
    setUser(userData);
    router.push("/dashboard");
  }, [router]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { user: userData } = await api.signUp(name, email, password);
    setUser(userData);
    router.push("/dashboard");
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
    router.push("/sign-in");
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    await api.resetPassword(email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}