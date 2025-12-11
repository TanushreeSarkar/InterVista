"use client";

import { motion } from "framer-motion";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Zap, Award } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Empowering job seekers with AI-powered interview preparation",
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Built with feedback from thousands of successful candidates",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Cutting-edge AI technology for realistic interview practice",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering the best interview preparation experience",
    },
  ];

  return (
    <main className="min-h-screen">
      <EnhancedNavbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-6">About InterVista</h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to help everyone ace their interviews with AI-powered practice
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-16"
          >
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  InterVista was founded by a team of engineers and career coaches who experienced
                  firsthand the challenges of interview preparation. We realized that traditional
                  methods weren't enough in today's competitive job market.
                </p>
                <p className="text-muted-foreground mb-4">
                  By combining artificial intelligence with proven interview techniques, we created
                  a platform that provides realistic practice sessions with instant, actionable
                  feedback.
                </p>
                <p className="text-muted-foreground">
                  Today, we're proud to help thousands of job seekers prepare for their dream roles
                  and land offers at top companies worldwide.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Join Us</h2>
                <p className="text-muted-foreground mb-4">
                  We're always looking for talented individuals to join our team. If you're
                  passionate about helping people succeed in their careers, we'd love to hear from
                  you.
                </p>
                <a href="/careers" className="text-primary hover:underline font-medium">
                  View Open Positions →
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}