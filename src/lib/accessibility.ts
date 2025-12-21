"use client";

import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook to trap focus within a container element.
 * Useful for modals, dialogs, and other overlay components.
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  options?: {
    initialFocusRef?: RefObject<HTMLElement | null>;
    returnFocusOnDeactivate?: boolean;
  }
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      
      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    };

    // Focus the initial element or the first focusable element
    const focusableElements = getFocusableElements();
    if (options?.initialFocusRef?.current) {
      options.initialFocusRef.current.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: Move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to the previously focused element
      if (options?.returnFocusOnDeactivate !== false && previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus?.();
      }
    };
  }, [isActive, options?.initialFocusRef, options?.returnFocusOnDeactivate]);

  return containerRef;
}

/**
 * Custom hook to handle escape key press
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
}

/**
 * Custom hook to handle click outside of an element
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  isActive: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    // Use mousedown to handle click outside before any other click handlers
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, isActive]);

  return ref;
}

/**
 * Custom hook to lock body scroll when a modal is open
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Prevent layout shift from scrollbar disappearing
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    };
  }, [isLocked]);
}

/**
 * Combined hook for modal accessibility
 */
export function useModalAccessibility<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
  options?: {
    initialFocusRef?: RefObject<HTMLElement | null>;
    returnFocusOnDeactivate?: boolean;
    lockScroll?: boolean;
  }
) {
  const containerRef = useFocusTrap<T>(isOpen, {
    initialFocusRef: options?.initialFocusRef,
    returnFocusOnDeactivate: options?.returnFocusOnDeactivate,
  });

  useEscapeKey(onClose, isOpen);
  useBodyScrollLock(options?.lockScroll !== false && isOpen);

  return containerRef;
}
