'use client';

import { forwardRef } from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'h-4 w-4 border bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200';
    
    const stateClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-700 focus:border-blue-500';

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5"><>

          <input
            ref={ref}
            type="radio"
            className={`
              ${baseClasses}
              ${stateClasses}
              ${className}
            `}
            {...props}
          />
        </div>
        <div
</> className="ml-3">
          {label && (
            <label className="text-sm font-medium text-gray-300">
              {label}
            </label>
          )}
          {(error || helperText) && (
            <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-400'}`}>
              {error || helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio; 