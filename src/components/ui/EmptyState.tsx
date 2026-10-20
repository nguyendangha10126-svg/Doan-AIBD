import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-[28px] bg-surface-2 border border-ink/10 shadow-card',
        className
      )}
    >
      {/* SVG Illustration Container */}
      <div className="w-24 h-24 mb-5 rounded-full bg-brand-100 flex items-center justify-center text-4xl shadow-xs relative">
        {icon || (
          <svg className="w-12 h-12 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10"/>
            <path d="M6 10h10"/>
            <path d="M12 14v4"/>
            <path d="M10 16h4"/>
          </svg>
        )}
      </div>

      <h3 className="text-xl font-heading font-extrabold text-ink mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-ink-soft max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action ? (
        <div>{action}</div>
      ) : actionText && onAction ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </div>
  );
};
