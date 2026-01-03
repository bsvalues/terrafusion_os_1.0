/**
 * TerraFusion OS Clock Component
 * 
 * System tray clock showing time and date.
 * Tooltip shows full date on hover.
 * 
 * @module shell/desktop/Clock
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ClockProps {
  className?: string;
}

// ============================================================================
// Clock Component
// ============================================================================

export const Clock: React.FC<ClockProps> = ({ className }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update every minute
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);

    // Also update immediately on second boundary for accuracy
    const secondsUntilNextMinute = 60 - time.getSeconds();
    const initialTimer = setTimeout(() => {
      setTime(new Date());
    }, secondsUntilNextMinute * 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, []);

  // Formatted strings
  const formattedTime = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedShortDate = time.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const formattedFullDate = time.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isoDateTime = time.toISOString();

  const ariaLabel = `Current time: ${formattedTime}, ${formattedFullDate}`;

  return (
    <div
      data-testid="clock"
      title={formattedFullDate}
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col items-end text-right px-2',
        'cursor-default select-none',
        className
      )}
    >
      <time dateTime={isoDateTime} role="time">
        <span 
          data-testid="clock-time"
          className="text-sm text-white/90 font-medium"
        >
          {formattedTime}
        </span>
        <span 
          data-testid="clock-date"
          className="block text-xs text-white/60"
        >
          {formattedShortDate}
        </span>
      </time>
    </div>
  );
};

export default Clock;
