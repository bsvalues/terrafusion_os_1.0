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
import type { DaisOperationalStats } from '../../pages/suites/daisOperationalStats';

interface CertRollPanelProps {
  stats: DaisOperationalStats | null;
}

export default function CertRollPanel({ stats }: CertRollPanelProps) {
  const certLabel = stats !== null
    ? `${stats.assessmentCompletionPercent.toFixed(1)}% certified`
    : '— certified';
  const pendingLabel = stats !== null ? `${stats.pendingAssessments.toLocaleString()} pending` : null;

  return (
    <div data-testid="cert-roll-panel" className="space-y-2">
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Certification Roll</div>
          <div className="text-xs text-muted-foreground">
            Roll sign-off, statutory export, and certification tracking
          </div>
        </div>
        <div className="flex gap-2">
          <span
            data-testid="cert-roll-status"
            className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'hsl(var(--tf-suite-dais) / 0.15)', color: 'hsl(var(--tf-suite-dais))' }}
          >
            {certLabel}
          </span>
          {pendingLabel !== null && (
            <span
              data-testid="cert-roll-pending"
              className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-slate-600 text-white"
            >
              {pendingLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
