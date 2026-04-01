/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * AppealNoticePanel
 *
 * Minimal parcel-scoped placeholder surface for follow-on appeal notice
 * work. This panel is mounted inside PropertyDais but does not load a
 * live hearing notice, notice queue, or notice-delivery result.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealNoticePanelProps {
  parcelId: string;
}

export default function AppealNoticePanel({ parcelId: _parcelId }: AppealNoticePanelProps) {
  return (
    <div data-testid="notice-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Notice</div>
          <div className="text-xs text-muted-foreground">
            No notice queue data available for this parcel.
          </div>
        </div>
        <span
          data-testid="notice-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700"
        >
          No data
        </span>
      </div>
    </div>
  );
}
