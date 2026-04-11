"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { signInWithEmail, signUpWithEmail, resetPasswordEmail, signOutClient } from "@/lib/oauthHelpers";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, hydrate user from cookie-based session and keep sync with Firebase
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

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // If Firebase restores session but backend cookie is missing/expired, re-sync.
          try {
             await api.getMe();
          } catch {
             // Cookie missing, so let's re-verify to generate it
             const idToken = await firebaseUser.getIdToken();
             // Assuming oauthHelpers will fetch proper provider context via verify-firebase endpoint if needed, 
             // but we'll use a direct fetch here to re-hydrate properly.
             const providerId = firebaseUser.providerData[0]?.providerId === 'password' ? 'email' : 'google';
             const res = await fetch('/api/auth/verify-firebase', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ idToken, provider: providerId })
             });
             const json = await res.json();
             if (json.data && json.data.user) {
               setUser(json.data.user);
             }
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string, redirectTo: string = "/dashboard") => {
    const { user: userData } = await signInWithEmail(email, password);
    setUser(userData);
    router.push(redirectTo);
  }, [router]);

  const signUp = useCallback(async (name: string, email: string, password: string, redirectTo: string = "/onboarding") => {
    const { user: userData } = await signUpWithEmail(name, email, password);
    setUser(userData);
    router.push(redirectTo);
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
      await signOutClient();
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
    router.push("/sign-in");
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    await resetPasswordEmail(email);
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
        setUser,
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