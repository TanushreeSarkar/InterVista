"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, Users, MessageSquareQuote } from "lucide-react";

// The simulated conversation script
const conversationScript = [
  { role: "ai", text: "Welcome to your InterVista mock interview. Today we'll be doing a practical behavioral assessment. First, tell me about a time you had to lead a project under a tightly restricted deadline.", duration: 8000 },
  { role: "human", text: "Hi, thank you. Yes, at my previous company, our primary client requested a major feature overhaul just two weeks before the scheduled launch date. I immediately gathered the team to reassess.", duration: 9000 },
  { role: "ai", text: "That sounds challenging. How did you handle the potential burnout of your engineering team during those two intense weeks? Did you face any significant pushback?", duration: 7000 },
  { role: "human", text: "Absolutely, there was initial resistance. I organized a transparent all-hands meeting explaining the stakes, and negotiated with leadership to guarantee compensatory time off afterward.", duration: 8500 },
  { role: "ai", text: "Excellent strategy using proactive transparent communication. It shows strong empathy. What was the final technical outcome of the launch?", duration: 6000 },
  { role: "human", text: "We successfully deployed the MVP with zero major production bugs. The client was absolutely thrilled and actually expanded our contract scope the following quarter.", duration: 7500 }
];

export function InteractionDemoSection() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying] = useState(true);

  // Automatically progress through the script
  useEffect(() => {
    if (!isPlaying) return;

    const currentLine = conversationScript[currentLineIndex];
    
    // Automatically advance to the next line after its duration
    const timer = setTimeout(() => {
      setCurrentLineIndex((prev) => (prev + 1) % conversationScript.length);
    }, currentLine.duration);

    return () => clearTimeout(timer);
  }, [currentLineIndex, isPlaying]);

  const activeSpeaker = conversationScript[currentLineIndex].role;
  const currentText = conversationScript[currentLineIndex].text;

  return (
    <section className="py-24 relative bg-background overflow-hidden border-y border-white/5">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background" />

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        
        {/* Header Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 max-w-3xl"
        >
          <div className="inline-flex items-center justify-center p-2 mb-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-medium tracking-wide uppercase text-sm flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" /> Live Simulation
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Stress-Free Interview Environment
          </h2>
          <p className="text-xl text-muted-foreground font-light">
            Practice in a hyper-realistic Zoom-style interface. InterVista&apos;s AI listens perfectly, analyzes your tone, and engages you in a dynamic, face-to-face conversational loop.
          </p>
        </motion.div>

        {/* The Zoom / Video Call Mockup Window */}
        <div className="w-full max-w-5xl rounded-[1.5rem] bg-[#111118] border border-white/10 shadow-2xl overflow-hidden relative flex flex-col">
          
          {/* Mockup Toolbar (Top) */}
          <div className="h-12 bg-[#1A1A24] border-b border-white/5 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/90" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/90" />
              <div className="w-3 h-3 rounded-full bg-green-500/90" />
            </div>
            <div className="text-xs font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> RECORDING
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Users className="w-4 h-4" /> <span className="text-xs font-mono">2 Participants</span>
            </div>
          </div>

          {/* Video Grid Area */}
          <div className="flex flex-col md:flex-row p-4 gap-4 bg-[#0A0A0F] h-[500px]">
            
            {/* AI INTERVIEWER PANEL */}
            <div className={`relative flex-1 rounded-2xl overflow-hidden bg-gradient-to-b from-[#151520] to-[#0A0A0F] border-2 transition-all duration-500 flex items-center justify-center ${activeSpeaker === 'ai' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-4 ring-green-500/20' : 'border-[#1E1E2E]'}`}>
              {/* Floating nametag */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-2 z-20">
                AI Interviewer 
                {activeSpeaker === 'ai' ? <Mic className="w-3.5 h-3.5 text-green-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>

              {/* The AI Visual Representation */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Static Outer Rings */}
                <div className="absolute inset-0 rounded-full border border-indigo-500/20" />
                <div className="absolute inset-4 rounded-full border border-indigo-500/30" />
                
                {/* Active Pulsing Orb */}
                <motion.div 
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 blur-md"
                  animate={{
                    scale: activeSpeaker === 'ai' ? [1, 1.2, 0.9, 1.1, 1] : 1,
                    opacity: activeSpeaker === 'ai' ? [0.6, 1, 0.7, 0.9, 0.6] : 0.3
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Inner Core */}
                <div className="absolute w-20 h-20 rounded-full bg-white/10 border border-white/30 backdrop-blur-sm shadow-inner" />
              </div>

              {/* Live Context Analysis Overlay (Decorative) */}
              <AnimatePresence>
                {activeSpeaker === 'ai' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-6 right-6 flex flex-col gap-2"
                  >
                    <div className="bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-md text-[10px] text-indigo-300 font-mono tracking-widest uppercase flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Analyzing context
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* CANDIDATE PANEL */}
            <div className={`relative flex-1 rounded-2xl overflow-hidden bg-[#1A1A24] border-2 transition-all duration-500 flex items-end justify-center ${activeSpeaker === 'human' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-4 ring-green-500/20' : 'border-[#1E1E2E]'}`}>
              {/* Floating nametag */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-2 z-20">
                You (Candidate)
                {activeSpeaker === 'human' ? <Mic className="w-3.5 h-3.5 text-green-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>

              {/* Human Silhouette Placeholder */}
              <div className="w-48 h-56 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-full opacity-30 shadow-2xl relative translate-y-8" />
              
              {/* Camera Off / Privacy note */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-50">
                <Video className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-zinc-500 text-xs tracking-widest font-mono">CAMERA_MUTE</span>
              </div>
            </div>

          </div>

          {/* Persistent Closed Captions Layer */}
          <div className="h-28 bg-[#111118]/90 border-t border-white/10 shrink-0 p-4 relative flex items-center justify-center overflow-hidden">
            <MessageSquareQuote className="absolute left-6 top-6 w-8 h-8 text-zinc-800" />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLineIndex} // Re-animate every time the text changes
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl text-center"
              >
                <div className={`text-sm font-bold tracking-widest mb-2 uppercase ${activeSpeaker === 'ai' ? 'text-indigo-400' : 'text-cyan-400'}`}>
                  {activeSpeaker === 'ai' ? 'Interviewer' : 'You'}
                </div>
                <p className="text-zinc-200 text-lg md:text-xl font-medium leading-relaxed drop-shadow-md">
                  {currentText}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Call Controls Mockup */}
          <div className="h-16 bg-[#1A1A24] border-t border-white/5 flex items-center justify-center gap-4 shrink-0 px-6">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 cursor-pointer transition-colors"><Mic className="w-4 h-4 text-zinc-300" /></div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 cursor-pointer transition-colors"><Video className="w-4 h-4 text-zinc-300" /></div>
            <div className="px-5 h-10 rounded-full bg-red-500 block items-center flex justify-center text-xs font-bold text-white tracking-widest">END CALL</div>
          </div>

        </div>
      </div>
    </section>
  );
}
