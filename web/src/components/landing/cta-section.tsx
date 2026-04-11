"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-primary via-primary/90 to-blue-600 rounded-3xl p-12 md:p-16 text-center text-primary-foreground shadow-2xl overflow-hidden group"
        >
          {/* Subtle animated background overlay */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <motion.div 
            className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-3xl rounded-full pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/20 blur-3xl rounded-full pointer-events-none"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of successful candidates who improved their interview
            skills with InterVista. Start practicing today!
          </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              asChild
            >
              <Link href="/dashboard">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}