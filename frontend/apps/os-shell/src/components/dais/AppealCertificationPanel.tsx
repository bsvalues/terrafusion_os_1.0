/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * AppealCertificationPanel
 *
 * Minimal parcel-scoped placeholder surface for follow-on certification work.
 * This panel is mounted inside PropertyDais but does not load a live appeal
 * outcome or certification-readiness result.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealCertificationPanelProps {
  parcelId: string;
}

export default function AppealCertificationPanel({ parcelId: _parcelId }: AppealCertificationPanelProps) {
  return (
    <div data-testid="certification-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Certification Readiness</div>
          <div className="text-xs text-muted-foreground">
            No certification readiness data available for this parcel.
          </div>
        </div>
        <span
          data-testid="certification-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium bg-slate-800/50 text-slate-400 border border-slate-700"
        >
          No data
        </span>
      </div>
    </div>
  );
}
