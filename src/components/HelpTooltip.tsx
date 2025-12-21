"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Lightbulb, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Context to manage tooltip visibility globally
interface HelpTooltipContextType {
  showTooltips: boolean;
  toggleTooltips: () => void;
  markAsSeen: (id: string) => void;
  hasSeenTooltip: (id: string) => boolean;
  firstTimeUser: boolean;
}

const HelpTooltipContext = createContext<HelpTooltipContextType>({
  showTooltips: true,
  toggleTooltips: () => {},
  markAsSeen: () => {},
  hasSeenTooltip: () => false,
  firstTimeUser: true
});

export function HelpTooltipProvider({ children }: { children: ReactNode }) {
  const [showTooltips, setShowTooltips] = useState(true);
  const [seenTooltips, setSeenTooltips] = useState<Set<string>>(new Set());
  const [firstTimeUser, setFirstTimeUser] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    const tooltipPref = localStorage.getItem("hostelmate_show_tooltips");
    const seen = localStorage.getItem("hostelmate_seen_tooltips");
    const isFirstTime = !localStorage.getItem("hostelmate_not_first_time");
    
    setShowTooltips(tooltipPref !== "false");
    setSeenTooltips(new Set(seen ? JSON.parse(seen) : []));
    setFirstTimeUser(isFirstTime);

    // Mark as not first time after first visit
    if (isFirstTime) {
      localStorage.setItem("hostelmate_not_first_time", "true");
    }
  }, []);

  const toggleTooltips = () => {
    const newValue = !showTooltips;
    setShowTooltips(newValue);
    localStorage.setItem("hostelmate_show_tooltips", String(newValue));
  };

  const markAsSeen = (id: string) => {
    const newSeen = new Set(seenTooltips).add(id);
    setSeenTooltips(newSeen);
    localStorage.setItem("hostelmate_seen_tooltips", JSON.stringify([...newSeen]));
  };

  const hasSeenTooltip = (id: string) => seenTooltips.has(id);

  return (
    <HelpTooltipContext.Provider value={{ showTooltips, toggleTooltips, markAsSeen, hasSeenTooltip, firstTimeUser }}>
      {children}
    </HelpTooltipContext.Provider>
  );
}

export function useHelpTooltip() {
  return useContext(HelpTooltipContext);
}

// Props for HelpTooltip component
interface HelpTooltipProps {
  id: string;
  content: string;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean; // Only show for first-time users
  className?: string;
  children?: ReactNode;
  variant?: "icon" | "inline" | "spotlight";
}

export function HelpTooltip({
  id,
  content,
  title,
  position = "top",
  showOnce = false,
  className,
  children,
  variant = "icon"
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { showTooltips, markAsSeen, hasSeenTooltip, firstTimeUser } = useHelpTooltip();

  // For showOnce tooltips, check if user has seen it
  const shouldShow = showTooltips && (!showOnce || (firstTimeUser && !hasSeenTooltip(id)));

  const handleClose = () => {
    setIsOpen(false);
    if (showOnce) {
      markAsSeen(id);
    }
  };

  // Auto-show spotlight tooltips for first-time users
  useEffect(() => {
    if (variant === "spotlight" && shouldShow && firstTimeUser && !hasSeenTooltip(id)) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [variant, shouldShow, firstTimeUser, id, hasSeenTooltip]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-card",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-card",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-card",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-card"
  };

  if (!shouldShow) {
    return children || null;
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        {children}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-xs text-muted-foreground ml-1"
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  }

  if (variant === "spotlight") {
    return (
      <div className={cn("relative", className)}>
        {children}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Spotlight overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-50"
                onClick={handleClose}
              />
              {/* Spotlight ring around element */}
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 ring-4 ring-primary ring-offset-4 ring-offset-background rounded-xl z-50 pointer-events-none"
              />
              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  "absolute z-50 w-72 p-4 rounded-2xl bg-card border border-primary/30 shadow-2xl",
                  positionClasses[position]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    {title && <p className="font-bold text-sm">{title}</p>}
                    <p className="text-sm text-muted-foreground">{content}</p>
                  </div>
                  <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="w-full mt-3 rounded-xl"
                >
                  Got it!
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default icon variant
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      {children}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 ml-1 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "absolute z-50 w-64 p-4 rounded-xl bg-card border border-border shadow-xl",
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div className={cn("absolute w-0 h-0 border-8", arrowClasses[position])} />
            
            <div className="space-y-2">
              {title && (
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <p className="font-bold text-sm">{title}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{content}</p>
            </div>
            
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick tip banner for important information
interface QuickTipProps {
  children: ReactNode;
  variant?: "info" | "tip" | "warning";
  dismissible?: boolean;
  id?: string;
  className?: string;
}

export function QuickTip({ 
  children, 
  variant = "tip", 
  dismissible = true, 
  id,
  className 
}: QuickTipProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (id) {
      const wasDismissed = localStorage.getItem(`hostelmate_tip_${id}`);
      setDismissed(wasDismissed === "true");
    }
  }, [id]);

  const handleDismiss = () => {
    setDismissed(true);
    if (id) {
      localStorage.setItem(`hostelmate_tip_${id}`, "true");
    }
  };

  if (dismissed) return null;

  const variantStyles = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
    tip: "bg-primary/10 border-primary/20 text-primary",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300"
  };

  const variantIcons = {
    info: <Info className="h-4 w-4" />,
    tip: <Lightbulb className="h-4 w-4" />,
    warning: <Info className="h-4 w-4" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        variantStyles[variant],
        className
      )}
    >
      <div className="shrink-0 mt-0.5">{variantIcons[variant]}</div>
      <div className="flex-1 text-sm">{children}</div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
