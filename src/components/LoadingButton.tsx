"use client";

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showSuccess?: boolean;
  showError?: boolean;
  children: ReactNode;
  /** Duration in ms to show success state before returning to normal */
  successDuration?: number;
  /** Duration in ms to show error state before returning to normal */
  errorDuration?: number;
}

export function LoadingButton({
  loading = false,
  loadingText,
  successText,
  errorText,
  showSuccess = false,
  showError = false,
  children,
  disabled,
  className,
  successDuration = 2000,
  errorDuration = 3000,
  'aria-label': ariaLabel,
  ...props
}: LoadingButtonProps) {
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [showErrorState, setShowErrorState] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      setShowSuccessState(true);
      const timer = setTimeout(() => setShowSuccessState(false), successDuration);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, successDuration]);

  useEffect(() => {
    if (showError) {
      setShowErrorState(true);
      const timer = setTimeout(() => setShowErrorState(false), errorDuration);
      return () => clearTimeout(timer);
    }
  }, [showError, errorDuration]);

  const currentState = loading ? 'loading' : showSuccessState ? 'success' : showErrorState ? 'error' : 'idle';
  
  const getAriaLabel = () => {
    if (loading) return loadingText || 'Loading...';
    if (showSuccessState) return successText || 'Success!';
    if (showErrorState) return errorText || 'Error occurred';
    return ariaLabel;
  };

  return (
    <Button
      disabled={disabled || loading}
      className={cn(
        'relative transition-all duration-200',
        loading && 'cursor-wait',
        showSuccessState && 'bg-green-600 hover:bg-green-600 focus:ring-green-500',
        showErrorState && 'bg-red-600 hover:bg-red-600 focus:ring-red-500',
        className
      )}
      aria-label={getAriaLabel()}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 
          className="mr-2 h-4 w-4 animate-spin" 
          aria-hidden="true"
        />
      )}
      {showSuccessState && !loading && (
        <Check 
          className="mr-2 h-4 w-4" 
          aria-hidden="true"
        />
      )}
      {showErrorState && !loading && !showSuccessState && (
        <AlertCircle 
          className="mr-2 h-4 w-4" 
          aria-hidden="true"
        />
      )}
      <span className={cn(loading && 'opacity-90')}>
        {loading 
          ? (loadingText || children) 
          : showSuccessState 
            ? (successText || 'Success!') 
            : showErrorState
              ? (errorText || 'Try Again')
              : children}
      </span>
    </Button>
  );
}

// Convenience wrapper for async operations
interface AsyncButtonProps extends Omit<LoadingButtonProps, 'loading' | 'showSuccess' | 'showError' | 'onError'> {
  onClick: () => Promise<void>;
  onSuccess?: () => void;
  onAsyncError?: (error: Error) => void;
}

export function AsyncButton({
  onClick,
  onSuccess,
  onAsyncError,
  ...props
}: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setShowSuccess(false);
    setShowError(false);
    
    try {
      await onClick();
      setShowSuccess(true);
      onSuccess?.();
    } catch (error) {
      setShowError(true);
      onAsyncError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      loading={loading}
      showSuccess={showSuccess}
      showError={showError}
      onClick={handleClick}
      {...props}
    />
  );
}
