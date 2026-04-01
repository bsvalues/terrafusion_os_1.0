/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * AppealDeadlinePanel
 *
 * Minimal parcel-scoped placeholder surface for follow-on appeal deadline
 * work. This panel is mounted inside PropertyDais but does not load a
 * live filing deadline, hearing milestone, or hearing-state result.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealDeadlinePanelProps {
  parcelId: string;
}

export default function AppealDeadlinePanel({ parcelId: _parcelId }: AppealDeadlinePanelProps) {
  return (
    <div data-testid="deadline-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Filing Deadline</div>
          <div className="text-xs text-muted-foreground">
            No filing deadline data available for this parcel.
          </div>
        </div>
        <span
          data-testid="deadline-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700"
        >
          No data
        </span>
      </div>
    </div>
  );
}
