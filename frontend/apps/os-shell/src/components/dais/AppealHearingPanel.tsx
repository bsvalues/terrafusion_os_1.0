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

export default function AppealHearingPanel({ parcelId }: AppealHearingPanelProps) {
  return (
    <div data-testid="hearing-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Hearing Placeholder: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            Mounted parcel-scoped placeholder. No live hearing schedule, hearing date, or hearing-state result is loaded in this panel.
          </div>
        </div>
        <span
          data-testid="hearing-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          Placeholder only
        </span>
      </div>
    </div>
  );
}
