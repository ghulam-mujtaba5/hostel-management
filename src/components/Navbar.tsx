"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, MessageSquare, Shield, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/tasks/pick", label: "Pick", icon: Sparkles, highlight: true },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const desktopLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/guide", label: "Guide", icon: BookOpen },
    { href: "/admin", label: "Admin", icon: Shield },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-4 md:px-8",
        scrolled ? "md:py-3" : "md:py-6"
      )}
    >
      <div className="max-w-7xl mx-auto">
        <div className={cn(
          "flex items-center justify-between bg-background/70 backdrop-blur-xl border border-border/50 shadow-lg rounded-2xl px-4 py-2 md:px-6 transition-all duration-300",
          scrolled && "shadow-primary/10 border-primary/20 bg-background/80"
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="sm" />
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary border border-primary/20 tracking-wider">
              BETA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || 
                (link.href !== '/' && pathname.startsWith(link.href));
              
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative gap-2 rounded-xl transition-all duration-300 px-4",
                      isActive 
                        ? "text-primary bg-primary/10 hover:bg-primary/20" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold">{link.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicatorDesktop"
                        className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-primary"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors h-10 w-10"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            )}
            <Button asChild size="sm" className="hidden sm:flex rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95">
              <Link href="/tasks/pick">
                <Sparkles className="mr-2 h-4 w-4" />
                Pick Task
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-background/90 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-[2rem] p-2 ring-1 ring-black/5">
          <div className="flex items-center justify-around relative">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || 
                (link.href !== '/' && link.href !== '/tasks/pick' && pathname.startsWith(link.href));
              
              if (link.highlight) {
                return (
                  <Link key={link.href} href={link.href} className="relative -mt-14">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/40 ring-8 ring-background"
                    >
                      <Icon className="h-8 w-8" />
                    </motion.div>
                  </Link>
                );
              }

              return (
                <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 px-3 py-2 min-w-[64px]">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}>
                    <Icon className={cn("h-6 w-6", isActive && "scale-110")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {link.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicatorMobile"
                      className="absolute bottom-1 h-1 w-6 rounded-full bg-primary"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
