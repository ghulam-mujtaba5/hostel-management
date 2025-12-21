"use client";

import Link from "next/link";
import { Home, CheckSquare, User, Trophy, Moon, Sun, Sparkles, MessageSquare, Shield, BookOpen, Bell, Search, Menu, X, Settings, LogOut, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, profile, currentSpace, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
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
          <nav 
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 py-2.5 md:px-6 transition-all duration-500",
              scrolled 
                ? "glass-strong shadow-xl shadow-black/5 border-primary/10" 
                : "bg-background/60 backdrop-blur-md border border-border/40"
            )}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <Logo size="sm" animated={!scrolled} />
              {user && currentSpace && (
                <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-border/50">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-[10px] font-bold text-primary tracking-wider uppercase">
                    {currentSpace.name}
                  </span>
                </div>
              )}
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
                        "relative gap-2 rounded-xl transition-all duration-300 px-4 h-10",
                        isActive 
                          ? "text-primary bg-primary/10 hover:bg-primary/15" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="navIndicatorDesktop"
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-primary to-purple-600"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Admin Link - only show for admin users */}
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative gap-2 rounded-xl transition-all duration-300 px-4 h-10",
                    pathname.startsWith('/admin')
                      ? "text-primary bg-primary/10 hover:bg-primary/15" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span className="font-semibold text-sm">Admin</span>
                </Button>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors h-10 w-10"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              )}

              {/* Profile / Auth */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {(profile?.username?.[0] || profile?.full_name?.[0] || 'U').toUpperCase()}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      profileMenuOpen && "rotate-180"
                    )} />
                  </button>
                  
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card border border-border/50 shadow-xl p-2"
                      >
                        <div className="px-3 py-2 border-b border-border/50 mb-2">
                          <p className="font-semibold text-sm">{profile?.full_name || profile?.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setProfileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-xl">
                            <User className="h-4 w-4" />
                            Profile
                          </Button>
                        </Link>
                        <Link href="/preferences" onClick={() => setProfileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-xl">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Button>
                        </Link>
                        <div className="border-t border-border/50 mt-2 pt-2">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-3 h-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <Button asChild size="sm" className="hidden sm:flex rounded-xl">
                  <Link href="/login">Sign In</Link>
                </Button>
              )}

              {/* CTA Button */}
              <Button asChild size="sm" variant="premium" className="hidden sm:flex rounded-xl gap-2 px-5">
                <Link href="/tasks/pick">
                  <Sparkles className="h-4 w-4" />
                  Pick Task
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="mx-4 mb-4">
          <div className="glass-strong rounded-[2rem] p-2 shadow-2xl border border-border/30">
            <div className="flex items-center justify-around relative">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || 
                  (link.href !== '/' && link.href !== '/tasks/pick' && pathname.startsWith(link.href));
                
                if (link.highlight) {
                  return (
                    <Link key={link.href} href={link.href} className="relative -mt-8">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-600 text-white shadow-xl shadow-primary/40 ring-4 ring-background"
                      >
                        <Icon className="h-7 w-7" />
                      </motion.div>
                    </Link>
                  );
                }

                return (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="flex flex-col items-center gap-0.5 px-4 py-2.5 min-w-[60px] relative"
                  >
                    <motion.div 
                      className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground"
                      )}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                    </motion.div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wide",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicatorMobile"
                        className="absolute -bottom-0.5 h-1 w-8 rounded-full bg-gradient-to-r from-primary to-purple-600"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close profile menu */}
      {profileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </>
  );
}
