"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { signInWithEmail, signUpWithEmail, resetPasswordEmail, signOutClient, syncSessionWithBackend } from "@/lib/oauthHelpers";
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

  // Flag to prevent onAuthStateChanged from interfering during manual sign-in/sign-up flows.
  // When signIn/signUp is called, we set this to true so the listener skips its logic —
  // the manual flow already handles session sync and user state.
  const skipAuthStateChangeRef = useRef(false);

  // Use Firebase as the source of truth and only stop loading after the initial state is resolved.
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If a manual sign-in/sign-up is in progress, skip — it already handles everything.
      if (skipAuthStateChangeRef.current) {
        return;
      }

      try {
        if (firebaseUser) {
          try {
             // Check if backend session is already valid
             const userData = await api.getMe();
             setUser(userData);
          } catch {
             // Cookie missing/expired, so we use the Firebase token to recreate it
             const idToken = await firebaseUser.getIdToken(true);
             const providerId = firebaseUser.providerData[0]?.providerId === 'password' ? 'email' : 'google';
             
             const result = await syncSessionWithBackend(idToken, providerId);
             if (result.user) {
               setUser(result.user);
             } else {
               setUser(null);
             }
          }
        } else {
          // No Firebase user — just clear local state.
          // Don't call api.signOut() here: it requires auth (will 401) and is unnecessary
          // since there's no session to clear if there's no Firebase user.
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string, redirectTo: string = "/dashboard") => {
    // Prevent onAuthStateChanged from racing with this manual flow
    skipAuthStateChangeRef.current = true;
    try {
      const { user: userData } = await signInWithEmail(email, password);
      setUser(userData);
      router.push(redirectTo);
    } finally {
      // Re-enable the listener after a short delay to let navigation settle
      setTimeout(() => { skipAuthStateChangeRef.current = false; }, 2000);
    }
  }, [router]);

  const signUp = useCallback(async (name: string, email: string, password: string, redirectTo: string = "/onboarding") => {
    // Prevent onAuthStateChanged from racing with this manual flow
    skipAuthStateChangeRef.current = true;
    try {
      const { user: userData } = await signUpWithEmail(name, email, password);
      setUser(userData);
      router.push(redirectTo);
    } finally {
      setTimeout(() => { skipAuthStateChangeRef.current = false; }, 2000);
    }
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