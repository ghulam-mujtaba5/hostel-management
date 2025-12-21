"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 py-2 px-4 text-center shadow-lg",
            className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <span>You're offline. Some features may not work.</span>
          </div>
        </motion.div>
      )}

      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] bg-green-500 text-white py-2 px-4 text-center shadow-lg",
            className
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Wifi className="h-4 w-4" aria-hidden="true" />
            <span>Back online!</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to use network status in components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
