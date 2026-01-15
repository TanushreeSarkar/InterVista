"use client";

import { useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Brain, BarChart3, Clock, Target, Zap } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Header Animation
    gsap.from(".feature-header", {
      scrollTrigger: {
        trigger: container.current,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    });

    // Cards Animation
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".feature-cards-grid",
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <section
      id="features"
      ref={container}
      className="py-24 bg-muted/50"
    >
      <div className="container mx-auto px-4">
        <div className="feature-header text-center mb-16 opacity-100">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you prepare for any interview scenario
          </p>
        </div>

        <div className="feature-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card opacity-100"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}