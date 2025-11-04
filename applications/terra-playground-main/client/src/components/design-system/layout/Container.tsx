import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Container variants using class-variance-authority
 */
const containerVariants = cva('mx-auto', {
  variants: {
    size: {
      xs: 'max-w-screen-sm',
      sm: 'max-w-screen-md',
      md: 'max-w-screen-lg',
      lg: 'max-w-screen-xl',
      xl: 'max-w-screen-2xl',
      full: 'max-w-full',
    },
    padding: {
      none: 'px-0',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
      xl: 'px-12',
    },
    gutter: {
      none: '',
      xs: 'py-2',
      sm: 'py-4',
      md: 'py-6',
      lg: 'py-8',
      xl: 'py-12',
      '2xl': 'py-16',
    },
  },
  defaultVariants: {
    size: 'lg',
    padding: 'md',
    gutter: 'none',
  },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Whether to render as a different HTML element
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Container component
 *
 * A layout component that centers content horizontally with consistent spacing.
 *
 * @example
 * ```tsx
 * <Container size="md" padding="lg">
 *   <p>Your content here</p>
 * </Container>
 * ```
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, gutter, as = 'div', children, ...props }, ref) => {
    const Element = as;

    return (
      <Element
        ref={ref}
        className={cn(containerVariants({ size, padding, gutter }), className)}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Container.displayName = 'Container';

export default Container;
