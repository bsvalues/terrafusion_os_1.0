import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Section variants using class-variance-authority
 */
const sectionVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      primary: 'bg-primary/10 text-foreground',
      secondary: 'bg-secondary/10 text-foreground',
      muted: 'bg-muted text-muted-foreground',
      accent: 'bg-accent text-accent-foreground',
      dark: 'bg-slate-900 text-white',
      glass: 'tf-glass text-foreground',
    },
    padding: {
      none: 'py-0',
      xs: 'py-2',
      sm: 'py-4',
      md: 'py-8',
      lg: 'py-12',
      xl: 'py-16',
      '2xl': 'py-24',
    },
    gap: {
      none: 'space-y-0',
      xs: 'space-y-2',
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8',
      xl: 'space-y-12',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    gap: 'md',
  },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  /**
   * Section title
   */
  title?: string;
  /**
   * Section description
   */
  description?: string;
  /**
   * Whether to add a divider between the title/description and content
   */
  divider?: boolean;
  /**
   * Type of header for the title (h1, h2, etc.)
   */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /**
   * Whether to render as a different HTML element
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Section component
 *
 * A layout component that represents a distinct section of a page.
 * Optionally includes a title and description.
 *
 * @example
 * ```tsx
 * <Section
 *   title="Features"
 *   description="Explore the powerful features of our platform."
 *   variant="primary"
 *   padding="lg"
 * >
 *   <FeaturesList />
 * </Section>
 * ```
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      variant,
      padding,
      gap,
      title,
      description,
      divider = false,
      titleAs = 'h2',
      as = 'section',
      children,
      ...props
    },
    ref
  ) => {
    const Element = as;
    const TitleElement = titleAs;

    return (
      <Element
        ref={ref}
        className={cn(sectionVariants({ variant, padding, gap }), className)}
        {...props}
      >
        {(title || description) && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            {title && (
              <TitleElement className="tf-heading text-2xl font-bold tracking-tight lg:text-3xl">
                {title}
              </TitleElement>
            )}
            {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
          </div>
        )}

        {divider && (title || description) && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <hr className="border-t border-border" />
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </Element>
    );
  }
);

Section.displayName = 'Section';

export default Section;
