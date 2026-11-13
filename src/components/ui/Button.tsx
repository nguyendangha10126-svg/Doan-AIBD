import React, { useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 
  | 'primary' 
  | 'magic' 
  | 'secondary' 
  | 'soft' 
  | 'ghost' 
  | 'danger'
  // Compatibility aliases
  | 'accent' 
  | 'outline' 
  | 'bedtime';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabledTooltip?: string;
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
      disabled = false,
      disabledTooltip,
      leftIcon,
      rightIcon,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Normalize variant aliases
    let activeVariant: 'primary' | 'magic' | 'secondary' | 'soft' | 'ghost' | 'danger' = 'primary';
    if (variant === 'accent') activeVariant = 'magic';
    else if (variant === 'outline') activeVariant = 'secondary';
    else if (variant === 'bedtime') activeVariant = 'soft';
    else activeVariant = variant;

    // Minimum touch area is always 44px
    const baseStyles = 'relative inline-flex items-center justify-center font-heading font-bold rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 select-none cursor-pointer';

    const variants = {
      primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-btn-primary',
      magic: 'bg-gradient-to-r from-[#8B7CF6] to-[#F472B6] text-white hover:opacity-95 shadow-btn-magic',
      secondary: 'bg-surface text-ink border border-ink/15 hover:bg-surface-2 shadow-xs',
      soft: 'bg-brand-100 text-ink hover:bg-peach/60 shadow-xs',
      ghost: 'bg-transparent text-ink hover:bg-ink/5',
      danger: 'bg-[#B42343] text-white hover:bg-[#961B36] shadow-xs',
    };

    const disabledStyles = 'disabled:opacity-50 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed';

    const sizes = {
      sm: 'h-10 min-h-[44px] min-w-[44px] text-xs sm:text-sm px-4 gap-1.5',
      md: 'h-12 min-h-[48px] min-w-[48px] text-sm sm:text-base px-6 gap-2',
      lg: 'h-14 min-h-[56px] min-w-[56px] text-base sm:text-lg px-8 gap-2.5',
    };

    const isActuallyDisabled = disabled || isLoading;

    return (
      <div 
        className="relative inline-flex items-center"
        onMouseEnter={() => isActuallyDisabled && disabledTooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <motion.button
          ref={ref}
          whileHover={{ y: isActuallyDisabled ? 0 : -1 }}
          whileTap={{ scale: isActuallyDisabled ? 1 : 0.97 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          disabled={isActuallyDisabled}
          aria-busy={isLoading ? true : undefined}
          onClick={(e) => {
            if (isActuallyDisabled) {
              e.preventDefault();
              return;
            }
            onClick?.(e);
          }}
          className={cn(
            baseStyles,
            variants[activeVariant],
            sizes[size],
            disabledStyles,
            className
          )}
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

        {/* Disabled Reason Tooltip */}
        {isActuallyDisabled && disabledTooltip && showTooltip && (
          <div 
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-ink text-white text-xs font-heading font-medium rounded-xl whitespace-nowrap shadow-pop z-50 pointer-events-none"
          >
            {disabledTooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink" />
          </div>
        )}
      </div>
    );
  }
);

Button.displayName = 'Button';
