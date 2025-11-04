import * as React from 'react';

import { cn } from '@/lib/utils';

export interface EliteAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  fallback?: string;
  glow?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, EliteAvatarProps>(
  ({ className, size = 'md', src, fallback, glow = false, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    const glowClasses = glow
      ? 'shadow-[0_0_15px_rgba(0,255,255,0.5)] ring-2 ring-terra-cyan/30'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-terra-slate border border-terra-cyan/20',
          sizeClasses[size],
          glowClasses,
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt='Avatar' className='aspect-square h-full w-full object-cover' />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-terra-cyan/10 text-terra-cyan font-semibold'>
            {fallback || '?'}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
