/**
 * TN-GUI-008 — Returned Mail / Exception Queue.
 *
 * Returned mail, bad address, vendor rejection, missing insert, and
 * policy/template conflict — each with the resolution action and a high-risk
 * flag that drives the reissue workflow.
 *
 * @module pages/notice/areas/ReturnedMail
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import type { NoticeConsoleSnapshot } from '../types';
import {
  EmptyState,
  SectionCard,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  formatInt,
} from '../components/primitives';

export const ReturnedMail: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const rows = snapshot.exceptions;
  const totalOpen = rows.reduce((acc, r) => acc + r.count, 0);
  const highRisk = rows.filter((r) => r.highRisk).reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="space-y-5" data-testid="notice-area-returned-mail">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-4" style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', border: '1px solid hsl(var(--tf-border) / 0.2)' }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--tf-muted))' }}>Open exceptions</div>
          <div className="text-3xl font-semibold mt-1">{formatInt(totalOpen)}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', border: '1px solid hsl(var(--tf-border) / 0.2)' }}>
          <div className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--tf-muted))' }}>High risk</div>
          <div className="text-3xl font-semibold mt-1" style={{ color: 'hsl(var(--tf-error))' }}>{formatInt(highRisk)}</div>
        </div>
      </div>

      <SectionCard title="Exception Queue">
        {rows.length === 0 ? (
          <EmptyState message="No exceptions in the queue." />
        ) : (
          <Table testId="exception-queue-table">
            <thead>
              <Tr>
                <Th>Category</Th>
                <Th className="text-right">Count</Th>
                <Th>Action</Th>
                <Th className="text-right">Risk</Th>
                <Th className="text-right">Reissue</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.category}>
                  <Td className="text-sm">{r.label}</Td>
                  <Td className="text-right font-mono">{formatInt(r.count)}</Td>
                  <Td className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{r.action}</Td>
                  <Td className="text-right">
                    <StatusPill label={r.highRisk ? 'High' : 'Normal'} variant={r.highRisk ? 'destructive' : 'outline'} />
                  </Td>
                  <Td className="text-right">
                    <Button size="sm" variant="outline" disabled={r.count === 0}>
                      Reissue
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className="text-[11px] mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
          Sandbox: reissue actions are inert — no replacement notices are generated.
        </p>
      </SectionCard>
    </div>
  );
};

export default ReturnedMail;
