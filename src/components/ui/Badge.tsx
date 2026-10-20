import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'primary'
    | 'magic'
    | 'accent'
    | 'mint'
    | 'peach'
    | 'sky'
    | 'lavender'
    | 'butter'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
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
    primary: 'bg-brand-100 text-brand-700 border-brand-400/30',
    magic: 'bg-magic-600/10 text-magic-600 border-magic-600/30',
    accent: 'bg-magic-600/10 text-magic-600 border-magic-600/30',
    mint: 'bg-[#C9F0DD] text-ink border-ink/10',
    peach: 'bg-[#FFD6BA] text-ink border-ink/10',
    sky: 'bg-[#CDE7FF] text-ink border-ink/10',
    lavender: 'bg-[#E3D9FF] text-ink border-ink/10',
    butter: 'bg-[#FFF1B8] text-ink border-ink/10',
    success: 'bg-[#DDF6E9] text-[#166E48] border-[#166E48]/20',
    warning: 'bg-[#FFF1B8] text-[#8A5A00] border-[#8A5A00]/20',
    danger: 'bg-[#FFE3EA] text-[#B42343] border-[#B42343]/20',
    info: 'bg-[#CDE7FF] text-[#1F5FA8] border-[#1F5FA8]/20',
    neutral: 'bg-surface text-ink border-ink/15 shadow-xs',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-heading font-bold rounded-full',
    md: 'text-sm px-3.5 py-1 font-heading font-bold rounded-full',
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
