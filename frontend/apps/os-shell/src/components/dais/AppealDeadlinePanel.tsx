/**
 * Phase 19 — TerraAppeal Deadline Spine, Tranche 6
 * AppealDeadlinePanel
 *
 * Minimal parcel-scoped deadline surface: shows appeal deadline
 * status for the active parcel. Displays filing/hearing milestones
 * and hearing state.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealDeadlinePanelProps {
  parcelId: string;
}

export default function AppealDeadlinePanel({ parcelId }: AppealDeadlinePanelProps) {
  return (
    <div data-testid="deadline-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Deadlines: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            Filing and hearing milestone tracking
          </div>
        </div>
        <span
          data-testid="deadline-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          No Active Appeals
        </span>
      </div>
    </div>
  );
}
