/**
 * @fileoverview BentoCard Component
 *
 * Individual card container for BentoGrid layouts.
 * Uses LiquidPanel variant="infrastructure" for consistent glass material.
 *
 * Features:
 * - Pre-defined span sizes: 1x1, 2x1, 1x2, 2x2, full
 * - Content variants: stat, chart, table, form, map
 * - Optional "promote" state for next-action highlighting
 * - Optional header with title, subtitle, and action slot
 * - Quality-gated glass via LiquidPanel
 *
 * @module BentoCard
 */

import React, { forwardRef, HTMLAttributes, useMemo } from 'react';
import { LiquidPanel } from './LiquidPanel';
import './bento-grid.css';

// ============================================================================
// Types
// ============================================================================

export type BentoCardSpan = '1x1' | '2x1' | '1x2' | '2x2' | 'full';
export type BentoCardVariant = 'stat' | 'chart' | 'table' | 'form' | 'map';

export interface BentoCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Grid span size (default '1x1') */
  span?: BentoCardSpan;
  /** Content layout variant */
  variant?: BentoCardVariant;
  /** Card title (rendered in header) */
  title?: React.ReactNode;
  /** Card subtitle (rendered below title) */
  subtitle?: React.ReactNode;
  /** Actions rendered in header right slot */
  actions?: React.ReactNode;
  /** Highlight as next required action */
  promote?: boolean;
  /** Children elements */
  children?: React.ReactNode;
}

// Token-backed CSS custom property values (set via style to avoid hsl() in CSS)
const BENTO_TOKEN_VARS: React.CSSProperties = {
  '--bento-header-border': 'hsl(var(--tf-border) / 0.15)',
  '--bento-title-color': 'hsl(var(--tf-text) / 0.9)',
  '--bento-subtitle-color': 'hsl(var(--tf-text) / 0.5)',
} as React.CSSProperties;

const BENTO_PROMOTE_VARS: React.CSSProperties = {
  '--bento-promote-border': 'hsl(var(--tf-accent) / 0.4)',
  '--bento-promote-glow': 'hsl(var(--tf-accent) / 0.06)',
} as React.CSSProperties;

// ============================================================================
// Component
// ============================================================================

/**
 * BentoCard - Glass card container for BentoGrid layouts.
 *
 * Uses LiquidPanel variant="infrastructure" so cards are visually subordinate
 * to OS chrome (which uses variant="shell").
 *
 * @example
 * ```tsx
 * <BentoCard span="2x1" variant="stat" title="Assessment Total" promote>
 *   <h2 className="text-3xl font-bold">$4.2B</h2>
 *   <p className="text-sm opacity-60">Benton County FY2026</p>
 * </BentoCard>
 * ```
 */
export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(function BentoCard(
  {
    span = '1x1',
    variant,
    title,
    subtitle,
    actions,
    promote = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const classes = useMemo(() => {
    const base = ['bento-card'];

    // Span size
    if (span !== '1x1') {
      base.push(`bento-card--${span}`);
    }

    // Content variant
    if (variant) {
      base.push(`bento-card--${variant}`);
    }

    // Promote state
    if (promote) {
      base.push('bento-card--promote');
    }

    return base.join(' ');
  }, [span, variant, promote]);

  const hasHeader = title || subtitle || actions;

  const tokenStyle = useMemo<React.CSSProperties>(() => ({
    ...BENTO_TOKEN_VARS,
    ...(promote ? BENTO_PROMOTE_VARS : {}),
  }), [promote]);

  return (
    <LiquidPanel
      ref={ref}
      variant="infrastructure"
      radius="lg"
      className={`${classes} ${className}`.trim()}
      style={tokenStyle}
      {...props}
    >
      {hasHeader && (
        <div className="bento-card__header">
          <div>
            {title && <h3 className="bento-card__title">{title}</h3>}
            {subtitle && <p className="bento-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="bento-card__actions">{actions}</div>}
        </div>
      )}
      <div className="bento-card__content">
        {children}
      </div>
    </LiquidPanel>
  );
});

export default BentoCard;
