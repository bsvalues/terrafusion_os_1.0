import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

/**
 * Renders a red banner at the top of County Studio if any of the three data
 * resources (segments, cohorts, scenarios) failed to load. Offers a retry
 * button that re-invokes the load function provided by useStudyData.
 *
 * Replaces the silent-empty-state pattern that previously hid API failures
 * as "no data." Users now see the real reason.
 */
export interface LoadErrorBannerProps {
  onRetry: () => void;
}

export function LoadErrorBanner({ onRetry }: LoadErrorBannerProps) {
  const loadStatus = useCountyStudioStore((s) => s.loadStatus);
  const loadErrors = useCountyStudioStore((s) => s.loadErrors);

  const failed = (['segments', 'cohorts', 'scenarios'] as const).filter(
    (r) => loadStatus[r] === 'error'
  );

  if (failed.length === 0) return null;

  return (
    <div
      role="alert"
      data-testid="cs-load-error-banner"
      style={{
        padding: '8px 14px',
        background: '#7f1d1d22',
        borderBottom: '1px solid #ef4444',
        color: '#fecaca',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
          ⛔ Couldn&apos;t load{' '}
          {failed.join(' · ')}
        </div>
        {failed.map((r) => (
          <div
            key={r}
            style={{
              fontSize: 11,
              color: '#fecaca',
              opacity: 0.85,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={loadErrors[r] ?? undefined}
          >
            {r}: {loadErrors[r] ?? 'Unknown error'}
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Retry loading failed resources"
        onClick={onRetry}
        style={{
          padding: '4px 12px',
          borderRadius: 4,
          border: '1px solid #ef4444',
          background: '#ef444422',
          color: '#fecaca',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </div>
  );
}
