import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-white/60 border-2 border-dashed border-peach/50',
        className
      )}
    >
      <div className="w-20 h-20 mb-4 rounded-full bg-peach/30 flex items-center justify-center text-3xl shadow-soft">
        {icon || '🎨'}
      </div>
      <h3 className="text-xl font-heading font-bold text-main mb-2">{title}</h3>
      <p className="text-sm text-main-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

