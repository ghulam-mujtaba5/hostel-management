"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, MessageSquare, Shield, BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/tasks/pick", label: "Pick", icon: Sparkles, highlight: true },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/guide", label: "Guide", icon: BookOpen },
    { href: "/admin", label: "Admin", icon: Shield },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-8 md:left-0 md:right-0 z-50">
      <div className="mx-auto max-w-md md:max-w-full">
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl md:rounded-none md:border-b md:border-x-0 md:border-t-0 p-2 md:px-8">
          <div className="flex items-center justify-around md:justify-between max-w-6xl mx-auto">
            <Link href="/" className="hidden md:flex items-center gap-2 group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                HostelMate
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
                BETA
              </span>
            </Link>
            
            <div className="flex w-full justify-around md:w-auto md:gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || 
                  (link.href !== '/' && link.href !== '/tasks/pick' && pathname.startsWith(link.href));
                
                if (link.highlight) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative -mt-8 md:mt-0"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center"
                      >
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-primary/40 ring-4 ring-background" 
                            : "bg-gradient-to-br from-primary to-purple-600 text-white shadow-primary/20 ring-4 ring-background"
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest mt-1.5 md:hidden",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {link.label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative group"
                  >
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 md:flex-row md:gap-2",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                      )}
                    >
                      <div className="relative">
                        <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "scale-110")} />
                        {isActive && (
                          <motion.div
                            layoutId="navIndicator"
                            className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary md:hidden"
                          />
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter md:text-sm md:normal-case md:tracking-normal">
                        {link.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Theme Toggle */}
            {mounted && (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? (
                        <Moon className="h-5 w-5" />
                      ) : (
                        <Sun className="h-5 w-5" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
