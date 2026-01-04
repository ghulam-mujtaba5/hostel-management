"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, ListTodo, Sparkles, Trophy, Users, 
  BarChart3, Settings, HelpCircle, ClipboardList
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsPWA } from "./PWAInstallBanner";

interface QuickAction {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    href: "/tasks/create",
    icon: ListTodo,
    label: "New Task",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    href: "/tasks/pick",
    icon: Sparkles,
    label: "Pick Task",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    label: "Rankings",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    href: "/team",
    icon: Users,
    label: "Team",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    href: "/insights",
    icon: BarChart3,
    label: "My Stats",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10"
  },
  {
    href: "/guide",
    icon: HelpCircle,
    label: "Help",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
];

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, currentSpace } = useAuth();
  const isPWA = useIsPWA();
  
  // Only show for authenticated users with a space on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render on desktop or for non-authenticated users
  if (!isMobile || !user || !currentSpace) return null;

  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => {
              triggerHaptic();
              setIsOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 left-4 right-4 z-[70] bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </h3>
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={action.href}
                      onClick={() => {
                        triggerHaptic();
                        setIsOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-muted/50 transition-all active:scale-95"
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        action.bgColor
                      )}>
                        <Icon className={cn("h-6 w-6", action.color)} />
                      </div>
                      <span className="text-xs font-semibold text-center">{action.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => {
          triggerHaptic();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "fixed z-[70] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "bg-gradient-to-br from-primary to-purple-600 text-white",
          "active:scale-95 shadow-primary/30",
          isPWA ? "bottom-24 right-4" : "bottom-[88px] right-4"
        )}
        animate={{ rotate: isOpen ? 45 : 0 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </motion.button>
    </>
  );
}
