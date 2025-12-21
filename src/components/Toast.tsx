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
  type?: 'success' | 'error' | 'info' | 'warning';
}

function CustomToast({ emoji, title, subtitle, points, type = 'info' }: CustomToastProps) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg border"
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {points && (
        <div 
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-sm font-bold"
          aria-label={`Earned ${points} points`}
        >
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
          type="success"
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
          type="success"
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
          type="success"
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
          type="success"
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
          type="success"
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
          type="success"
        />
      ),
      { duration: 5000 }
    );
  },

  error: (message: string, subtitle?: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="❌"
          title={message}
          subtitle={subtitle}
          type="error"
        />
      ),
      { duration: 4000 }
    );
  },

  warning: (message: string, subtitle?: string) => {
    hotToast.custom(
      (t) => (
        <CustomToast
          emoji="⚠️"
          title={message}
          subtitle={subtitle}
          type="warning"
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
          type="info"
        />
      ),
      { duration: 3000 }
    );
  },

  loading: (message: string) => {
    return hotToast.custom(
      (t) => (
        <CustomToast
          emoji="⏳"
          title={message}
          type="info"
        />
      ),
      { duration: Infinity }
    );
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return hotToast.promise(promise, {
      loading: messages.loading,
      success: (data) => typeof messages.success === 'function' ? messages.success(data) : messages.success,
      error: (err) => typeof messages.error === 'function' ? messages.error(err) : messages.error,
    });
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
