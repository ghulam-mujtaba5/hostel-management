"use client";

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState, useId } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  maxLength?: number;
  showCounter?: boolean;
  validation?: (value: string) => string | undefined;
  onValidationChange?: (isValid: boolean) => void;
}

export function FormField({
  label,
  error,
  helper,
  maxLength,
  showCounter = false,
  validation,
  onValidationChange,
  value = '',
  onChange,
  id: providedId,
  required,
  'aria-describedby': ariaDescribedBy,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const counterId = `${id}-counter`;
  
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string>();
  const charCount = String(value).length;
  const displayError = internalError || error;
  const isValid = touched && !displayError && String(value).length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (validation && touched) {
      const validationError = validation(newValue);
      setInternalError(validationError);
      onValidationChange?.(!validationError);
    }
    
    onChange?.(e);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validation && value) {
      const validationError = validation(String(value));
      setInternalError(validationError);
      onValidationChange?.(!validationError);
    }
  };

  // Build aria-describedby from all relevant elements
  const describedByIds = [
    ariaDescribedBy,
    displayError && touched ? errorId : null,
    !displayError && helper ? helperId : null,
    showCounter && maxLength ? counterId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={id}
          className="text-sm font-semibold block"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          required={required}
          aria-invalid={touched && !!displayError}
          aria-describedby={describedByIds}
          aria-required={required}
          className={cn(
            'transition-all pr-10',
            displayError && touched && 'border-destructive focus:ring-destructive/20',
            isValid && 'border-green-500 focus:ring-green-500/20'
          )}
          {...props}
        />
        {/* Validation indicator */}
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid && !displayError && (
              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
            )}
            {displayError && (
              <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {touched && displayError && (
        <p 
          id={errorId}
          className="text-sm text-destructive font-medium flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {displayError}
        </p>
      )}
      
      {/* Helper text */}
      {!displayError && helper && (
        <p 
          id={helperId}
          className="text-sm text-muted-foreground"
        >
          {helper}
        </p>
      )}

      {/* Character counter */}
      {showCounter && maxLength && (
        <div 
          id={counterId}
          className="flex justify-between items-center"
          aria-live="polite"
        >
          <span className="text-xs text-muted-foreground">
            {charCount}/{maxLength} characters
          </span>
          {charCount > maxLength * 0.8 && (
            <span className="text-xs text-amber-500 font-medium">
              {maxLength - charCount} remaining
            </span>
          )}
        </div>
      )}
    </div>
  );
}
