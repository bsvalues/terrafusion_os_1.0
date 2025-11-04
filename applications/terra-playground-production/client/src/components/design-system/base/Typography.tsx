import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Typography variants using class-variance-authority
 */
const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl tf-heading',
      h2: 'scroll-m-20 text-3xl font-semibold tracking-tight tf-heading',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight tf-heading',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight tf-heading',
      h5: 'scroll-m-20 text-lg font-semibold tracking-tight tf-heading',
      h6: 'scroll-m-20 text-base font-semibold tracking-tight tf-heading',
      p: 'leading-7 tf-body',
      large: 'text-lg font-semibold tf-body',
      small: 'text-sm font-medium leading-none tf-body',
      muted: 'text-sm text-muted-foreground tf-body',
      lead: 'text-xl text-muted-foreground tf-body',
      code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold tf-mono',
      blockquote: 'mt-6 border-l-2 border-border pl-6 italic text-muted-foreground',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    transform: {
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
      normal: 'normal-case',
    },
  },
  defaultVariants: {
    variant: 'p',
    weight: 'normal',
    align: 'left',
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  /**
   * The HTML element to render the typography as
   */
  as?: keyof JSX.IntrinsicElements;
  /**
   * Truncate text with ellipsis after specified number of lines
   */
  truncate?: number;
}

/**
 * Typography component
 *
 * A versatile typography component that can be used for various text styles.
 *
 * @example
 * ```tsx
 * <Typography variant="h1">Heading 1</Typography>
 * <Typography variant="p" weight="medium">Medium paragraph</Typography>
 * <Typography variant="muted" align="center">Centered muted text</Typography>
 * ```
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, weight, align, transform, as, truncate, children, ...props }, ref) => {
    // Determine the HTML element to use based on the variant or 'as' prop
    const Element =
      as || (variant?.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') : 'p');

    return React.createElement(
      Element,
      {
        className: cn(
          typographyVariants({ variant, weight, align, transform }),
          truncate && 'overflow-hidden',
          truncate === 1 && 'whitespace-nowrap text-ellipsis',
          truncate && truncate > 1 && `line-clamp-${truncate}`,
          className
        ),
        ref,
        ...props,
      },
      children
    );
  }
);

Typography.displayName = 'Typography';

export default Typography;
