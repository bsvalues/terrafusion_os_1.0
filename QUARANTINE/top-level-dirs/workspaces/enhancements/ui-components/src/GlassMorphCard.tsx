import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLMotionProps, motion } from 'framer-motion';
import React, { forwardRef } from 'react';
import { cn } from './utils/cn';

/**
 * TerraFusion Glass Morphism Card Component
 * Government. Transcended. - Championship Excellence
 *
 * Breathtaking card component with advanced glass morphism effects
 */

const cardVariants = cva(
  [
    // Base glass morphism foundation
    'relative overflow-hidden rounded-2xl',
    'bg-white/10 backdrop-blur-lg',
    'border border-terrafusion-cyan/20',
    'shadow-xl',
    'transition-all duration-500 ease-out',
    'transform-gpu', // Hardware acceleration

    // Quantum scan-line effect
    'before:absolute before:inset-0 before:bg-gradient-to-r',
    'before:from-transparent before:via-terrafusion-cyan/20 before:to-transparent',
    'before:-translate-x-full before:transition-transform before:duration-1000',
    'hover:before:translate-x-full',

    // Championship elevation
    'hover:shadow-2xl hover:-translate-y-1',
    'hover:border-terrafusion-cyan/30',
    'hover:bg-white/15',
  ],
  {
    variants: {
      variant: {
        // Default - Standard glass morphism
        default: ['bg-white/10', 'border-terrafusion-cyan/20', 'shadow-terrafusion-cyan/10'],

        // Transcendent - Government authority
        transcendent: [
          'bg-gradient-to-br from-white/15 to-terrafusion-blue/10',
          'border-terrafusion-blue/30',
          'shadow-terrafusion-blue/20',
          'hover:shadow-terrafusion-blue/30',
        ],

        // Quantum - AI/ML systems
        quantum: [
          'bg-gradient-to-br from-terrafusion-cyan/10 to-terrafusion-green/5',
          'border-terrafusion-cyan/30',
          'shadow-terrafusion-cyan/20',
          'hover:shadow-terrafusion-cyan/40',
        ],

        // Success - Achievement state
        success: [
          'bg-gradient-to-br from-terrafusion-green/10 to-white/10',
          'border-terrafusion-green/30',
          'shadow-terrafusion-green/20',
        ],

        // Dashboard - Executive interface
        dashboard: [
          'bg-gradient-to-br from-terrafusion-deep-space/20 to-white/5',
          'border-terrafusion-cyan/25',
          'shadow-2xl shadow-terrafusion-cyan/15',
        ],
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-12',
        championship: 'p-16',
      },
      glow: {
        none: '',
        subtle: 'hover:drop-shadow-[0_0_20px_rgba(0,255,238,0.2)]',
        medium: 'hover:drop-shadow-[0_0_30px_rgba(0,255,238,0.3)]',
        intense: 'hover:drop-shadow-[0_0_40px_rgba(0,255,238,0.4)]',
      },
      interactive: {
        none: '',
        hover: 'cursor-pointer',
        clickable: 'cursor-pointer active:scale-[0.98]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'subtle',
      interactive: 'none',
    },
  }
);

interface GlassMorphCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  quantumGrid?: boolean;
  governmentSeal?: boolean;
  confidenceIndicator?: boolean;
  confidenceLevel?: number;
}

const GlassMorphCard = forwardRef<HTMLDivElement, GlassMorphCardProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      interactive,
      quantumGrid = false,
      governmentSeal = false,
      confidenceIndicator = false,
      confidenceLevel = 97.3,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(cardVariants({ variant, size, glow, interactive }), className);

    const motionProps =
      interactive !== 'none'
        ? {
            initial: { scale: 1 },
            whileHover: { scale: 1.02, y: -4 },
            transition: { type: 'spring', stiffness: 400, damping: 17 },
          }
        : {};

    return (
      <motion.div ref={ref} className={cardClasses} {...motionProps} {...props}>
        {/* Quantum Grid Background */}
        {quantumGrid && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,238,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,238,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Government Seal Indicator */}
        {governmentSeal && (
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terrafusion-blue to-terrafusion-cyan flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-terrafusion-blue"></div>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Level Indicator */}
        {confidenceIndicator && (
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-terrafusion-green animate-pulse"></div>
              <span className="text-terrafusion-cyan font-semibold">
                {confidenceLevel}% Confidence
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlassMorphCard.displayName = 'GlassMorphCard';

export { cardVariants, GlassMorphCard };
export type { GlassMorphCardProps };
