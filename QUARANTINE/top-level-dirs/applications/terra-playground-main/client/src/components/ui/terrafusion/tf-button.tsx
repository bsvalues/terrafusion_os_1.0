import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2  } from '@mui/icons-material';

/**
 * Terrafusion Button Types
 */
export type TFButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ghost'
  | 'link'
  | 'outline'
  | 'destructive'
  | 'success';

export type TFButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

/**
 * Terrafusion Button Props Interface
 */
export interface TFButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button type */
  variant?: TFButtonVariant;
  /** Button size */
  size?: TFButtonSize;
  /** Is the button loading */
  loading?: boolean;
  /** Should the button be full width */
  fullWidth?: boolean;
  /** Icon to display at the start of the button */
  startIcon?: React.ReactNode;
  /** Alias for startIcon for compatibility */
  iconLeft?: React.ReactNode;
  /** Icon to display at the end of the button */
  endIcon?: React.ReactNode;
  /** Alias for endIcon for compatibility */
  iconRight?: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Creates a glass-like effect */
  glassmorphic?: boolean;
  /** Animates on hover */
  animated?: boolean;
}

/**
 * Terrafusion Button Component
 *
 * A styled button component for the Terrafusion UI design system
 */
export const TFButton = forwardRef<HTMLButtonElement, TFButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      loading = false,
      fullWidth = false,
      startIcon,
      endIcon,
      iconLeft,
      iconRight,
      className = '',
      glassmorphic = false,
      animated = false,
      ...props
    },
    ref
  ) => {
    // Map Terrafusion variant names to Shadcn/UI variant
    const variantMap: Record<TFButtonVariant, string> = {
      default: 'default',
      primary: 'default',
      secondary: 'secondary',
      accent: 'accent', // Custom variant - need to add to theme
      ghost: 'ghost',
      link: 'link',
      outline: 'outline',
      destructive: 'destructive',
      success: 'success', // Custom variant - need to add to theme
    };

    // Map Terrafusion sizes to tailwind classes
    const sizeClasses: Record<TFButtonSize, string> = {
      xs: 'h-8 px-2 text-xs',
      sm: 'h-9 px-3',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
      icon: 'h-10 w-10 p-2',
    };

    const buttonClasses = cn(
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      glassmorphic ? 'backdrop-blur-sm bg-opacity-80 shadow-md' : '',
      animated ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-1' : '',
      variant === 'accent' ? 'bg-teal-600 text-white hover:bg-teal-700' : '',
      variant === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : '',
      className
    );

    return (
      <Button
        ref={ref}
        variant={variantMap[variant] as any}
        className={buttonClasses}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && (startIcon || iconLeft) && (
          <span className="mr-2">{startIcon || iconLeft}</span>
        )}
        {children}
        {!loading && (endIcon || iconRight) && <span className="ml-2">{endIcon || iconRight}</span>}
      </Button>
    );
  }
);

TFButton.displayName = 'TFButton';

export default TFButton;
