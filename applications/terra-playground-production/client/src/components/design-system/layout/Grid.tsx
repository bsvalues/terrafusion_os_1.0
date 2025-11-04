import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Grid variants using class-variance-authority
 */
const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-10',
    },
    rowGap: {
      none: 'row-gap-0',
      xs: 'row-gap-1',
      sm: 'row-gap-2',
      md: 'row-gap-4',
      lg: 'row-gap-6',
      xl: 'row-gap-8',
      '2xl': 'row-gap-10',
    },
    colGap: {
      none: 'col-gap-0',
      xs: 'col-gap-1',
      sm: 'col-gap-2',
      md: 'col-gap-4',
      lg: 'col-gap-6',
      xl: 'col-gap-8',
      '2xl': 'col-gap-10',
    },
    flow: {
      row: 'grid-flow-row',
      col: 'grid-flow-col',
      dense: 'grid-flow-dense',
      rowDense: 'grid-flow-row-dense',
      colDense: 'grid-flow-col-dense',
    },
  },
  defaultVariants: {
    cols: 3,
    gap: 'md',
    flow: 'row',
  },
});

export interface GridProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  /**
   * Custom grid template columns (overrides cols variant)
   */
  gridTemplateColumns?: string;
  /**
   * Custom grid template rows
   */
  gridTemplateRows?: string;
  /**
   * Whether to render as a different HTML element
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Grid component
 *
 * A layout component that arranges children in a grid format.
 *
 * @example
 * ```tsx
 * <Grid cols={3} gap="lg">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * <Grid gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap="md">
 *   {items.map(item => (
 *     <div key={item.id}>{item.name}</div>
 *   ))}
 * </Grid>
 * ```
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols,
      gap,
      rowGap,
      colGap,
      flow,
      gridTemplateColumns,
      gridTemplateRows,
      as = 'div',
      style = {},
      children,
      ...props
    },
    ref
  ) => {
    const Element = as;

    const customStyles = {
      ...style,
      ...(gridTemplateColumns ? { gridTemplateColumns } : {}),
      ...(gridTemplateRows ? { gridTemplateRows } : {}),
    };

    return (
      <Element
        ref={ref}
        className={cn(gridVariants({ cols, gap, rowGap, colGap, flow }), className)}
        style={customStyles}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;
