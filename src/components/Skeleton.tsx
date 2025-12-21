"use client";

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle' | 'button';
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  variant = 'rectangle',
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseStyles = 'animate-pulse rounded-md bg-muted';
  
  const variantStyles = {
    text: 'h-4 w-full',
    circle: 'h-12 w-12 rounded-full',
    rectangle: 'h-[200px] w-full',
    button: 'h-10 w-24 rounded-lg'
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
    <div className="space-y-4 p-4 border border-border/50 rounded-lg">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
        </div>
        <Skeleton variant="circle" width="40px" height="40px" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="text" width="60px" height="20px" />
        <Skeleton variant="text" width="60px" height="20px" />
      </div>
      <Skeleton variant="button" width="100%" />
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circle" width="40px" height="40px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
          <Skeleton variant="text" width="30px" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-4">
        <Skeleton variant="text" width="40%" height="32px" />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" width="40%" height="32px" />
        <LeaderboardSkeleton />
      </div>
    </div>
  );
}
