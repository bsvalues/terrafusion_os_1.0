/**
 * OPS-1-B: StatusBadge — circle + text label for the four
 * Sync Readiness status values. Maps OPS-1 statuses to the
 * existing `tf-status-*` utility classes (no new design tokens
 * introduced per OPS-1 non-goals).
 *
 * Color is NEVER the only signal — every badge carries the
 * status text label (FISMA-HIGH WCAG 2.1 AA contract).
 */

import React from 'react';
import type { SyncReadinessStatusValue } from '@/api/workbenchSyncReadiness';

interface StatusBadgeProps {
  status: SyncReadinessStatusValue | string;
}

function classForStatus(status: string): string {
  switch (status) {
    case 'YES':
      return 'tf-status-success';
    case 'WARN':
      return 'tf-status-warning';
    case 'NO':
      return 'tf-status-error';
    default:
      // UNKNOWN + any unexpected value → muted
      return 'tf-status-muted';
  }
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const cls = classForStatus(status);
  const normalized = ['YES', 'WARN', 'NO', 'UNKNOWN'].includes(status) ? status : 'UNKNOWN';
  return (
    <span
      className={`${cls} inline-flex items-center px-2 py-1 rounded text-xs font-semibold`}
      role='status'
      aria-label={`Status: ${normalized}`}
      data-testid='status-badge'
      data-status={normalized}
    >
      <span
        aria-hidden='true'
        className='inline-block w-2 h-2 rounded-full mr-2'
        style={{ background: 'currentColor' }}
      />
      {normalized}
    </span>
  );
}
