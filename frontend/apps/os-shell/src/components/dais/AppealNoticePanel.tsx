/**
 * Phase 19 — TerraNotice Appeal Notice Spine, Tranche 8
 * AppealNoticePanel
 *
 * Minimal parcel-scoped notice surface: shows notice queue status
 * for the active parcel's appeal.
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
          <div className="font-medium">Appeal Notices: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            Hearing notice generation and queue status
          </div>
        </div>
        <span
          data-testid="notice-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          No Pending Notices
        </span>
      </div>
    </div>
  );
}
