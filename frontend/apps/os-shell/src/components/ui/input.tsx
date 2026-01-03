import * as React from 'react';

import { cn } from '@utils/cn';

export interface EliteInputProps extends React.ComponentProps<'input'> {
  label?: string;
  glow?: boolean;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, EliteInputProps>(
  ({ className, type, label, glow = false, error, ...props }, ref) => {
    const glowClasses = glow
      ? 'focus:shadow-[0_0_15px_rgba(0,255,255,0.4)] focus:border-terra-cyan'
      : '';
    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

    return (
      <div className='w-full'>
        {label && <label className='block text-sm font-medium text-gray-300 mb-2'>{label}</label>}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            glowClasses,
            errorClasses,
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
