"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ServerCrash, Home, RefreshCw } from "lucide-react";

export default function ServerErrorPage() {
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
            <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
              <ServerCrash className="w-12 h-12 text-destructive" />
            </div>
          </motion.div>

          <h1 className="text-6xl font-bold text-gradient mb-4">500</h1>
          <h2 className="text-3xl font-bold mb-4">Server Error</h2>

          <p className="text-xl text-muted-foreground mb-8">
            Something went wrong on our end. We're working to fix it!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => window.location.reload()}>
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}