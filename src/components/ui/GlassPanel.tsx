import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  className,
  intensity = 'medium',
  children,
  ...props
}) => {
  const intensityClasses = {
    low: 'bg-white/60 backdrop-blur-sm border-white/40',
    medium: 'bg-white/80 backdrop-blur-md border-white/60',
    high: 'bg-white/95 backdrop-blur-lg border-white/80',
  };

  return (
    <div
      className={cn(
        'rounded-3xl border shadow-soft transition-all',
        intensityClasses[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

