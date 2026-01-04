'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('Page Error:', {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 mb-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Something went wrong
            </h2>
            <p className="text-slate-400">
              An error occurred while loading this page. Please try again.
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 font-mono">
                Reference: {error.digest}
              </p>
            )}
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-slate-800/50 rounded-lg text-left overflow-hidden border border-slate-700">
              <summary className="p-4 cursor-pointer hover:bg-slate-800/70 flex items-center justify-between text-sm text-slate-400">
                <span>Error details</span>
                <ChevronDown className="h-4 w-4" />
              </summary>
              <div className="p-4 pt-0 border-t border-slate-700">
                <p className="text-sm text-red-400 font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
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
