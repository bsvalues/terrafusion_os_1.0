import React from 'react';
import { Badge } from '../ui/badge';
import type { DisclosureSource } from '../../hooks/useSourceDisclosure';

export type { DisclosureSource };

interface WorkbenchSourceBadgeProps {
  source: DisclosureSource;
  /** Only used when source is 'partial' */
  liveFields?: number;
  totalFields?: number;
  className?: string;
}

// Map every source disclosure to TF tokens — leak-guard requires
// var(--tf-*) / hsl(var(--tf-*-hs) / alpha) instead of raw hsl literals.
const SOURCE_STYLE: Record<DisclosureSource, React.CSSProperties> = {
  live:        { color: 'hsl(var(--tf-success-hs) 36%)', borderColor: 'hsl(var(--tf-success-hs) 36% / 0.4)' },
  partial:     { color: 'hsl(var(--tf-warning-hs) 50%)', borderColor: 'hsl(var(--tf-warning-hs) 50% / 0.4)' },
  fallback:    { color: 'hsl(var(--tf-warning-hs) 50%)', borderColor: 'hsl(var(--tf-warning-hs) 50% / 0.4)' },
  unavailable: { color: 'hsl(var(--tf-muted))',          borderColor: 'hsl(var(--tf-muted) / 0.4)' },
};

function getLabel(
  source: DisclosureSource,
  liveFields?: number,
  totalFields?: number,
): string {
  if (source === 'partial') {
    return liveFields != null && totalFields != null
      ? `Partial — ${liveFields} of ${totalFields} fields live`
      : 'Partial';
  }
  const LABELS: Record<Exclude<DisclosureSource, 'partial'>, string> = {
    live: 'Live',
    fallback: 'Non-live data',
    unavailable: 'Unavailable',
  };
  return LABELS[source];
}

export function WorkbenchSourceBadge({
  source,
  liveFields,
  totalFields,
  className,
}: WorkbenchSourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={className}
      style={SOURCE_STYLE[source]}
      data-testid="workbench-source-badge"
      data-source={source}
    >
      {getLabel(source, liveFields, totalFields)}
    </Badge>
  );
}
