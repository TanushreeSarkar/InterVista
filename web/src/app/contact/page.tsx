"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-xl h-full">
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>We usually respond within 24 hours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="john@example.com" type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea placeholder="How can we help?" className="min-h-[120px]" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-lg relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 flex items-start space-x-4 relative z-10">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-muted-foreground text-sm">support@intervista.ai</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-lg relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6 flex items-start space-x-4 relative z-10">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Social Media</h3>
                    <p className="text-muted-foreground text-sm">@InterVistaAI on X</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}