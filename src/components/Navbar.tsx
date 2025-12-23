"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, MessageSquare, Shield, BookOpen, Bell, Search, Menu, X, Settings, LogOut, ChevronDown, Building, Users, Zap } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/tasks/pick", label: "Pick", icon: Sparkles, highlight: true },
    { href: "/leaderboard", label: "Rank", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const desktopLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/queue", label: "Queue", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/guide", label: "Help", icon: BookOpen },
  ];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 py-3 md:px-6",
          scrolled ? "py-2" : "py-4"
        )}
        role="banner"
      >
        <div className="max-w-7xl mx-auto">
          <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 py-2.5 md:px-6 transition-all duration-500",
              scrolled 
                ? "bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 border border-border/50" 
                : "bg-background/50 backdrop-blur-md border border-border/30"
            )}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <Logo size="sm" variant={scrolled ? "minimal" : "default"} animated={!scrolled} />
              {user && currentSpace && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-border/50"
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                    <Building className="h-3 w-3 text-primary" />
                    <span className="text-xs font-bold text-primary tracking-wide">
                      {currentSpace.name}
                    </span>
                  </div>
                </motion.div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5 bg-muted/50 rounded-xl p-1">
              {desktopLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || 
                  (link.href !== '/' && pathname.startsWith(link.href));
                
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "relative gap-2 rounded-lg transition-all duration-300 px-3.5 h-9",
                          isActive 
                            ? "text-primary bg-background shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
                        <span className="font-medium text-sm">{link.label}</span>
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
              
              {/* Admin Link */}
              <Link href="/admin">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative gap-2 rounded-lg transition-all duration-300 px-3.5 h-9",
                      pathname.startsWith('/admin')
                        ? "text-primary bg-background shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="font-medium text-sm">Admin</span>
                  </Button>
                </motion.div>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Notifications */}
              {user && <NotificationBell />}

              {/* Theme Toggle */}
              {mounted && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors h-9 w-9"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={theme}
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </motion.div>
              )}

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-border/50 mx-1" />

              {/* Profile / Auth */}
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-all group"
                  >
                    <div className="relative">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-background">
                        {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300",
                      profileMenuOpen && "rotate-180"
                    )} />
                  </motion.button>
                  
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/20 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="p-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-b border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                              {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{profile?.full_name || profile?.username}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="p-2">
                          <Link href="/profile" onClick={() => setProfileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                              <User className="h-4 w-4" />
                              My Profile
                            </Button>
                          </Link>
                          <Link href="/spaces" onClick={() => setProfileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                              <Building className="h-4 w-4" />
                              My Spaces
                            </Button>
                          </Link>
                        </div>
                        
                        {/* Sign Out */}
                        <div className="p-2 border-t border-border/50 bg-muted/30">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-3 h-11 rounded-xl font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              signOut();
                              setProfileMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button asChild size="sm" variant="ghost" className="hidden sm:flex rounded-xl font-medium">
                  <Link href="/login">Sign In</Link>
                </Button>
              )}

              {/* CTA Button */}
              <Button asChild size="sm" variant="glow" className="hidden sm:flex rounded-xl gap-2 px-4 h-9 font-bold">
                <Link href="/tasks/pick">
                  <Zap className="h-4 w-4" />
                  Pick Task
                </Link>
              </Button>
            </div>
          </motion.nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="mx-3 mb-3">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="bg-background/80 backdrop-blur-xl rounded-[1.75rem] p-1.5 shadow-2xl shadow-black/20 border border-border/50"
          >
            <div className="flex items-center justify-around relative">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || 
                  (link.href !== '/' && link.href !== '/tasks/pick' && pathname.startsWith(link.href));
                
                if (link.highlight) {
                  return (
                    <Link key={link.href} href={link.href} className="relative -mt-6">
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 3 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-blue-600 text-white shadow-xl shadow-primary/40 ring-[3px] ring-background">
                          <Icon className="h-6 w-6" />
                        </div>
                        {/* Pulse effect */}
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-2xl bg-primary/30"
                        />
                      </motion.div>
                    </Link>
                  );
                }

                return (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] relative"
                  >
                    <motion.div 
                      className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        isActive 
                          ? "text-primary bg-primary/15" 
                          : "text-muted-foreground"
                      )}
                      whileTap={{ scale: 0.85 }}
                    >
                      <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                    </motion.div>
                    <span className={cn(
                      "text-[10px] font-bold tracking-wide",
                      isActive ? "text-primary" : "text-muted-foreground/80"
                    )}>
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicatorMobile"
                        className="absolute bottom-0 h-1 w-6 rounded-full bg-gradient-to-r from-primary to-purple-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </nav>
    </>
  );
}
