"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Engineer at Google",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    rating: 5,
    text: "InterVista helped me land my dream job! The AI feedback was incredibly detailed and helped me improve my communication skills significantly.",
  },
  {
    name: "Michael Chen",
    role: "Product Manager at Microsoft",
    avatar: "https://i.pravatar.cc/150?u=michael",
    rating: 5,
    text: "The realistic interview scenarios and instant feedback made all the difference. I felt so much more confident in my actual interviews.",
  },
  {
    name: "Emily Rodriguez",
    role: "Data Scientist at Meta",
    avatar: "https://i.pravatar.cc/150?u=emily",
    rating: 5,
    text: "Best interview prep tool I've used. The AI understands context and provides actionable feedback that actually helps you improve.",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="testimonials"
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
            What Our Users Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful candidates who improved their interview skills
          </p>
        </motion.div>

        <div className="relative overflow-hidden w-full max-w-7xl mx-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-muted/50 to-transparent z-10 pointer-events-none hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-muted/50 to-transparent z-10 pointer-events-none hidden md:block" />

          {/* Marquee Container */}
          <div className="flex md:animate-marquee md:hover:[animation-play-state:paused] md:w-max flex-col md:flex-row gap-8 pb-4">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="w-full md:w-[400px] shrink-0"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 hover:scale-105 bg-card/60 backdrop-blur-sm group">
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center mb-4">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full mr-4 object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                      />
                      <div>
                        <div className="font-semibold group-hover:text-primary transition-colors">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex mb-4">
                      {Array.from({ length: Math.floor(testimonial.rating) }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-md"
                        />
                      ))}
                    </div>

                    <div className="relative">
                      <Quote className="w-8 h-8 text-primary/10 absolute -top-4 -left-2 group-hover:text-primary/20 transition-colors" />
                      <p className="text-muted-foreground pl-6 relative z-10 leading-relaxed">
                        {testimonial.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}