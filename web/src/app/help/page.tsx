"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    { q: "How does the AI evaluate my answers?", a: "Our AI uses advanced NLP models to analyze your speech transcribed into text. It grades based on a comprehensive rubric including clarity, relevance, STAR format structure, and domain specific metrics." },
    { q: "Do I need a camera?", a: "No! InterVista is an audio-first platform. Real interviews have a video component, but we focus on optimizing what you say and how you say it, reducing cognitive load during practice." },
    { q: "Can I use custom job descriptions?", a: "Yes, on the Pro tier, you can paste any job description and our AI will generate a tailored interview matching those specific requirements." },
    { q: "How long is a typical interview?", a: "A standard mock interview takes about 15-20 minutes, simulating 4-5 major behavioral or technical questions." }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Help Center</h1>
            <p className="text-xl text-muted-foreground mb-8">
              How can we help you today?
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-10 h-12 text-lg rounded-full bg-card/60 backdrop-blur-md" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full bg-card/50 backdrop-blur-sm rounded-xl border border-white/5 px-6">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium text-lg hover:text-primary transition-colors">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}