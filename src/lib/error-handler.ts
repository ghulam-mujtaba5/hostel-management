/**
 * Centralized error handling and logging
 * Production-grade error management
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Too many requests. Please try again later.', 'RATE_LIMIT', 429, {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Log errors to external service in production
 */
export function logError(
  error: Error | AppError,
  context?: Record<string, any>
) {
  const isDev = process.env.NODE_ENV === 'development';

  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context,
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
    }),
  };

  if (isDev) {
    console.error('[ERROR]', errorData);
  } else {
    // In production, send to error tracking service (Sentry, etc.)
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'UNAUTHORIZED':
        return 'Please sign in to continue.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'RATE_LIMIT':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Wrap async function with error handling
 */
export function wrapAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };
}
