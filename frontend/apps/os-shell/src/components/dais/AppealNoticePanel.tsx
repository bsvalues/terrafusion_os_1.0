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

export default function AppealNoticePanel({ parcelId }: AppealNoticePanelProps) {
  return (
    <div data-testid="notice-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Appeal Notice Placeholder: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            Mounted parcel-scoped placeholder. No live hearing notice, notice queue, or notice-delivery result is loaded in this panel.
          </div>
        </div>
        <span
          data-testid="notice-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          Placeholder only
        </span>
      </div>
    </div>
  );
}
