/**
 * TN-GUI (Telemetry / Risk Dashboard).
 *
 * Notices issued / delivered / returned / reissued, call-surge proxy, QR scans,
 * portal engagement, and exception handling time. Delivery-side metrics are
 * zero until dispatch begins — surfaced honestly rather than faked.
 *
 * @module pages/notice/areas/Telemetry
 */

import React from 'react';
import type { NoticeConsoleSnapshot } from '../types';
import { SectionCard, formatInt } from '../components/primitives';

export const Telemetry: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const metrics = snapshot.telemetry;

  return (
    <div className="space-y-5" data-testid="notice-area-telemetry">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="rounded-lg p-4"
            style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', border: '1px solid hsl(var(--tf-border) / 0.2)' }}
          >
            <div className="text-xs uppercase tracking-wide" style={{ color: 'hsl(var(--tf-muted))' }}>{m.label}</div>
            <div className="text-2xl font-semibold mt-1">
              {formatInt(m.value)}
              {m.unit && <span className="text-sm font-normal ml-1" style={{ color: 'hsl(var(--tf-muted))' }}>{m.unit}</span>}
            </div>
            {m.delta && (
              <div className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>{m.delta}</div>
            )}
          </div>
        ))}
      </div>

      <SectionCard title="Delivery Funnel">
        <DeliveryFunnel snapshot={snapshot} />
        <p className="text-[11px] mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
          Delivery, returned, and engagement metrics remain zero until vendor dispatch begins. The console does not
          fabricate delivery telemetry.
        </p>
      </SectionCard>
    </div>
  );
};

const DeliveryFunnel: React.FC<{ snapshot: NoticeConsoleSnapshot }> = ({ snapshot }) => {
  const issued = snapshot.telemetry.find((m) => m.key === 'issued')?.value ?? 0;
  const stages = [
    { label: 'Issued', value: issued },
    { label: 'Delivered', value: snapshot.telemetry.find((m) => m.key === 'delivered')?.value ?? 0 },
    { label: 'Returned', value: snapshot.telemetry.find((m) => m.key === 'returned')?.value ?? 0 },
    { label: 'Reissued', value: snapshot.telemetry.find((m) => m.key === 'reissued')?.value ?? 0 },
  ];
  const max = Math.max(issued, 1);

  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-24 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>{s.label}</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'hsl(var(--tf-border) / 0.2)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`, background: 'hsl(var(--tf-accent))' }}
            />
          </div>
          <span className="w-20 text-right font-mono text-sm">{formatInt(s.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default Telemetry;
