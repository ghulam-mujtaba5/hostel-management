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
  const [open, setOpen] = useState(false);

  const handleExit = async () => {
    if (onExit) return onExit();
    try {
      await fetch('/api/admin/session', { method: 'DELETE' });
    } finally {
      window.location.href = '/';
    }
  };

  const Sidebar = (
    <div className="h-full w-72 bg-background/70 backdrop-blur-xl border-r border-border/50">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Admin Portal</div>
            <div className="text-xl font-extrabold tracking-tight">HostelMate</div>
          </div>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={handleExit} title="Exit admin">
              <LogOut className="h-4 w-4" />
            </Button>
        </div>

        <div className="mt-6 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border/50 bg-muted/30 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tip</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Use Feedback to triage issues and reply to users quickly.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="text-sm font-extrabold tracking-tight">{title ?? "Admin"}</div>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={handleExit}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="absolute left-0 top-0 bottom-0"
              onClick={(e) => e.stopPropagation()}
            >
              {Sidebar}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden lg:flex fixed inset-y-0 left-0">{Sidebar}</div>

      <div className="lg:pl-72">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
          {title && (
            <div className="hidden lg:block mb-8">
              <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Administration</div>
              <div className="text-3xl font-extrabold tracking-tight">{title}</div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
