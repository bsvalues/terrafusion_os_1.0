import * as React from 'react';

import { cn } from '@/lib/utils';

export interface EliteProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: 'default' | 'quantum' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, EliteProgressProps>(
  ({ className, value = 0, variant = 'default', showValue = false, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-terra-cyan',
      quantum:
        'bg-gradient-to-r from-terra-cyan to-terra-blue shadow-[0_0_10px_rgba(0,255,255,0.4)]',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };

    return (
      <div className='w-full' ref={ref} {...props}>
        <div
          className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-700', className)}
        >
          <div
            className={cn('h-full transition-all duration-300', variantClasses[variant])}
            data-progress={Math.min(Math.max(value, 0), 100)}
          />
        </div>
        {showValue && (
          <div className='mt-1 text-xs text-gray-400 text-right'>{Math.round(value)}%</div>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
