"use client";

import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider } from "@/contexts/auth-context";
import { SpeechProvider } from "@/contexts/SpeechContext";
import { InterviewProvider } from "@/contexts/InterviewContext";

export function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SpeechProvider>
          <InterviewProvider>
            {children}
          </InterviewProvider>
        </SpeechProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
