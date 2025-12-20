"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Flame, Star, Zap } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  showAnimation?: boolean;
}

export function StreakBadge({ streak, showAnimation = false }: StreakBadgeProps) {
  const [animated, setAnimated] = useState(showAnimation);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setAnimated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  if (streak === 0) return null;

  const getStreakColor = () => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    return '✨';
  };

  return (
    <motion.div
      initial={animated ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${getStreakColor()} text-white font-medium text-sm shadow-lg`}
    >
      <motion.span
        animate={animated ? { 
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: 0.5, repeat: animated ? 2 : 0 }}
      >
        {getStreakEmoji()}
      </motion.span>
      <span>{streak} day streak</span>
    </motion.div>
  );
}

// Achievement/Badge Types
export type BadgeType = 
  | 'first_task'
  | 'hard_worker'
  | 'streak_7'
  | 'streak_30'
  | 'team_player'
  | 'early_bird'
  | 'night_owl'
  | 'perfectionist'
  | 'washroom_warrior'
  | 'kitchen_king'
  | 'speed_demon'
  | 'consistent';

interface BadgeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Record<BadgeType, BadgeConfig> = {
  first_task: {
    name: 'First Steps',
    description: 'Completed your first task',
    icon: '🌟',
    color: 'from-yellow-400 to-yellow-600',
    rarity: 'common',
  },
  hard_worker: {
    name: 'Hard Worker',
    description: 'Completed 10 hard tasks',
    icon: '💪',
    color: 'from-red-500 to-pink-600',
    rarity: 'rare',
  },
  streak_7: {
    name: 'Week Warrior',
    description: '7 day streak',
    icon: '🔥',
    color: 'from-orange-500 to-red-500',
    rarity: 'rare',
  },
  streak_30: {
    name: 'Monthly Legend',
    description: '30 day streak',
    icon: '⚡',
    color: 'from-purple-500 to-pink-500',
    rarity: 'legendary',
  },
  team_player: {
    name: 'Team Player',
    description: 'Helped verify 5 tasks',
    icon: '🤝',
    color: 'from-blue-500 to-cyan-500',
    rarity: 'common',
  },
  early_bird: {
    name: 'Early Bird',
    description: 'Completed tasks before 8am',
    icon: '🌅',
    color: 'from-amber-400 to-orange-500',
    rarity: 'rare',
  },
  night_owl: {
    name: 'Night Owl',
    description: 'Completed tasks after midnight',
    icon: '🦉',
    color: 'from-indigo-600 to-purple-700',
    rarity: 'rare',
  },
  perfectionist: {
    name: 'Perfectionist',
    description: 'All tasks verified first try',
    icon: '✨',
    color: 'from-emerald-400 to-teal-600',
    rarity: 'epic',
  },
  washroom_warrior: {
    name: 'Washroom Warrior',
    description: 'Cleaned washroom 10 times',
    icon: '🚿',
    color: 'from-blue-400 to-blue-600',
    rarity: 'rare',
  },
  kitchen_king: {
    name: 'Kitchen King',
    description: 'Kitchen duty 10 times',
    icon: '👑',
    color: 'from-yellow-500 to-amber-600',
    rarity: 'rare',
  },
  speed_demon: {
    name: 'Speed Demon',
    description: 'Completed task in under 5 mins',
    icon: '⚡',
    color: 'from-cyan-400 to-blue-500',
    rarity: 'epic',
  },
  consistent: {
    name: 'Consistency King',
    description: 'Tasks every week for a month',
    icon: '📊',
    color: 'from-green-500 to-emerald-600',
    rarity: 'epic',
  },
};

interface BadgeDisplayProps {
  type: BadgeType;
  earned?: boolean;
  showUnlock?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({ type, earned = true, showUnlock = false, size = 'md' }: BadgeDisplayProps) {
  const badge = BADGES[type];
  const [unlocking, setUnlocking] = useState(showUnlock);

  useEffect(() => {
    if (showUnlock) {
      const timer = setTimeout(() => setUnlocking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showUnlock]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50',
  };

  return (
    <motion.div
      initial={unlocking ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        animate={unlocking ? { 
          boxShadow: [
            '0 0 0 0 rgba(255,215,0,0)',
            '0 0 20px 10px rgba(255,215,0,0.6)',
            '0 0 0 0 rgba(255,215,0,0)'
          ]
        } : {}}
        transition={{ duration: 1, repeat: unlocking ? 2 : 0 }}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex items-center justify-center 
          bg-gradient-to-br ${earned ? badge.color : 'from-gray-300 to-gray-400'}
          shadow-lg ${earned ? rarityGlow[badge.rarity] : ''}
          ${!earned ? 'opacity-40 grayscale' : ''}
        `}
      >
        <span className={earned ? '' : 'opacity-50'}>{badge.icon}</span>
      </motion.div>
      <div className="text-center">
        <p className={`font-medium text-sm ${!earned ? 'text-muted-foreground' : ''}`}>
          {badge.name}
        </p>
        {size !== 'sm' && (
          <p className="text-xs text-muted-foreground">{badge.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// Badge unlock popup
interface BadgeUnlockPopupProps {
  type: BadgeType;
  onClose: () => void;
}

export function BadgeUnlockPopup({ type, onClose }: BadgeUnlockPopupProps) {
  const badge = BADGES[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.1, 1.1, 1.1, 1.1, 1]
            }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <BadgeDisplay type={type} size="lg" showUnlock />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Badge Unlocked!
            </h2>
            <p className="text-muted-foreground mt-2">{badge.description}</p>

            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium
              ${badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800' : ''}
              ${badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' : ''}
              ${badge.rarity === 'common' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Animated Points Counter
interface PointsCounterProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function PointsCounter({ points, size = 'md', animate = true }: PointsCounterProps) {
  const [displayPoints, setDisplayPoints] = useState(animate ? 0 : points);

  useEffect(() => {
    if (!animate) {
      setDisplayPoints(points);
      return;
    }

    let current = displayPoints;
    const increment = Math.ceil((points - current) / 20);
    const interval = setInterval(() => {
      current += increment;
      if (current >= points) {
        current = points;
        clearInterval(interval);
      }
      setDisplayPoints(current);
    }, 30);

    return () => clearInterval(interval);
  }, [points, animate]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <motion.div
      key={points}
      initial={animate ? { scale: 1.2 } : false}
      animate={{ scale: 1 }}
      className={`font-bold ${sizeClasses[size]} bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent`}
    >
      {displayPoints.toLocaleString()}
    </motion.div>
  );
}

// Level Progress Bar
interface LevelProgressProps {
  currentPoints: number;
  currentLevel: number;
  pointsForNextLevel: number;
}

export function LevelProgress({ currentPoints, currentLevel, pointsForNextLevel }: LevelProgressProps) {
  const progress = (currentPoints / pointsForNextLevel) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">Level {currentLevel}</span>
        </div>
        <span className="text-muted-foreground">
          {currentPoints} / {pointsForNextLevel}
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full"
        />
      </div>
    </div>
  );
}

// Calculate level from points
export function calculateLevel(points: number): { level: number; pointsForNextLevel: number; currentLevelPoints: number } {
  // Level formula: each level requires progressively more points
  // Level 1: 0-50, Level 2: 51-150, Level 3: 151-300, etc.
  let level = 1;
  let threshold = 50;
  let previousThreshold = 0;

  while (points >= threshold) {
    level++;
    previousThreshold = threshold;
    threshold += 50 * level;
  }

  return {
    level,
    pointsForNextLevel: threshold - previousThreshold,
    currentLevelPoints: points - previousThreshold,
  };
}
