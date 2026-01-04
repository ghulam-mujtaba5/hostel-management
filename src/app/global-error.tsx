'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Global Error:', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      // Send to error tracking service
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>

              {/* Error Message */}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-white">
                  Something went wrong
                </h1>
                <p className="text-slate-400 text-lg">
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
                {error.digest && (
                  <p className="text-xs text-slate-500 font-mono">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-slate-800/50 rounded-lg p-4 text-left overflow-auto max-h-48 border border-slate-700">
                  <p className="text-sm text-red-400 font-mono break-all font-semibold mb-2">
                    {error.message}
                  </p>
                  {error.stack && (
                    <details className="text-xs text-slate-500">
                      <summary className="cursor-pointer hover:text-slate-400">
                        Stack trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={reset}
                  className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <RotateCcw className="h-5 w-5" />
                  Try again
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
                  size="lg"
                >
                  <Link href="/">
                    <Home className="h-5 w-5" />
                    Go home
                  </Link>
                </Button>
              </div>

              {/* Support Link */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-500 mb-2">
                  Need help? Contact our support team
                </p>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white gap-2"
                >
                  <a href="mailto:support@hostelmate.app">
                    <MessageSquare className="h-4 w-4" />
                    support@hostelmate.app
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
