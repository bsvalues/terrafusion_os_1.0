import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';

export interface TFIconButtonProps extends Omit<ButtonProps, 'asChild'> {
  /** The icon element to display */
  icon: React.ReactNode;
  /** Optional tooltip text */
  tooltip?: string;
  /** Optional aria label */
  ariaLabel?: string;
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  /** Optional className for additional styling */
  className?: string;
  /** Whether to show a notification badge */
  showBadge?: boolean;
  /** Optional badge count */
  badgeCount?: number;
}

/**
 * Terrafusion Icon Button Component
 *
 * A specialized button that displays only an icon
 */
export const TFIconButton: React.FC<TFIconButtonProps> = ({
  icon,
  tooltip,
  ariaLabel,
  size = 'icon',
  className,
  showBadge = false,
  badgeCount,
  variant = 'ghost',
  ...props
}) => {
  return (
    <div className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        aria-label={ariaLabel || tooltip}
        className={cn(
          'relative',
          size === 'sm' && 'h-8 w-8',
          size === 'default' && 'h-10 w-10',
          size === 'lg' && 'h-12 w-12',
          size === 'xl' && 'h-14 w-14',
          size === 'icon' && 'h-9 w-9 p-0',
          className
        )}
        {...props}
      >
        {icon}
      </Button>

      {showBadge && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
          {badgeCount && badgeCount > 0 ? (badgeCount > 99 ? '99+' : badgeCount) : ''}
        </div>
      )}

      {tooltip && (
        <div className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 -translate-y-2 transform rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 peer-hover:block peer-hover:opacity-100">
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default TFIconButton;
