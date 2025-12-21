"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  Circle, 
  User, 
  Users, 
  CheckSquare, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Rocket,
  Target
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  action: string;
  href: string;
  isComplete: boolean;
  icon: React.ReactNode;
}

interface GettingStartedChecklistProps {
  hasProfile?: boolean;
  hasSpace?: boolean;
  hasCompletedTask?: boolean;
  className?: string;
  collapsed?: boolean;
}

export function GettingStartedChecklist({
  hasProfile = false,
  hasSpace = false,
  hasCompletedTask = false,
  className,
  collapsed: initialCollapsed = false
}: GettingStartedChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [dismissed, setDismissed] = useState(false);

  // Check if checklist was dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem("hostelmate_checklist_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const checklistItems: ChecklistItem[] = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your name and avatar to help flatmates recognize you",
      action: "Edit Profile",
      href: "/profile",
      isComplete: hasProfile,
      icon: <User className="h-5 w-5" />
    },
    {
      id: "space",
      title: "Join or Create a Space",
      description: "Connect with your flatmates in a shared space",
      action: hasSpace ? "View Space" : "Get Started",
      href: hasSpace ? "/spaces" : "/spaces/create",
      isComplete: hasSpace,
      icon: <Users className="h-5 w-5" />
    },
    {
      id: "task",
      title: "Complete Your First Task",
      description: "Pick a task and earn your first points!",
      action: "Pick Task",
      href: "/tasks/pick",
      isComplete: hasCompletedTask,
      icon: <CheckSquare className="h-5 w-5" />
    }
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const progress = (completedCount / checklistItems.length) * 100;
  const isAllComplete = completedCount === checklistItems.length;

  const dismissChecklist = () => {
    setDismissed(true);
    localStorage.setItem("hostelmate_checklist_dismissed", "true");
  };

  // Don't show if dismissed or all complete
  if (dismissed && isAllComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 rounded-[2rem] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Getting Started</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAllComplete ? "All done! 🎉" : `${completedCount} of ${checklistItems.length} complete`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-xl"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full"
            />
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0 space-y-3">
                {checklistItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      item.isComplete 
                        ? "bg-green-500/5 border border-green-500/20" 
                        : "bg-card/50 border border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                      item.isComplete ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                    )}>
                      {item.isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        item.icon
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold text-sm",
                        item.isComplete && "text-muted-foreground line-through"
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>

                    {!item.isComplete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-xl shrink-0 text-primary hover:bg-primary/10"
                      >
                        <Link href={item.href}>
                          {item.action}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </motion.div>
                ))}

                {/* Dismiss Option */}
                {!isAllComplete && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={dismissChecklist}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Hide this checklist
                    </button>
                  </div>
                )}

                {/* Completion Celebration */}
                {isAllComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-2"
                  >
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Sparkles className="h-8 w-8 text-yellow-500" />
                      </motion.div>
                    </div>
                    <p className="font-bold text-green-500">You're all set!</p>
                    <p className="text-sm text-muted-foreground">
                      You've completed all the getting started steps.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// Compact inline version for the dashboard
export function GettingStartedBanner({
  hasProfile = false,
  hasSpace = false,
  hasCompletedTask = false,
  className
}: GettingStartedChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("hostelmate_banner_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const steps = [
    { done: hasProfile, label: "Profile" },
    { done: hasSpace, label: "Space" },
    { done: hasCompletedTask, label: "First Task" }
  ];

  const nextStep = steps.find(s => !s.done);
  const completedCount = steps.filter(s => s.done).length;
  const isAllComplete = completedCount === steps.length;

  if (dismissed || isAllComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Target className="h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold text-sm">Complete your setup</p>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} steps done • Next: {nextStep?.label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                step.done ? "bg-green-500" : "bg-muted"
              )}
            />
          ))}
        </div>

        <Button size="sm" variant="outline" className="rounded-xl" asChild>
          <Link href={hasSpace ? "/profile" : hasProfile ? "/spaces/create" : "/profile"}>
            Continue
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>

        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("hostelmate_banner_dismissed", "true");
          }}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}
