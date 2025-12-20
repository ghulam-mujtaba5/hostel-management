"use client";

import { Info } from "lucide-react";
import { motion } from "framer-motion";

export function BetaBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-primary/10 backdrop-blur-md border-b border-primary/20 py-1.5 px-4 z-[100]">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary">
        <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[9px]">
          <Info className="h-3 w-3" />
          BETA
        </div>
        <span className="opacity-90">
          Testing Phase: Some features may be incomplete
        </span>
      </div>
    </div>
  );
}
