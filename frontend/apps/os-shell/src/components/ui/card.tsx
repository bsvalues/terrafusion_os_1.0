import * as React from 'react';

import { cn } from '@/utils/cn';

interface EliteCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'quantum' | 'elite';
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, EliteCardProps>(
  ({ className, variant = 'default', glow = false, ...props }, ref) => {
    const variantClasses = {
      default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
      glass:
        'rounded-lg bg-terra-slate/20 border border-terra-cyan/20 backdrop-blur-md text-white shadow-lg',
      quantum:
        'rounded-lg bg-gradient-to-br from-terra-cyan/10 to-terra-blue/10 border border-terra-cyan/30 text-white shadow-xl backdrop-blur-md',
      elite:
        'rounded-lg bg-terra-midnight border border-terra-cyan/40 text-white shadow-2xl backdrop-blur-lg',
    };

    const glowClasses = glow
      ? 'shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-shadow duration-300'
      : '';

    return (
      <div ref={ref} className={cn(variantClasses[variant], glowClasses, className)} {...props} />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
