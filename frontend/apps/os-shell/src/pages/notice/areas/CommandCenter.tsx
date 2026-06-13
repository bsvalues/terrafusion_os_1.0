/**
 * TN-GUI-001 — Notice Operations Command Center.
 *
 * The air-traffic-control overview: live KPIs, batch lifecycle, the governance
 * trace for the active batch, and at-a-glance status of policy, templates,
 * vendor dispatch, exceptions and the audit vault.
 *
 * @module pages/notice/areas/CommandCenter
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import type { BatchRow, BatchStatus, NoticeConsoleSnapshot } from '../types';
import {
  EmptyState,
  GovernanceTimeline,
  KpiTile,
  SectionCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  formatInt,
  formatPct,
} from '../components/primitives';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const BATCH_STATUS: Record<BatchStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'outline' },
  validated: { label: 'Validated', variant: 'default' },
  'legal-review': { label: 'Legal Review', variant: 'secondary' },
  frozen: { label: 'Frozen', variant: 'secondary' },
  dispatched: { label: 'Dispatched', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

interface AreaProps {
  snapshot: NoticeConsoleSnapshot;
  onNavigate: (area: import('../types').ConsoleAreaId) => void;
}

export const CommandCenter: React.FC<AreaProps> = ({ snapshot, onNavigate }) => {
  const { kpis, batches, timeline } = snapshot;

  return (
    <div className="space-y-5" data-testid="notice-area-command-center">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          testId="kpi-active-batches"
          label="Active Batches"
          value={String(kpis.activeBatches)}
          note={kpis.activeBatchesNote}
          accentVar="--tf-accent"
        />
        <KpiTile
          testId="kpi-notices-prepared"
          label="Notices Prepared"
          value={formatInt(kpis.noticesPrepared)}
          note={`${formatPct(kpis.validationPassRate)} validation pass rate`}
          accentVar="--tf-accent-2"
        />
        <KpiTile
          testId="kpi-open-exceptions"
          label="Open Exceptions"
          value={formatInt(kpis.openExceptions)}
          note={`${kpis.highRiskExceptions} high-risk return-mail items`}
          accentVar="--tf-warning"
        />
        <KpiTile
          testId="kpi-audit-readiness"
          label="Audit Readiness"
          value={formatPct(kpis.auditReadiness)}
          note={kpis.auditReadinessNote}
          accentVar="--tf-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Batch lifecycle */}
        <div className="lg:col-span-2">
          <SectionCard
            testId="command-center-batches"
            title="Batch Lifecycle"
            chip={<StatusPill label="Freeze pending" variant="secondary" />}
          >
            {batches.length === 0 ? (
              <EmptyState message="No batches returned for this program." />
            ) : (
              <Table testId="command-center-batch-table">
                <thead>
                  <Tr>
                    <Th>Batch</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Notices</Th>
                    <Th>Policy</Th>
                    <Th>Template</Th>
                  </Tr>
                </thead>
                <tbody>
                  {batches.map((b: BatchRow) => {
                    const s = BATCH_STATUS[b.status];
                    return (
                      <Tr key={b.batchId} interactive onClick={() => onNavigate('batch-operations')}>
                        <Td className="font-mono text-xs">{b.batchId}</Td>
                        <Td>
                          <StatusPill label={s.label} variant={s.variant} />
                        </Td>
                        <Td className="text-right font-mono">{formatInt(b.notices)}</Td>
                        <Td className="text-xs">{b.policyVersion}</Td>
                        <Td className="text-xs">{b.templateVersion}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => onNavigate('batch-operations')}>
                Open Batch Workspace
              </Button>
              <Button size="sm" variant="outline" onClick={() => onNavigate('freeze-snapshots')}>
                View Freeze Preview
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* Governance timeline */}
        <SectionCard
          testId="command-center-timeline"
          title="Governance Timeline"
          chip={<StatusPill label="Trace active" variant="outline" />}
        >
          <GovernanceTimeline steps={timeline} />
        </SectionCard>
      </div>

      {/* At-a-glance status row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <GlanceTile
          label="Policy Pack"
          value={snapshot.policyPacks[0]?.packId ?? '—'}
          pill={<StatusPill label="Approved" variant="default" />}
          onClick={() => onNavigate('policy-packs')}
        />
        <GlanceTile
          label="Template Governance"
          value="1 review item"
          pill={<StatusPill label="Plain-language pending" variant="secondary" />}
          onClick={() => onNavigate('template-governance')}
        />
        <GlanceTile
          label="Vendor Dispatch"
          value="Ready"
          pill={<StatusPill label="Print contract validated" variant="default" />}
          onClick={() => onNavigate('vendor-dispatch')}
        />
        <GlanceTile
          label="Returned Mail / Exceptions"
          value={`${formatInt(kpis.openExceptions)} open`}
          pill={<StatusPill label={`${kpis.highRiskExceptions} high risk`} variant="destructive" />}
          onClick={() => onNavigate('returned-mail')}
        />
      </div>
    </div>
  );
};

const GlanceTile: React.FC<{
  label: string;
  value: string;
  pill: React.ReactNode;
  onClick: () => void;
}> = ({ label, value, pill, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left rounded-lg p-3 flex flex-col gap-1 transition-colors hover:opacity-90"
    style={{ background: 'hsl(var(--tf-card-bg) / 0.4)', border: '1px solid hsl(var(--tf-border) / 0.2)' }}
  >
    <span className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span className="font-semibold">{value}</span>
    <span>{pill}</span>
  </button>
);

export default CommandCenter;
