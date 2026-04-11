"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";

export default function TermsPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: April 2024</p>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
                <p>By accessing and using InterVista, you accept and agree to be bound by the terms and provision of this agreement.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">2. Description of Service</h2>
                <p>InterVista provides an AI-powered interview preparation platform. You are responsible for obtaining access to the Service, and that access may involve third-party fees (such as Internet service provider or airtime charges).</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">3. User Conduct</h2>
                <p>You agree to not use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload, post, transmit or otherwise make available any content that is unlawful, harmful, threatening, or abusive.</li>
                  <li>Impersonate any person or entity.</li>
                  <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground">4. Modifications to Service</h2>
                <p>InterVista reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
