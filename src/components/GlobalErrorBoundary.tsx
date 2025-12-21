'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export function GlobalErrorBoundary({
  children,
  fallback,
}: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const reset = () => setError(null);

  if (error) {
    if (fallback) {
      return <>{fallback(error, reset)}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
        <div className="max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again or return to the home page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-slate-800/50 rounded-lg p-4 text-left overflow-auto max-h-48">
                <p className="text-xs text-muted-foreground font-mono break-all">
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
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
