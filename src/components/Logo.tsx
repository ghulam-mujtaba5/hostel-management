"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "default" | "minimal" | "gradient" | "monochrome" | "dark" | "light";
  showText?: boolean;
  showTagline?: boolean;
  animated?: boolean;
}

// Premium SVG Logo Mark - Abstract "H" + Home + Unity symbol
function LogoMark({ className, variant = "gradient" }: { className?: string; variant?: string }) {
  const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Color schemes based on variant
  const colors = {
    default: { primary: "#10B981", secondary: "#0D9488", accent: "#FBBF24" },
    gradient: { primary: "#10B981", secondary: "#0D9488", accent: "#FBBF24" },
    minimal: { primary: "currentColor", secondary: "currentColor", accent: "currentColor" },
    monochrome: { primary: "#1F2937", secondary: "#374151", accent: "#6B7280" },
    dark: { primary: "#F9FAFB", secondary: "#E5E7EB", accent: "#FBBF24" },
    light: { primary: "#10B981", secondary: "#0D9488", accent: "#FBBF24" },
  };
  
  const c = colors[variant as keyof typeof colors] || colors.gradient;
  const useGradient = variant === "gradient" || variant === "default";

  return (
    <svg 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HostelMate Logo"
    >
      <defs>
        {useGradient && (
          <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        )}
      </defs>
      
      {/* Abstract House/H mark - represents home, unity, and upward growth */}
      <path
        d="M24 4L6 18V44H18V30H30V44H42V18L24 4Z"
        fill={useGradient ? `url(#${gradientId})` : c.primary}
        fillOpacity="0.9"
      />
      
      {/* Inner geometric accent - represents structure and harmony */}
      <path
        d="M24 12L14 20V32H20V24H28V32H34V20L24 12Z"
        fill="white"
        fillOpacity="0.3"
      />
      
      {/* Sparkle accent - represents excellence (Ihsan) */}
      <circle cx="38" cy="10" r="3" fill={c.accent} />
      <circle cx="42" cy="6" r="1.5" fill={c.accent} fillOpacity="0.6" />
    </svg>
  );
}

export function Logo({ 
  className, 
  size = "md", 
  variant = "default",
  showText = true,
  showTagline = false,
  animated = false
}: LogoProps) {
  const sizes = {
    xs: { 
      icon: "h-5 w-5", 
      container: "h-6 w-6", 
      text: "text-sm font-bold", 
      tagline: "text-[8px]",
      gap: "gap-1.5"
    },
    sm: { 
      icon: "h-6 w-6", 
      container: "h-8 w-8", 
      text: "text-base font-bold", 
      tagline: "text-[9px]",
      gap: "gap-2"
    },
    md: { 
      icon: "h-8 w-8", 
      container: "h-10 w-10", 
      text: "text-lg font-bold", 
      tagline: "text-[10px]",
      gap: "gap-2.5"
    },
    lg: { 
      icon: "h-10 w-10", 
      container: "h-12 w-12", 
      text: "text-xl font-extrabold", 
      tagline: "text-xs",
      gap: "gap-3"
    },
    xl: { 
      icon: "h-12 w-12", 
      container: "h-14 w-14", 
      text: "text-2xl font-extrabold", 
      tagline: "text-sm",
      gap: "gap-3"
    },
    hero: { 
      icon: "h-16 w-16", 
      container: "h-20 w-20", 
      text: "text-3xl font-black", 
      tagline: "text-base",
      gap: "gap-4"
    },
  };

  const s = sizes[size];
  
  const LogoIcon = animated ? motion.div : "div";
  const animationProps = animated ? {
    whileHover: { scale: 1.05, rotate: 2 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 17 }
  } : {};

  return (
    <div className={cn("flex items-center tracking-tight select-none", s.gap, className)}>
      <LogoIcon 
        className={cn("relative flex-shrink-0", s.container)}
        {...(animated ? animationProps : {})}
      >
        <LogoMark className={cn("w-full h-full", s.icon)} variant={variant} />
      </LogoIcon>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={cn(
            "leading-none tracking-tight",
            s.text,
            variant === "dark" ? "text-white" : "text-foreground"
          )}>
            <span className="text-emerald-600 dark:text-emerald-400">Hostel</span>
            <span>Mate</span>
          </span>
          {showTagline && (
            <span className={cn(
              "leading-tight mt-0.5 font-medium",
              s.tagline,
              variant === "dark" ? "text-white/60" : "text-muted-foreground"
            )}>
              Live Better, Together
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Export standalone logo mark for favicons, app icons, etc.
export { LogoMark };

// Wordmark only version
export function LogoWordmark({ 
  className, 
  size = "md",
  variant = "default"
}: Omit<LogoProps, "showText" | "showTagline">) {
  const sizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    hero: "text-4xl"
  };
  
  return (
    <span className={cn(
      "font-extrabold tracking-tight",
      sizes[size],
      variant === "dark" ? "text-white" : "",
      className
    )}>
      <span className="text-emerald-600 dark:text-emerald-400">Hostel</span>
      <span className={variant === "dark" ? "text-white" : "text-foreground"}>Mate</span>
    </span>
  );
}
