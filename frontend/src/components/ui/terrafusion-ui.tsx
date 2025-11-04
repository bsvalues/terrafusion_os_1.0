/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION DESIGN SYSTEM - CORE COMPONENTS
 * Quantum Governance Platform UI Components
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import './terrafusion-ui.css';

/* ═══ BUTTON COMPONENT ═══ */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'quantum' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  pulse?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, pulse = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
          'disabled:opacity-50 disabled:pointer-events-none',

          // Variants
          {
            // Primary - Terra Cyan
            'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400':
              variant === 'primary',
            'text-gray-900 shadow-lg hover:shadow-xl focus:ring-cyan-400': variant === 'primary',

            // Secondary - Terra Blue
            'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500':
              variant === 'secondary',
            'text-white shadow-lg hover:shadow-xl focus:ring-blue-400': variant === 'secondary',

            // Ghost - Transparent with border
            'bg-transparent border border-cyan-400/50 hover:border-cyan-400': variant === 'ghost',
            'text-cyan-400 hover:bg-cyan-400/10 focus:ring-cyan-400': variant === 'ghost',

            // Quantum - Animated gradient
            'terra-gradient-quantum text-white shadow-xl': variant === 'quantum',
            'hover:shadow-2xl focus:ring-purple-400': variant === 'quantum',

            // Danger
            'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500':
              variant === 'danger',
            'text-white shadow-lg hover:shadow-xl focus:ring-red-400': variant === 'danger',
          },

          // Sizes
          {
            'px-3 py-1.5 text-sm h-8': size === 'sm',
            'px-4 py-2 text-base h-10': size === 'md',
            'px-6 py-3 text-lg h-12': size === 'lg',
            'px-8 py-4 text-xl h-16': size === 'xl',
          },

          // Effects
          glow && 'terra-glow',
          pulse && 'quantum-pulse',

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

/* ═══ CARD COMPONENT ═══ */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'quantum';
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', glow = false, ...props }, ref) => {
    return (
      <div
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-300',

          // Variants
          {
            'terra-glass': variant === 'glass',
            'bg-gray-800 border border-gray-700': variant === 'solid',
            'terra-gradient-quantum border border-cyan-400/30': variant === 'quantum',
          },

          // Effects
          glow && 'terra-quantum-glow',

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={cn('p-6 pb-3', className)} ref={ref} {...props} />;
  }
);

CardHeader.displayName = 'CardHeader';

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />;
  }
);

CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={cn('p-6 pt-3', className)} ref={ref} {...props} />;
  }
);

CardFooter.displayName = 'CardFooter';

/* ═══ INPUT COMPONENT ═══ */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  glow?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, glow = false, ...props }, ref) => {
    return (
      <div className='space-y-2'>
        {label && <label className='block text-sm font-medium text-cyan-400'>{label}</label>}
        <input
          className={cn(
            'w-full px-4 py-3 rounded-lg border transition-all duration-300',
            'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400',
            'hover:border-gray-500',
            glow && 'terra-glow',
            error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className='text-sm text-red-400'>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ═══ BADGE COMPONENT ═══ */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'quantum';
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', pulse = false, ...props }, ref) => {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          'transition-all duration-300',

          // Variants
          {
            'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30': variant === 'default',
            'bg-green-400/20 text-green-400 border border-green-400/30': variant === 'success',
            'bg-amber-400/20 text-amber-400 border border-amber-400/30': variant === 'warning',
            'bg-red-400/20 text-red-400 border border-red-400/30': variant === 'error',
            'terra-gradient-quantum text-white border border-purple-400/30': variant === 'quantum',
          },

          // Effects
          pulse && 'quantum-pulse',

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

/* ═══ AVATAR COMPONENT ═══ */
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', glow = false, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden',
          'bg-gradient-to-r from-cyan-400 to-blue-500',
          'transition-all duration-300',

          // Sizes
          {
            'w-8 h-8 text-xs': size === 'sm',
            'w-10 h-10 text-sm': size === 'md',
            'w-12 h-12 text-base': size === 'lg',
            'w-16 h-16 text-lg': size === 'xl',
          },

          // Effects
          glow && 'terra-glow',

          className
        )}
        ref={ref}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className='w-full h-full object-cover' />
        ) : (
          <span className='font-medium text-white'>{fallback || '?'}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/* ═══ PROGRESS COMPONENT ═══ */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'quantum';
  showValue?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = 'default', showValue = false, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const progressClass = `progress-${Math.round(percentage / 5) * 5}`;

    return (
      <div className='space-y-2'>
        {showValue && (
          <div className='flex justify-between text-sm text-gray-400'>
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn('w-full bg-gray-800 rounded-full h-2 overflow-hidden', className)}
          ref={ref}
          {...props}
        >
          <div
            className={cn('h-full transition-all duration-300 ease-out', progressClass, {
              'bg-gradient-to-r from-cyan-400 to-blue-500': variant === 'default',
              'terra-gradient-quantum': variant === 'quantum',
            })}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

/* ═══ DIVIDER COMPONENT ═══ */
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'gradient' | 'quantum';
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, variant = 'solid', orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        className={cn(
          'transition-all duration-300',

          // Orientation
          orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',

          // Variants
          {
            'bg-gray-700': variant === 'solid',
            'bg-gradient-to-r from-transparent via-cyan-400 to-transparent':
              variant === 'gradient' && orientation === 'horizontal',
            'bg-gradient-to-b from-transparent via-cyan-400 to-transparent':
              variant === 'gradient' && orientation === 'vertical',
            'terra-gradient-quantum': variant === 'quantum',
          },

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export {
  type AvatarProps,
  type BadgeProps,
  type ButtonProps,
  type CardProps,
  type DividerProps,
  type InputProps,
  type ProgressProps,
};
