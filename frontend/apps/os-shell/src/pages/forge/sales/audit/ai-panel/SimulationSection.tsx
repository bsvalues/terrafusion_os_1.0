// .../audit/ai-panel/SimulationSection.tsx
import React from 'react';
import type { SimulationResult } from '../../../../../services/forge/salesAuditApi';

interface StatRowProps { label: string; current?: number; projected?: number }

function StatRow({ label, current, projected }: StatRowProps) {
  const changed = projected != null && current != null && Math.abs(projected - current) > 0.001;
  return (
    <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider flex-1">{label}</span>
      {current != null && (
        <span className="text-xs text-slate-500 line-through">{current.toFixed(3)}</span>
      )}
      {changed && <span className="text-slate-600 text-[10px]">→</span>}
      {projected != null && (
        <span className={`text-xs font-mono font-bold ${changed ? 'text-cyan-400' : 'text-slate-400'}`}>
          {projected.toFixed(3)}
        </span>
      )}
    </div>
  );
}

interface Props {
  current: SimulationResult | null;
  projected: SimulationResult | null;
}

export function SimulationSection({ current, projected }: Props) {
  if (!projected) return null;
  return (
    <div className="mt-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mb-2">
        Simulation {current ? '(if accepted)' : ''}
      </div>
      <StatRow label="COD" current={current?.cod} projected={projected.cod} />
      <StatRow label="Median" current={current?.medianRatio} projected={projected.medianRatio} />
      <StatRow label="PRD" current={current?.prd} projected={projected.prd} />
      <div className="text-[10px] text-slate-600 mt-1">{projected.saleCount} sales</div>
    </div>
  );
}
