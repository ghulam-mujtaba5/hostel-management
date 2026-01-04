/**
 * Health Check API Endpoint
 * Production-grade health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    latency: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
  details?: Record<string, unknown>;
}

const startTime = Date.now();

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = performance.now();
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const duration = performance.now() - start;
    
    if (error) {
      return {
        status: 'fail',
        message: `Database error: ${error.message}`,
        duration,
      };
    }
    
    if (duration > 1000) {
      return {
        status: 'warn',
        message: 'Database response time is slow',
        duration,
      };
    }
    
    return {
      status: 'pass',
      message: 'Database connection successful',
      duration,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: performance.now() - start,
    };
  }
}

function checkMemory(): HealthCheckResult {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return {
      status: 'pass',
      message: 'Memory check not available in this environment',
    };
  }

  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(usage.rss / 1024 / 1024);

  const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

  if (usagePercent > 90) {
    return {
      status: 'fail',
      message: `Memory usage critical: ${usagePercent.toFixed(1)}%`,
      details: { heapUsedMB, heapTotalMB, rssMB, usagePercent },
    };
  }

  if (usagePercent > 70) {
    return {
      status: 'warn',
      message: `Memory usage high: ${usagePercent.toFixed(1)}%`,
      details: { heapUsedMB, heapTotalMB, rssMB, usagePercent },
    };
  }

  return {
    status: 'pass',
    message: `Memory usage normal: ${usagePercent.toFixed(1)}%`,
    details: { heapUsedMB, heapTotalMB, rssMB, usagePercent },
  };
}

function checkLatency(dbDuration: number): HealthCheckResult {
  if (dbDuration > 2000) {
    return {
      status: 'fail',
      message: `High latency: ${dbDuration.toFixed(0)}ms`,
      duration: dbDuration,
    };
  }

  if (dbDuration > 500) {
    return {
      status: 'warn',
      message: `Elevated latency: ${dbDuration.toFixed(0)}ms`,
      duration: dbDuration,
    };
  }

  return {
    status: 'pass',
    message: `Latency normal: ${dbDuration.toFixed(0)}ms`,
    duration: dbDuration,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const dbCheck = await checkDatabase();
  const memoryCheck = checkMemory();
  const latencyCheck = checkLatency(dbCheck.duration || 0);

  const checks = {
    database: dbCheck,
    memory: memoryCheck,
    latency: latencyCheck,
  };

  // Determine overall status
  const checkResults = Object.values(checks);
  let overallStatus: HealthCheck['status'] = 'healthy';

  if (checkResults.some(c => c.status === 'fail')) {
    overallStatus = 'unhealthy';
  } else if (checkResults.some(c => c.status === 'warn')) {
    overallStatus = 'degraded';
  }

  const health: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks,
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

// Kubernetes-style readiness probe
export async function HEAD(): Promise<NextResponse> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return new NextResponse(null, { status: 503 });
    }
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
