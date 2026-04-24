"use client";

import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider } from "@/contexts/auth-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
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
        <SubscriptionProvider>
          <SpeechProvider>
            <InterviewProvider>
              {children}
            </InterviewProvider>
          </SpeechProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
