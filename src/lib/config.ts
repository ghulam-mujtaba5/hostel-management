/**
 * Production Configuration & Feature Flags
 * Silicon Valley-grade configuration management
 */

// Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GA_ID',
  'SENTRY_DSN',
  'NEXT_PUBLIC_MONITORING_ENDPOINT',
] as const;

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const CONFIG = {
  /**
   * App metadata
   */
  app: {
    name: 'HostelMate',
    tagline: 'Manage Your Hostel Life with Barakah',
    description: 'Smart hostel duty management with fair task distribution, gamification, and team collaboration. Built with Islamic values and excellence (Ihsan) in mind.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://hostel-management.vercel.app',
    version: '1.0.0',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'development',
    environment: process.env.NODE_ENV as 'development' | 'production' | 'test',
  },

  /**
   * Feature flags - Toggle features without deployment
   */
  features: {
    realTimeUpdates: true,
    notifications: true,
    analytics: process.env.NODE_ENV === 'production',
    errorTracking: process.env.NODE_ENV === 'production',
    performanceMonitoring: process.env.NODE_ENV === 'production',
    // Advanced features
    aiTaskRecommendations: true,
    gamification: true,
    socialFeatures: true,
    offlineMode: true,
    pushNotifications: false, // Requires additional setup
    darkMode: true,
    multiLanguage: false, // Future feature
    advancedAnalytics: false, // Premium feature
  },

  /**
   * Performance settings
   */
  performance: {
    imageOptimization: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    staleCacheTimeout: 60 * 60 * 1000, // 1 hour stale-while-revalidate
    requestTimeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000, // Base delay for exponential backoff
    batchSize: 50, // Batch operations
    debounceDelay: 300, // Debounce user inputs
    throttleDelay: 100, // Throttle scroll/resize
    preloadThreshold: '50px', // Intersection observer margin
    lazyLoadImages: true,
    prefetchLinks: true,
  },

  /**
   * Security settings
   */
  security: {
    enableCSRFProtection: true,
    enableRateLimit: true,
    maxRequestsPerMinute: 100,
    maxRequestsPerHour: 1000,
    blockDurationMinutes: 5,
    enableContentSecurityPolicy: true,
    enableStrictTransportSecurity: true,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      '*.supabase.co',
    ],
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
    // Fairness settings
    fairness: {
      maxTasksPerWeek: 10, // Maximum tasks a user can complete per week
      maxEasyTaskRatio: 0.6, // 60% max easy tasks to enforce variety
      minDaysBetweenSameTask: 2, // Days before same task type can be taken
      enforceDifficultyBalance: true, // Force users to take harder tasks
      allowOvertimeIfNoOthers: true, // Allow exceeding limit if nobody else available
      weeklyLimitWindow: 7, // Days in the rolling window
    },
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
