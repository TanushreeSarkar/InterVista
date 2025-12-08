"use client";

import { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { Mic, Brain, BarChart3, Clock, Target, Zap } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-First Experience",
    description: "Natural audio-based interviews that simulate real conversations with hiring managers.",
  },
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    description: "Get intelligent, personalized feedback on your answers, communication style, and delivery.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track your progress with comprehensive metrics and performance insights over time.",
  },
  {
    icon: Clock,
    title: "Practice Anytime",
    description: "24/7 availability means you can practice whenever it fits your schedule.",
  },
  {
    icon: Target,
    title: "Role-Specific Questions",
    description: "Tailored questions for your target role, industry, and experience level.",
  },
  {
    icon: Zap,
    title: "Instant Evaluation",
    description: "Real-time scoring and feedback streamed as you complete your interview.",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 bg-muted/50"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you prepare for any interview scenario
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}