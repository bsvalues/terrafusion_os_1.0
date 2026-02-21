import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        primary:
          'bg-terra-cyan text-terra-midnight font-semibold hover:bg-terra-cyan/90 shadow-lg hover:shadow-[0_0_15px_hsl(var(--tf-accent)/0.4)] transition-all duration-300',
        quantum:
          'bg-gradient-to-r from-terra-cyan to-terra-blue text-white font-bold hover:from-terra-cyan/90 hover:to-terra-blue/90 shadow-xl hover:shadow-[0_0_20px_hsl(var(--tf-accent)/0.5)] animate-pulse',
        danger:
          'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-[0_0_15px_var(--tf-error-red)]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        md: 'h-9 px-4 py-2 has-[>svg]:px-3',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  pulse = false,
  glow = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pulse?: boolean;
    glow?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const pulseClasses = pulse ? 'animate-pulse' : '';
  const glowClasses = glow
    ? 'shadow-[0_0_20px_hsl(var(--tf-accent)/0.4)] hover:shadow-[0_0_30px_hsl(var(--tf-accent)/0.6)]'
    : '';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }), pulseClasses, glowClasses)}
      {...props}
    />
  );
}

export { Button, buttonVariants };

