/**
 * Performance Optimization Utilities
 * Includes lazy loading, code splitting, and bundle optimization helpers
 */

import { ComponentType, lazy, Suspense, ReactNode, JSX } from 'react';

/**
 * Creates a lazy-loaded component with a loading fallback
 * @param importFn - Dynamic import function for the component
 * @param fallback - Loading fallback component or element
 */
export function lazyWithFallback<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null
): (props: P) => JSX.Element {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: P): JSX.Element {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component when idle or on hover
 * @param importFn - Dynamic import function for the component
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
  // Check if we're in browser environment
  if (typeof window === 'undefined') return;
  
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      importFn();
    });
  } else {
    setTimeout(() => {
      importFn();
    }, 200);
  }
}

/**
 * Creates a prefetch handler for route transitions
 * @param href - Route to prefetch
 */
export function createPrefetchHandler(href: string) {
  return {
    onMouseEnter: () => {
      // Next.js will automatically handle prefetching
      // This is for additional custom prefetch logic if needed
    },
    onFocus: () => {
      // Same for focus events (accessibility)
    },
  };
}

/**
 * Memoization helper for expensive computations
 * @param fn - Function to memoize
 * @param keyFn - Function to generate cache key from arguments
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * Batch multiple state updates to reduce re-renders
 * Works with React 18+'s automatic batching
 */
export function batchUpdates<T extends (...args: unknown[]) => unknown>(fn: T): T {
  // React 18+ automatically batches updates, but this can be useful
  // for complex async scenarios
  return ((...args: Parameters<T>) => {
    // Use startTransition for non-urgent updates if available
    if (typeof window !== 'undefined' && 'startTransition' in (window as unknown as Record<string, unknown>)) {
      const { startTransition } = require('react');
      startTransition(() => {
        fn(...args);
      });
    } else {
      return fn(...args);
    }
  }) as T;
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if device is low-powered
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check for hardware concurrency (number of CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check for device memory (in GB)
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
  
  // Consider low-power if less than 4 cores or less than 4GB RAM
  return cores < 4 || memory < 4;
}

/**
 * Get optimized animation config based on device capability
 */
export function getOptimizedAnimationConfig() {
  const reducedMotion = prefersReducedMotion();
  const lowPower = isLowPowerDevice();
  
  if (reducedMotion || lowPower) {
    return {
      // Minimal animations for accessibility or performance
      duration: 0.1,
      ease: 'linear',
      animate: false,
    };
  }
  
  return {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
    animate: true,
  };
}

/**
 * Intersection Observer based lazy loading trigger
 * @param callback - Function to call when element is visible
 * @param options - IntersectionObserver options
 */
export function createVisibilityTrigger(
  callback: () => void,
  options?: IntersectionObserverInit
): (element: Element | null) => void {
  let observer: IntersectionObserver | null = null;
  
  return (element: Element | null) => {
    if (observer) {
      observer.disconnect();
    }
    
    if (!element) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer?.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(element);
  };
}

/**
 * Resource hints for critical resources
 */
export function addResourceHints(resources: { href: string; type: 'preload' | 'prefetch' | 'preconnect' }[]) {
  if (typeof document === 'undefined') return;
  
  resources.forEach(({ href, type }) => {
    // Check if hint already exists
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    link.rel = type;
    link.href = href;
    
    if (type === 'preload') {
      // Determine as attribute based on file extension
      const ext = href.split('.').pop()?.toLowerCase();
      if (ext === 'css') link.setAttribute('as', 'style');
      else if (['js', 'mjs'].includes(ext || '')) link.setAttribute('as', 'script');
      else if (['woff', 'woff2', 'ttf', 'otf'].includes(ext || '')) {
        link.setAttribute('as', 'font');
        link.setAttribute('crossorigin', 'anonymous');
      }
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '')) {
        link.setAttribute('as', 'image');
      }
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Image loading optimization
 */
export const imageOptimization = {
  /**
   * Get srcset for responsive images
   */
  getSrcSet: (src: string, widths: number[] = [320, 640, 960, 1280, 1920]) => {
    return widths.map((w) => `${src}?w=${w} ${w}w`).join(', ');
  },
  
  /**
   * Get sizes attribute for responsive images
   */
  getSizes: (breakpoints: { maxWidth: number; size: string }[] = [
    { maxWidth: 640, size: '100vw' },
    { maxWidth: 1024, size: '50vw' },
    { maxWidth: Infinity, size: '33vw' },
  ]) => {
    return breakpoints
      .map(({ maxWidth, size }) => 
        maxWidth === Infinity ? size : `(max-width: ${maxWidth}px) ${size}`
      )
      .join(', ');
  },
  
  /**
   * Get blur placeholder data URL
   */
  getBlurPlaceholder: (width: number = 10, height: number = 10): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" fill="#f0f0f0"/>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  },
};

// Export type for component lazy loading
export type LazyComponentOptions = {
  fallback?: ReactNode;
  preload?: boolean;
};
