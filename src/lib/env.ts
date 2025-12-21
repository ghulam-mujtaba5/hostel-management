/**
 * Environment configuration with validation
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_PORTAL_PASSWORD',
  'NEXT_PUBLIC_API_URL',
  'SENTRY_DSN',
  'NEXT_PUBLIC_GA_ID',
];

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get environment variables with defaults
 */
export const env = {
  // Required
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Optional
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  GA_ID: process.env.NEXT_PUBLIC_GA_ID || '',
  ADMIN_PASSWORD: process.env.ADMIN_PORTAL_PASSWORD || 'admin',

  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000',

  // Derived
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  get isStaging() {
    return this.VERCEL_ENV === 'preview';
  },
  get appUrl() {
    if (this.isProduction) {
      return `https://${this.VERCEL_URL}`;
    }
    return `http://${this.VERCEL_URL}`;
  },
};

/**
 * Validate on startup
 */
if (typeof window === 'undefined') {
  // Only validate on server
  try {
    validateEnvironment();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('Environment validation warning:', error);
  }
}
