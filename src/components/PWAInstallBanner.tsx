"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if dismissed recently (within 3 days)
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < threeDays) {
        return;
      }
    }

    // For Android/Chrome - listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing banner for better UX
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS - show manual instructions after delay
    if (iOS && !standalone) {
      setTimeout(() => setShowBanner(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install prompt failed:", err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <>
      {/* Main Install Banner */}
      <AnimatePresence>
        {showBanner && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[100] md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="relative bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl p-4 shadow-2xl shadow-primary/30">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                  <Smartphone className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-1">Install HostelMate 📲</h3>
                  <p className="text-xs text-white/80 mb-3">
                    Add to your home screen for quick access. Bismillah, let's make hostel life easier!
                  </p>
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="w-full h-10 bg-white text-emerald-600 hover:bg-white/90 font-bold rounded-xl gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Install HostelMate</h3>
                <p className="text-sm text-muted-foreground">
                  Follow these steps to add the app to your home screen
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-500">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tap the Share button</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Share className="h-3 w-3" /> at the bottom of Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-500">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Plus className="h-3 w-3" /> Look for this icon
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-green-500">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tap "Add" to confirm</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The app will appear on your home screen
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDismiss}
                variant="outline"
                className="w-full h-12 mt-6 rounded-xl font-bold"
              >
                Got it!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hook to detect if running as PWA
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check multiple methods for PWA detection
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        (window.navigator as any).standalone === true || // iOS Safari
        document.referrer.includes('android-app://') || // Android TWA
        window.matchMedia('(display-mode: window-controls-overlay)').matches;
      
      setIsPWA(isStandalone);
    };
    
    checkStandalone();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return isPWA;
}
