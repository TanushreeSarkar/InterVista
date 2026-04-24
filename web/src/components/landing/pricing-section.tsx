"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Get started with the basics",
    features: [
      { text: "3 interviews per month", included: true },
      { text: "Basic AI feedback", included: true },
      { text: "Standard question bank", included: true },
      { text: "Unlimited interviews", included: false },
      { text: "Detailed analytics", included: false },
      { text: "PDF reports", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Premium",
    price: "₹499",
    description: "Everything you need to ace interviews",
    features: [
      { text: "Unlimited AI interviews", included: true },
      { text: "Per-question AI scoring", included: true },
      { text: "Detailed analytics dashboard", included: true },
      { text: "Downloadable PDF reports", included: true },
      { text: "Custom question banks", included: true },
      { text: "Filler word tracking", included: true },
    ],
    cta: "Upgrade to Premium",
    popular: true,
  },
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={sectionRef} className="py-24 bg-background">
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
            Start free, upgrade when you&apos;re ready to get serious about interview prep.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl backdrop-blur-xl bg-card/60 ${
                plan.popular
                  ? "border-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.1)] hover:shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                  : "border-white/5 hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 to-blue-500/20 opacity-20 pointer-events-none rounded-2xl" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5">
                      <Crown className="w-3 h-3" /> MOST POPULAR
                    </div>
                  </div>
                </>
              )}

              <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div>
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "" : "text-muted-foreground/50"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-lg text-white"
                      : "bg-background/50 hover:bg-primary/20 hover:text-primary"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href={plan.popular ? "/pricing" : "/sign-up"}>
                    {plan.popular && <Zap className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}