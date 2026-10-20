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
          <label htmlFor={inputId} className="block text-sm font-heading font-bold text-ink">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-ink-faint pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full min-h-[44px] rounded-[16px] border border-ink/15 bg-surface px-4 py-2.5 text-ink placeholder:text-ink-faint transition-all duration-200 outline-none',
              'focus:border-brand-600 focus:bg-surface focus:ring-3 focus:ring-brand-100',
              'disabled:bg-surface-2 disabled:text-ink-faint disabled:cursor-not-allowed',
              leftIcon && 'pl-11',
              error && 'border-[#B42343] focus:border-[#B42343] focus:ring-[#FFE3EA]',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-semibold text-[#B42343] animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-soft">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
