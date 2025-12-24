"use client";

import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AdvancedLoadingProps {
  fullPage?: boolean;
  text?: string;
  className?: string;
}

export function AdvancedLoading({ 
  fullPage = true, 
  text = "Loading your experience...", 
  className 
}: AdvancedLoadingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background overflow-hidden",
      fullPage ? "fixed inset-0 z-50" : "w-full h-full min-h-[300px]",
      className
    )}>
      {/* Animated Background Particles */}
      {fullPage && mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/10 blur-xl"
              animate={{
                x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                width: Math.random() * 200 + 100 + "px",
                height: Math.random() * 200 + 100 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Outer rotating ring with glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-t-2 border-r-2 border-primary/20 border-t-primary border-r-purple-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
        />
        
        {/* Middle rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full border-b-2 border-l-2 border-purple-500/20 border-b-purple-600 border-l-primary"
        />

        {/* Inner pulsing ring */}
        <motion.div
          animate={{ 
            scale: [0.8, 1.1, 0.8],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 blur-sm"
        />

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Logo size="lg" showText={false} />
          </motion.div>
        </div>
      </div>

      {/* Loading Text with Shimmer Effect */}
      <div className="mt-12 flex flex-col items-center gap-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary via-purple-600 to-primary bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] bg-clip-text text-transparent">
            {text}
          </h2>
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">
            Please wait a moment
          </p>
        </motion.div>

        {/* Modern Progress Bar */}
        <div className="w-64 h-1.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-blue-600"
            initial={{ width: "0%", x: "-100%" }}
            animate={{ 
              width: ["0%", "100%", "0%"],
              x: ["0%", "0%", "100%"]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}
