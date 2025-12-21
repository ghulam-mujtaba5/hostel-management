/**
 * Production-grade notifications system
 */

import { toast } from 'sonner';
import { CheckCircle, AlertCircle, InfoIcon, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Notification manager
 */
export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  /**
   * Show success notification
   */
  success(message: string, description?: string, duration = 3000) {
    return this.notify('success', message, description, duration);
  }

  /**
   * Show error notification
   */
  error(message: string, description?: string, duration = 4000) {
    return this.notify('error', message, description, duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, description?: string, duration = 3500) {
    return this.notify('warning', message, description, duration);
  }

  /**
   * Show info notification
   */
  info(message: string, description?: string, duration = 3000) {
    return this.notify('info', message, description, duration);
  }

  /**
   * Show generic notification
   */
  notify(
    type: NotificationType,
    message: string,
    description?: string,
    duration = 3000,
    action?: Notification['action']
  ): string {
    const id = `notif_${Date.now()}_${Math.random()}`;

    // Show toast using sonner
    const toastOptions = {
      description,
      duration,
      action: action ? { label: action.label, onClick: action.onClick } : undefined,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
      default:
        toast(message, toastOptions);
    }

    // Store notification
    const notification: Notification = {
      id,
      type,
      message,
      description,
      duration,
      action,
    };

    this.notifications.set(id, notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration + 500);
    }

    // Notify listeners
    this.notifyListeners();

    return id;
  }

  /**
   * Remove notification
   */
  remove(id: string) {
    this.notifications.delete(id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications.clear();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    const notifications = this.getAll();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
}

/**
 * Singleton instance
 */
export const notificationManager = new NotificationManager();

/**
 * Convenience functions
 */
export const notify = {
  success: (message: string, description?: string) =>
    notificationManager.success(message, description),
  error: (message: string, description?: string) =>
    notificationManager.error(message, description),
  warning: (message: string, description?: string) =>
    notificationManager.warning(message, description),
  info: (message: string, description?: string) =>
    notificationManager.info(message, description),
};

/**
 * Task-specific notifications
 */
export const notifyTask = {
  created: (taskName: string) =>
    notify.success(`Task "${taskName}" created`, 'You can view it in the tasks list'),
  updated: (taskName: string) =>
    notify.success(`Task "${taskName}" updated`),
  deleted: (taskName: string) =>
    notify.success(`Task "${taskName}" deleted`),
  completed: (taskName: string) =>
    notify.success(`Great job!`, `You completed "${taskName}"`),
  assigned: (taskName: string, assignee: string) =>
    notify.info(`Task "${taskName}" assigned to ${assignee}`),
  error: (message: string) =>
    notify.error('Task operation failed', message),
};

/**
 * Space-specific notifications
 */
export const notifySpace = {
  created: (spaceName: string) =>
    notify.success(`Hostel "${spaceName}" created`, 'Start adding members and tasks'),
  updated: (spaceName: string) =>
    notify.success(`Hostel "${spaceName}" updated`),
  deleted: (spaceName: string) =>
    notify.success(`Hostel "${spaceName}" deleted`),
  memberAdded: (memberName: string) =>
    notify.info(`${memberName} joined your hostel`),
  memberRemoved: (memberName: string) =>
    notify.info(`${memberName} left your hostel`),
  error: (message: string) =>
    notify.error('Hostel operation failed', message),
};

/**
 * Auth-specific notifications
 */
export const notifyAuth = {
  signedin: () =>
    notify.success('Welcome back!', 'You have been signed in'),
  signedout: () =>
    notify.success('Signed out', 'See you next time'),
  registered: () =>
    notify.success('Account created!', 'Welcome to HostelMate'),
  error: (message: string) =>
    notify.error('Authentication failed', message),
};

/**
 * React hook for notifications
 */
import { useEffect, useState } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    setNotifications(notificationManager.getAll());

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    notifications,
    success: notificationManager.success.bind(notificationManager),
    error: notificationManager.error.bind(notificationManager),
    warning: notificationManager.warning.bind(notificationManager),
    info: notificationManager.info.bind(notificationManager),
    clear: notificationManager.clear.bind(notificationManager),
  };
}
