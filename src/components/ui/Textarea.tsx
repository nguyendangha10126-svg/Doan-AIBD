import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-heading font-bold text-ink">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-sm sm:text-base text-ink placeholder:text-ink-faint transition-all duration-200',
            'focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-100',
            'disabled:bg-ink/5 disabled:text-ink-faint disabled:cursor-not-allowed resize-y',
            error && 'border-[#B42343] focus:border-[#B42343] focus:ring-[#FFE3EA]',
            className
          )}
          {...props}
        />
        {error ? (
          <p role="alert" className="text-xs font-semibold text-[#B42343]">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-ink-soft leading-relaxed">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
