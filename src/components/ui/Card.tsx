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
      white: 'bg-white/95 border border-white/60 text-main shadow-soft',
      cream: 'bg-cream-100 border border-peach/30 text-main shadow-soft',
      peach: 'bg-peach/30 border border-peach text-main shadow-soft',
      mint: 'bg-mint/30 border border-mint text-main shadow-soft',
      sky: 'bg-sky/30 border border-sky text-main shadow-soft',
      lavender: 'bg-lavender/30 border border-lavender text-main shadow-soft',
      butter: 'bg-butter/30 border border-butter text-main shadow-soft',
      glass: 'bg-white/80 backdrop-blur-md border border-white/40 shadow-soft',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -4, scale: 1.01 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'rounded-3xl p-6 transition-shadow relative overflow-hidden',
          isInteractive && 'hover:shadow-soft-lg cursor-pointer',
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

