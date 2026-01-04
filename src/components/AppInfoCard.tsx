"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Smartphone, ExternalLink, Info, FileText, Shield, 
  Mail, Heart, Sparkles, Github, Twitter, Globe,
  MessageCircle, HelpCircle, BookOpen, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsPWA } from "./PWAInstallBanner";

export function AppInfoCard() {
  const isPWA = useIsPWA();

  const links = [
    { href: "/guide", icon: BookOpen, label: "User Guide", external: false },
    { href: "/fairness-info", icon: Info, label: "How It Works", external: false },
    { href: "/feedback", icon: MessageCircle, label: "Send Feedback", external: false },
  ];

  const legalLinks = [
    { href: "#", icon: FileText, label: "Terms of Service" },
    { href: "#", icon: Shield, label: "Privacy Policy" },
  ];

  return (
    <div className="space-y-4">
      {/* App Info Card */}
      <Card className="border border-border/50 shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">HostelMate</h3>
              <p className="text-sm text-muted-foreground">Version 2.0.0</p>
              {isPWA && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                  <Smartphone className="h-3 w-3" />
                  Installed as App
                </span>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 mb-6">
            {links.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center">
                    <link.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{link.label}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Legal Links */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex flex-wrap gap-4">
              {legalLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <link.icon className="h-3 w-3" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Made with Love */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
          Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" /> for students
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1">
          © 2026 HostelMate. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

// Compact version for dashboard
export function AppInfoBanner() {
  return (
    <Link href="/profile">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "flex items-center justify-between p-4 rounded-2xl",
          "bg-gradient-to-r from-primary/5 to-purple-500/5",
          "border border-primary/10 cursor-pointer transition-all"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">HostelMate v2.0</p>
            <p className="text-xs text-muted-foreground">Smart Duty Management</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Star className="h-3.5 w-3.5 fill-primary" />
          Rate Us
        </div>
      </motion.div>
    </Link>
  );
}
