"use client";

import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
}

export function Logo({ className, size = "md", showText = true, animated = true }: LogoProps) {
  const sizes = {
    sm: { icon: "h-4 w-4", container: "h-8 w-8", text: "text-lg", subtext: "text-[8px]" },
    md: { icon: "h-5 w-5", container: "h-10 w-10", text: "text-xl", subtext: "text-[9px]" },
    lg: { icon: "h-7 w-7", container: "h-14 w-14", text: "text-2xl", subtext: "text-[10px]" },
    xl: { icon: "h-10 w-10", container: "h-20 w-20", text: "text-4xl", subtext: "text-xs" },
  };

  const IconWrapper = animated ? motion.div : 'div';
  const iconAnimationProps = animated ? {
    initial: { rotate: -5 },
    whileHover: { rotate: 0, scale: 1.05 },
    transition: { type: "spring" as const, stiffness: 300 }
  } : {};

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-indigo-600 shadow-xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500",
        sizes[size].container
      )}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-80" />
        
        <IconWrapper className="relative z-10" {...iconAnimationProps}>
          <Building2 className={cn("text-white drop-shadow-sm", sizes[size].icon)} strokeWidth={2.5} />
        </IconWrapper>
        
        {/* Sparkle accent */}
        {animated && (
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
              rotate: [0, 15, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-1 -right-1"
          >
            <div className="relative">
              <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300 drop-shadow-lg" />
              <div className="absolute inset-0 blur-sm bg-amber-300/50 rounded-full" />
            </div>
          </motion.div>
        )}

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-black tracking-tight bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent",
            sizes[size].text
          )}>
            HostelMate
          </span>
          <span className={cn(
            "font-bold text-muted-foreground/70 tracking-[0.2em] uppercase mt-0.5",
            sizes[size].subtext
          )}>
            Smart Living Platform
          </span>
        </div>
      )}
    </div>
  );
}
