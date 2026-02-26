import * as React from 'react';

import { cn } from '@utils/cn';

export interface EliteProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'quantum' | 'success' | 'warning' | 'error';
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, EliteProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', showValue = false, ...props }, ref) => {
    // Sanitize value: handle null, undefined, NaN
    const sanitizedValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    const clampedValue = Math.min(Math.max(sanitizedValue, 0), max);
    const percentage = (clampedValue / max) * 100;

    const variantClasses = {
      default: 'bg-terra-cyan',
      quantum:
        'bg-gradient-to-r from-terra-cyan to-terra-blue shadow-[0_0_10px_hsl(var(--tf-accent)_/_0.4)]',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };

    // Determine visual state
    const getState = () => {
      if (percentage === 0) return 'empty';
      if (percentage === 100) return 'complete';
      return 'loading';
    };

    const {
      ['aria-label']: ariaLabel,
      ['aria-labelledby']: ariaLabelledBy,
      ...restProps
    } = props as Record<string, unknown>;

    return (
      <div className='w-full'>
        <div
          ref={ref}
          role='progressbar'
          aria-label={
            (ariaLabel as string | undefined) ?? (ariaLabelledBy ? undefined : 'Progress')
          }
          aria-labelledby={ariaLabelledBy as string | undefined}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={clampedValue}
          data-state={getState()}
          data-value={clampedValue}
          data-max={max}
          className={cn(
            'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
            className
          )}
          {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
        >
          <div
            className={cn('h-full transition-all duration-300', variantClasses[variant])}
            data-state={getState()}
            style={{
              transform: `translateX(${percentage === 100 ? '0%' : `-${100 - percentage}%`})`,
            }}
          />
        </div>
        {showValue && (
          <div className='mt-1 text-xs text-gray-400 text-right'>{Math.round(percentage)}%</div>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
