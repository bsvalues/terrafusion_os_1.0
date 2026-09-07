/**
 * TerraFusion OS Clock Component
 *
 * System tray clock showing time and date.
 * Tooltip shows full date on hover.
 *
 * @module shell/desktop/Clock
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

export interface ClockProps {
  className?: string;
}

/**
 * Browser locale detectors can return POSIX suffixes such as `en-US@posix`.
 * ECMA-402 rejects those tags, so normalize the detector value before using
 * it for locale-sensitive formatting in the shell.
 */
export function normalizeLocale(locale?: string): string {
  const candidate = (locale ?? 'en-US').split('@', 1)[0].replace(/_/g, '-');
  try {
    return Intl.getCanonicalLocales(candidate)[0] ?? 'en-US';
  } catch {
    return 'en-US';
  }
}

// ============================================================================
// Clock Component
// ============================================================================

export const Clock: React.FC<ClockProps> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const [time, setTime] = useState(new Date());
  const locale = normalizeLocale(i18n.language);

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
  const formattedTime = time.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedShortDate = time.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });

  const formattedFullDate = time.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isoDateTime = time.toISOString();

  const ariaLabel = t('clock.currentTime', { time: formattedTime, date: formattedFullDate });

  return (
    <div
      data-testid='clock'
      title={formattedFullDate}
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col items-end text-right px-2',
        'cursor-default select-none',
        className
      )}
    >
      <time dateTime={isoDateTime} role='time'>
        <span data-testid='clock-time' className='text-sm font-medium' style={{ color: 'hsl(var(--tf-text))' }}>
          {formattedTime}
        </span>
        <span data-testid='clock-date' className='block text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
          {formattedShortDate}
        </span>
      </time>
    </div>
  );
};

export default Clock;
