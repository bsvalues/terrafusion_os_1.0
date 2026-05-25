import React from 'react';
import type { CurrentUseEvidenceItem, CurrentUseParcelOverview } from '../types/currentUseTypes';
import { currency, formatEnum, MetricCard } from './shared';

export function CurrentUseOverviewCards({
  overview,
  evidenceItems,
}: {
  overview: CurrentUseParcelOverview;
  evidenceItems: CurrentUseEvidenceItem[];
}) {
  const evidenceIssues = evidenceItems.filter((item) =>
    ['MISSING', 'REQUESTED', 'STALE'].includes(item.status),
  ).length;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <MetricCard label="Classification" value={formatEnum(overview.classificationType)} />
      <MetricCard label="Lifecycle" value={formatEnum(overview.lifecycleState)} />
      <MetricCard label="Risk" value={overview.riskLevel} />
      <MetricCard label="Evidence Issues" value={String(evidenceIssues)} />
      <MetricCard
        label="Rollback Exposure"
        value={overview.rollbackExposureEstimate ? currency(overview.rollbackExposureEstimate) : 'Unknown'}
      />
    </section>
  );
}
