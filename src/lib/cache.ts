/**
 * Advanced Caching Layer
 * Production-grade caching with TTL, LRU eviction, and cache invalidation
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
};

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

/**
 * LRU Cache with TTL support
 */
export class Cache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly staleWhileRevalidate: boolean;
  private revalidating: Set<string> = new Set();

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize ?? 1000;
    this.staleWhileRevalidate = options.staleWhileRevalidate ?? true;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      if (this.staleWhileRevalidate) {
        // Mark as stale but still return
        entry.accessCount++;
        entry.lastAccessed = now;
        return entry.value;
      }
      this.cache.delete(key);
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + (ttl ?? this.defaultTTL),
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt && !this.staleWhileRevalidate) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Check if entry is stale
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete entries matching pattern
   */
  deletePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    staleCount: number;
  } {
    const now = Date.now();
    let totalAccess = 0;
    let staleCount = 0;

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      if (now > entry.expiresAt) staleCount++;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      staleCount,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldest = key;
        oldestTime = entry.lastAccessed;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const existing = this.get(key);
    
    // Return cached if valid
    if (existing !== undefined && !this.isStale(key)) {
      return existing;
    }

    // If stale-while-revalidate and we have stale data, return it and revalidate
    if (existing !== undefined && this.staleWhileRevalidate && !this.revalidating.has(key)) {
      this.revalidating.add(key);
      factory().then(value => {
        this.set(key, value, ttl);
        this.revalidating.delete(key);
      }).catch(() => {
        this.revalidating.delete(key);
      });
      return existing;
    }

    // Fetch fresh data
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
}

// Global cache instances
export const dataCache = new Cache({ ttl: 5 * 60 * 1000, maxSize: 500 });
export const apiCache = new Cache({ ttl: 60 * 1000, maxSize: 200 });
export const staticCache = new Cache({ ttl: 24 * 60 * 60 * 1000, maxSize: 100 });

/**
 * Memoization with cache
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: {
    keyFn?: (...args: Parameters<T>) => string;
    ttl?: number;
    cache?: Cache;
  }
): T {
  const cache = options?.cache ?? new Cache({ ttl: options?.ttl ?? 60000 });
  const keyFn = options?.keyFn ?? ((...args: unknown[]) => JSON.stringify(args));

  return (async (...args: Parameters<T>) => {
    const key = keyFn(...args);
    return cache.getOrSet(key, () => fn(...args) as Promise<unknown>, options?.ttl);
  }) as T;
}

/**
 * Request deduplication
 */
const pendingRequests = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const pending = pendingRequests.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = factory().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Batch request handler
 */
export class BatchLoader<K, V> {
  private queue: Map<K, { resolve: (v: V) => void; reject: (e: Error) => void }[]> = new Map();
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchFn: (keys: K[]) => Promise<Map<K, V>>;
  private readonly delay: number;
  private readonly maxBatchSize: number;

  constructor(
    batchFn: (keys: K[]) => Promise<Map<K, V>>,
    options?: { delay?: number; maxBatchSize?: number }
  ) {
    this.batchFn = batchFn;
    this.delay = options?.delay ?? 10;
    this.maxBatchSize = options?.maxBatchSize ?? 100;
  }

  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      const callbacks = this.queue.get(key) ?? [];
      callbacks.push({ resolve, reject });
      this.queue.set(key, callbacks);

      if (this.queue.size >= this.maxBatchSize) {
        this.dispatch();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.dispatch(), this.delay);
      }
    });
  }

  private async dispatch(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const batch = new Map(this.queue);
    this.queue.clear();

    try {
      const results = await this.batchFn([...batch.keys()]);
      
      for (const [key, callbacks] of batch) {
        const value = results.get(key);
        if (value !== undefined) {
          callbacks.forEach(({ resolve }) => resolve(value));
        } else {
          callbacks.forEach(({ reject }) => reject(new Error(`Key not found: ${key}`)));
        }
      }
    } catch (error) {
      for (const callbacks of batch.values()) {
        callbacks.forEach(({ reject }) => reject(error as Error));
      }
    }
  }
}

/**
 * Optimistic update helper
 */
export function createOptimisticUpdate<T>(
  cache: Cache<T>,
  key: string,
  optimisticValue: T,
  serverUpdate: () => Promise<T>
): { rollback: () => void; promise: Promise<T> } {
  const previousValue = cache.get(key);
  cache.set(key, optimisticValue);

  const promise = serverUpdate()
    .then(serverValue => {
      cache.set(key, serverValue);
      return serverValue;
    })
    .catch(error => {
      // Rollback on error
      if (previousValue !== undefined) {
        cache.set(key, previousValue);
      } else {
        cache.delete(key);
      }
      throw error;
    });

  return {
    rollback: () => {
      if (previousValue !== undefined) {
        cache.set(key, previousValue);
      } else {
        cache.delete(key);
      }
    },
    promise,
  };
}
