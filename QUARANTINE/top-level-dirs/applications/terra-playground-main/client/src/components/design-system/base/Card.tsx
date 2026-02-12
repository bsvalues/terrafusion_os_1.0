import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card variants using class-variance-authority
 */
const cardVariants = cva('rounded-lg overflow-hidden transition-shadow', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground shadow-sm',
      glass: 'tf-card-glass',
      outline: 'border border-border bg-transparent',
      filled: 'bg-accent text-accent-foreground',
      accent: 'bg-primary/10 text-primary-foreground',
      gradient: 'bg-gradient-to-br from-primary/20 to-primary/5 text-foreground',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    elevation: {
      flat: 'shadow-none',
      low: 'shadow-sm',
      medium: 'shadow-md',
      high: 'shadow-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    elevation: 'medium',
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Title of the card, rendered in the header if provided
   */
  title?: string;
  /**
   * Description text, rendered below the title if provided
   */
  description?: string;
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  /**
   * Optional header actions (buttons, etc.)
   */
  actions?: React.ReactNode;
  /**
   * If true, adds a hover effect to the card
   */
  hoverable?: boolean;
  /**
   * If true, removes overflow hidden, allowing content to overflow
   */
  allowOverflow?: boolean;
}

/**
 * Card component
 *
 * A versatile card component that can be used for various content types.
 *
 * @example
 * ```tsx
 * <Card title="Card Title" description="Card description text">
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      elevation,
      title,
      description,
      footer,
      actions,
      hoverable,
      allowOverflow,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          cardVariants({ variant, padding, elevation }),
          hoverable &&
            'hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1',
          allowOverflow && 'overflow-visible',
          className
        )}
        ref={ref}
        {...props}
      >
        {(title || description || actions) && (
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="flex items-center justify-between">
              {title && (
                <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
              )}
              {actions && <div className="flex items-center space-x-2">{actions}</div>}
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        {/* Main content */}
        <div className={cn(!padding || padding === 'none' ? 'px-6 py-4' : '')}>{children}</div>

        {/* Footer */}
        {footer && <div className="border-t border-border p-6">{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
