"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const THRESHOLD = 100;
const MAX_PULL = 150;

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  disabled = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pullY = useMotionValue(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  // Transform values for visual feedback
  const pullProgress = useTransform(pullY, [0, THRESHOLD], [0, 1]);
  const iconRotation = useTransform(pullY, [0, THRESHOLD], [0, 180]);
  const scale = useTransform(pullY, [0, THRESHOLD, MAX_PULL], [0.5, 1, 1.2]);
  const opacity = useTransform(pullY, [0, 50, THRESHOLD], [0, 0.5, 1]);

  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ("vibrate" in navigator) {
      const duration = intensity === 'light' ? 5 : intensity === 'medium' ? 15 : 25;
      navigator.vibrate(duration);
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only activate if at top of scroll
    const scrollTop = container.scrollTop;
    if (scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY.current;
    
    if (deltaY > 0) {
      // Apply resistance
      const resistance = 0.5;
      const clampedDelta = Math.min(deltaY * resistance, MAX_PULL);
      pullY.set(clampedDelta);
      
      // Haptic feedback at threshold
      const prevValue = pullY.getPrevious();
      if (clampedDelta >= THRESHOLD && prevValue !== undefined && prevValue < THRESHOLD) {
        triggerHaptic('medium');
      }
      
      // Prevent default scroll
      e.preventDefault();
    }
  }, [disabled, isRefreshing, pullY, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;
    
    const currentPull = pullY.get();
    
    if (currentPull >= THRESHOLD && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      triggerHaptic('heavy');
      
      // Animate to loading position
      animate(pullY, 60, { type: "spring", stiffness: 300, damping: 30 });
      
      try {
        await onRefresh();
        setShowSuccess(true);
        triggerHaptic('medium');
        
        // Show success briefly
        await new Promise(resolve => setTimeout(resolve, 500));
        setShowSuccess(false);
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    } else {
      // Snap back
      animate(pullY, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }, [disabled, isRefreshing, pullY, onRefresh, triggerHaptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto touch-pan-y", className)}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{ y: useTransform(pullY, v => v - 60) }}
      >
        <motion.div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
            isRefreshing && "animate-pulse"
          )}
          style={{ scale, opacity }}
        >
          {showSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Check className="h-6 w-6" strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div
              style={{ rotate: isRefreshing ? undefined : iconRotation }}
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={isRefreshing ? { 
                repeat: Infinity, 
                duration: 1, 
                ease: "linear" 
              } : {}}
            >
              <RefreshCw className="h-5 w-5" strokeWidth={2.5} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}

// Hook for manual refresh trigger
export function useRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (callback: () => Promise<void>) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await callback();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return { isRefreshing, refresh };
}
