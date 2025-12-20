"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 p-2 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 safe-area-inset-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around md:max-w-4xl md:justify-between">
        <Link href="/" className="hidden text-xl font-bold md:flex md:items-center md:gap-2 text-primary">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🏠
          </motion.span>
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            HostelMate
          </span>
        </Link>
        
        <div className="flex w-full justify-around md:w-auto md:gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || 
              (link.href !== '/' && link.href !== '/tasks/pick' && pathname.startsWith(link.href));
            
            if (link.highlight) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative -mt-4 md:mt-0"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center"
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
                      isActive 
                        ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-primary/40" 
                        : "bg-gradient-to-r from-primary/80 to-purple-600/80 text-white"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium mt-1",
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
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-all md:flex-row md:text-sm",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary md:hidden"
                      />
                    )}
                  </div>
                  <span>{link.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Desktop Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden md:flex"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </motion.div>
          </Button>
        )}
      </div>
    </nav>
  );
}
