"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Mic, Sparkles } from "lucide-react";
import Link from "next/link";
import CountUp from "react-countup";
import { SparkleBackground } from "./sparkle-background";

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingRef1 = useRef<HTMLDivElement>(null);
  const floatingRef2 = useRef<HTMLDivElement>(null);
  const floatingRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: 0.3,
      })
        .from(
          subtitleRef.current,
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          ctaRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.4"
        );

      // Floating animations for decorative elements
      gsap.to(floatingRef1.current, {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      gsap.to(floatingRef2.current, {
        y: -30,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 0.5,
      });

      gsap.to(floatingRef3.current, {
        y: -25,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: 1,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background with animated particles */}
      <SparkleBackground />

      {/* Floating Elements (behind content, above canvas) */}
      <div
        ref={floatingRef1}
        className="absolute top-1/4 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        ref={floatingRef2}
        className="absolute top-1/3 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        ref={floatingRef3}
        className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-primary/15 rounded-full blur-3xl pointer-events-none"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Interview Practice</span>
          </motion.div>

          <h1
            ref={titleRef}
            className="text-6xl md:text-7xl lg:text-[80px] font-bold leading-tight tracking-tight"
          >
            Prep Smarter, Get <span className="text-primary text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Hired</span> faster with AI
          </h1>

          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Experience realistic mock interviews tailored to your role. Get real-time data on your performance and refine your pitch until it&apos;s perfect.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-indigo-500/25 transition-all border-0" asChild>
              <Link href="/dashboard">
                <Mic className="w-5 h-5 mr-2" />
                Start Practicing
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all border-white/10" asChild>
              <Link href="/#features">
                Learn More
              </Link>
            </Button>
          </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16"
              >
                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold text-primary flex justify-center items-center">
                    <CountUp end={12400} duration={2.5} separator="," enableScrollSpy scrollSpyOnce />+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Interviews Conducted
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold text-primary flex justify-center items-center">
                    <CountUp end={94} duration={2} enableScrollSpy scrollSpyOnce />%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Success Rate
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold text-primary flex justify-center items-center">
                    <CountUp end={24} duration={2} enableScrollSpy scrollSpyOnce />/7
                  </div>
                  <div className="text-sm text-muted-foreground">
                    AI Availability
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-4xl font-bold text-primary flex justify-center items-center">
                    <CountUp end={4} decimals={1} duration={2} enableScrollSpy scrollSpyOnce />.9★
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Rating
                  </div>
                </div>
              </motion.div>
        </div>
      </div>
    </section>
  );
}