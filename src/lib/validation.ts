/**
 * Production-grade input validation and sanitization
 */

import { z } from 'zod';
import { ValidationError } from './error-handler';

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';

  return input
    .slice(0, maxLength)
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number;
  isStrong: boolean;
  feedback: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('At least 8 characters');
  } else {
    score += 20;
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 10;
  }

  return {
    score: Math.min(100, score),
    isStrong: score >= 60,
    feedback: feedback.length > 0 ? feedback : ['Strong password'],
  };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 15;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(num: number): boolean {
  return Number.isFinite(num) && num > 0;
}

/**
 * Common Zod schemas for validation
 */
export const ValidationSchemas = {
  email: z.string().email('Invalid email address').max(254),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(32, 'Username is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash'),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  spaceName: z
    .string()
    .min(3, 'Space name must be at least 3 characters')
    .max(50, 'Space name is too long'),
  taskTitle: z
    .string()
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title is too long'),
  taskDescription: z.string().max(500, 'Description is too long').optional(),
  points: z
    .number()
    .int('Points must be a whole number')
    .min(1, 'Points must be at least 1')
    .max(1000, 'Points cannot exceed 1000'),
};

/**
 * Validate form data
 */
export function validateFormData<T>(
  data: any,
  schema: z.ZodSchema
): T | null {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      throw new ValidationError('Form validation failed', { fieldErrors });
    }
    throw error;
  }
}

/**
 * Sanitize form data object
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limit check
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}
