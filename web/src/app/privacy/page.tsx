"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: April 2024</p>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
                <p>Welcome to InterVista. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">2. Data We Collect</h2>
                <p>We may collect, use, store and transfer different kinds of personal data about you, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Identity Data: First name, last name, username.</li>
                  <li>Contact Data: Email address.</li>
                  <li>Audio Data: Voice recordings during practice sessions (processed securely and temporarily).</li>
                  <li>Usage Data: Information about how you use our website and services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Data</h2>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide our AI interview services, improve our models, and manage your account.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">4. Data Security</h2>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.</p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
