"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface PWASplashScreenProps {
  onComplete?: () => void;
  minimumDisplay?: number; // Minimum time to show splash in ms
}

export function PWASplashScreen({ 
  onComplete, 
  minimumDisplay = 1500 
}: PWASplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Hide splash after minimum display time
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, minimumDisplay);

    return () => {
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary via-purple-600 to-primary flex flex-col items-center justify-center"
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.1 
            }}
            className="relative"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 rounded-3xl bg-white/20 blur-xl"
            />
            <div className="relative h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/30 shadow-2xl">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <h1 className="text-3xl font-black text-white tracking-tight">
              HostelMate
            </h1>
            <p className="text-sm text-white/70 mt-1 font-medium">
              Smart Duty Management
            </p>
          </motion.div>

          {/* Loading Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "50%" }}
            transition={{ delay: 0.5 }}
            className="mt-12 max-w-[200px] w-full"
          >
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-12 text-xs text-white/50 font-medium"
          >
            Made with ❤️ for students
          </motion.p>
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
