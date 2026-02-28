/**
 * @fileoverview BentoGrid Component
 *
 * CSS Grid layout system for dashboard-style content inside suite windows.
 * Adapts to container width since OS windows can be any size.
 *
 * Features:
 * - Pre-defined column counts (1-4) or auto-fit
 * - Zero CLS: all sizing is CSS Grid (no JS measurement)
 * - Responsive: auto-fit mode uses minmax() for fluid columns
 * - Container-aware: large cards collapse on narrow windows
 *
 * @module BentoGrid
 */

import React, { forwardRef, HTMLAttributes, useMemo } from 'react';
import './bento-grid.css';

// ============================================================================
// Types
// ============================================================================

export type BentoGridColumns = 1 | 2 | 3 | 4 | 'auto';

export interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns (1-4) or 'auto' for responsive auto-fit */
  columns?: BentoGridColumns;
  /** Grid gap in rem (default 1) */
  gap?: number;
  /** Grid padding in rem (default 1) */
  padding?: number;
  /** Minimum column width in px for auto-fit mode (default 280) */
  minColumnWidth?: number;
  /** Children elements (BentoCard components) */
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * BentoGrid - CSS Grid layout for dashboard content.
 *
 * Use as the top-level layout inside a suite window's content area.
 * Place BentoCard children inside for consistent card sizing.
 *
 * @example
 * ```tsx
 * <BentoGrid columns={3}>
 *   <BentoCard span="2x1" variant="stat" title="Total Parcels">
 *     <h2>89,247</h2>
 *   </BentoCard>
 *   <BentoCard variant="chart" title="Trend">
 *     <LineChart data={data} />
 *   </BentoCard>
 * </BentoGrid>
 * ```
 */
export const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(function BentoGrid(
  {
    columns = 'auto',
    gap = 1,
    padding = 1,
    minColumnWidth = 280,
    className = '',
    children,
    style,
    ...props
  },
  ref
) {
  const classes = useMemo(() => {
    const base = ['bento-grid'];
    if (columns === 'auto') {
      base.push('bento-grid--auto');
    } else {
      base.push(`bento-grid--cols-${columns}`);
    }
    return base.join(' ');
  }, [columns]);

  const gridStyle = useMemo<React.CSSProperties>(() => ({
    '--bento-gap': `${gap}rem`,
    '--bento-padding': `${padding}rem`,
    ...(columns === 'auto' ? { '--bento-col-min': `${minColumnWidth}px` } : {}),
    ...style,
  } as React.CSSProperties), [gap, padding, minColumnWidth, columns, style]);

  return (
    <div
      ref={ref}
      className={`${classes} ${className}`.trim()}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
});

export default BentoGrid;
