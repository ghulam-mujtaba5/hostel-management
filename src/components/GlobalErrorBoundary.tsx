'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RotateCcw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  componentStack?: string;
}

// Error reporting function
async function reportError(errorReport: ErrorReport): Promise<void> {
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    try {
      // Send to your error tracking endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch {
      // Silently fail - don't cause more errors
      console.error('Failed to report error:', errorReport);
    }
  } else {
    console.error('[Error Report]', errorReport);
  }
}

export function GlobalErrorBoundary({
  children,
  fallback,
}: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);
  const [errorId, setErrorId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleError = useCallback((err: Error, componentStack?: string) => {
    const id = `ERR-${Date.now().toString(36).toUpperCase()}`;
    setErrorId(id);
    setError(err);

    // Report error
    reportError({
      message: err.message,
      stack: err.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      componentStack,
    });
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message));
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason))
      );
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [handleError]);

  const reset = useCallback(() => {
    setError(null);
    setErrorId('');
    // Clear any cached state that might have caused the error
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const copyErrorDetails = useCallback(async () => {
    if (!error) return;
    
    const details = `Error ID: ${errorId}\nMessage: ${error.message}\nStack: ${error.stack || 'N/A'}\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`;
    
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [error, errorId]);

  if (error) {
    if (fallback) {
      return <>{fallback(error, reset)}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-950 p-4">
        <div className="max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Our team has been notified.
              </p>
              {errorId && (
                <p className="text-xs text-muted-foreground/60 font-mono">
                  Error ID: {errorId}
                </p>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-slate-800/50 rounded-lg p-4 text-left overflow-auto max-h-48 relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={copyErrorDetails}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <p className="text-xs text-red-400 font-mono break-all font-semibold">
                  {error.message}
                </p>
                {error.stack && (
                  <p className="text-xs text-muted-foreground font-mono mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={reset}
                className="flex-1 gap-2"
                variant="default"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 gap-2"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1"
                onClick={() => window.location.reload()}
              >
                <Bug className="h-3 w-3" />
                Force Reload
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
