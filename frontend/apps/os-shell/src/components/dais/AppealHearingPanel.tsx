/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * AppealHearingPanel
 *
 * Minimal parcel-scoped placeholder surface for follow-on hearing work.
 * This panel is mounted inside PropertyDais but does not load a live
 * hearing schedule, hearing date, or hearing-state result.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealHearingPanelProps {
  parcelId: string;
}

export default function AppealHearingPanel({ parcelId: _parcelId }: AppealHearingPanelProps) {
  return (
    <div data-testid="hearing-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Board of Equalization Hearing</div>
          <div className="text-xs text-muted-foreground">
            No hearing schedule data available for this parcel.
          </div>
        </div>
        <span
          data-testid="hearing-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700"
        >
          No data
        </span>
      </div>
    </div>
  );
}
