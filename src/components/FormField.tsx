"use client";

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  ...props
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string>();
  const charCount = String(value).length;
  const isValid = !internalError && (!validation || !validation(String(value)));

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
    }
  };

  const displayError = internalError || error;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-semibold">
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={cn(
            'transition-all',
            displayError && touched && 'border-destructive focus:ring-destructive/20',
            isValid && touched && 'border-green-500 focus:ring-green-500/20'
          )}
          {...props}
        />
        {isValid && touched && !displayError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            ✓
          </div>
        )}
      </div>

      {touched && displayError && (
        <p className="text-sm text-destructive font-medium">{displayError}</p>
      )}
      {!displayError && helper && (
        <p className="text-sm text-muted-foreground">{helper}</p>
      )}

      {showCounter && maxLength && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {charCount}/{maxLength} characters
          </span>
          {charCount > maxLength * 0.8 && (
            <span className="text-xs text-warning">Getting close!</span>
          )}
        </div>
      )}
    </div>
  );
}
