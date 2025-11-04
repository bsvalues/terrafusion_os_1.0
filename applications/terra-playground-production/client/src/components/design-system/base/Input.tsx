import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Input variants using class-variance-authority
 */
const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-foreground shadow-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
        outline: 'border-2 focus:outline-none focus:border-primary focus:ring-0',
        ghost:
          'border-0 bg-transparent shadow-none focus:outline-none focus:ring-1 focus:ring-primary/25',
        underlined:
          'rounded-none border-0 border-b border-input bg-transparent px-0 focus:outline-none focus:ring-0 focus:border-primary',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 py-1 text-sm',
        lg: 'h-12 px-5 py-3 text-lg',
      },
      state: {
        default: '',
        error: 'border-destructive focus:border-destructive focus:ring-destructive/25',
        success: 'border-success focus:border-success focus:ring-success/25',
        warning: 'border-warning focus:border-warning focus:ring-warning/25',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
  /**
   * Error message to display below the input
   */
  error?: string;
  /**
   * Help text to display below the input
   */
  helperText?: string;
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Whether the input is required
   */
  required?: boolean;
}

/**
 * Input component
 *
 * A versatile input component that can be used for various form fields.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   startIcon={<MailIcon />}
 *   required
 * />
 *
 * <Input
 *   variant="underlined"
 *   label="Password"
 *   type="password"
 *   helperText="Password must be at least 8 characters"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      error,
      helperText,
      label,
      required,
      startIcon,
      endIcon,
      type = 'text',
      ...props
    },
    ref
  ) => {
    // Set state to error if error message is provided
    if (error && state === 'default') {
      state = 'error';
    }

    const inputId = React.useId();

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium',
              required && "after:content-['*'] after:ml-0.5 after:text-destructive",
              state === 'error' && 'text-destructive'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              inputVariants({ variant, size, state }),
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={state === 'error'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
