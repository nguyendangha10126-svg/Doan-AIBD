import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  icon,
  children,
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all min-h-[36px] select-none border cursor-pointer',
        selected
          ? 'bg-brand-600 text-white border-transparent shadow-btn-primary scale-[1.02]'
          : 'bg-surface text-ink border-ink/15 hover:bg-surface-2 hover:border-ink/25 shadow-xs',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

