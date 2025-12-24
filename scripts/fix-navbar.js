const fs = require('fs');
const path = require('path');

const content = `"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, Menu, X, LogOut, ChevronDown, Building, History } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, profile, currentSpace, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled ? "bg-background/80 backdrop-blur-md border-border" : "bg-transparent border-transparent py-2"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo & Space Name */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            {user && currentSpace && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium">
                <Building className="h-3 w-3 text-muted-foreground" />
                {currentSpace.name}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={cn("gap-2", isActive && "font-semibold")}
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pl-2 pr-3 rounded-full border border-border/50 hover:bg-muted/50"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(profile?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-popover border shadow-lg overflow-hidden p-1"
                    >
                      <div className="px-3 py-2 border-b mb-1">
                        <p className="text-sm font-medium truncate">{profile?.full_name || profile?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal">
                          <User className="h-4 w-4" /> Profile
                        </Button>
                      </Link>
                      <Link href="/spaces" onClick={() => setProfileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 font-normal">
                          <Building className="h-4 w-4" /> My Spaces
                        </Button>
                      </Link>
                      <div className="h-px bg-border my-1" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start gap-2 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button asChild size="sm" className="rounded-full px-6">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t pb-safe">
        <div className="flex items-center justify-around p-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <Link 
            href="/profile"
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[64px]",
              pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className={cn("h-5 w-5", pathname === "/profile" && "fill-current")} />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
`;

fs.writeFileSync(path.join(process.cwd(), 'src/components/Navbar.tsx'), content);
console.log('Navbar.tsx fixed');
