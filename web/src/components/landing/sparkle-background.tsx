"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

export function SparkleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;

    const colors = ["rgba(255, 255, 255, 0.6)", "#a78bfa", "#60a5fa"];

    // Initialize Canvas Size
    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Create particles
    const initParticles = () => {
      particlesArray = [];
      // Adjust density based on screen size (desktop vs mobile)
      const numParticles = window.innerWidth < 768 ? 40 : 80;
      
      for (let i = 0; i < numParticles; i++) {
        const size = Math.random() * 2 + 1; // 1px to 3px
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speedX = (Math.random() - 0.5) * 0.1; // Very slow drift
        const speedY = (Math.random() - 0.5) * 0.1;
        const opacity = Math.random() * 0.5 + 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particlesArray.push({ x, y, size, speedX, speedY, opacity, color });
      }
    };

    // Draw and animate particles
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i];
        
        // Update positions
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Bounce off edges smoothly by wrapping around or reversing
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        // Twinkle effect (sine wave opacity change over time)
        const timeOffset = Date.now() * 0.001;
        const twinkle = Math.abs(Math.sin(timeOffset + i)) * 0.8 + 0.2;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Use global alpha for twinkling
        ctx.globalAlpha = p.opacity * twinkle;
        ctx.fillStyle = p.color;
        
        // Add subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        
        ctx.fill();
      }
      
      animationFrameId = requestAnimationFrame(drawParticles);
    };

    initCanvas();
    initParticles();
    drawParticles();

    // Handle resize
    const handleResize = () => {
      initCanvas();
      initParticles(); // Re-initialize to fix density
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full p-0 m-0"
        style={{ pointerEvents: "none" }}
      />
      {/* Radial Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(10, 10, 15, 0.4) 100%)",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
