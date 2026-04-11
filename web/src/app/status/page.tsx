"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function StatusPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">System Status</h1>
            <p className="text-xl text-green-500 font-medium mb-12">
              All systems are fully operational.
            </p>

            <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden text-left">
              <div className="p-4 border-b border-white/5 font-semibold bg-white/5">
                Current Services
              </div>
              <div className="divide-y divide-white/5">
                {[
                  "Web Application",
                  "API endpoints",
                  "AI Interview Engine",
                  "Speech-to-Text Service",
                  "Database"
                ].map((service, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <span>{service}</span>
                    <span className="text-green-500 text-sm font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Operational
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
