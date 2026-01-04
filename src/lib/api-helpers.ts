/**
 * Production API Route Handlers
 * Type-safe, validated, and secured API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  ForbiddenError,
  RateLimitError,
  type ApiResponse 
} from './error-handler';
import { rateLimiter, getSecurityHeaders, logSecurityEvent } from './security';
import { monitoring } from './monitoring';

/**
 * Create authenticated Supabase client for API routes
 */
export async function createApiClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  return { user, supabase };
}

/**
 * Validate request body against schema
 */
export function validateBody<T>(body: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    const errors = result.error.flatten();
    throw new ValidationError('Invalid request body', { 
      fieldErrors: errors.fieldErrors,
      formErrors: errors.formErrors,
    });
  }
  
  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams, 
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return validateBody(params, schema);
}

/**
 * Rate limit middleware
 */
export function checkRateLimit(request: NextRequest, key?: string): void {
  const identifier = key || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'anonymous';
  
  const result = rateLimiter.isAllowed(identifier);
  
  if (!result.allowed) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: identifier,
      userAgent: request.headers.get('user-agent') || undefined,
      details: { resetAt: result.resetAt },
      timestamp: new Date(),
    });
    
    throw new RateLimitError(Math.ceil((result.resetAt - Date.now()) / 1000));
  }
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T, 
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { 
      status, 
      headers: {
        ...getSecurityHeaders(),
        ...headers,
      },
    }
  );
}

/**
 * Create error response
 */
export function errorResponse(
  error: Error | AppError,
  request?: NextRequest
): NextResponse<ApiResponse<never>> {
  // Log error
  monitoring.recordError({
    name: error.name,
    message: error.message,
    stack: error.stack,
    context: {
      url: request?.url,
      method: request?.method,
    },
  });

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && { details: error.context }),
        },
      },
      { 
        status: error.statusCode,
        headers: getSecurityHeaders(),
      }
    );
  }

  // Unknown error - don't expose details in production
  return NextResponse.json(
    {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
    },
    { 
      status: 500,
      headers: getSecurityHeaders(),
    }
  );
}

/**
 * API route wrapper with error handling
 */
export function withApiHandler<T>(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse<ApiResponse<T | never>>> => {
    const start = performance.now();
    
    try {
      // Rate limiting
      checkRateLimit(request);
      
      // Execute handler
      const response = await handler(request, context);
      
      // Track success
      monitoring.trackApiCall(
        request.url,
        request.method,
        performance.now() - start,
        response.status
      );
      
      return response;
    } catch (error) {
      // Track error
      monitoring.trackApiCall(
        request.url,
        request.method,
        performance.now() - start,
        error instanceof AppError ? error.statusCode : 500
      );
      
      return errorResponse(error instanceof Error ? error : new Error(String(error)), request);
    }
  };
}

/**
 * API route wrapper requiring authentication
 */
export function withAuthenticatedHandler<T>(
  handler: (
    request: NextRequest, 
    auth: Awaited<ReturnType<typeof getAuthenticatedUser>>,
    context?: unknown
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return withApiHandler(async (request: NextRequest, context?: unknown) => {
    const auth = await getAuthenticatedUser(request);
    return handler(request, auth, context);
  });
}

/**
 * Check if user is admin of space
 */
export async function requireSpaceAdmin(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  userId: string,
  spaceId: string
): Promise<void> {
  const { data: member } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();

  if (!member || member.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
}

/**
 * Check if user is member of space
 */
export async function requireSpaceMember(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  userId: string,
  spaceId: string
): Promise<void> {
  const { data: member } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();

  if (!member) {
    throw new ForbiddenError('Space membership required');
  }
}

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SpaceIdSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
});

export const TaskIdSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['washroom', 'sweeping', 'kitchen', 'trash', 'dusting', 'laundry', 'dishes', 'other']),
  difficulty: z.number().int().min(1).max(10),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(['todo', 'in_progress', 'pending_verification', 'done']).optional(),
  proof_image_url: z.string().url().optional(),
});
