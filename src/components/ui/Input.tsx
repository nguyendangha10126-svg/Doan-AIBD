import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-heading font-bold text-main">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-main-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full min-h-[44px] rounded-2xl border-2 border-peach/50 bg-white/90 px-4 py-2.5 text-main placeholder:text-main-subtle transition-all duration-200',
              'focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/20',
              'disabled:bg-cream-200 disabled:cursor-not-allowed',
              leftIcon && 'pl-11',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-semibold text-rose-500 animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-main-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

