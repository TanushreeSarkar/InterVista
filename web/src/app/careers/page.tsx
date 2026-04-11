"use client";

import { EnhancedNavbar } from "@/components/layout/enhanced-navbar";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-background">
      <EnhancedNavbar />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Careers at InterVista</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join us in building the future of interview preparation.
            </p>
            <p className="text-muted-foreground">
              We don&apos;t have any open positions right now, but check back soon!
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
