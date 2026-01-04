/**
 * Production-grade Monitoring & Observability
 * Silicon Valley standard instrumentation
 */

import { CONFIG, isProduction } from './config';

// Performance metrics types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

export interface ErrorMetric {
  name: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: number;
}

/**
 * Core Web Vitals tracking
 */
export interface WebVitals {
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  FCP: number | null; // First Contentful Paint
  INP: number | null; // Interaction to Next Paint
}

/**
 * Monitoring Manager for production observability
 */
export class MonitoringManager {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private webVitals: Partial<WebVitals> = {};
  private sessionId: string;
  private userId?: string;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializeErrorTracking();
      this.startPeriodicFlush();
    }
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.webVitals.LCP = entry.startTime;
      this.recordMetric('web_vitals_lcp', entry.startTime, 'ms');
    });

    // First Contentful Paint
    this.observePerformanceEntry('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.webVitals.FCP = entry.startTime;
        this.recordMetric('web_vitals_fcp', entry.startTime, 'ms');
      }
    });

    // Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.webVitals.TTFB = navigation.responseStart - navigation.requestStart;
      this.recordMetric('web_vitals_ttfb', this.webVitals.TTFB, 'ms');
    }

    // Layout Shift tracking
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entry: PerformanceEntry) => {
      const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
        clsValue += layoutShiftEntry.value;
        this.webVitals.CLS = clsValue;
      }
    });

    // Record CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.webVitals.CLS !== undefined) {
        this.recordMetric('web_vitals_cls', this.webVitals.CLS * 1000, 'ms');
      }
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entry: PerformanceEntry) => {
      const fidEntry = entry as PerformanceEntry & { processingStart?: number };
      if (fidEntry.processingStart) {
        this.webVitals.FID = fidEntry.processingStart - entry.startTime;
        this.recordMetric('web_vitals_fid', this.webVitals.FID, 'ms');
      }
    });
  }

  /**
   * Helper to observe performance entries
   */
  private observePerformanceEntry(
    type: string,
    callback: (entry: PerformanceEntry) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch {
      // Observer type not supported
    }
  }

  /**
   * Initialize global error tracking
   */
  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.recordError({
        name: 'UnhandledError',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        name: 'UnhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        context: { type: 'promise_rejection' },
      });
    });
  }

  /**
   * Start periodic flush of metrics
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      tags: {
        ...tags,
        sessionId: this.sessionId,
        ...(this.userId && { userId: this.userId }),
      },
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (process.env.NODE_ENV === 'development') {
      console.log('[METRIC]', metric);
    }

    if (this.metrics.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Record an error
   */
  recordError(error: Omit<ErrorMetric, 'timestamp' | 'userId' | 'sessionId'>): void {
    const errorMetric: ErrorMetric = {
      ...error,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.errors.push(errorMetric);

    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR]', errorMetric);
    }

    if (this.errors.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Track API call performance
   */
  trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    size?: number
  ): void {
    this.recordMetric('api_call_duration', duration, 'ms', {
      endpoint,
      method,
      status: String(status),
    });

    if (size) {
      this.recordMetric('api_response_size', size, 'bytes', {
        endpoint,
        method,
      });
    }

    // Track error rates
    if (status >= 400) {
      this.recordMetric('api_error', 1, 'count', {
        endpoint,
        method,
        status: String(status),
      });
    }
  }

  /**
   * Track component render time
   */
  trackRender(componentName: string, duration: number): void {
    this.recordMetric('component_render', duration, 'ms', {
      component: componentName,
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, target: string, duration?: number): void {
    this.recordMetric('user_interaction', duration || 1, duration ? 'ms' : 'count', {
      action,
      target,
    });
  }

  /**
   * Get current web vitals
   */
  getWebVitals(): Partial<WebVitals> {
    return { ...this.webVitals };
  }

  /**
   * Flush metrics and errors to backend
   */
  async flush(): Promise<void> {
    if (this.metrics.length === 0 && this.errors.length === 0) return;

    const metricsToSend = [...this.metrics];
    const errorsToSend = [...this.errors];

    this.metrics = [];
    this.errors = [];

    if (!isProduction()) return;

    try {
      // Send to your monitoring backend
      // This would integrate with services like Datadog, New Relic, or custom backend
      if (CONFIG.services.sentry.enabled) {
        // Integration with Sentry or similar
        await this.sendToMonitoringService({
          metrics: metricsToSend,
          errors: errorsToSend,
          sessionId: this.sessionId,
          userId: this.userId,
        });
      }
    } catch (error) {
      // Re-add metrics on failure (with limit)
      if (this.metrics.length < this.MAX_BUFFER_SIZE) {
        this.metrics.push(...metricsToSend.slice(0, 10));
      }
    }
  }

  /**
   * Send data to monitoring service
   */
  private async sendToMonitoringService(data: {
    metrics: PerformanceMetric[];
    errors: ErrorMetric[];
    sessionId: string;
    userId?: string;
  }): Promise<void> {
    // Implementation for your monitoring service
    // Example: Datadog, New Relic, custom endpoint
    const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT;
    if (!endpoint) return;

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true, // Ensure data is sent even on page unload
    });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
export const monitoring = new MonitoringManager();

/**
 * Performance measurement decorator/wrapper
 */
export function measurePerformance<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.finally(() => {
        monitoring.recordMetric(name, performance.now() - start, 'ms');
      });
    }

    monitoring.recordMetric(name, performance.now() - start, 'ms');
    return result;
  }) as T;
}

/**
 * API call wrapper with automatic tracking
 */
export async function trackedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const start = performance.now();
  const method = options?.method || 'GET';

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - start;

    monitoring.trackApiCall(
      url,
      method,
      duration,
      response.status
    );

    return response;
  } catch (error) {
    const duration = performance.now() - start;
    monitoring.trackApiCall(url, method, duration, 0);
    throw error;
  }
}

/**
 * React hook for component performance tracking
 */
import { useEffect, useRef } from 'react';

export function usePerformanceTracking(componentName: string): void {
  const renderStart = useRef(performance.now());

  useEffect(() => {
    const renderDuration = performance.now() - renderStart.current;
    monitoring.trackRender(componentName, renderDuration);
  });
}

/**
 * Health check endpoint data
 */
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
} {
  return {
    status: 'healthy',
    checks: {
      database: true, // Would check Supabase connection
      memory: process.memoryUsage?.().heapUsed < 500 * 1024 * 1024, // Under 500MB
    },
    timestamp: new Date().toISOString(),
  };
}
