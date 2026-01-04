"use client";

import { Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "gradient" | "islamic";
  showText?: boolean;
  showTagline?: boolean;
}

export function Logo({ 
  className, 
  size = "md", 
  variant = "default",
  showText = true,
  showTagline = false
}: LogoProps) {
  const sizes = {
    sm: { icon: "h-4 w-4", container: "h-8 w-8 rounded-lg", text: "text-lg", tagline: "text-[9px]" },
    md: { icon: "h-5 w-5", container: "h-10 w-10 rounded-xl", text: "text-xl", tagline: "text-[10px]" },
    lg: { icon: "h-6 w-6", container: "h-12 w-12 rounded-xl", text: "text-2xl", tagline: "text-xs" },
  };

  const variantStyles = {
    default: "bg-primary text-primary-foreground",
    minimal: "bg-primary/10 text-primary",
    gradient: "bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/20",
    islamic: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20"
  };

  return (
    <div className={cn("flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <div className={cn(
        "relative flex items-center justify-center transition-colors",
        variantStyles[variant],
        sizes[size].container
      )}>
        <Building2 className={sizes[size].icon} strokeWidth={2.5} />
        {variant === 'islamic' && (
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
        )}
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn("text-foreground leading-tight", sizes[size].text)}>
            HostelMate
          </span>
          {showTagline && (
            <span className={cn("text-muted-foreground leading-tight", sizes[size].tagline)}>
              Manage with Barakah ✨
            </span>
          )}
        </div>
      )}
    </div>
  );
}
