/**
 * ConflictBadge Component
 *
 * A visual indicator that shows when conflicts exist.
 * Can be used in headers, tabs, or anywhere to alert users.
 */

import React from 'react';
import clsx from 'clsx';

export interface ConflictBadgeProps {
  /** Number of conflicts */
  count: number;
  /** Maximum number to display (after this, shows "+") */
  max?: number;
  /** Whether to show the badge when count is 0 */
  showZero?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS class names */
  className?: string;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * ConflictBadge component
 */
export const ConflictBadge: React.FC<ConflictBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  size = 'medium',
  className,
  onClick,
  tooltip,
}) => {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Format the display count
  const displayCount = count > max ? `${max}+` : count.toString();

  // Base styles
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium';

  // Size-specific styles
  const sizeClasses = {
    small: 'text-xs w-5 h-5',
    medium: 'text-sm w-6 h-6',
    large: 'text-base w-7 h-7',
  };

  // Color based on count
  const colorClasses = count > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600';

  return (
    <div
      className={clsx(
        baseClasses,
        sizeClasses[size],
        colorClasses,
        className,
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      onClick={onClick}
      title={tooltip || `${count} conflict${count !== 1 ? 's' : ''}`}
      role={onClick ? 'button' : 'status'}
      aria-label={`${count} conflict${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </div>
  );
};

/**
 * ConflictBadge component story
 */
export default {
  title: 'Conflict Resolution/ConflictBadge',
  component: ConflictBadge,
  parameters: {
    docs: {
      description: {
        component: 'A badge that shows the number of conflicts',
      },
    },
  },
};
