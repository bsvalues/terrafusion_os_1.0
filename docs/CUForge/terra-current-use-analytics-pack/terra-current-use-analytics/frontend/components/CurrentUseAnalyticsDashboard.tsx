
import React, { useEffect, useState } from 'react';
import { getCurrentUseOperationalSummaryMock } from '../analytics/currentUseAnalyticsApi';
import type { CurrentUseOperationalSummary } from '../analytics/currentUseAnalyticsTypes';

export function CurrentUseAnalyticsDashboard({
  countyId,
}: {
  countyId: string;
}) {
  const [summary, setSummary] = useState<CurrentUseOperationalSummary | null>(null);

  useEffect(() => {
    getCurrentUseOperationalSummaryMock(countyId).then(setSummary);
  }, [countyId]);

  if (!summary) {
    return <div className="p-6 text-sm text-slate-600">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold">Current Use Operational Analytics</h2>
        <p className="text-sm text-slate-600">
          County-wide operational visibility for Current Use governance.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Classified Parcels"
          value={summary.totalClassifiedParcels.toLocaleString()}
        />

        <MetricCard
          label="Classified Acres"
          value={summary.totalClassifiedAcres.toLocaleString()}
        />

        <MetricCard
          label="Rollback Exposure"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(summary.estimatedTotalRollbackExposure)}
        />

        <MetricCard
          label="Monitoring Parcels"
          value={summary.activeMonitoringCount.toLocaleString()}
        />
      </section>

      <div className="rounded-xl border border-dashed p-4">
        <p className="text-sm text-slate-600">
          Analytics support operational awareness only.
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
