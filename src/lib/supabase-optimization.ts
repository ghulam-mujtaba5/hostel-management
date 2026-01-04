/**
 * Supabase Free Tier Optimization Utilities
 * 
 * Free tier limits (as of 2024):
 * - 500MB database
 * - 1GB file storage
 * - 2GB bandwidth per month
 * - 50,000 monthly active users
 * - 500,000 Edge Function invocations
 * 
 * This module provides utilities to stay well within these limits.
 */

import { supabase } from './supabase';

// Simple in-memory cache for reducing database calls
const queryCache = new Map<string, { data: any; timestamp: number }>();

// Cache configuration
const CACHE_CONFIG = {
  defaultTTL: 60 * 1000, // 1 minute default
  longTTL: 5 * 60 * 1000, // 5 minutes for less frequently changing data
  shortTTL: 30 * 1000, // 30 seconds for frequently accessed data
  maxCacheSize: 100, // Maximum number of cached queries
};

/**
 * Cache key generator
 */
function generateCacheKey(table: string, query: Record<string, any>): string {
  return `${table}:${JSON.stringify(query)}`;
}

/**
 * Get data from cache if valid
 */
function getFromCache<T>(key: string, ttl: number): T | null {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  return null;
}

/**
 * Set data in cache
 */
function setInCache(key: string, data: any): void {
  // Prevent cache from growing too large
  if (queryCache.size >= CACHE_CONFIG.maxCacheSize) {
    // Remove oldest entries
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 10; i++) {
      queryCache.delete(entries[i][0]);
    }
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear specific cache entry or all cache
 */
export function clearCache(key?: string): void {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
}

/**
 * Clear cache for a specific table (useful after mutations)
 */
export function clearTableCache(table: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(`${table}:`)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Optimized query with caching
 * Reduces database calls by caching results
 */
export async function cachedQuery<T>(
  table: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    cacheKey?: string;
    ttl?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<{ data: T | null; error: any; fromCache: boolean }> {
  const { ttl = CACHE_CONFIG.defaultTTL, forceRefresh = false } = options;
  const cacheKey = options.cacheKey || generateCacheKey(table, {});

  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const cached = getFromCache<T>(cacheKey, ttl);
    if (cached !== null) {
      return { data: cached, error: null, fromCache: true };
    }
  }

  // Execute query
  const result = await queryFn();

  // Cache successful results
  if (result.data && !result.error) {
    setInCache(cacheKey, result.data);
  }

  return { ...result, fromCache: false };
}

/**
 * Batch multiple queries into a single request where possible
 */
export async function batchQuery<T>(
  queries: Array<{
    table: string;
    select: string;
    filters?: Record<string, unknown>;
    single?: boolean;
  }>
): Promise<Array<{ data: T | null; error: unknown }>> {
  // For now, execute queries in parallel
  // This reduces perceived latency
  const promises = queries.map(async (q): Promise<{ data: T | null; error: unknown }> => {
    let query = supabase.from(q.table).select(q.select);
    
    if (q.filters) {
      Object.entries(q.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (q.single) {
      const result = await query.single();
      return { data: result.data as T | null, error: result.error };
    }
    
    const result = await query;
    return { data: result.data as T | null, error: result.error };
  });

  return Promise.all(promises);
}

/**
 * Paginated query helper to avoid fetching too much data
 */
export async function paginatedQuery<T>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  data: T[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  error: unknown;
}> {
  const {
    select = '*',
    filters = {},
    orderBy,
    page = 1,
    pageSize = 20,
  } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(table)
    .select(select, { count: 'exact' })
    .range(from, to);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }

  const { data, error, count } = await query;

  return {
    data: (data || []) as T[],
    page,
    pageSize,
    hasMore: (count || 0) > page * pageSize,
    error,
  };
}

/**
 * Debounced save - prevents rapid consecutive saves
 */
const saveTimeouts = new Map<string, NodeJS.Timeout>();

export function debouncedSave(
  key: string,
  saveFn: () => Promise<void>,
  delay: number = 1000
): void {
  const existingTimeout = saveTimeouts.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(async () => {
    try {
      await saveFn();
    } finally {
      saveTimeouts.delete(key);
    }
  }, delay);

  saveTimeouts.set(key, timeout);
}

/**
 * Optimized image upload with compression info
 * Free tier has 1GB storage limit
 */
export const STORAGE_TIPS = {
  maxImageSize: 500 * 1024, // 500KB recommended max
  recommendedFormat: 'webp',
  compressionQuality: 0.8,
  maxDimension: 1200, // Max width/height
};

/**
 * Query usage tracker for monitoring
 * Helps identify opportunities for optimization
 */
const queryStats = new Map<string, { count: number; lastUsed: Date }>();

export function trackQuery(table: string): void {
  const stats = queryStats.get(table) || { count: 0, lastUsed: new Date() };
  stats.count++;
  stats.lastUsed = new Date();
  queryStats.set(table, stats);
}

export function getQueryStats(): Record<string, { count: number; lastUsed: Date }> {
  return Object.fromEntries(queryStats);
}

/**
 * Optimized subscription helper
 * Reduces connection overhead by reusing subscriptions
 */
const activeSubscriptions = new Map<string, any>();

export function getOrCreateSubscription(
  key: string,
  createFn: () => any
): any {
  if (!activeSubscriptions.has(key)) {
    activeSubscriptions.set(key, createFn());
  }
  return activeSubscriptions.get(key);
}

export function removeSubscription(key: string): void {
  const sub = activeSubscriptions.get(key);
  if (sub) {
    sub.unsubscribe?.();
    activeSubscriptions.delete(key);
  }
}

/**
 * Database size estimation
 * Helps track usage against 500MB free tier limit
 */
export const SIZE_ESTIMATES = {
  // Approximate bytes per row (excluding large text/blob fields)
  profile: 500,
  space: 300,
  space_member: 200,
  task: 500,
  task_proof: 100000, // Can be large due to image URLs
  activity_log: 300,
  notification: 400,
};

export function estimateStorageUsage(counts: Record<string, number>): {
  estimatedBytes: number;
  estimatedMB: number;
  percentOfFreeTier: number;
} {
  let total = 0;
  
  Object.entries(counts).forEach(([table, count]) => {
    const perRow = SIZE_ESTIMATES[table as keyof typeof SIZE_ESTIMATES] || 300;
    total += count * perRow;
  });

  return {
    estimatedBytes: total,
    estimatedMB: total / (1024 * 1024),
    percentOfFreeTier: (total / (500 * 1024 * 1024)) * 100,
  };
}
