"use client";

import { motion } from "framer-motion";
import { Building2, Sparkles, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  variant?: "default" | "minimal" | "gradient";
}

export function Logo({ 
  className, 
  size = "md", 
  showText = true, 
  animated = true,
  variant = "default" 
}: LogoProps) {
  const sizes = {
    xs: { icon: "h-3.5 w-3.5", container: "h-7 w-7 rounded-lg", text: "text-base", subtext: "text-[7px]", spark: "h-3 w-3" },
    sm: { icon: "h-4 w-4", container: "h-9 w-9 rounded-xl", text: "text-lg", subtext: "text-[8px]", spark: "h-3.5 w-3.5" },
    md: { icon: "h-5 w-5", container: "h-11 w-11 rounded-xl", text: "text-xl", subtext: "text-[9px]", spark: "h-4 w-4" },
    lg: { icon: "h-7 w-7", container: "h-14 w-14 rounded-2xl", text: "text-2xl", subtext: "text-[10px]", spark: "h-5 w-5" },
    xl: { icon: "h-10 w-10", container: "h-20 w-20 rounded-3xl", text: "text-4xl", subtext: "text-xs", spark: "h-6 w-6" },
  };

  const IconWrapper = animated ? motion.div : 'div';
  const iconAnimationProps = animated ? {
    initial: { rotate: -5 },
    whileHover: { rotate: 0, scale: 1.05 },
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  } : {};

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2 group", className)}>
        <div className={cn(
          "relative flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors",
          sizes[size].container
        )}>
          <Home className={cn("text-primary", sizes[size].icon)} strokeWidth={2} />
        </div>
        {showText && (
          <span className={cn("font-bold text-foreground", sizes[size].text)}>
            HostelMate
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center",
        "bg-gradient-to-br from-primary via-[#8b5cf6] to-[#6366f1]",
        "shadow-lg shadow-primary/25 group-hover:shadow-primary/40",
        "transition-all duration-500 group-hover:scale-[1.02]",
        sizes[size].container
      )}>
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/25 via-white/5 to-transparent" />
        
        {/* Icon */}
        <IconWrapper className="relative z-10" {...iconAnimationProps}>
          <Building2 className={cn("text-white drop-shadow-sm", sizes[size].icon)} strokeWidth={2.5} />
        </IconWrapper>
        
        {/* Sparkle accent */}
        {animated && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
              rotate: [0, 10, 0],
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-0.5 -right-0.5"
          >
            <div className="relative">
              <Sparkles className={cn("text-amber-300 fill-amber-300 drop-shadow-lg", sizes[size].spark)} />
              <div className="absolute inset-0 blur-sm bg-amber-300/40 rounded-full" />
            </div>
          </motion.div>
        )}

        {/* Hover shine effect */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" style={{ transitionProperty: 'opacity, transform' }} />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-extrabold tracking-tight",
            variant === "gradient" 
              ? "bg-gradient-to-r from-primary via-[#8b5cf6] to-[#6366f1] bg-clip-text text-transparent"
              : "text-foreground",
            sizes[size].text
          )}>
            HostelMate
          </span>
          <span className={cn(
            "font-semibold text-muted-foreground/60 tracking-[0.15em] uppercase mt-0.5",
            sizes[size].subtext
          )}>
            Smart Living
          </span>
        </div>
      )}
    </div>
  );
}
