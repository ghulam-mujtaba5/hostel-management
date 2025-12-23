"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, MessageSquare, Home, Users, Building2, BedDouble, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/hostels", label: "Hostels", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/accommodation", label: "Accommodation", icon: BedDouble },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/", label: "Back to App", icon: Home },
];

export function AdminShell({
  title,
  children,
  onExit,
}: {
  title?: string;
  children: React.ReactNode;
  onExit?: () => void;
}) {
  const pathname = usePathname();

  const handleExit = async () => {
    if (onExit) return onExit();
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">H</div>
            <div className="font-extrabold tracking-tight">{title ?? "Admin Portal"}</div>
          </div>
          <Button variant="ghost" size="sm" className="rounded-xl font-bold text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleExit}>
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer Navigation (Bottom Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    active && "bg-primary/10"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
