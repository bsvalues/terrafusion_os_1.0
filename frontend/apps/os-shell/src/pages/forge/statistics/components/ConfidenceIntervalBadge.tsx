/**
 * ConfidenceIntervalBadge.tsx
 *
 * Renders a statistic with its 95% bootstrap CI in bracket notation.
 * e.g. 0.974 [0.961 – 0.987]
 */

import React from 'react';

interface CIValue {
  point: number;
  lo: number;
  hi: number;
}

interface ConfidenceIntervalBadgeProps {
  value: CIValue | null | undefined;
  decimals?: number;
  suffix?: string;
  loading?: boolean;
}

export function ConfidenceIntervalBadge({
  value,
  decimals = 4,
  suffix = '',
  loading = false,
}: ConfidenceIntervalBadgeProps) {
  if (loading) return <span className="text-muted-foreground">…</span>;
  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="font-mono text-sm">
      <span className="font-semibold">{value.point.toFixed(decimals)}{suffix}</span>
      <span className="text-muted-foreground text-xs ml-1">
        [{value.lo.toFixed(decimals)} – {value.hi.toFixed(decimals)}]
      </span>
    </span>
  );
}
