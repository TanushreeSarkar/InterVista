"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Mic, Brain, TrendingUp, Settings, FileText, Target } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Create Your Profile",
    description: "Sign up and tell us about your target role, industry, and experience level.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Settings,
    title: "2. Select Interview Type",
    description: "Choose between Technical, Behavioral, Case Study, or Full Loop formats.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Mic,
    title: "3. Start Your Session",
    description: "Our voice-first AI interviewer begins the conversation naturally.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Target,
    title: "4. Answer in Real Time",
    description: "Speak naturally; the AI listens, understands context, and engages with follow-ups.",
    color: "from-pink-500 to-purple-500",
  },
  {
    icon: Brain,
    title: "5. Get Instant Feedback",
    description: "Receive a detailed breakdown and specific improvement tips right after.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: FileText,
    title: "6. Review Full Report",
    description: "Access transcripts, audio playbacks, and rubric-based scoring.",
    color: "from-orange-500 to-rose-500",
  },
  {
    icon: TrendingUp,
    title: "7. Track Your Progress",
    description: "Monitor improvement trends and detect weak areas over time.",
    color: "from-amber-500 to-orange-500",
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const spineHeight = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="py-24 bg-background relative overflow-hidden"
    >
      {/* Background Glows for Premium Effect */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-32"
        >
          <div className="inline-flex items-center justify-center p-2 mb-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium tracking-wide uppercase text-sm">
              The Process
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Get started in minutes and begin your journey to interview success with our AI-powered platform.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Center Spine Line (Desktop) with Glow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-white/5 hidden md:block rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-purple-500 to-rose-500 origin-top shadow-[0_0_20px_rgba(168,85,247,0.8)]"
              style={{ scaleY: spineHeight }}
            />
          </div>

          {/* Vertical Left Spine Line (Mobile) with Glow */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-white/5 md:hidden rounded-full overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-purple-500 to-rose-500 origin-top shadow-[0_0_20px_rgba(168,85,247,0.8)]"
              style={{ scaleY: spineHeight }}
            />
          </div>

          <div className="space-y-16 md:space-y-32 py-10">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 50 }}
                  className={`relative flex items-center ${isEven ? 'md:justify-start' : 'md:justify-end'} justify-end group`}
                >
                  {/* Glowing Node on the spine (Desktop) */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-background border border-white/10 items-center justify-center z-20 shadow-2xl transition-all duration-500 group-hover:scale-125 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                    <motion.div 
                      className={`w-full h-full rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-inner`}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, margin: "-150px" }}
                      transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                    >
                      <step.icon className="w-6 h-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Node on the spine (Mobile) */}
                  <div className="md:hidden absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-white/10 flex items-center justify-center z-20 shadow-lg">
                    <motion.div 
                      className={`w-full h-full rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    >
                      <step.icon className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Content Card with Glassmorphism & Hover Triggers */}
                  <div className={`w-[calc(100%-5rem)] md:w-[calc(50%-4rem)] ${isEven ? 'md:pr-10' : 'md:pl-10'}`}>
                    <div className="relative p-[1px] rounded-3xl overflow-hidden bg-gradient-to-b from-white/10 to-transparent hover:from-white/20 transition-all duration-500">
                      <Card className="h-full text-left bg-card/40 backdrop-blur-xl border-none relative overflow-hidden rounded-[calc(1.5rem-1px)] transition-all duration-500 hover:bg-card/60">
                        {/* Inner subtle gradient hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${step.color} transition-opacity duration-700 pointer-events-none`} />
                        
                        <CardHeader className="p-8 relative z-10">
                          <div className="md:hidden flex mb-6">
                            <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/50`}>
                              <step.icon className="w-7 h-7 text-white" />
                            </div>
                          </div>
                          <span className={`inline-block px-3 py-1 mb-4 rounded-full text-xs font-semibold tracking-wider uppercase bg-gradient-to-r ${step.color} text-transparent bg-clip-text border border-white/10`}>
                            Step 0{index + 1}
                          </span>
                          <CardTitle className="text-2xl md:text-3xl mb-4 font-semibold text-white tracking-tight">
                            {step.title.split('. ')[1] || step.title}
                          </CardTitle>
                          <CardDescription className="text-lg text-muted-foreground leading-relaxed">
                            {step.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}