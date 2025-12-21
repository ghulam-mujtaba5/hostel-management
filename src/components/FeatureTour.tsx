"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  CheckSquare,
  Trophy,
  Users,
  Target,
  MessageSquare,
  SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  icon: ReactNode;
}

const defaultTourSteps: TourStep[] = [
  {
    id: "welcome",
    target: "[data-tour='dashboard-welcome']",
    title: "Your Dashboard",
    content: "This is your home base! Here you can see your stats, active tasks, and what's recommended for you.",
    position: "bottom",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: "recommended",
    target: "[data-tour='recommended-tasks']",
    title: "Recommended Tasks",
    content: "These are tasks we think are perfect for you based on your availability and fairness score.",
    position: "top",
    icon: <Target className="h-5 w-5" />
  },
  {
    id: "leaderboard",
    target: "[data-tour='leaderboard']",
    title: "Leaderboard",
    content: "See how you rank against your flatmates! Earn points by completing tasks to climb up.",
    position: "left",
    icon: <Trophy className="h-5 w-5" />
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    content: "Create new tasks or give feedback to flatmates with these shortcuts.",
    position: "top",
    icon: <CheckSquare className="h-5 w-5" />
  }
];

// Tour Context
interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  totalSteps: number;
}

const TourContext = createContext<TourContextType>({
  isTourActive: false,
  currentStep: 0,
  startTour: () => {},
  endTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  totalSteps: 0
});

export function useTour() {
  return useContext(TourContext);
}

interface TourProviderProps {
  children: ReactNode;
  steps?: TourStep[];
  autoStart?: boolean;
}

export function TourProvider({ children, steps = defaultTourSteps, autoStart = false }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasCompletedTour = localStorage.getItem("hostelmate_tour_completed");
    const hasSeenDashboard = localStorage.getItem("hostelmate_dashboard_seen");
    
    if (!hasCompletedTour && !hasSeenDashboard && autoStart) {
      setIsFirstVisit(true);
      // Delay starting tour to let page load
      const timer = setTimeout(() => {
        setIsTourActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, currentStep]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
    localStorage.setItem("hostelmate_tour_completed", "true");
    localStorage.setItem("hostelmate_dashboard_seen", "true");
  }, []);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    localStorage.setItem("hostelmate_tour_completed", "true");
    localStorage.setItem("hostelmate_dashboard_seen", "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  return (
    <TourContext.Provider value={{
      isTourActive,
      currentStep,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
      totalSteps: steps.length
    }}>
      {children}
      <AnimatePresence>
        {isTourActive && (
          <TourOverlay steps={steps} currentStep={currentStep} />
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

interface TourOverlayProps {
  steps: TourStep[];
  currentStep: number;
}

function TourOverlay({ steps, currentStep }: TourOverlayProps) {
  const { nextStep, prevStep, skipTour, endTour, totalSteps } = useTour();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  
  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    // Find the target element
    const targetElement = document.querySelector(step.target);
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setHighlightRect(rect);

      // Calculate tooltip position
      const padding = 20;
      let top = 0;
      let left = 0;

      switch (step.position) {
        case "top":
          top = rect.top - padding - 180; // Tooltip height
          left = rect.left + rect.width / 2 - 160; // Half tooltip width
          break;
        case "bottom":
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - 160;
          break;
        case "left":
          top = rect.top + rect.height / 2 - 90;
          left = rect.left - padding - 320;
          break;
        case "right":
          top = rect.top + rect.height / 2 - 90;
          left = rect.right + padding;
          break;
      }

      // Keep tooltip in viewport
      top = Math.max(20, Math.min(top, window.innerHeight - 200));
      left = Math.max(20, Math.min(left, window.innerWidth - 340));

      setTooltipPosition({ top, left });
    }
  }, [step, currentStep]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={skipTour}
      />

      {/* Highlight cutout */}
      {highlightRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            borderRadius: "1rem"
          }}
        >
          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl ring-4 ring-primary ring-offset-4 ring-offset-transparent animate-pulse" />
        </motion.div>
      )}

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[10000] w-80 bg-card border border-primary/30 rounded-2xl shadow-2xl p-6"
        style={{ 
          top: tooltipPosition.top, 
          left: tooltipPosition.left 
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tour-step-title-${currentStep}`}
        aria-describedby={`tour-step-content-${currentStep}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary" aria-hidden="true">
              {step.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider" aria-live="polite">
                Step {currentStep + 1} of {totalSteps}
              </p>
              <h3 id={`tour-step-title-${currentStep}`} className="text-lg font-bold">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={skipTour}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <p id={`tour-step-content-${currentStep}`} className="text-muted-foreground mb-6 leading-relaxed">
          {step.content}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === currentStep 
                  ? "w-6 bg-primary" 
                  : idx < currentStep 
                    ? "w-1.5 bg-primary/50" 
                    : "w-1.5 bg-muted"
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-1 disabled:opacity-30"
            aria-label="Go to previous step"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground"
              aria-label="Skip tour"
            >
              <SkipForward className="h-4 w-4 mr-1" aria-hidden="true" />
              Skip
            </Button>
            <Button
              size="sm"
              onClick={isLastStep ? endTour : nextStep}
              className="gap-1 bg-primary"
              aria-label={isLastStep ? "Finish tour" : "Go to next step"}
            >
              {isLastStep ? (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Use arrow keys to navigate • Esc to close
        </p>
      </motion.div>
    </>
  );
}

// Component to mark tour targets
interface TourTargetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TourTarget({ id, children, className }: TourTargetProps) {
  return (
    <div data-tour={id} className={className}>
      {children}
    </div>
  );
}

// Start Tour button for settings/help
export function StartTourButton({ className }: { className?: string }) {
  const { startTour, isTourActive } = useTour();

  if (isTourActive) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className={cn("gap-2", className)}
    >
      <Sparkles className="h-4 w-4" />
      Take a Tour
    </Button>
  );
}
