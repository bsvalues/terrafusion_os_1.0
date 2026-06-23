/**
 * TN-GUI (Release & Deployment Console).
 *
 * Release health, the deployed policy pack / template set, and attestation
 * completeness. A release cannot be marked healthy until all required
 * attestations are recorded.
 *
 * @module pages/notice/areas/ReleaseConsole
 */

import React from 'react';
import type { NoticeConsoleSnapshot, ReleaseHealth } from '../types';
import { EmptyState, SectionCard, StatusPill } from '../components/primitives';

const HEALTH: Record<ReleaseHealth, { label: string; variant: 'default' | 'secondary' | 'destructive'; accent: string }> = {
  healthy: { label: 'Healthy', variant: 'default', accent: '--tf-success' },
  degraded: { label: 'Degraded', variant: 'secondary', accent: '--tf-warning' },
  blocked: { label: 'Blocked', variant: 'destructive', accent: '--tf-error' },
};

export const ReleaseConsole: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const releases = snapshot.releases;

  if (releases.length === 0) {
    return (
      <div data-testid="notice-area-release-console">
        <SectionCard title="Release & Deployment">
          <EmptyState message="No releases recorded for this environment." />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="notice-area-release-console">
      {releases.map((r) => {
        const h = HEALTH[r.health];
        const pct = r.attestationsRequired > 0 ? r.attestationsComplete / r.attestationsRequired : 0;
        return (
          <SectionCard
            key={r.releaseId}
            title={`Release ${r.releaseId}`}
            chip={<StatusPill label={h.label} variant={h.variant} />}
          >
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label="Environment" value={r.environment} />
              <Field label="Deployed" value={r.deployedAt} />
              <Field label="Policy pack" value={r.policyPack} />
              <Field label="Template set" value={r.templateSet} />
            </dl>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Approval attestations</span>
                <span className="font-mono">{r.attestationsComplete}/{r.attestationsRequired}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsl(var(--tf-border) / 0.2)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: `hsl(var(${h.accent}))` }} />
              </div>
              {r.attestationsComplete < r.attestationsRequired && (
                <p className="text-xs mt-2" style={{ color: 'hsl(var(--tf-warning))' }}>
                  {r.attestationsRequired - r.attestationsComplete} attestation(s) outstanding — release stays degraded until complete.
                </p>
              )}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col">
    <dt className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

export default ReleaseConsole;
