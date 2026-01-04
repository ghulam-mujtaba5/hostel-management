"use client";

import { useState, useEffect } from "react";
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
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, currentSpace, spaceMembership } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 py-3 bg-transparent border-transparent">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="h-8 w-8 rounded-xl bg-muted/20 animate-pulse" />
          <div className="hidden md:flex items-center gap-1">
            <div className="h-8 w-20 rounded-full bg-muted/20 animate-pulse" />
            <div className="h-8 w-20 rounded-full bg-muted/20 animate-pulse" />
            <div className="h-8 w-20 rounded-full bg-muted/20 animate-pulse" />
          </div>
          <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
        </div>
      </header>
    );
  }

  if (!user) return null;

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
            <Logo size="sm" />
            {currentSpace && (
              <span className="hidden sm:inline-flex items-center text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
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
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar - Optimized for small screens */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 md:hidden safe-area-inset">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                            (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 touch-target-sm",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <Icon className={cn(
                  "h-5 w-5 relative z-10 transition-transform",
                  isActive && "scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[9px] font-semibold mt-0.5 relative z-10",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
