"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About InterVista</h1>
            <p className="text-xl text-muted-foreground">
              We are on a mission to democratize interview preparation and help candidates put their best foot forward.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-12"
          >
            <section>
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80">
                <p>
                  InterVista was founded with a simple observation: technical skills alone aren&apos;t enough to land a great job. Communication, confidence, and articulation play a massive role, yet there were few tools available to practice these specifically.
                </p>
                <p>
                  We built InterVista to provide a realistic, stress-free environment where candidates can practice with an AI interviewer that understands context, asks follow-up questions, and provides actionable feedback.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-8">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Empowerment", desc: "We believe everyone deserves the tools to succeed." },
                  { title: "Continuous Learning", desc: "Feedback is the breakfast of champions." },
                  { title: "Accessibility", desc: "High-quality interview prep shouldn't be a luxury." },
                  { title: "Innovation", desc: "Always pushing the boundaries of what AI can do for education." }
                ].map((value, i) => (
                  <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/5 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="pt-6 relative z-10">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{value.title}</h3>
                      <p className="text-muted-foreground">{value.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}