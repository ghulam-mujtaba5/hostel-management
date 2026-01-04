/**
 * Production-grade Security Utilities
 * Silicon Valley standard security practices
 */

import { CONFIG } from './config';

// Content Security Policy directives
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:', '*.supabase.co'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://www.google-analytics.com', 'https://vitals.vercel-insights.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * CSRF Token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';

  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    if (typeof window === 'undefined') {
      // Server-side: use crypto
      const crypto = require('crypto');
      return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    }
    // Client-side: use Web Crypto API
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string | null, storedToken: string): boolean {
    if (!token || !storedToken) return false;
    if (token.length !== storedToken.length) return false;
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    return result === 0;
  }

  static get headerName(): string {
    return this.TOKEN_HEADER;
  }

  static get cookieName(): string {
    return this.TOKEN_COOKIE;
  }
}

/**
 * Rate limiting with sliding window
 */
interface RateLimitEntry {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxRequests: number = CONFIG.security.maxRequestsPerMinute,
    windowMs: number = 60000,
    blockDurationMs: number = 300000 // 5 minutes block
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Check if request should be allowed
   */
  isAllowed(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.limits.get(key);

    // Check if currently blocked
    if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
      };
    }

    // Initialize or clean entry
    if (!entry || (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil)) {
      entry = { timestamps: [], blocked: false };
      this.limits.set(key, entry);
    }

    // Remove old timestamps outside window
    const windowStart = now - this.windowMs;
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    // Check limit
    if (entry.timestamps.length >= this.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + this.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
      };
    }

    // Allow request
    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      resetAt: now + this.windowMs,
    };
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Singleton rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Input sanitization utilities
 */
export const Sanitizer = {
  /**
   * Sanitize HTML to prevent XSS
   */
  html(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };
    return input.replace(/[&<>"'`=/]/g, char => map[char]);
  },

  /**
   * Sanitize for SQL (as additional layer, use parameterized queries!)
   */
  sql(input: string): string {
    return input.replace(/['";\\]/g, '');
  },

  /**
   * Sanitize filename
   */
  filename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .slice(0, 255);
  },

  /**
   * Sanitize URL
   */
  url(input: string): string | null {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  },

  /**
   * Remove all potentially dangerous content
   */
  strict(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  },
};

/**
 * Secure session management helpers
 */
export const SecureSession = {
  /**
   * Generate secure session ID
   */
  generateId(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined') {
      crypto.getRandomValues(array);
    } else {
      require('crypto').randomFillSync(array);
    }
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Hash sensitive data
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    if (typeof window !== 'undefined') {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(data).digest('hex');
    }
  },

  /**
   * Secure cookie options
   */
  getCookieOptions(maxAge: number = 7 * 24 * 60 * 60) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    };
  },
};

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': generateCSPHeader(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Validate request origin
 */
export function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    return allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return url.hostname.endsWith(domain);
      }
      return url.origin === allowed;
    });
  } catch {
    return false;
  }
}

/**
 * Audit logging for security events
 */
export interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'csrf_violation' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export function logSecurityEvent(event: SecurityEvent): void {
  const logData = {
    ...event,
    timestamp: event.timestamp.toISOString(),
    environment: process.env.NODE_ENV,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', logData);
  } else {
    // In production, send to logging service (e.g., Sentry, Datadog)
    // This would integrate with your monitoring stack
  }
}
