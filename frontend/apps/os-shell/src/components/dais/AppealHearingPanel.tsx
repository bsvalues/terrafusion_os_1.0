/**
 * Phase 19 — TerraAppeal Hearing Scheduling Spine, Tranche 7
 * AppealHearingPanel
 *
 * Minimal parcel-scoped hearing scheduling surface: shows hearing
 * status for the active parcel's appeal.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealHearingPanelProps {
  parcelId: string;
}

export default function AppealHearingPanel({ parcelId }: AppealHearingPanelProps) {
  return (
    <div data-testid="hearing-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Hearing Schedule: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            BOE hearing scheduling and tracking
          </div>
        </div>
        <span
          data-testid="hearing-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          No Scheduled Hearings
        </span>
      </div>
    </div>
  );
}
