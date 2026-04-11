"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";

export default function CookiesPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Cookie Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: April 2024</p>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground">1. What Are Cookies</h2>
                <p>Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">2. How InterVista Uses Cookies</h2>
                <p>When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To enable certain functions of the Service (e.g., maintaining your logged-in session).</li>
                  <li>To provide analytics and understand how users interact with our platform.</li>
                  <li>To store your preferences (e.g., dark mode vs light mode).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">3. Essential vs Non-Essential Cookies</h2>
                <p>We use both session and persistent cookies on the Service. We use essential cookies to authenticate users and prevent fraudulent use of user accounts. Non-essential cookies help us improve our service through analytics.</p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
