"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Celebration types
type CelebrationType = 
  | 'task_taken'
  | 'task_completed'
  | 'streak_milestone'
  | 'badge_earned'
  | 'first_task'
  | 'hard_task'
  | 'leaderboard_top'
  | 'weekly_goal';

interface CelebrationConfig {
  title: string;
  subtitle: string;
  emoji: string;
  confettiType: 'burst' | 'cannon' | 'fireworks' | 'stars' | 'rain';
  duration: number;
}

const celebrationConfigs: Record<CelebrationType, CelebrationConfig> = {
  task_taken: {
    title: "Let's Go!",
    subtitle: "You've got this! 💪",
    emoji: "🎯",
    confettiType: 'burst',
    duration: 2000,
  },
  task_completed: {
    title: "Amazing Work!",
    subtitle: "Task completed successfully!",
    emoji: "🎉",
    confettiType: 'cannon',
    duration: 3000,
  },
  streak_milestone: {
    title: "Streak Fire! 🔥",
    subtitle: "Keep the momentum going!",
    emoji: "⚡",
    confettiType: 'fireworks',
    duration: 4000,
  },
  badge_earned: {
    title: "Badge Unlocked!",
    subtitle: "You've earned a new achievement!",
    emoji: "🏆",
    confettiType: 'stars',
    duration: 3500,
  },
  first_task: {
    title: "First Step!",
    subtitle: "Your journey begins now!",
    emoji: "🌟",
    confettiType: 'stars',
    duration: 3000,
  },
  hard_task: {
    title: "Champion!",
    subtitle: "You conquered a tough one!",
    emoji: "💎",
    confettiType: 'fireworks',
    duration: 4000,
  },
  leaderboard_top: {
    title: "You're #1!",
    subtitle: "Top of the leaderboard!",
    emoji: "👑",
    confettiType: 'rain',
    duration: 5000,
  },
  weekly_goal: {
    title: "Weekly Hero!",
    subtitle: "Goal achieved this week!",
    emoji: "🎊",
    confettiType: 'fireworks',
    duration: 4000,
  },
};

// Confetti animation functions
const triggerConfetti = {
  burst: () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: Parameters<typeof confetti>[0]) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  },

  cannon: () => {
    const end = Date.now() + 2000;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  },

  fireworks: () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  },

  stars: () => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
      zIndex: 9999,
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'] as confetti.Shape[],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle'] as confetti.Shape[],
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  },

  rain: () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    let skew = 1;

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    (function frame() {
      const timeLeft = animationEnd - Date.now();
      const ticks = Math.max(200, 500 * (timeLeft / duration));
      skew = Math.max(0.8, skew - 0.001);

      confetti({
        particleCount: 1,
        startVelocity: 0,
        ticks: ticks,
        origin: {
          x: Math.random(),
          y: Math.random() * skew - 0.2,
        },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
        shapes: ['circle'] as confetti.Shape[],
        gravity: randomInRange(0.4, 0.6),
        scalar: randomInRange(0.4, 1),
        drift: randomInRange(-0.4, 0.4),
        zIndex: 9999,
      });

      if (timeLeft > 0) {
        requestAnimationFrame(frame);
      }
    })();
  },
};

interface CelebrationOverlayProps {
  type: CelebrationType;
  onComplete?: () => void;
  points?: number;
  customMessage?: string;
}

export function CelebrationOverlay({ 
  type, 
  onComplete, 
  points,
  customMessage 
}: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(true);
  const config = celebrationConfigs[type];

  useEffect(() => {
    // Trigger confetti
    triggerConfetti[config.confettiType]();

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, config.duration);

    return () => clearTimeout(timer);
  }, [config, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 10 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              {config.emoji}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
            >
              {config.title}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mt-2"
            >
              {customMessage || config.subtitle}
            </motion.p>

            {points && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-bold"
              >
                <span className="text-lg">+{points}</span>
                <span className="text-sm opacity-90">points</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Simple confetti trigger for quick celebrations
export function triggerQuickCelebration(type: 'burst' | 'stars' = 'burst') {
  triggerConfetti[type]();
}

// Hook for celebration management
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType;
    points?: number;
    customMessage?: string;
  } | null>(null);

  const celebrate = useCallback((
    type: CelebrationType, 
    options?: { points?: number; customMessage?: string }
  ) => {
    setCelebration({ type, ...options });
  }, []);

  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const CelebrationComponent = celebration ? (
    <CelebrationOverlay
      type={celebration.type}
      points={celebration.points}
      customMessage={celebration.customMessage}
      onComplete={clearCelebration}
    />
  ) : null;

  return { celebrate, CelebrationComponent };
}
