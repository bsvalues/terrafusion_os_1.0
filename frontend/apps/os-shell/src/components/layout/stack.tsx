/**
 * Stack Component - TerraFusion Design System
 * Week 2, Day 1 - Layout Components Phase
 *
 * Purpose: Flexbox wrapper for stacking elements with consistent spacing
 * - Vertical and horizontal stacking
 * - Flexible spacing options
 * - Alignment and justification
 * - Responsive direction
 *
 * @example
 * // Vertical stack with medium spacing
 * <Stack direction="vertical" spacing="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Stack>
 *
 * @example
 * // Horizontal stack with responsive direction
 * <Stack direction={{ base: 'vertical', md: 'horizontal' }} spacing="lg">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Stack>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction of the stack */
  direction?:
    | 'vertical'
    | 'horizontal'
    | {
        base?: 'vertical' | 'horizontal';
        sm?: 'vertical' | 'horizontal';
        md?: 'vertical' | 'horizontal';
        lg?: 'vertical' | 'horizontal';
      };
  /** Spacing between items */
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Alignment of items along cross-axis */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justification of items along main-axis */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Whether items should wrap */
  wrap?: boolean;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// Spacing mappings for vertical (gap-y) and horizontal (gap-x)
const spacingClasses = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

// Direction classes
const directionClasses = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

// Responsive direction classes
const responsiveDirectionClasses = {
  base: {
    vertical: 'flex-col',
    horizontal: 'flex-row',
  },
  sm: {
    vertical: 'sm:flex-col',
    horizontal: 'sm:flex-row',
  },
  md: {
    vertical: 'md:flex-col',
    horizontal: 'md:flex-row',
  },
  lg: {
    vertical: 'lg:flex-col',
    horizontal: 'lg:flex-row',
  },
};

// Alignment classes (cross-axis)
const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

// Justify classes (main-axis)
const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

/**
 * Stack component for vertical or horizontal layouts with consistent spacing
 */
export function Stack({
  direction = 'vertical',
  spacing = 'md',
  align,
  justify,
  wrap = false,
  children,
  className,
  ...props
}: StackProps) {
  // Build direction classes
  let directionClass = '';

  if (typeof direction === 'string') {
    directionClass = directionClasses[direction];
  } else {
    // Responsive direction
    const responsiveDirs: string[] = [];
    if (direction.base) responsiveDirs.push(responsiveDirectionClasses.base[direction.base]);
    if (direction.sm) responsiveDirs.push(responsiveDirectionClasses.sm[direction.sm]);
    if (direction.md) responsiveDirs.push(responsiveDirectionClasses.md[direction.md]);
    if (direction.lg) responsiveDirs.push(responsiveDirectionClasses.lg[direction.lg]);
    directionClass = responsiveDirs.join(' ');
  }

  return (
    <div
      className={cn(
        'flex',
        directionClass,
        spacingClasses[spacing],
        align && alignClasses[align],
        justify && justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * StackItem component for individual items that need custom behavior
 */
export interface StackItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether this item should grow to fill available space */
  grow?: boolean;
  /** Whether this item should shrink if needed */
  shrink?: boolean;
  /** Flex basis (width for horizontal, height for vertical) */
  basis?: string;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function StackItem({
  grow = false,
  shrink = true,
  basis,
  children,
  className,
  ...props
}: StackItemProps) {
  return (
    <div
      className={cn(
        grow && 'flex-grow',
        shrink && 'flex-shrink',
        !shrink && 'flex-shrink-0',
        className
      )}
      style={basis ? { flexBasis: basis } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
