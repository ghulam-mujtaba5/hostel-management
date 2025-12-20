"use client";

import { Toaster, toast as hotToast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Custom toast messages for different events
const MOTIVATIONAL_MESSAGES = {
  task_taken: [
    "You've got this! 💪",
    "Time to shine! ✨",
    "Let's make it happen!",
    "Champion in action! 🏆",
    "Go crush it! 🎯",
  ],
  task_completed: [
    "Nailed it! 🎉",
    "Awesome job! ⭐",
    "You're on fire! 🔥",
    "Keep slaying! 👑",
    "Incredible work! 💎",
  ],
  streak: [
    "Streak extended! 🔥",
    "Consistency is key! 📈",
    "Unstoppable! ⚡",
    "Keep the fire burning! 🔥",
  ],
  verification: [
    "Task verified! ✅",
    "Great teamwork! 🤝",
    "Community spirit! 💪",
  ],
  points: [
    "Points earned! 🌟",
    "Climbing the ranks! 📊",
    "Cha-ching! 💰",
  ],
};

function getRandomMessage(type: keyof typeof MOTIVATIONAL_MESSAGES): string {
  const messages = MOTIVATIONAL_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Custom toast component
interface CustomToastProps {
  emoji: string;
  title: string;
  subtitle?: string;
  points?: number;
}

function CustomToast({ emoji, title, subtitle, points }: CustomToastProps) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg border"
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {points && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-sm font-bold">
          +{points}
        </div>
      )}
    </motion.div>
  );
}

// Toast functions
export const toast = {
  success: (message: string, options?: { emoji?: string; subtitle?: string; points?: number }) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji={options?.emoji || '✅'}
          title={message}
          subtitle={options?.subtitle}
          points={options?.points}
        />
      ),
      { duration: 3000 }
    );
  },

  taskTaken: (taskTitle: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="🎯"
          title={getRandomMessage('task_taken')}
          subtitle={`Started: ${taskTitle}`}
        />
      ),
      { duration: 3000 }
    );
  },

  taskCompleted: (taskTitle: string, points: number) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="🎉"
          title={getRandomMessage('task_completed')}
          subtitle={`Completed: ${taskTitle}`}
          points={points}
        />
      ),
      { duration: 4000 }
    );
  },

  streak: (days: number) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="🔥"
          title={getRandomMessage('streak')}
          subtitle={`${days} days and counting!`}
        />
      ),
      { duration: 4000 }
    );
  },

  points: (amount: number, reason?: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="⭐"
          title={getRandomMessage('points')}
          subtitle={reason}
          points={amount}
        />
      ),
      { duration: 3000 }
    );
  },

  badge: (badgeName: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="🏆"
          title="New Badge Earned!"
          subtitle={badgeName}
        />
      ),
      { duration: 5000 }
    );
  },

  error: (message: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="❌"
          title={message}
        />
      ),
      { duration: 4000 }
    );
  },

  info: (message: string, subtitle?: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="ℹ️"
          title={message}
          subtitle={subtitle}
        />
      ),
      { duration: 3000 }
    );
  },
};

// Toast Provider Component
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
      }}
      containerStyle={{
        top: 80,
      }}
    />
  );
}
