/**
 * Analytics tracking system
 */

import { CONFIG, isProduction } from './config';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

/**
 * Analytics manager
 */
export class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private spaceId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    if (typeof window !== 'undefined') {
      this.initializeGoogleAnalytics();
    }
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGoogleAnalytics() {
    if (typeof window === 'undefined' || !CONFIG.services.analytics.enabled) return;

    const gaId = CONFIG.services.analytics.googleAnalyticsId;
    if (!gaId) return;

    try {
      // Load GA script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
    } catch (error) {
      console.error('Error initializing Google Analytics:', error);
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  /**
   * Set space context
   */
  setSpace(spaceId: string) {
    this.spaceId = spaceId;
  }

  /**
   * Track event
   */
  trackEvent(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        spaceId: this.spaceId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Send to Google Analytics if configured
    if (CONFIG.services.analytics.enabled && typeof window !== 'undefined') {
      this.sendToGoogleAnalytics(name, event.properties);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', name, event.properties);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title: string) {
    this.trackEvent('page_view', { path, title });
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, details?: Record<string, any>) {
    this.trackEvent(`user_${action}`, details);
  }

  /**
   * Track task action
   */
  trackTaskAction(
    action: 'created' | 'updated' | 'deleted' | 'completed' | 'assigned',
    taskId: string,
    details?: Record<string, any>
  ) {
    this.trackEvent(`task_${action}`, {
      taskId,
      ...details,
    });
  }

  /**
   * Track space action
   */
  trackSpaceAction(
    action: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed',
    spaceId: string,
    details?: Record<string, any>
  ) {
    this.trackEvent(`space_${action}`, {
      spaceId,
      ...details,
    });
  }

  /**
   * Track error
   */
  trackError(message: string, context?: Record<string, any>) {
    this.trackEvent('error', {
      message,
      ...context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Get events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by name
   */
  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter(e => e.name === name);
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send to Google Analytics
   */
  private sendToGoogleAnalytics(eventName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined' || !CONFIG.services.analytics.enabled) return;

    const gaId = CONFIG.services.analytics.googleAnalyticsId;
    if (!gaId) return;

    try {
      (window as any).gtag?.('event', eventName, properties);
    } catch (error) {
      console.error('Error sending to Google Analytics:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const analytics = new AnalyticsManager();

/**
 * Initialize analytics on page load
 */
export function initializeAnalytics(userId?: string) {
  if (userId) {
    analytics.setUserId(userId);
  }

  // Track page view
  if (typeof window !== 'undefined') {
    analytics.trackPageView(window.location.pathname, document.title);
  }
}

/**
 * React hook for analytics
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics(userId?: string) {
  const pathname = usePathname();

  useEffect(() => {
    if (userId) {
      analytics.setUserId(userId);
    }
    analytics.trackPageView(pathname, document.title);
  }, [pathname, userId]);

  return analytics;
}

/**
 * Track Core Web Vitals
 */
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // Track Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'largest-contentful-paint') {
        analytics.trackPerformance('lcp', entry.startTime, 'ms');
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Observer not supported
  }

  // Track First Input Delay (FID) using web-vitals if available
  // Note: First Input Delay (FID) tracking requires non-standard API properties
  // Removed non-functional FID tracking - use native Web Vitals API instead

  // Note: Cumulative Layout Shift (CLS) tracking requires layout-shift API
  // Removed broken CLS tracking - requires proper type casting
}
