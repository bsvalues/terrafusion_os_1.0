import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to render inside the container
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  /**
   * Maximum width variant
   * @default 'default'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'default';
  /**
   * Whether to center the container
   * @default true
   */
  center?: boolean;
  /**
   * Padding variant
   * @default 'default'
   */
  padding?: 'none' | 'sm' | 'default' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  default: 'max-w-7xl',
};

const paddingClasses = {
  none: '',
  sm: 'px-4',
  default: 'px-4 md:px-6 lg:px-8',
  lg: 'px-6 md:px-8 lg:px-12',
};

/**
 * Container Component
 * 
 * A responsive container component that constrains content width and provides
 * consistent horizontal padding across breakpoints.
 * 
 * @example
 * ```tsx
 * <Container>
 *   <h1>Page Content</h1>
 * </Container>
 * ```
 */
export function Container({
  children,
  className,
  maxWidth = 'default',
  center = true,
  padding = 'default',
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        center && 'mx-auto',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
