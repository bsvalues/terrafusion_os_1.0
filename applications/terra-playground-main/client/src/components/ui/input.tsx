import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-secondary-gray bg-surface-light px-3 py-2 text-sm ring-offset-background tf-font-body text-primary-gray-dark file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary-blue placeholder:text-primary-gray-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue-light focus-visible:ring-offset-2 focus-visible:border-primary-blue disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
