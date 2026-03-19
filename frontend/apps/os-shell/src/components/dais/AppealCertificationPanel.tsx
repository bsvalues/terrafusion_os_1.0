/**
 * Phase 19 — TerraCert Appeal Outcome + Certification Readiness Spine, Tranche 9
 * AppealCertificationPanel
 *
 * Minimal parcel-scoped certification surface: shows appeal outcome
 * and certification readiness state for the active parcel.
 *
 * Props: { parcelId: string }
 */

import React from 'react';

interface AppealCertificationPanelProps {
  parcelId: string;
}

export default function AppealCertificationPanel({ parcelId }: AppealCertificationPanelProps) {
  return (
    <div data-testid="certification-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Certification Readiness: {parcelId}</div>
          <div className="text-xs text-muted-foreground">
            Appeal outcome and certification status
          </div>
        </div>
        <span
          data-testid="certification-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          Pending
        </span>
      </div>
    </div>
  );
}
