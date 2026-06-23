/**
 * TN-GUI-006 — Freeze Snapshot Viewer.
 *
 * Every issued notice binds to an immutable freeze: the parcel/data snapshot,
 * legal text version, template version, policy version, county-config version,
 * and the artifact hash. This screen makes that binding inspectable.
 *
 * @module pages/notice/areas/FreezeSnapshots
 */

import React, { useState } from 'react';
import type { NoticeConsoleSnapshot } from '../types';
import { EmptyState, SectionCard, StatusPill, Table, Td, Th, Tr } from '../components/primitives';

export const FreezeSnapshots: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const snaps = snapshot.freezeSnapshots;
  const [selected, setSelected] = useState(snaps[0]?.snapshotId ?? '');
  const active = snaps.find((s) => s.snapshotId === selected) ?? snaps[0];

  if (snaps.length === 0) {
    return (
      <div data-testid="notice-area-freeze-snapshots">
        <SectionCard title="Freeze Snapshots">
          <EmptyState message="No freeze snapshots yet. Freeze a validated batch to create one." />
        </SectionCard>
      </div>
    );
  }

  const bindings: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Parcel / data snapshot', value: `${active.parcelCount.toLocaleString('en-US')} parcels` },
    { label: 'Legal text version', value: active.legalTextVersion },
    { label: 'Template version', value: active.templateVersion },
    { label: 'Policy version', value: active.policyVersion },
    { label: 'County config version', value: active.countyConfigVersion },
    { label: 'Artifact hash', value: active.artifactHash, mono: true },
    { label: 'Frozen at', value: active.frozenAt },
    { label: 'Frozen by', value: active.frozenBy },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="notice-area-freeze-snapshots">
      <SectionCard title="Snapshots">
        <Table>
          <thead>
            <Tr>
              <Th>Snapshot</Th>
              <Th className="text-right">Batch</Th>
            </Tr>
          </thead>
          <tbody>
            {snaps.map((s) => (
              <Tr key={s.snapshotId} interactive onClick={() => setSelected(s.snapshotId)}>
                <Td className="font-mono text-xs">{s.snapshotId}</Td>
                <Td className="text-right font-mono text-xs">{s.batchId}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </SectionCard>

      <div className="lg:col-span-2">
        <SectionCard
          title={`Snapshot — ${active.snapshotId}`}
          chip={<StatusPill label="Immutable" variant="default" />}
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {bindings.map((b) => (
              <div key={b.label} className="flex flex-col">
                <dt className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{b.label}</dt>
                <dd className={`font-medium ${b.mono ? 'font-mono text-xs' : ''}`}>{b.value}</dd>
              </div>
            ))}
          </dl>
          <div
            className="mt-4 rounded-lg p-4 text-center"
            style={{ background: 'hsl(var(--tf-bg) / 0.6)', border: '1px dashed hsl(var(--tf-border) / 0.4)' }}
          >
            <div className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Rendered artifact</div>
            <div className="font-mono text-xs mt-1">{active.artifactHash}</div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default FreezeSnapshots;
