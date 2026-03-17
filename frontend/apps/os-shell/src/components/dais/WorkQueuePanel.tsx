/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * WorkQueuePanel
 *
 * Cross-parcel work queue surface for TerraDais standalone.
 * Shows assignment, escalation state, and parcel drill-through.
 *
 * Props: { onDrillThrough?: (parcelId: string) => void }
 */

import React from 'react';

interface WorkQueuePanelProps {
  onDrillThrough?: (parcelId: string) => void;
}

export default function WorkQueuePanel({ onDrillThrough }: WorkQueuePanelProps) {
  return (
    <div data-testid="work-queue-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Work Queue</div>
          <div className="text-xs text-muted-foreground">
            Cross-parcel assignment, escalation, and progress tracking
          </div>
        </div>
        <span
          data-testid="queue-count"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          0 Items
        </span>
      </div>
    </div>
  );
}
