/**
 * TN-GUI-005 — Batch Workspace.
 *
 * Draft batch → validation results → approval checklist → freeze → release,
 * with a status timeline. Actions are gated: Freeze requires validation pass
 * and a complete approval checklist; Release requires a freeze.
 *
 * In sandbox the action buttons advance a local lifecycle marker only and are
 * clearly labeled as non-dispatching.
 *
 * @module pages/notice/areas/BatchOperations
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BatchRow, NoticeConsoleSnapshot } from '../types';
import {
  EmptyState,
  GovernanceTimeline,
  SectionCard,
  StatusPill,
  formatInt,
} from '../components/primitives';

const CHECKLIST = [
  { id: 'policy', label: 'Policy pack approved' },
  { id: 'template', label: 'Template version legally approved' },
  { id: 'parcels', label: 'Parcel snapshot reconciled' },
  { id: 'legal', label: 'Legal sign-off recorded' },
];

export const BatchOperations: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const draftable = snapshot.batches;
  const [activeBatchId, setActiveBatchId] = useState(draftable[0]?.batchId ?? '');
  const active = draftable.find((b) => b.batchId === activeBatchId) ?? draftable[0];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [frozen, setFrozen] = useState(false);

  const allChecked = CHECKLIST.every((c) => checked[c.id]);
  const validationPassed = active?.status !== 'failed' && active?.status !== 'draft';
  // Release dispatches notices — only valid against a live backend. Freeze stays
  // interactive in sandbox to demonstrate the checklist→freeze gating locally.
  const inert = snapshot.source !== 'live';

  if (!active) {
    return (
      <div data-testid="notice-area-batch-operations">
        <SectionCard title="Batch Workspace">
          <EmptyState message="No batches to work. Create one from a county program." />
        </SectionCard>
      </div>
    );
  }

  const timeline = [
    { label: 'Draft assembled', state: 'done' as const, at: `${formatInt(active.notices)} notices` },
    { label: 'Validation', state: validationPassed ? ('done' as const) : ('active' as const), at: validationPassed ? `${formatPctOf(snapshot)} pass` : 'pending' },
    { label: 'Approval checklist', state: allChecked ? ('done' as const) : ('active' as const), at: `${CHECKLIST.filter((c) => checked[c.id]).length}/${CHECKLIST.length}` },
    { label: 'Freeze', state: frozen ? ('done' as const) : ('pending' as const), at: frozen ? 'snapshot sealed' : '—' },
    { label: 'Release', state: 'pending' as const, at: '—' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="notice-area-batch-operations">
      <SectionCard title="Batches">
        <ul className="space-y-2">
          {draftable.map((b: BatchRow) => (
            <li key={b.batchId}>
              <button
                onClick={() => { setActiveBatchId(b.batchId); setFrozen(false); setChecked({}); }}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={{
                  background: b.batchId === activeBatchId ? 'hsl(var(--tf-accent) / 0.12)' : 'hsl(var(--tf-card-bg) / 0.4)',
                  border: `1px solid hsl(var(--tf-border) / ${b.batchId === activeBatchId ? 0.4 : 0.15})`,
                }}
              >
                <div className="font-mono text-sm">{b.batchId}</div>
                <div className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {b.program} · {formatInt(b.notices)} notices
                </div>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="lg:col-span-2 space-y-5">
        <SectionCard
          title={`Approval Checklist — ${active.batchId}`}
          chip={<StatusPill label={allChecked ? 'Complete' : 'Incomplete'} variant={allChecked ? 'default' : 'secondary'} />}
        >
          <div className="space-y-2">
            {CHECKLIST.map((c) => (
              <label key={c.id} className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checked[c.id]}
                  onChange={() => setChecked((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                  aria-label={c.label}
                />
                {c.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button
              size="sm"
              disabled={!validationPassed || !allChecked || frozen}
              onClick={() => setFrozen(true)}
              data-testid="batch-freeze-action"
            >
              Freeze Snapshot
            </Button>
            <Button size="sm" variant="outline" disabled={!frozen || inert} data-testid="batch-release-action">
              Release to Dispatch
            </Button>
            {!validationPassed && (
              <span className="text-xs" style={{ color: 'hsl(var(--tf-warning))' }}>
                Run validation before freezing.
              </span>
            )}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
            Sandbox: Freeze / Release advance the local lifecycle marker only — no notices are dispatched and no
            artifacts are sealed.
          </p>
        </SectionCard>

        <SectionCard title="Status Timeline">
          <GovernanceTimeline steps={timeline} />
        </SectionCard>
      </div>
    </div>
  );
};

function formatPctOf(snapshot: NoticeConsoleSnapshot): string {
  return `${(snapshot.kpis.validationPassRate * 100).toFixed(1)}%`;
}

export default BatchOperations;
