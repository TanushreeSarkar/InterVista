import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "InterVista - AI-Powered Mock Interviews",
  description: "The ultimate audio-first mock interview platform powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ClientProviders>
          <SmoothScroll>{children}</SmoothScroll>
        </ClientProviders>
      </body>
    </html>
  );
}
