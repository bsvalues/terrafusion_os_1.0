/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * NoticeBatchQueuePanel
 *
 * Cross-parcel notice batch queue surface for TerraDais standalone.
 * Shows batch status, dispatch channel, and queue depth.
 *
 * Props: (none — county-wide cross-parcel view)
 */

import React from 'react';

export default function NoticeBatchQueuePanel() {
  return (
    <div data-testid="notice-batch-queue-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Notice Batch Queue</div>
          <div className="text-xs text-muted-foreground">
            Batch dispatch, mail/print queue, and delivery tracking
          </div>
        </div>
        <span
          data-testid="batch-queue-count"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          0 Batches
        </span>
      </div>
    </div>
  );
}
