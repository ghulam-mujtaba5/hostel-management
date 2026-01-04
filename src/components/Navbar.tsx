"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Trophy, 
  User, 
  Bell,
  Menu,
  X,
  History,
  BarChart3,
  Home,
  ListTodo,
  Users,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { motion } from "framer-motion";
import { useIsPWA } from "./PWAInstallBanner";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, currentSpace, spaceMembership } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isPWA = useIsPWA();

  // Haptic feedback utility
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ("vibrate" in navigator) {
      const duration = intensity === 'light' ? 5 : intensity === 'medium' ? 10 : 20;
      navigator.vibrate(duration);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home", icon: Home, mobileLabel: "Home" },
    { href: "/tasks", label: "Tasks", icon: ListTodo, mobileLabel: "Tasks" },
    { href: "/team", label: "Team", icon: Users, mobileLabel: "Team" },
    { href: "/leaderboard", label: "Rank", icon: Trophy, mobileLabel: "Rank" },
    { href: "/profile", label: "Me", icon: User, mobileLabel: "Me" },
  ];

  const isAdmin = spaceMembership?.role === 'admin';

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled 
          ? "bg-background/95 backdrop-blur-lg border-border/50 py-2" 
          : "bg-background/50 backdrop-blur-sm border-transparent py-3"
      )}>
        <div className="container mx-auto px-4 flex items-center justify-between max-w-6xl">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-2">
            <Logo size="sm" animated />
            {user && currentSpace && (
              <span className="hidden sm:inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                {currentSpace.name.length > 15 ? currentSpace.name.slice(0, 15) + '...' : currentSpace.name}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname.startsWith('/admin')
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <NotificationBell />
            ) : (
              <Button asChild size="sm" className="rounded-xl font-bold">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar - Optimized for PWA */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-background/95 backdrop-blur-xl border-t border-border/50",
        isPWA && "pb-safe"
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => triggerHaptic(isActive ? 'light' : 'medium')}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200",
                  "touch-target-sm active:scale-95",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10"
                >
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all",
                      isActive && "drop-shadow-sm"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                <motion.span 
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
                  className={cn(
                    "text-[10px] font-bold mt-1 relative z-10 tracking-tight",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.mobileLabel}
                </motion.span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Admin badge if applicable */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-3 right-4"
          >
            <Link
              href="/admin"
              onClick={() => triggerHaptic('medium')}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                "bg-orange-500 text-white shadow-lg shadow-orange-500/30",
                "active:scale-95 transition-transform"
              )}
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </motion.div>
        )}
      </nav>
    </>
  );
}
