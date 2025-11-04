import * as React from 'react';
import { cn } from '../../utils/classes';

// Define props interface for the Input component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helpText?: string;
}

/**
 * Input component for text entry
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter your name" />
 *
 * <Input
 *   type="email"
 *   placeholder="Enter your email"
 *   error={!!errors.email}
 *   helpText={errors.email?.message}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helpText, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {helpText && (
          <p className={cn('text-xs mt-1', error ? 'text-destructive' : 'text-muted-foreground')}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
