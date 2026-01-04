/**
 * Custom React Hooks
 * Production-grade hooks for common patterns
 */

import { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo,
  useReducer,
  DependencyList
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from './supabase';
import { dataCache } from './cache';
import { monitoring } from './monitoring';
import { AppError } from './error-handler';

/**
 * Debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}

/**
 * Local storage hook with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Async state hook with loading and error handling
 */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

type AsyncAction<T> =
  | { type: 'loading' }
  | { type: 'success'; payload: T }
  | { type: 'error'; payload: Error }
  | { type: 'reset' };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null };
    case 'success':
      return { data: action.payload, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: action.payload };
    case 'reset':
      return { data: null, loading: false, error: null };
    default:
      return state;
  }
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
  options: { immediate?: boolean; cacheKey?: string } = {}
): AsyncState<T> & { execute: () => Promise<T | null>; reset: () => void } {
  const { immediate = true, cacheKey } = options;
  
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    dispatch({ type: 'loading' });
    
    try {
      // Check cache first
      if (cacheKey) {
        const cached = dataCache.get(cacheKey) as T | undefined;
        if (cached) {
          dispatch({ type: 'success', payload: cached });
          return cached;
        }
      }

      const data = await asyncFn();
      
      // Cache result
      if (cacheKey && data) {
        dataCache.set(cacheKey, data);
      }
      
      dispatch({ type: 'success', payload: data });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      dispatch({ type: 'error', payload: err });
      monitoring.recordError({
        name: 'useAsync',
        message: err.message,
        stack: err.stack,
      });
      return null;
    }
  }, [asyncFn, cacheKey]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  return { ...state as AsyncState<T>, execute, reset };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      rootMargin: '100px',
      threshold: 0.1,
      ...options,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, options.rootMargin, options.threshold]);

  return [ref, isIntersecting];
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Common media query hooks
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Click outside hook
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref as React.RefObject<T>;
}

/**
 * Keyboard shortcut hook
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (!options.ctrl || event.ctrlKey) &&
        (!options.shift || event.shiftKey) &&
        (!options.alt || event.altKey) &&
        (!options.meta || event.metaKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options.ctrl, options.shift, options.alt, options.meta]);
}

/**
 * Form state hook with validation
 */
export function useFormState<T extends Record<string, unknown>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name] }));
      }
    }
  }, [values, validate]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>
  ) => {
    setIsSubmitting(true);
    
    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setTouched(Object.keys(values).reduce((acc, key) => ({
          ...acc,
          [key]: true,
        }), {} as Record<keyof T, boolean>));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValues,
  };
}

/**
 * Supabase data subscription hook
 */
export function useSupabaseQuery<T>(
  table: string,
  query: {
    select?: string;
    filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  },
  deps: DependencyList = []
) {
  const { currentSpace } = useAuth();
  
  const fetchData = useCallback(async () => {
    let queryBuilder = supabase.from(table).select(query.select || '*');
    
    // Apply filters
    if (query.filter) {
      for (const [key, value] of Object.entries(query.filter)) {
        if (value !== undefined) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      }
    }
    
    // Apply ordering
    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, {
        ascending: query.order.ascending ?? true,
      });
    }
    
    // Apply limit
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) throw new AppError(error.message, 'DB_ERROR', 500);
    return data as T[];
  }, [table, JSON.stringify(query)]);

  return useAsync<T[]>(fetchData, [currentSpace?.id, ...deps]);
}

/**
 * Optimistic update hook
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const rollbackRef = useRef<T | null>(null);

  const update = useCallback(async (optimisticData: T) => {
    setIsUpdating(true);
    rollbackRef.current = data;
    setData(optimisticData);

    try {
      const result = await updateFn(optimisticData);
      setData(result);
      return result;
    } catch (error) {
      // Rollback on error
      if (rollbackRef.current !== null) {
        setData(rollbackRef.current);
      }
      throw error;
    } finally {
      setIsUpdating(false);
      rollbackRef.current = null;
    }
  }, [data, updateFn]);

  return { data, update, isUpdating };
}

/**
 * Clipboard hook
 */
export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch {
      return false;
    }
  }, [timeout]);

  return { copied, copy };
}

/**
 * Online status hook
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Window size hook
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Scroll position hook
 */
export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
}

// Re-export all hooks from hooks.ts
export * from './hooks';
