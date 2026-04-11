"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const roles = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "Designer",
    "Marketing",
    "Sales",
  ];

  const levels = ["Junior / Entry", "Mid-Level", "Senior", "Lead / Staff", "Manager"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-[5px] bg-muted/30">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" animated />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {step === 1 && "Welcome to InterVista! 👋"}
            {step === 2 && "What's your target role?"}
            {step === 3 && "What's your experience level?"}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 && "Let's set up your profile to personalize your mock interviews."}
            {step === 2 && "We'll tailor the questions to this specific career path."}
            {step === 3 && "This helps us adjust the difficulty of the technical and behavioral questions."}
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-white/5 shadow-2xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-center text-lg">
                    We just need a couple of details to get started. It takes less than a minute.
                  </p>
                  <Button 
                    className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-blue-600 border-0" 
                    onClick={handleNext}
                  >
                    Let&apos;s Go!
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                          role === r 
                            ? "border-primary bg-primary/10" 
                            : "border-white/5 hover:border-white/20 bg-background/50"
                        }`}
                      >
                        <span className="font-medium">{r}</span>
                        {role === r && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span className="w-10 h-px bg-muted" />
                    <span>Or type your own</span>
                    <span className="w-10 h-px bg-muted" />
                  </div>
                  <Input 
                    placeholder="e.g. Frontend Developer" 
                    value={roles.includes(role) ? "" : role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-12"
                  />
                  <div className="flex space-x-3 pt-4">
                    <Button variant="outline" className="w-1/3 h-12" onClick={() => setStep(1)}>Back</Button>
                    <Button className="w-2/3 h-12 bg-gradient-to-r from-purple-600 to-blue-600 border-0" onClick={handleNext} disabled={!role}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-3">
                    {levels.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                          level === l 
                            ? "border-primary bg-primary/10" 
                            : "border-white/5 hover:border-white/20 bg-background/50"
                        }`}
                      >
                        <span className="font-medium">{l}</span>
                        {level === l && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button variant="outline" className="w-1/3 h-12" onClick={() => setStep(2)}>Back</Button>
                    <Button className="w-2/3 h-12 bg-gradient-to-r from-purple-600 to-blue-600 border-0" onClick={handleNext} disabled={!level}>
                      Complete Setup
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
