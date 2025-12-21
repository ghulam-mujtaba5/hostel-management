"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  CheckSquare, 
  Trophy, 
  Scale,
  Sparkles,
  Home,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string | null;
}

const steps = [
  {
    id: 1,
    icon: <Home className="h-10 w-10" />,
    title: "Welcome to HostelMate!",
    description: "Your all-in-one solution for managing shared living spaces. Let's show you how to get the most out of it.",
    color: "from-primary to-purple-600",
    bgColor: "bg-primary/10"
  },
  {
    id: 2,
    icon: <Users className="h-10 w-10" />,
    title: "Create or Join a Space",
    description: "A Space represents your hostel or flat. Create one and invite your flatmates, or join an existing space with an invite code.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: 3,
    icon: <CheckSquare className="h-10 w-10" />,
    title: "Manage Tasks Together",
    description: "Create household tasks, assign them to flatmates, and track completion. No more arguments about who did what!",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10"
  },
  {
    id: 4,
    icon: <Scale className="h-10 w-10" />,
    title: "AI-Powered Fairness",
    description: "Our smart algorithm tracks everyone's contributions and ensures tasks are distributed fairly among all members.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10"
  },
  {
    id: 5,
    icon: <Trophy className="h-10 w-10" />,
    title: "Earn Points & Compete",
    description: "Complete tasks to earn points, climb the leaderboard, and become the top contributor in your space!",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10"
  }
];

export function WelcomeModal({ isOpen, onClose, username }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && skipTour()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-card rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={skipTour}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Progress Dots */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
              {steps.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    width: idx === currentStep ? 24 : 8,
                    backgroundColor: idx === currentStep ? "hsl(var(--primary))" : idx < currentStep ? "hsl(var(--primary))" : "hsl(var(--muted))"
                  }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>

            {/* Content */}
            <div className="pt-16 pb-8 px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  {/* Icon */}
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className={cn(
                        "w-24 h-24 rounded-[2rem] flex items-center justify-center",
                        steps[currentStep].bgColor
                      )}
                    >
                      <div className={cn(
                        "bg-gradient-to-br bg-clip-text text-transparent",
                        steps[currentStep].color
                      )}>
                        <div className="text-primary">
                          {steps[currentStep].icon}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Personalized greeting on first step */}
                  {currentStep === 0 && username && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-lg text-primary font-semibold"
                    >
                      Hey {username}! 👋
                    </motion.p>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {steps[currentStep].title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                    {steps[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex items-center justify-between gap-4">
              {currentStep > 0 ? (
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  className="rounded-xl"
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={skipTour}
                  className="rounded-xl text-muted-foreground"
                >
                  Skip
                </Button>
              )}

              <Button
                onClick={nextStep}
                className={cn(
                  "rounded-xl gap-2 px-6 bg-gradient-to-r",
                  steps[currentStep].color
                )}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage welcome modal state
export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem("hostelmate_welcome_seen");
    if (!hasSeenWelcome) {
      // Delay showing modal to let the page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem("hostelmate_welcome_seen", "true");
  };

  const resetWelcome = () => {
    localStorage.removeItem("hostelmate_welcome_seen");
    setIsOpen(true);
  };

  return { isOpen, closeModal, resetWelcome };
}
