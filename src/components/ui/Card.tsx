import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'white' | 'cream' | 'peach' | 'mint' | 'sky' | 'lavender' | 'butter' | 'glass';
  isInteractive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'white',
      isInteractive = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      white: 'bg-surface border border-ink/10 text-ink shadow-card',
      cream: 'bg-surface-2 border border-ink/10 text-ink shadow-card',
      peach: 'bg-peach/30 border border-peach-dark/30 text-ink shadow-card',
      mint: 'bg-mint/30 border border-mint-dark/30 text-ink shadow-card',
      sky: 'bg-sky/30 border border-sky-dark/30 text-ink shadow-card',
      lavender: 'bg-lavender/30 border border-lavender-dark/30 text-ink shadow-card',
      butter: 'bg-butter/30 border border-butter-dark/30 text-ink shadow-card',
      glass: 'bg-surface/85 backdrop-blur-md border border-ink/10 text-ink shadow-card',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className={cn(
          'rounded-[28px] p-6 transition-all relative overflow-hidden',
          isInteractive && 'hover:shadow-pop cursor-pointer',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
