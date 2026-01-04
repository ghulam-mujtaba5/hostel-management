/**
 * Production Analytics & Event Tracking
 * 
 * Comprehensive analytics system for tracking user behavior, 
 * business metrics, and feature usage.
 */

type EventCategory = 
  | 'auth'
  | 'navigation' 
  | 'task'
  | 'space'
  | 'user'
  | 'error'
  | 'performance'
  | 'engagement'
  | 'conversion';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  pageUrl: string;
}

interface UserProperties {
  userId?: string;
  email?: string;
  plan?: string;
  spacesCount?: number;
  createdAt?: string;
  lastActive?: string;
  [key: string]: unknown;
}

class Analytics {
  private static instance: Analytics;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private userProperties: UserProperties = {};
  private isEnabled: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  private constructor() {
    this.sessionId = this.generateSessionId();
    
    if (typeof window !== 'undefined') {
      this.startFlushInterval();
      this.setupPageVisibilityHandler();
      this.trackPageView();
    }
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private setupPageVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  // Enable/disable analytics (for GDPR compliance)
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.eventQueue = [];
    }
  }

  // Identify user
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties, userId };
    
    this.track('user', 'identify', undefined, undefined, properties);
  }

  // Clear user identity (on logout)
  clearIdentity(): void {
    this.userId = undefined;
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
  }

  // Core tracking method
  track(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      metadata,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
    };

    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  // Page view tracking
  trackPageView(pageName?: string): void {
    if (typeof window === 'undefined') return;
    
    this.track('navigation', 'page_view', pageName || window.location.pathname, undefined, {
      referrer: document.referrer,
      title: document.title,
    });
  }

  // Auth events
  trackAuth = {
    login: (method: 'email' | 'google' | 'github') => {
      this.track('auth', 'login', method);
    },
    logout: () => {
      this.track('auth', 'logout');
    },
    signup: (method: 'email' | 'google' | 'github') => {
      this.track('auth', 'signup', method);
    },
    passwordReset: () => {
      this.track('auth', 'password_reset');
    },
  };

  // Task events
  trackTask = {
    create: (taskCategory: string) => {
      this.track('task', 'create', taskCategory);
    },
    complete: (taskCategory: string, points: number) => {
      this.track('task', 'complete', taskCategory, points);
    },
    assign: (taskCategory: string) => {
      this.track('task', 'assign', taskCategory);
    },
    skip: (taskCategory: string, reason?: string) => {
      this.track('task', 'skip', taskCategory, undefined, { reason });
    },
    proofUpload: (taskId: string) => {
      this.track('task', 'proof_upload', taskId);
    },
  };

  // Space events
  trackSpace = {
    create: (type: string) => {
      this.track('space', 'create', type);
    },
    join: (inviteCode: string) => {
      this.track('space', 'join', inviteCode);
    },
    leave: (spaceId: string) => {
      this.track('space', 'leave', spaceId);
    },
    inviteSent: (count: number) => {
      this.track('space', 'invite_sent', undefined, count);
    },
  };

  // Engagement events
  trackEngagement = {
    featureUsed: (featureName: string) => {
      this.track('engagement', 'feature_used', featureName);
    },
    buttonClick: (buttonName: string, context?: string) => {
      this.track('engagement', 'button_click', buttonName, undefined, { context });
    },
    shareContent: (contentType: string, platform?: string) => {
      this.track('engagement', 'share', contentType, undefined, { platform });
    },
    viewLeaderboard: () => {
      this.track('engagement', 'view_leaderboard');
    },
    viewInsights: () => {
      this.track('engagement', 'view_insights');
    },
  };

  // Error tracking (supplement to monitoring.ts)
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track('error', 'error_occurred', error.message, undefined, {
      errorName: error.name,
      stack: error.stack?.substring(0, 500),
      ...context,
    });
  }

  // Performance tracking (supplement to monitoring.ts)
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', metric, unit, value);
  }

  // Conversion tracking
  trackConversion = {
    trialStarted: () => {
      this.track('conversion', 'trial_started');
    },
    subscriptionStarted: (plan: string, value: number) => {
      this.track('conversion', 'subscription_started', plan, value);
    },
    firstTask: () => {
      this.track('conversion', 'first_task_completed');
    },
    firstSpace: () => {
      this.track('conversion', 'first_space_created');
    },
  };

  // Flush events to backend
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, send to analytics backend
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events,
            userProperties: this.userProperties,
          }),
          keepalive: true,
        });
      } else {
        // Development: log to console
        console.debug('[Analytics]', events);
      }
    } catch (error) {
      // Re-queue events on failure (with limit to prevent memory issues)
      if (this.eventQueue.length < this.MAX_QUEUE_SIZE * 2) {
        this.eventQueue = [...events, ...this.eventQueue];
      }
      console.error('Analytics flush failed:', error);
    }
  }

  // Get current session data for debugging
  getDebugInfo(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queueLength: this.eventQueue.length,
      isEnabled: this.isEnabled,
      userProperties: this.userProperties,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Convenience exports
export const trackPageView = (pageName?: string) => analytics.trackPageView(pageName);
export const trackEvent = (
  category: EventCategory,
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>
) => analytics.track(category, action, label, value, metadata);
export const identifyUser = (userId: string, properties?: UserProperties) => 
  analytics.identify(userId, properties);
export const clearIdentity = () => analytics.clearIdentity();

// Hook for React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackAuth: analytics.trackAuth,
    trackTask: analytics.trackTask,
    trackSpace: analytics.trackSpace,
    trackEngagement: analytics.trackEngagement,
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackConversion: analytics.trackConversion,
    identify: analytics.identify.bind(analytics),
    clearIdentity: analytics.clearIdentity.bind(analytics),
    setEnabled: analytics.setEnabled.bind(analytics),
  };
}
