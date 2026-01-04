"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getRandomQuote, 
  getTimeBasedGreeting, 
  getDaySpecificMotivation,
  Quote 
} from "@/lib/quotes";
import { Sparkles, Quote as QuoteIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface IslamicQuoteCardProps {
  className?: string;
  variant?: 'default' | 'compact' | 'banner';
  showRefresh?: boolean;
  category?: Quote['category'];
}

export function IslamicQuoteCard({ 
  className, 
  variant = 'default',
  showRefresh = true,
  category
}: IslamicQuoteCardProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setQuote(getRandomQuote(category));
  }, [category]);

  const refreshQuote = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(getRandomQuote(category));
      setIsRefreshing(false);
    }, 300);
  };

  if (!quote) return null;

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
          "border border-emerald-500/20 rounded-2xl p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.p
                key={quote.text}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-foreground leading-relaxed"
              >
                "{quote.text}"
              </motion.p>
            </AnimatePresence>
            {quote.source && (
              <p className="text-xs text-muted-foreground mt-1">
                — {quote.source}
              </p>
            )}
          </div>
          {showRefresh && (
            <button
              onClick={refreshQuote}
              className="p-2 rounded-lg hover:bg-emerald-500/10 transition-colors shrink-0"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                "h-4 w-4 text-emerald-600 dark:text-emerald-400",
                isRefreshing && "animate-spin"
              )} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className
        )}
      >
        <QuoteIcon className="h-3 w-3 shrink-0" />
        <AnimatePresence mode="wait">
          <motion.span
            key={quote.text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="line-clamp-1"
          >
            {quote.text}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl p-6",
        "bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5",
        "border border-emerald-500/20",
        className
      )}
    >
      {/* Decorative pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="islamic-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M10 0L20 10L10 20L0 10Z" fill="currentColor" />
          </pattern>
          <rect width="100" height="100" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shrink-0">
            <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <div className="flex-1 space-y-3">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quote.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-foreground leading-relaxed"
              >
                "{quote.text}"
              </motion.blockquote>
            </AnimatePresence>
            
            {quote.source && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-emerald-600 dark:text-emerald-400 font-medium"
              >
                — {quote.source}
              </motion.p>
            )}
          </div>
        </div>

        {showRefresh && (
          <div className="flex justify-end mt-4">
            <button
              onClick={refreshQuote}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl",
                "text-xs font-medium text-emerald-600 dark:text-emerald-400",
                "hover:bg-emerald-500/10 transition-colors"
              )}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              New Quote
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Daily greeting component
export function DailyGreeting({ username }: { username?: string | null }) {
  const greeting = getTimeBasedGreeting();
  const dayMotivation = getDaySpecificMotivation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      <h1 className="text-2xl font-bold tracking-tight">
        {greeting}
      </h1>
      {username && (
        <p className="text-lg text-primary font-semibold">
          Welcome back, {username}! 👋
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {dayMotivation}
      </p>
    </motion.div>
  );
}

// Bismillah header for task creation
export function BismillahHeader({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "text-center py-4 px-6 rounded-2xl",
        "bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5",
        "border border-emerald-500/10",
        className
      )}
    >
      <p className="text-2xl font-arabic text-emerald-600 dark:text-emerald-400 mb-1">
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
      </p>
      <p className="text-xs text-muted-foreground">
        In the name of Allah, the Most Gracious, the Most Merciful
      </p>
    </motion.div>
  );
}
