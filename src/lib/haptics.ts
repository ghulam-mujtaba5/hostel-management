// Haptic Feedback Utility for Mobile PWA
// Provides consistent haptic feedback across the app

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 5,
  medium: 15,
  heavy: 25,
  success: [10, 50, 10], // Short-pause-short
  warning: [20, 30, 20, 30, 20], // Triple pulse
  error: [50, 100, 50], // Long-pause-long
};

/**
 * Trigger haptic feedback on supported devices
 * @param intensity - The intensity/pattern of the haptic feedback
 * @returns boolean - Whether haptic feedback was triggered
 */
export function triggerHaptic(intensity: HapticIntensity = 'light'): boolean {
  if (!('vibrate' in navigator)) {
    return false;
  }

  try {
    const pattern = HAPTIC_PATTERNS[intensity];
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * React hook for haptic feedback
 */
import { useCallback } from 'react';

export function useHaptic() {
  const trigger = useCallback((intensity: HapticIntensity = 'light') => {
    return triggerHaptic(intensity);
  }, []);

  const cancel = useCallback(() => {
    cancelHaptic();
  }, []);

  return {
    trigger,
    cancel,
    isSupported: isHapticSupported(),
  };
}

/**
 * Higher-order function to wrap event handlers with haptic feedback
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  handler: T,
  intensity: HapticIntensity = 'light'
): T {
  return ((...args: unknown[]) => {
    triggerHaptic(intensity);
    return handler(...args);
  }) as T;
}
