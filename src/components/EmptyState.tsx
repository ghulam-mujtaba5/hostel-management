"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon, Sparkles, CheckSquare, Users, Trophy, MessageSquare, Calendar, Search, FileQuestion, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  minHeight?: string;
  variant?: 'default' | 'compact' | 'card' | 'inline';
  illustration?: 'tasks' | 'search' | 'members' | 'leaderboard' | 'feedback' | 'schedule' | 'generic';
}

// Pre-built illustrations for different empty states
const illustrations = {
  tasks: (
    <div className="relative">
      <div className="absolute -top-2 -left-4 w-16 h-16 bg-primary/5 rounded-2xl rotate-12" />
      <div className="absolute top-8 left-8 w-12 h-12 bg-purple-500/5 rounded-xl -rotate-6" />
      <CheckSquare className="h-16 w-16 text-primary relative z-10" />
    </div>
  ),
  search: (
    <div className="relative">
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl" />
      <Search className="h-16 w-16 text-blue-500 relative z-10" />
    </div>
  ),
  members: (
    <div className="relative">
      <div className="flex -space-x-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn(
            "w-12 h-12 rounded-full border-4 border-background flex items-center justify-center text-white font-bold",
            i === 1 ? "bg-primary" : i === 2 ? "bg-purple-500" : "bg-blue-500"
          )}>
            ?
          </div>
        ))}
      </div>
    </div>
  ),
  leaderboard: (
    <div className="relative">
      <Trophy className="h-16 w-16 text-yellow-500" />
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-2 -right-2"
      >
        <Sparkles className="h-6 w-6 text-yellow-400" />
      </motion.div>
    </div>
  ),
  feedback: (
    <div className="relative">
      <MessageSquare className="h-16 w-16 text-green-500" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <Plus className="h-4 w-4 text-white" />
      </div>
    </div>
  ),
  schedule: (
    <div className="relative">
      <Calendar className="h-16 w-16 text-blue-500" />
    </div>
  ),
  generic: (
    <div className="relative">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
    </div>
  )
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  minHeight = "60vh",
  variant = 'default',
  illustration
}: EmptyStateProps) {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';
  const isInline = variant === 'inline';

  if (isInline) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {action && (
          action.href ? (
            <Button size="sm" variant="ghost" asChild className="shrink-0">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={action.onClick} className="shrink-0">
              {action.label}
            </Button>
          )
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        isCompact ? "py-8" : "py-12",
        isCard && "bg-white dark:bg-slate-900 rounded-[2rem] border border-border/50 shadow-sm",
        !isCompact && !isCard && `min-h-[${minHeight}]`
      )}
    >
      {/* Animated Icon with Glow */}
      {(Icon || illustration) && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={cn(
            "relative mb-6",
            isCompact ? "mb-4" : "mb-8"
          )}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-2xl opacity-50" />
          
          {/* Icon container */}
          <div className={cn(
            "relative rounded-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center border border-primary/20",
            isCompact ? "w-20 h-20" : "w-32 h-32"
          )}>
            {illustration ? (
              illustrations[illustration] || illustrations.generic
            ) : (
              <motion.div
                animate={{ 
                  y: [0, -4, 0],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                {Icon && <Icon className={cn(
                  "text-primary",
                  isCompact ? "h-10 w-10" : "h-16 w-16"
                )} />}
              </motion.div>
            )}
            
            {/* Sparkle decorations */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "max-w-md space-y-3",
          isCompact ? "mb-4" : "mb-8"
        )}
      >
        <h2 className={cn(
          "font-bold tracking-tight",
          isCompact ? "text-xl" : "text-3xl"
        )}>
          {title}
        </h2>
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isCompact ? "text-sm" : "text-lg"
        )}>
          {description}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {action && (
          action.href ? (
            <Button 
              asChild 
              size={isCompact ? "default" : "lg"} 
              className="rounded-xl shadow-lg shadow-primary/20 min-h-[44px] gap-2"
            >
              <Link href={action.href}>
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button 
              size={isCompact ? "default" : "lg"} 
              className="rounded-xl shadow-lg shadow-primary/20 min-h-[44px] gap-2" 
              onClick={action.onClick}
            >
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}

        {secondaryAction && (
          secondaryAction.href ? (
            <Button 
              asChild 
              variant="outline" 
              size={isCompact ? "default" : "lg"} 
              className="rounded-xl min-h-[44px]"
            >
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size={isCompact ? "default" : "lg"} 
              className="rounded-xl min-h-[44px]" 
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )
        )}
      </motion.div>
    </motion.div>
  );
}

// Pre-built empty states for common scenarios
export function NoTasksEmptyState({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      illustration="tasks"
      title="No tasks yet!"
      description="Create your first task to start managing your hostel duties with your flatmates."
      action={{
        label: "Create Task",
        href: onCreateTask ? undefined : "/tasks/create",
        onClick: onCreateTask
      }}
      secondaryAction={{
        label: "Pick Available Tasks",
        href: "/tasks/pick"
      }}
    />
  );
}

export function NoSearchResultsEmptyState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
      action={onClear ? {
        label: "Clear Search",
        onClick: onClear
      } : undefined}
      variant="compact"
    />
  );
}

export function NoMembersEmptyState() {
  return (
    <EmptyState
      illustration="members"
      title="It's quiet here..."
      description="Invite your flatmates to join your space and start collaborating on tasks."
      action={{
        label: "Invite Flatmates",
        href: "/spaces"
      }}
    />
  );
}

export function NoLeaderboardEmptyState() {
  return (
    <EmptyState
      illustration="leaderboard"
      title="No rankings yet"
      description="Complete tasks to earn points and appear on the leaderboard!"
      action={{
        label: "Pick a Task",
        href: "/tasks/pick"
      }}
      variant="compact"
    />
  );
}

export function NoFeedbackEmptyState() {
  return (
    <EmptyState
      illustration="feedback"
      title="No feedback received"
      description="Complete tasks and help your flatmates to receive feedback and recognition."
      action={{
        label: "View Available Tasks",
        href: "/tasks/pick"
      }}
      variant="compact"
    />
  );
}
