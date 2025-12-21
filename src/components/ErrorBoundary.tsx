"use client";

import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with Sentry, LogRocket, etc.
      console.error('[ErrorBoundary] Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState(prev => ({ 
      hasError: false, 
      error: undefined,
      errorInfo: undefined,
      retryCount: prev.retryCount + 1 
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const canRetry = this.state.retryCount < 3;
      
      return (
        <div 
          className="flex items-center justify-center min-h-[40vh] p-4"
          role="alert"
          aria-live="assertive"
        >
          <Card className="max-w-md w-full border-red-200/50 dark:border-red-800/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Something went wrong</h3>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Retry attempts: {this.state.retryCount}/3
                  </p>
                )}
              </div>
              
              {/* Development mode: show stack trace */}
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
                  <summary className="cursor-pointer font-medium flex items-center gap-2">
                    <Bug className="h-3 w-3" />
                    Stack Trace (Dev Only)
                  </summary>
                  <pre className="mt-2 overflow-auto max-h-32 text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                {canRetry && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={this.handleRetry}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Try Again
                  </Button>
                )}
                <Button
                  variant={canRetry ? "ghost" : "outline"}
                  className="flex-1 gap-2"
                  onClick={this.handleReload}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reload Page
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="flex-1 gap-2"
                >
                  <Link href="/">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
