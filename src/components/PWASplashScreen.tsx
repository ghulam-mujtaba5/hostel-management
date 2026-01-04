"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

interface PWASplashScreenProps {
  onComplete?: () => void;
  minimumDisplay?: number; // Minimum time to show splash in ms
}

export function PWASplashScreen({ 
  onComplete, 
  minimumDisplay = 1800 
}: PWASplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");

  useEffect(() => {
    // Loading text progression
    const texts = ["Initializing...", "Loading experience...", "Almost ready...", "Welcome!"];
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = Math.min(textIndex + 1, texts.length - 1);
      setLoadingText(texts[textIndex]);
    }, minimumDisplay / 4);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 80);

    // Hide splash after minimum display time
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, minimumDisplay);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [minimumDisplay, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #0D9488 50%, #0891B2 100%)"
          }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.1 
              }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 rounded-3xl bg-white/30 blur-2xl"
              />
              
              {/* Logo container */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl"
              >
                <LogoMark className="h-20 w-20" variant="dark" />
              </motion.div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl font-black text-white tracking-tight">
                <span className="text-white/90">Hostel</span>
                <span className="text-white">Mate</span>
              </h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-white/70 mt-2 font-medium tracking-wide"
              >
                Live Better, Together
              </motion.p>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-12 w-48"
            >
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, white, rgba(255,255,255,0.8))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <motion.p
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-white/50 text-center mt-3 font-medium"
              >
                {loadingText}
              </motion.p>
            </motion.div>
          </div>

          {/* Bottom tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
              <span className="h-px w-8 bg-white/20" />
              <span>Smart Shared Living</span>
              <span className="h-px w-8 bg-white/20" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Minimal loading indicator for in-app transitions
export function PWALoadingIndicator() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
      />
    </div>
  );
}

// Skeleton placeholder for PWA content
export function PWAContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-muted/50 rounded-2xl w-3/4" />
      <div className="h-32 bg-muted/50 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-muted/50 rounded-2xl" />
        <div className="h-24 bg-muted/50 rounded-2xl" />
      </div>
      <div className="h-48 bg-muted/50 rounded-3xl" />
    </div>
  );
}
