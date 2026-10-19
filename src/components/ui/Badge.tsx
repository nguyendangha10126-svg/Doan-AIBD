import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'primary'
    | 'accent'
    | 'mint'
    | 'peach'
    | 'sky'
    | 'lavender'
    | 'butter'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary/15 text-primary-dark border-primary/30',
    accent: 'bg-accent/15 text-accent-dark border-accent/30',
    mint: 'bg-mint text-emerald-800 border-mint-dark',
    peach: 'bg-peach text-amber-900 border-peach-dark',
    sky: 'bg-sky text-sky-900 border-sky-dark',
    lavender: 'bg-lavender text-purple-900 border-lavender-dark',
    butter: 'bg-butter text-amber-900 border-butter-dark',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    danger: 'bg-rose-100 text-rose-800 border-rose-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-medium rounded-full',
    md: 'text-sm px-3.5 py-1 font-semibold rounded-full',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border leading-none transition-colors select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

