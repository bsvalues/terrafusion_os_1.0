/**
 * TN-GUI-003 — Policy Pack Manager.
 *
 * State baseline rules + county overrides, effective dates, rule-test results,
 * and approval status. Selecting a pack shows its rule ledger.
 *
 * @module pages/notice/areas/PolicyPacks
 */

import React, { useState } from 'react';
import type { NoticeConsoleSnapshot, PolicyRule } from '../types';
import {
  EmptyState,
  SectionCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  approvalVariant,
} from '../components/primitives';

function testVariant(s: PolicyRule['testStatus']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'pass') return 'default';
  if (s === 'fail') return 'destructive';
  return 'outline';
}

export const PolicyPacks: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const packs = snapshot.policyPacks;
  const [selected, setSelected] = useState(packs[0]?.packId ?? '');
  const active = packs.find((p) => p.packId === selected) ?? packs[0];

  if (packs.length === 0) {
    return (
      <div data-testid="notice-area-policy-packs">
        <SectionCard title="Policy Packs">
          <EmptyState message="No policy packs available for this county." />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" data-testid="notice-area-policy-packs">
      <SectionCard title="Packs">
        <ul className="space-y-2">
          {packs.map((p) => (
            <li key={p.packId}>
              <button
                onClick={() => setSelected(p.packId)}
                className="w-full text-left p-3 rounded-lg transition-colors"
                style={{
                  background: p.packId === selected ? 'hsl(var(--tf-accent) / 0.12)' : 'hsl(var(--tf-card-bg) / 0.4)',
                  border: `1px solid hsl(var(--tf-border) / ${p.packId === selected ? 0.4 : 0.15})`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm">{p.packId}</span>
                  <StatusPill label={p.approval} variant={approvalVariant(p.approval)} />
                </div>
                <div className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {p.label} · effective {p.effectiveDate}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="lg:col-span-2">
        <SectionCard
          title={`Rule Ledger — ${active.packId}`}
          chip={<StatusPill label={active.approval} variant={approvalVariant(active.approval)} />}
        >
          <Table testId="policy-rule-table">
            <thead>
              <Tr>
                <Th>Rule</Th>
                <Th>Source</Th>
                <Th>Effective</Th>
                <Th className="text-center">Test</Th>
                <Th className="text-right">Approval</Th>
              </Tr>
            </thead>
            <tbody>
              {active.rules.map((r) => (
                <Tr key={r.ruleId}>
                  <Td>
                    <div className="text-sm">{r.title}</div>
                    <div className="font-mono text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{r.ruleId}</div>
                  </Td>
                  <Td>
                    <StatusPill
                      label={r.source === 'state-baseline' ? 'State baseline' : 'County override'}
                      variant={r.source === 'state-baseline' ? 'outline' : 'secondary'}
                    />
                  </Td>
                  <Td className="text-xs">{r.effectiveDate}</Td>
                  <Td className="text-center">
                    <StatusPill label={r.testStatus} variant={testVariant(r.testStatus)} />
                  </Td>
                  <Td className="text-right">
                    <StatusPill label={r.approval} variant={approvalVariant(r.approval)} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </SectionCard>
      </div>
    </div>
  );
};

export default PolicyPacks;
