import React from 'react';
import type { StratumDiagnosisSummary } from '../../../../services/forge/salesAuditApi';

interface KpiTileProps {
  label: string;
  value: string;
  target: string;
  colorClass: string;
}

function KpiTile({ label, value, target, colorClass }: KpiTileProps) {
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 min-w-0">
      <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-slate-600">{target}</div>
    </div>
  );
}

function tileColor(value: number, low: number, high: number, invertOk = false): string {
  const inRange = value >= low && value <= high;
  const isGood = invertOk ? !inRange : inRange;
  return isGood ? 'text-emerald-400' : 'text-red-400';
}

interface CountyKpiBarProps {
  strata: StratumDiagnosisSummary[];
  cod?: number;
  medianRatio?: number;
  prd?: number;
  qualifiedSales?: number;
}

export function CountyKpiBar({
  strata,
  cod = 0,
  medianRatio = 0,
  prd = 0,
  qualifiedSales = 0,
}: CountyKpiBarProps) {
  const failing = strata.filter(
    (s) => s.primaryDiagnosis && s.primaryDiagnosis !== 'PASSING'
  );
  const diagnosed = strata.filter((s) => s.primaryDiagnosis && !s.isStale);

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950 overflow-x-auto shrink-0">
      <KpiTile
        label="County COD"
        value={cod.toFixed(1)}
        target="target < 15.0"
        colorClass={tileColor(cod, 0, 15, true)}
      />
      <KpiTile
        label="Median Ratio"
        value={medianRatio.toFixed(3)}
        target="0.95 – 1.05"
        colorClass={tileColor(medianRatio, 0.95, 1.05)}
      />
      <KpiTile
        label="PRD"
        value={prd.toFixed(3)}
        target="0.98 – 1.03"
        colorClass={tileColor(prd, 0.98, 1.03)}
      />
      <KpiTile
        label="Qualified Sales"
        value={qualifiedSales.toLocaleString()}
        target="county total"
        colorClass={qualifiedSales > 200 ? 'text-emerald-400' : 'text-amber-400'}
      />
      <KpiTile
        label="Strata Failing"
        value={`${failing.length} / ${strata.length}`}
        target="target 0"
        colorClass={failing.length === 0 ? 'text-emerald-400' : 'text-red-400'}
      />
      <KpiTile
        label="AI Diagnosed"
        value={`${diagnosed.length} / ${failing.length}`}
        target="of failing"
        colorClass={
          failing.length > 0 && diagnosed.length >= failing.length
            ? 'text-emerald-400'
            : 'text-amber-400'
        }
      />
    </div>
  );
}
