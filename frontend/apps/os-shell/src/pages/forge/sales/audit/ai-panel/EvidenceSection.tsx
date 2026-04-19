// .../audit/ai-panel/EvidenceSection.tsx
import React from 'react';
import type { DiagnosisFinding } from '../../../../services/forge/salesAuditApi';

interface Props { findings: DiagnosisFinding[]; }

export function EvidenceSection({ findings }: Props) {
  if (findings.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-2">Evidence</div>
      <ul className="space-y-1.5">
        {findings.map((f, i) => (
          <li key={i} className="text-xs text-slate-400 flex gap-2">
            <span className="text-slate-600 shrink-0">•</span>
            <span>{f.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
