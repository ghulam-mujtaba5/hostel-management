"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

// Animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideLeft = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scale = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const bounce = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    }
  },
  exit: { opacity: 0, scale: 0.3 },
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Motion wrapper components
interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce';
  delay?: number;
}

const variants = {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scale,
  bounce,
};

export const AnimatedDiv = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, variant = 'fadeIn', delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={variants[variant].initial}
        animate={variants[variant].animate}
        exit={variants[variant].exit}
        transition={{ duration: 0.3, delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedDiv.displayName = "AnimatedDiv";

// Animated list
interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Pulse animation
interface PulseProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function Pulse({ children, active = true, className = '' }: PulseProps) {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Shake animation
interface ShakeProps {
  children: ReactNode;
  trigger?: boolean;
  className?: string;
}

export function Shake({ children, trigger = false, className = '' }: ShakeProps) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Float animation
interface FloatProps {
  children: ReactNode;
  className?: string;
}

export function Float({ children, className = '' }: FloatProps) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide-in card
interface SlideInCardProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export function SlideInCard({ children, direction = 'up', delay = 0, className = '' }: SlideInCardProps) {
  const directionMap = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Progress ring
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className = '',
  children 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <motion.circle
          className="text-primary stroke-current"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
}

// Animated counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1, className = '' }: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={value}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

// Skeleton loader
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animate = true
}: SkeletonProps) {
  const variantClass = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div 
      className={cn(
        "bg-muted relative overflow-hidden",
        animate && "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent dark:after:via-white/5",
        variantClass[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

// Loading spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'gradient' | 'dots';
}

export function Spinner({ size = 'md', className = '', variant = 'default' }: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (variant === 'dots') {
    return (
      <div className={cn("flex gap-1 items-center justify-center", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className={cn(
              "rounded-full bg-primary",
              size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={cn("relative", sizeClass[size], className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-purple-500"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-1 rounded-full border-2 border-transparent border-b-purple-600 border-l-primary opacity-50"
        />
      </div>
    );
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        sizeClass[size],
        "border-2 border-muted border-t-primary rounded-full",
        className
      )}
    />
  );
}

// Pull to refresh indicator
interface PullToRefreshProps {
  refreshing: boolean;
  pullProgress: number; // 0-1
}

export function PullToRefreshIndicator({ refreshing, pullProgress }: PullToRefreshProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ 
        opacity: pullProgress > 0.1 ? 1 : 0, 
        y: refreshing ? 0 : Math.min(pullProgress * 50, 50) - 50
      }}
      className="absolute top-0 left-0 right-0 flex justify-center py-4"
    >
      <motion.div
        animate={refreshing ? { rotate: 360 } : { rotate: pullProgress * 180 }}
        transition={refreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        className="h-8 w-8 border-2 border-muted border-t-primary rounded-full"
      />
    </motion.div>
  );
}

// Swipeable card wrapper
interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function Swipeable({ children, onSwipeLeft, onSwipeRight, className = '' }: SwipeableProps) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x < -100 || (velocity.x < -500 && offset.x < 0)) {
          onSwipeLeft?.();
        } else if (offset.x > 100 || (velocity.x > 500 && offset.x > 0)) {
          onSwipeRight?.();
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
