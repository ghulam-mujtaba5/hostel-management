"use client";

import { motion } from "framer-motion";
import { Home, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: "h-5 w-5", container: "h-8 w-8", text: "text-lg" },
    md: { icon: "h-6 w-6", container: "h-10 w-10", text: "text-xl" },
    lg: { icon: "h-8 w-8", container: "h-14 w-14", text: "text-3xl" },
  };

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300",
        sizes[size].container
      )}>
        <motion.div
          initial={{ rotate: -10 }}
          whileHover={{ rotate: 0, scale: 1.1 }}
          className="relative z-10"
        >
          <Home className={cn("text-white", sizes[size].icon)} />
        </motion.div>
        
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300" />
        </motion.div>

        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent",
            sizes[size].text
          )}>
            HostelMate
          </span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5">
            Smart Living
          </span>
        </div>
      )}
    </div>
  );
}
