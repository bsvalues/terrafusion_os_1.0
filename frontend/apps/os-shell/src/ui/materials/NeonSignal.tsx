/**
 * @fileoverview NeonSignal Component
 *
 * Semantic status indicator with neon glow effect.
 *
 * Design Manifesto Rule: Neon is NEVER decoration.
 * Only for critical system state:
 * - healthy / degraded / down — system health
 * - active — audit mode, active process
 * - locked — model locked, read-only state
 *
 * @module NeonSignal
 */

import React, { forwardRef, useMemo } from 'react';
import './neon-signal.css';

// ============================================================================
// Types
// ============================================================================

export type NeonSignalStatus = 'healthy' | 'degraded' | 'down' | 'active' | 'locked';
export type NeonSignalSize = 'xs' | 'sm' | 'md';

export interface NeonSignalProps {
  /** Semantic status — determines glow color */
  status: NeonSignalStatus;
  /** Size preset */
  size?: NeonSignalSize;
  /** Whether the dot pulses */
  pulse?: boolean;
  /** Label text */
  children: React.ReactNode;
  /** Optional className */
  className?: string;
  /** ARIA label override (defaults to children text) */
  'aria-label'?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * NeonSignal — semantic status badge with neon glow.
 *
 * @example
 * ```tsx
 * <NeonSignal status="healthy" pulse>SENTINEL Healthy</NeonSignal>
 * <NeonSignal status="active" size="xs">AUDIT MODE</NeonSignal>
 * <NeonSignal status="locked" size="xs">MODEL LOCKED</NeonSignal>
 * ```
 */
export const NeonSignal = forwardRef<HTMLSpanElement, NeonSignalProps>(
  function NeonSignal(
    {
      status,
      size = 'sm',
      pulse = false,
      children,
      className = '',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) {
    const classes = useMemo(() => {
      const parts = [
        'neon-signal',
        `neon-signal--${status}`,
        `neon-signal--${size}`,
      ];
      if (pulse) parts.push('neon-signal--pulse');
      return parts.join(' ');
    }, [status, size, pulse]);

    return (
      <span
        ref={ref}
        role='status'
        aria-label={ariaLabel}
        data-material="neon"
        className={`${classes} ${className}`.trim()}
        {...props}
      >
        <span className='neon-signal__dot' aria-hidden='true' />
        {children}
      </span>
    );
  }
);

export default NeonSignal;
