/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * CertRollPanel
 *
 * Cross-parcel certification operations surface for TerraDais standalone.
 * Shows roll status, sign-off state, and export readiness.
 *
 * Props: (none — county-wide cross-parcel view)
 */

import React from 'react';

export default function CertRollPanel() {
  return (
    <div data-testid="cert-roll-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Certification Roll</div>
          <div className="text-xs text-muted-foreground">
            Roll sign-off, statutory export, and certification tracking
          </div>
        </div>
        <span
          data-testid="cert-roll-status"
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
        >
          No Active Roll
        </span>
      </div>
    </div>
  );
}
