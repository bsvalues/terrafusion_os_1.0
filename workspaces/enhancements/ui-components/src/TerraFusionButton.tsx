import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLMotionProps, motion } from 'framer-motion';
import React, { forwardRef } from 'react';
import { cn } from './utils/cn';

/**
 * TerraFusion Button Component
 * Government. Transcended. - Championship Excellence
 *
 * Breathtaking button component with quantum effects and government authority
 */

const buttonVariants = cva(
  [
    // Base styles - Championship foundation
    'inline-flex items-center justify-center rounded-full font-semibold text-sm',
    'transition-all duration-300 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terrafusion-cyan focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
    'transform-gpu', // Hardware acceleration for quantum effects

    // Quantum scan-line effect setup
    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-terrafusion-cyan/20 before:to-transparent',
    'before:-translate-x-full before:transition-transform before:duration-1000',
    'hover:before:translate-x-full',

    // Championship elevation
    'shadow-lg hover:shadow-2xl',
    'hover:-translate-y-1',
    'active:translate-y-0 active:shadow-lg',
  ],
  {
    variants: {
      variant: {
        // Primary - Clarity Gradient (Championship)
        primary: [
          'bg-gradient-to-br from-terrafusion-blue via-terrafusion-cyan to-terrafusion-green',
          'text-white uppercase tracking-wide',
          'border border-terrafusion-cyan/30',
          'shadow-terrafusion-cyan/25',
          'hover:shadow-terrafusion-cyan/40',
          'hover:border-terrafusion-cyan/50',
        ],

        // Secondary - Glass Morphism
        secondary: [
          'bg-white/10 backdrop-blur-lg',
          'text-terrafusion-cyan border border-terrafusion-cyan/30',
          'hover:bg-white/20 hover:border-terrafusion-cyan/50',
          'shadow-terrafusion-cyan/20',
        ],

        // Transcendent - Government Authority
        transcendent: [
          'bg-terrafusion-blue',
          'text-white font-bold uppercase',
          'border border-terrafusion-blue/50',
          'hover:bg-terrafusion-cyan hover:border-terrafusion-cyan',
          'shadow-terrafusion-blue/30 hover:shadow-terrafusion-cyan/40',
        ],

        // Quantum - AI/ML Systems
        quantum: [
          'bg-gradient-to-r from-terrafusion-cyan/80 to-terrafusion-green/80',
          'text-terrafusion-deep-space font-bold',
          'border border-terrafusion-cyan/50',
          'backdrop-blur-sm',
          'hover:from-terrafusion-cyan hover:to-terrafusion-green',
          'shadow-terrafusion-cyan/30',
        ],

        // Outline - Minimalist Excellence
        outline: [
          'border-2 border-terrafusion-cyan',
          'text-terrafusion-cyan',
          'hover:bg-terrafusion-cyan hover:text-terrafusion-deep-space',
          'hover:shadow-terrafusion-cyan/30',
        ],

        // Ghost - Subtle Interaction
        ghost: [
          'text-terrafusion-cyan',
          'hover:bg-terrafusion-cyan/10',
          'hover:text-terrafusion-cyan',
        ],
      },
      size: {
        sm: 'h-9 px-6 text-xs',
        default: 'h-11 px-8 text-sm',
        lg: 'h-14 px-12 text-base',
        championship: 'h-16 px-16 text-lg font-bold tracking-wider',
        icon: 'h-11 w-11',
      },
      glow: {
        none: '',
        subtle: 'hover:drop-shadow-[0_0_10px_rgba(0,255,238,0.3)]',
        medium: 'hover:drop-shadow-[0_0_20px_rgba(0,255,238,0.4)]',
        intense: 'hover:drop-shadow-[0_0_30px_rgba(0,255,238,0.6)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      glow: 'subtle',
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  quantumEffect?: boolean;
  governmentAuthority?: boolean;
}

const TerraFusionButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      loading = false,
      quantumEffect = true,
      governmentAuthority = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const buttonClasses = cn(
      buttonVariants({ variant, size, glow }),
      governmentAuthority && 'font-black tracking-widest',
      className
    );

    const motionProps = {
      initial: { scale: 1 },
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: 'spring', stiffness: 400, damping: 17 },
    };

    const scanLineAnimation = quantumEffect
      ? {
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(0,255,238,0.2), transparent)',
          backgroundSize: '200% 100%',
          animation: 'tf-scan-line 2s ease-in-out infinite',
        }
      : {};

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        style={scanLineAnimation}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-xs uppercase tracking-wider">
              {governmentAuthority ? 'Processing Excellence...' : 'Loading...'}
            </span>
          </div>
        ) : (
          <span className="relative z-10 flex items-center justify-center space-x-2">
            {children}
          </span>
        )}

        {/* Quantum Ripple Effect */}
        {quantumEffect && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0, opacity: 0.5 }}
            whileTap={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'radial-gradient(circle, rgba(0,255,238,0.3) 0%, transparent 70%)',
            }}
          />
        )}
      </motion.button>
    );
  }
);

TerraFusionButton.displayName = 'TerraFusionButton';

export { buttonVariants, TerraFusionButton };
export type { ButtonProps };
