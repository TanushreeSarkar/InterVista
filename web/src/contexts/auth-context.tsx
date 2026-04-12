"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { signInWithEmail, signUpWithEmail, resetPasswordEmail, signOutClient, syncSessionWithBackend } from "@/lib/oauthHelpers";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
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
             const providerId = firebaseUser.providerData[0]?.providerId === 'password' ? 'email' : 'google';
             
             // Fixed: Use syncSessionWithBackend instead of direct fetch to handle API_BASE_URL and credentials
             const result = await syncSessionWithBackend(idToken, providerId);
             if (result.user) {
               setUser(result.user);
             }
          }
        }
      });

      // Handle Redirect Result (for Google/GitHub sign-in)
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const idToken = await result.user.getIdToken();
          // Normalize provider ID for backend (google.com -> google, github.com -> github)
          const firebaseProvider = result.user.providerData[0]?.providerId;
          const providerId = firebaseProvider === 'google.com' ? 'google' : 'github';
          
          const { user: userData } = await syncSessionWithBackend(idToken, providerId);
          setUser(userData);
          router.push("/dashboard");
        }
      }).catch((error) => {
        console.error("Redirect sign-in error:", error);
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