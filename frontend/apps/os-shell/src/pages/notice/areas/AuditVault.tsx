/**
 * TN-GUI-010 — Audit Evidence Vault.
 *
 * Every issued notice must bind to template version, policy version, county
 * configuration version, parcel/data snapshot, batch ID, artifact hash,
 * dispatch receipt, and an immutable approval trace. This screen exposes the
 * evidence bundle and a release-manifest export.
 *
 * @module pages/notice/areas/AuditVault
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NoticeConsoleSnapshot } from '../types';
import { EmptyState, SectionCard, StatusPill } from '../components/primitives';

export const AuditVault: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const bundles = snapshot.auditBundles;
  // Vault open/export operate against a live backend; disabled in sandbox.
  const inert = snapshot.source !== 'live';
  const [selected, setSelected] = useState(bundles[0]?.bundleId ?? '');
  const active = bundles.find((b) => b.bundleId === selected) ?? bundles[0];

  if (bundles.length === 0) {
    return (
      <div data-testid="notice-area-audit-vault">
        <SectionCard title="Audit Evidence Vault">
          <EmptyState message="No evidence bundles sealed yet." />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="notice-area-audit-vault">
      <SectionCard title="Evidence Bundles">
        <ul className="space-y-2">
          {bundles.map((b) => (
            <li key={b.bundleId}>
              <button
                onClick={() => setSelected(b.bundleId)}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={{
                  background: b.bundleId === selected ? 'hsl(var(--tf-accent) / 0.12)' : 'hsl(var(--tf-card-bg) / 0.4)',
                  border: `1px solid hsl(var(--tf-border) / ${b.bundleId === selected ? 0.4 : 0.15})`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{b.bundleId}</span>
                  <StatusPill label={b.sealed ? 'Sealed' : 'Open'} variant={b.sealed ? 'default' : 'secondary'} />
                </div>
                <div className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>{b.batchId}</div>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="lg:col-span-2">
        <SectionCard
          title={`Evidence Bundle — ${active.bundleId}`}
          chip={<StatusPill label={active.sealed ? 'Immutable' : 'Assembling'} variant={active.sealed ? 'default' : 'secondary'} />}
        >
          <dl className="space-y-2 text-sm">
            {active.bindings.map((b) => (
              <div key={b.label} className="flex items-center justify-between gap-3 py-1" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.12)' }}>
                <dt style={{ color: 'hsl(var(--tf-muted))' }}>{b.label}</dt>
                <dd className="font-medium text-right font-mono text-xs">{b.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" variant="outline" disabled={inert}>Open Evidence Bundle</Button>
            <Button size="sm" variant="outline" disabled={inert}>Export Release Manifest</Button>
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
            Sandbox: export actions are inert. A sealed bundle binds every notice to its template, policy, config,
            snapshot, artifact hash, dispatch receipt, and approval trace.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

export default AuditVault;
