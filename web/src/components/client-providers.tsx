"use client";

import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider } from "@/contexts/auth-context";
import { SpeechProvider } from "@/contexts/SpeechContext";

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
          {children}
        </SpeechProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
