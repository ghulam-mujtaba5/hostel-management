/**
 * Production-grade API client with caching, retry logic, and error handling
 */

import { AppError, logError } from './error-handler';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  cache?: 'default' | 'no-cache' | 'reload' | 'force-cache';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 2;
const REQUEST_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * HTTP client with built-in retry logic, timeout, and caching
 */
export class HttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Make HTTP request with retry and timeout
   */
  private async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const cacheKey = `${method}:${fullUrl}`;

    // Check cache for GET requests
    if (method === 'GET') {
      const cached = REQUEST_CACHE.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          method,
          headers: { ...this.headers, ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.handleErrorResponse(response);
          throw error;
        }

        const data = await response.json();

        // Cache successful GET requests
        if (method === 'GET') {
          REQUEST_CACHE.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain errors
        if (
          lastError.message === 'Failed to fetch' ||
          lastError.message.includes('abort')
        ) {
          if (attempt < retries) {
            await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
            continue;
          }
        }

        if (attempt === retries) {
          logError(lastError, { url, method, attempt });
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const data = await response.json();
      return new AppError(
        data.message || 'Request failed',
        data.code || `HTTP_${response.status}`,
        response.status,
        data
      );
    } catch {
      return new AppError(
        response.statusText || 'Request failed',
        `HTTP_${response.status}`,
        response.status
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    REQUEST_CACHE.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(url: string, method: string = 'GET'): void {
    REQUEST_CACHE.delete(`${method}:${url}`);
  }
}

// Export singleton instance
export const apiClient = new HttpClient();
