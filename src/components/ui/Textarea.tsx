import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-heading font-bold text-main">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-2xl border-2 border-peach/50 bg-white/90 px-4 py-3 text-main placeholder:text-main-subtle transition-all duration-200',
            'focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/20',
            'disabled:bg-cream-200 disabled:cursor-not-allowed resize-y',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-semibold text-rose-500 animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-main-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

