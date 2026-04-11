"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "3 practice sessions per month",
      "Basic AI feedback",
      "Standard question bank",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For serious job seekers",
    features: [
      "Unlimited practice sessions",
      "Advanced AI feedback",
      "Premium question bank",
      "Priority support",
      "Performance analytics",
      "Custom interview scenarios",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team management",
      "Custom branding",
      "API access",
      "Dedicated support",
      "Training sessions",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="py-24 bg-background"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include core features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card
                className={`group h-full relative border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden backdrop-blur-xl bg-card/60 ${
                  plan.popular
                    ? "border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.1)] scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] hover:border-primary z-10"
                    : "hover:border-primary/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.1)]"
                }`}
              >
                {/* Gradient animation border for popular plan */}
                {plan.popular && (
                  <>
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/30 to-blue-500/30 opacity-20 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                  </>
                )}
                
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white px-4 py-1.5 shadow-lg">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="relative z-10 h-full flex flex-col">
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">{plan.name}</CardTitle>
                    <CardDescription className="mb-4">
                      {plan.description}
                    </CardDescription>
                    <div className="mb-4">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full transition-all duration-300 ${
                        plan.popular 
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-lg text-white group-hover:shadow-indigo-500/25" 
                          : "bg-background/50 hover:bg-primary/20 hover:text-primary group-hover:border-primary/50"
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link href="/sign-up">{plan.cta}</Link>
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}