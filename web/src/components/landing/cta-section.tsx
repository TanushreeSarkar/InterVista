"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Zap, BrainCircuit } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -45]);

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden bg-background">
      {/* Background Grid with Perspective */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      {/* Dynamic Floating Elements */}
      <motion.div 
        style={{ y: y1, rotate: rotate1 }} 
        className="absolute top-20 left-[10%] w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full pointer-events-none" 
      />
      <motion.div 
        style={{ y: y2, rotate: rotate2 }} 
        className="absolute bottom-20 right-[10%] w-48 h-48 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-3xl rounded-full pointer-events-none" 
      />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#111118]/80 backdrop-blur-2xl p-10 md:p-20 text-center shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden group"
        >
          {/* Inner animated glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent rotate-45 group-hover:rotate-[225deg] transition-transform duration-[3000ms] ease-in-out pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 mb-8 shadow-xl shadow-indigo-500/25"
            >
              <div className="w-full h-full bg-[#111118] rounded-[15px] flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-indigo-400" />
              </div>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-gradient-to-br from-white via-white to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
              Ready to Ace Your Interview?
            </h2>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed font-light">
              Join thousands of successful candidates who transformed their interview anxiety into unshakeable confidence. Your dream job is one practice session away.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] font-semibold border-0"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Start Practicing Free
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur transition-all"
                  asChild
                >
                  <Link href="/pricing" className="flex items-center justify-center gap-2">
                    View Pricing
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500 font-medium">
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500/80" /> No credit card required</span>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  );
}