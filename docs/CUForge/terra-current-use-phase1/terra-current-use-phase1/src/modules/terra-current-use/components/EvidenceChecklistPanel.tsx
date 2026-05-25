import React from 'react';
import type { CurrentUseEvidenceItem } from '../types/currentUseTypes';
import { formatEnum, Panel } from './shared';

export function EvidenceChecklistPanel({ items }: { items: CurrentUseEvidenceItem[] }) {
  return (
    <Panel title="Evidence Checklist">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border p-3">
            <div className="flex justify-between gap-3">
              <span className="font-medium">{formatEnum(item.evidenceType)}</span>
              <span className="rounded-full border px-2 py-1 text-xs">{formatEnum(item.status)}</span>
            </div>
            {item.receivedAt && (
              <p className="mt-1 text-xs text-slate-500">Received: {item.receivedAt}</p>
            )}
            {item.notes && <p className="mt-2 text-sm text-slate-600">{item.notes}</p>}
          </div>
        ))}
      </div>
    </Panel>
  );
}
