/**
 * @fileoverview LiquidPanel Component
 *
 * A glass-effect panel that automatically degrades based on quality gate.
 *
 * Features:
 * - Backdrop blur on capable hardware
 * - Static fallback on low-power devices
 * - Reduced motion compliance
 * - WCAG AA contrast for text
 * - Zero idle animations
 *
 * Material Hierarchy Variants:
 * - shell: Infrastructure layer (darkest, most prominent blur)
 * - interactive: Clickable surfaces (subtle hover states)
 * - signal: Feedback/notification surfaces (accent tint)
 *
 * @module LiquidPanel
 */

import React, { forwardRef, HTMLAttributes, useMemo } from 'react';
import './liquid-panel.css';
import { MaterialQuality, useMaterialQuality } from './materialQualityGate';

// ============================================================================
// Types
// ============================================================================

export type LiquidPanelVariant = 'shell' | 'infrastructure' | 'interactive' | 'signal';

export interface LiquidPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Material hierarchy variant */
  variant?: LiquidPanelVariant;
  /** Enable shimmer effect (only when motion allowed) */
  shimmer?: boolean;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Blur intensity (0-3, default 2) */
  blurIntensity?: 0 | 1 | 2 | 3;
  /** Border radius preset */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Children elements */
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LiquidPanel - Quality-gated glass effect container.
 *
 * Automatically adapts to:
 * - GPU tier (disables blur on low-power)
 * - prefers-reduced-motion (disables shimmer)
 * - contrast requirements (ensures text readability)
 *
 * @example
 * ```tsx
 * <LiquidPanel variant="shell">
 *   <h1>Dashboard</h1>
 * </LiquidPanel>
 * ```
 */
export const LiquidPanel = forwardRef<HTMLDivElement, LiquidPanelProps>(function LiquidPanel(
  {
    variant = 'shell',
    shimmer = false,
    backgroundColor,
    blurIntensity = 2,
    radius = 'lg',
    className = '',
    children,
    style,
    ...props
  },
  ref
) {
  const quality = useMaterialQuality();

  // Compute CSS classes based on quality tier
  const classes = useMemo(() => {
    const baseClasses = ['liquid-panel', `liquid-panel--${variant}`];

    // Quality tier class
    switch (quality.tier) {
      case MaterialQuality.LOW:
        baseClasses.push('liquid-panel--static');
        break;
      case MaterialQuality.MEDIUM:
        baseClasses.push('liquid-panel--blur');
        break;
      case MaterialQuality.HIGH:
        baseClasses.push('liquid-panel--glass');
        if (quality.enableGlassDistortion) {
          baseClasses.push('liquid-panel--distortion');
        }
        break;
    }

    // Shimmer (only when motion allowed)
    if (shimmer && quality.enableLoopingAnimations) {
      baseClasses.push('liquid-panel--shimmer');
    }

    // Blur intensity
    if (quality.enableBackdropBlur && blurIntensity > 0) {
      baseClasses.push(`liquid-panel--blur-${blurIntensity}`);
    }

    // Border radius
    if (radius !== 'none') {
      baseClasses.push(`liquid-panel--radius-${radius}`);
    }

    return baseClasses.join(' ');
  }, [quality, variant, shimmer, blurIntensity, radius]);

  // Custom style overrides
  const computedStyle = useMemo(() => {
    const styles: React.CSSProperties = { ...style };

    if (backgroundColor) {
      styles.backgroundColor = backgroundColor;
    }

    return styles;
  }, [style, backgroundColor]);

  return (
    <div
      ref={ref}
      className={`${classes} ${className}`.trim()}
      style={computedStyle}
      data-material="liquid-glass"
      data-reduced-motion={quality.prefersReducedMotion ? 'true' : 'false'}
      data-quality-tier={quality.tier}
      {...props}
    >
      {children}
    </div>
  );
});

// ============================================================================
// Exports
// ============================================================================

export default LiquidPanel;
