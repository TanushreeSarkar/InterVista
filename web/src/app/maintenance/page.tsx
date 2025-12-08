"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { Wrench, Clock } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <Logo size="lg" animated />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center">
              <Wrench className="w-12 h-12 text-warning" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold mb-4">Under Maintenance</h1>

          <p className="text-xl text-muted-foreground mb-8">
            We're currently performing scheduled maintenance to improve your experience.
            We'll be back shortly!
          </p>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span>Expected downtime: 30 minutes</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}