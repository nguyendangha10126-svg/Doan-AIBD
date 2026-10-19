import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'bedtime' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-heading font-bold rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] select-none';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-soft hover:shadow-glow-primary active:bg-primary-dark',
      secondary: 'bg-peach text-main hover:bg-peach-dark shadow-soft',
      accent: 'bg-accent text-white hover:bg-accent-hover shadow-soft hover:shadow-glow-accent active:bg-accent-dark',
      outline: 'border-2 border-primary text-primary hover:bg-primary-light active:bg-primary-light/80',
      ghost: 'text-main hover:bg-white/60 active:bg-white/80',
      bedtime: 'bg-indigo-950/80 text-amber-200 border border-amber-300/30 hover:bg-indigo-900 active:bg-indigo-950',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 shadow-soft',
    };

    const sizes = {
      sm: 'text-sm px-3 py-1.5 min-w-[36px] min-h-[44px] gap-1.5',
      md: 'text-base px-5 py-2.5 min-w-[44px] min-h-[44px] gap-2',
      lg: 'text-lg px-7 py-3.5 min-w-[52px] min-h-[52px] gap-2.5 rounded-3xl',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

