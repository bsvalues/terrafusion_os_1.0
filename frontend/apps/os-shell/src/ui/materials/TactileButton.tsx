/**
 * @fileoverview TactileButton Component
 *
 * A physics-based button with spring animations that respects quality gates.
 *
 * Features:
 * - Spring animations on capable hardware (60fps)
 * - CSS fallback on low-power/reduced-motion
 * - WCAG AA focus indicators
 * - Zero idle animations
 *
 * Constitutional Values:
 * - SPRING_STIFFNESS: 400 (responsive but not jarring)
 * - SPRING_DAMPING: 10 (crisp settle)
 * - SCALE_HOVER: 1.02 (subtle lift)
 * - SCALE_TAP: 0.97 (satisfying press)
 *
 * @module TactileButton
 */

import { motion, useReducedMotion } from 'framer-motion';
import React, { ButtonHTMLAttributes, forwardRef, useMemo } from 'react';
import { useMaterialQuality } from './materialQualityGate';
import './tactile-button.css';

// ============================================================================
// Types
// ============================================================================

export type TactileButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type TactileButtonSize = 'sm' | 'md' | 'lg';

export interface TactileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: TactileButtonVariant;
  /** Size preset */
  size?: TactileButtonSize;
  /** Full width */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon before text */
  leftIcon?: React.ReactNode;
  /** Icon after text */
  rightIcon?: React.ReactNode;
  /** Children elements */
  children?: React.ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 10,
  mass: 0.6,
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.96;

// ============================================================================
// Component
// ============================================================================

/**
 * TactileButton - Physics-based button with spring animations.
 *
 * Automatically adapts to:
 * - prefers-reduced-motion (uses CSS transitions instead)
 * - Quality tier (disables physics on low-power)
 *
 * @example
 * ```tsx
 * <TactileButton variant="primary" onClick={handleSubmit}>
 *   Submit
 * </TactileButton>
 * ```
 */
export const TactileButton = forwardRef<HTMLButtonElement, TactileButtonProps>(
  function TactileButton(
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) {
    const quality = useMaterialQuality();
    const reducedMotion = useReducedMotion();

    // Determine if springs should be used
    const enableSprings = quality.enableSprings && !reducedMotion;

    // Compute CSS classes
    const classes = useMemo(() => {
      const baseClasses = [
        'tactile-button',
        `tactile-button--${variant}`,
        `tactile-button--${size}`,
      ];

      if (fullWidth) {
        baseClasses.push('tactile-button--full-width');
      }

      if (loading) {
        baseClasses.push('tactile-button--loading');
      }

      if (disabled) {
        baseClasses.push('tactile-button--disabled');
      }

      return baseClasses.join(' ');
    }, [variant, size, fullWidth, loading, disabled]);

    // Motion props (only if springs enabled)
    const motionProps = useMemo(() => {
      if (!enableSprings || disabled) {
        return {
          whileHover: undefined,
          whileTap: undefined,
          transition: undefined,
        };
      }

      return {
        whileHover: { scale: HOVER_SCALE },
        whileTap: { scale: TAP_SCALE },
        transition: SPRING_CONFIG,
      };
    }, [enableSprings, disabled]);

    return (
      <motion.button
        ref={ref}
        className={`${classes} ${className}`.trim()}
        disabled={disabled || loading}
        data-material="tactile"
        data-reduced-motion={!enableSprings ? 'true' : 'false'}
        data-loading={loading ? 'true' : 'false'}
        {...motionProps}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <span className='tactile-button__spinner' aria-hidden='true'>
            <svg
              className='tactile-button__spinner-icon'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <circle cx='12' cy='12' r='10' strokeOpacity='0.25' />
              <path d='M12 2a10 10 0 0 1 10 10' strokeLinecap='round' />
            </svg>
          </span>
        )}

        {/* Left icon */}
        {leftIcon && !loading && (
          <span className='tactile-button__icon tactile-button__icon--left'>{leftIcon}</span>
        )}

        {/* Text content */}
        <span className='tactile-button__text' style={{ opacity: loading ? 0 : 1 }}>
          {children}
        </span>

        {/* Right icon */}
        {rightIcon && !loading && (
          <span className='tactile-button__icon tactile-button__icon--right'>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

// ============================================================================
// Exports
// ============================================================================

export default TactileButton;
