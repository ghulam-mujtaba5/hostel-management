/**
 * Production configuration and feature flags
 */

export const CONFIG = {
  /**
   * App metadata
   */
  app: {
    name: 'HostelMate',
    description: 'Smart duty management for hostel living',
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://hostel-management.vercel.app',
    version: '1.0.0',
  },

  /**
   * Feature flags
   */
  features: {
    realTimeUpdates: true,
    notifications: true,
    analytics: true,
    errorTracking: false, // Enable in production
    performanceMonitoring: false, // Enable in production
  },

  /**
   * Performance settings
   */
  performance: {
    imageOptimization: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    requestTimeout: 10000, // 10 seconds
    maxRetries: 3,
  },

  /**
   * Security settings
   */
  security: {
    enableCSRFProtection: true,
    enableRateLimit: true,
    maxRequestsPerMinute: 100,
    enableContentSecurityPolicy: true,
  },

  /**
   * API configuration
   */
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  /**
   * External services
   */
  services: {
    sentry: {
      enabled: process.env.SENTRY_DSN ? true : false,
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    },
    analytics: {
      enabled: process.env.NEXT_PUBLIC_GA_ID ? true : false,
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    },
  },

  /**
   * Business logic
   */
  business: {
    minPasswordLength: 6,
    maxUsernameLength: 32,
    maxSpaceNameLength: 50,
    maxTaskTitleLength: 100,
    maxTaskDescriptionLength: 500,
    maxTasksPerPage: 20,
    maxUsersPerSpace: 100,
    defaultPointsForTask: 10,
    minPointsForTask: 1,
    maxPointsForTask: 1000,
  },

  /**
   * UI/UX settings
   */
  ui: {
    animationsEnabled: true,
    reducedMotion: false,
    darkModeDefault: 'system',
    paginationSize: 20,
    toastDuration: 3000,
  },
};

/**
 * Get feature flag value
 */
export function isFeatureEnabled(feature: keyof typeof CONFIG.features): boolean {
  const isDev = process.env.NODE_ENV === 'development';
  const featureValue = CONFIG.features[feature];

  // Allow overriding features via environment variables in development
  if (isDev) {
    const envVar = process.env[`FEATURE_${feature.toUpperCase()}`];
    if (envVar !== undefined) {
      return envVar === 'true';
    }
  }

  return featureValue;
}

/**
 * Check if app is in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if app is in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return CONFIG.api.baseUrl;
}

/**
 * Should enable external service
 */
export function shouldEnableService(service: 'sentry' | 'analytics'): boolean {
  if (!isProduction()) return false;

  switch (service) {
    case 'sentry':
      return CONFIG.services.sentry.enabled;
    case 'analytics':
      return CONFIG.services.analytics.enabled;
    default:
      return false;
  }
}
