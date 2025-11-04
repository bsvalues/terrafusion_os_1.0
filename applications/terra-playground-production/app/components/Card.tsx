'use client';

import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      title,
      subtitle,
      footer,
      header,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'bg-gray-800 rounded-lg shadow-sm';
    
    const variantClasses = {
      default: '',
      bordered: 'border border-gray-700',
      elevated: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      >
        {(header || title || subtitle) && (
          <div className="px-6 py-4 border-b border-gray-700">
            {header || (
              <>
                {title && (
                  <h3 className="text-lg font-medium text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-400">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-700">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card; 