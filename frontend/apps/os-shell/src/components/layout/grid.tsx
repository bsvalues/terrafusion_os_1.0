/**
 * Grid Component - TerraFusion Design System
 * Week 2, Day 1 - Layout Components Phase
 *
 * Purpose: CSS Grid wrapper for creating responsive grid layouts
 * - Column-based layouts (1-12 columns)
 * - Responsive grid patterns
 * - Gap utilities for spacing
 * - Auto-fit and auto-fill patterns
 *
 * @example
 * // Basic 3-column grid
 * <Grid cols={3} gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * @example
 * // Responsive grid (1 col on mobile, 2 on tablet, 3 on desktop)
 * <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="lg">
 *   <Card>Content</Card>
 *   <Card>Content</Card>
 *   <Card>Content</Card>
 * </Grid>
 */

import * as React from 'react';
import { cn } from '@utils/cn';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns (1-12) or responsive object */
  cols?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Number of rows (optional) */
  rows?: number | 'auto';
  /** Alignment of items along main axis */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justification of items */
  justify?: 'start' | 'center' | 'end' | 'stretch' | 'between';
  /** Enable auto-fit (responsive column fitting) */
  autoFit?: boolean;
  /** Minimum column width for auto-fit (default: 250px) */
  minColWidth?: string;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// Gap size mappings
const gapClasses = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

// Column count mappings
const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

// Responsive column mappings
const responsiveColClasses = {
  base: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  },
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
  },
};

// Alignment classes
const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

// Justify classes
const justifyClasses = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
  between: 'justify-between',
};

/**
 * Grid component for creating responsive grid layouts
 */
export function Grid({
  cols = 1,
  gap = 'md',
  rows,
  align,
  justify,
  autoFit = false,
  minColWidth = '250px',
  children,
  className,
  ...props
}: GridProps) {
  // Build column classes
  let columnClasses = '';

  if (autoFit) {
    // Auto-fit creates responsive columns automatically
    columnClasses = '';
  } else if (typeof cols === 'number') {
    // Single number for all breakpoints
    columnClasses = colClasses[cols as keyof typeof colClasses] || 'grid-cols-1';
  } else {
    // Responsive object
    const responsiveCols: string[] = [];
    if (cols.base)
      responsiveCols.push(
        responsiveColClasses.base[cols.base as keyof typeof responsiveColClasses.base]
      );
    if (cols.sm)
      responsiveCols.push(responsiveColClasses.sm[cols.sm as keyof typeof responsiveColClasses.sm]);
    if (cols.md)
      responsiveCols.push(responsiveColClasses.md[cols.md as keyof typeof responsiveColClasses.md]);
    if (cols.lg)
      responsiveCols.push(responsiveColClasses.lg[cols.lg as keyof typeof responsiveColClasses.lg]);
    if (cols.xl)
      responsiveCols.push(responsiveColClasses.xl[cols.xl as keyof typeof responsiveColClasses.xl]);
    columnClasses = responsiveCols.join(' ');
  }

  // Build row classes
  const rowClasses = rows && typeof rows === 'number' ? `grid-rows-${rows}` : '';

  // Auto-fit inline style
  const autoFitStyle = autoFit
    ? { gridTemplateColumns: `repeat(auto-fit, minmax(${minColWidth}, 1fr))` }
    : undefined;

  return (
    <div
      className={cn(
        'grid',
        columnClasses,
        rowClasses,
        gapClasses[gap],
        align && alignClasses[align],
        justify && justifyClasses[justify],
        className
      )}
      style={autoFitStyle}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GridItem component for spanning multiple columns/rows
 */
export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns to span (1-12) */
  colSpan?: number | 'full';
  /** Number of rows to span */
  rowSpan?: number | 'full';
  /** Column start position (1-13) */
  colStart?: number;
  /** Row start position (1-13) */
  rowStart?: number;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const colSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  full: 'col-span-full',
};

const rowSpanClasses = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
  full: 'row-span-full',
};

export function GridItem({
  colSpan,
  rowSpan,
  colStart,
  rowStart,
  children,
  className,
  ...props
}: GridItemProps) {
  const spanClasses = [
    colSpan && colSpanClasses[colSpan as keyof typeof colSpanClasses],
    rowSpan && rowSpanClasses[rowSpan as keyof typeof rowSpanClasses],
    colStart && `col-start-${colStart}`,
    rowStart && `row-start-${rowStart}`,
  ].filter(Boolean);

  return (
    <div className={cn(...spanClasses, className)} {...props}>
      {children}
    </div>
  );
}
