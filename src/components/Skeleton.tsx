"use client";

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle' | 'button' | 'card';
  width?: string;
  height?: string;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'rectangle',
  width,
  height,
  animate = true,
  ...props
}: SkeletonProps) {
  const baseStyles = cn(
    'rounded-xl bg-muted/50 relative overflow-hidden',
    animate && 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent dark:after:via-white/5'
  );
  
  const variantStyles = {
    text: 'h-4 w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full',
    rectangle: 'h-[200px] w-full',
    button: 'h-12 w-28 rounded-xl',
    card: 'h-32 w-full rounded-2xl'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-5 border border-border/50 rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="rectangle" className="h-14 w-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="70%" height="20px" />
          <div className="flex gap-2">
            <Skeleton variant="text" width="60px" height="18px" className="rounded-full" />
            <Skeleton variant="text" width="80px" height="18px" className="rounded-full" />
          </div>
        </div>
        <Skeleton variant="button" className="h-11 w-24" />
      </div>
    </motion.div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="flex items-center gap-4 flex-1">
        <Skeleton variant="text" className="h-8 w-8 rounded-lg" />
        <Skeleton variant="circle" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height="16px" />
          <Skeleton variant="text" width="25%" height="12px" />
        </div>
      </div>
      <Skeleton variant="text" width="50px" height="24px" />
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 pb-24">
      {/* Welcome Card Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton variant="card" className="h-32 rounded-[2rem]" />
        </div>
        <Skeleton variant="card" className="h-32 rounded-[2rem]" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton variant="card" className="lg:col-span-2 h-36 rounded-[2rem]" />
        <Skeleton variant="card" className="h-36 rounded-[2rem]" />
        <Skeleton variant="card" className="h-36 rounded-[2rem]" />
      </div>

      {/* Tasks Section Skeleton */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <Skeleton variant="text" width="200px" height="28px" />
            <Skeleton variant="text" width="80px" height="20px" />
          </div>
          <div className="space-y-4">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        </div>
        
        <div className="space-y-6">
          <Skeleton variant="card" className="h-40 rounded-[2rem]" />
          <div className="space-y-3">
            <LeaderboardSkeleton />
            <LeaderboardSkeleton />
            <LeaderboardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-10 pb-24">
      {/* Header Skeleton */}
      <div className="rounded-[2rem] overflow-hidden border border-border/50 bg-white dark:bg-slate-900 shadow-sm">
        <Skeleton variant="rectangle" className="h-40 rounded-none" />
        <div className="px-8 pb-8 pt-20 text-center space-y-4">
          <div className="flex justify-center -mt-24">
            <Skeleton variant="circle" className="h-32 w-32 rounded-3xl border-4 border-white dark:border-slate-900" />
          </div>
          <Skeleton variant="text" width="200px" height="32px" className="mx-auto" />
          <Skeleton variant="text" width="160px" height="16px" className="mx-auto" />
          <div className="flex justify-center gap-2">
            <Skeleton variant="text" width="80px" height="24px" className="rounded-full" />
            <Skeleton variant="text" width="80px" height="24px" className="rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton variant="card" className="md:col-span-2 h-40 rounded-[2rem]" />
        <Skeleton variant="card" className="h-40 rounded-[2rem]" />
      </div>
    </div>
  );
}

export function SpacesSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-6 border border-border/50 rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangle" className="h-16 w-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height="24px" />
              <Skeleton variant="text" width="40%" height="16px" />
            </div>
            <Skeleton variant="button" className="h-10 w-20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
