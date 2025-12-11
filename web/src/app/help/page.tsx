"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, MessageSquare, Book, Video } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How does InterVista work?",
      answer: "InterVista uses AI to conduct realistic mock interviews. Simply create a session, answer questions via audio, and receive instant feedback on your performance.",
    },
    {
      question: "What types of interviews can I practice?",
      answer: "We support various interview types including technical, behavioral, case study, and role-specific interviews for positions like Software Engineer, Product Manager, Data Scientist, and more.",
    },
    {
      question: "How is my performance evaluated?",
      answer: "Our AI analyzes your answers based on content quality, communication skills, structure, and relevance. You'll receive detailed feedback with strengths and areas for improvement.",
    },
    {
      question: "Can I practice multiple times?",
      answer: "Yes! Pro and Enterprise plans offer unlimited practice sessions. Free users get 3 sessions per month.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and never share your personal information or interview recordings with third parties.",
    },
    {
      question: "How long does an interview session take?",
      answer: "Most sessions take 15-30 minutes depending on the number of questions. You can pause and resume at any time.",
    },
    {
      question: "Do I need special equipment?",
      answer: "Just a computer or mobile device with a working microphone. A quiet environment is recommended for best results.",
    },
    {
      question: "Can I download my interview reports?",
      answer: "Yes, all users can download their evaluation reports as PDF files for future reference.",
    },
  ];

  const categories = [
    {
      icon: HelpCircle,
      title: "Getting Started",
      description: "Learn the basics of using InterVista",
      link: "/help/getting-started",
    },
    {
      icon: MessageSquare,
      title: "Interview Tips",
      description: "Best practices for interview success",
      link: "/help/tips",
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Detailed guides and tutorials",
      link: "/docs",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step walkthroughs",
      link: "/help/videos",
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
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-6">Help Center</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers to common questions and get support
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-3xl mx-auto mt-16"
          >
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to help you succeed
                </p>
                <a
                  href="/contact"
                  className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Contact Support
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