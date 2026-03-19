/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * ManagementDashboardPanel
 *
 * Cross-parcel supervisory rollup surface for TerraDais standalone.
 * Shows workload, appeal exposure, cert risk, and notice queue state.
 *
 * Props: (none — county-wide cross-parcel view, no parcel context required)
 */

import React from 'react';
import type { DaisOperationalStats } from '../../pages/suites/daisOperationalStats';

interface ManagementDashboardPanelProps {
  stats: DaisOperationalStats | null;
}

export default function ManagementDashboardPanel({ stats }: ManagementDashboardPanelProps) {
  const pendingLabel = stats !== null ? `${stats.pendingAssessments.toLocaleString()} pending` : '—';
  const appealsLabel = stats !== null ? `${stats.activeAppeals.toLocaleString()} appeals` : '—';

  return (
    <div data-testid="mgmt-dashboard-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Management Dashboard</div>
          <div className="text-xs text-muted-foreground">
            Office-wide supervisory rollup — workload, appeals, certification, notices
          </div>
        </div>
        <div className="flex gap-2">
          <span
            data-testid="mgmt-dashboard-pending"
            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'hsl(var(--tf-suite-dais) / 0.15)', color: 'hsl(var(--tf-suite-dais))' }}
          >
            {pendingLabel}
          </span>
          <span
            data-testid="mgmt-dashboard-appeals"
            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
          >
            {appealsLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
