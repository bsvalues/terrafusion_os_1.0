import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { ratioPointColor } from '../utils/choropleths';
import type { SalePoint } from '../types/geoforge.types';

type SortField = 'ratio' | 'salePrice' | 'assessedValue' | 'saleDate';
type FilterMode = 'all' | 'outlier' | 'qualified' | 'disqualified';

const FILTER_LABELS: Record<FilterMode, string> = {
  all: 'All',
  qualified: 'Qualified',
  outlier: 'Outlier',
  disqualified: 'DQ',
};

const DQ_BADGE: Record<string, string> = {
  qualified: 'text-emerald-400',
  outlier: 'text-yellow-400',
  disqualified: 'text-red-400',
};

const HIST_BANDS = [
  { label: '<.85', min: 0, max: 0.85 },
  { label: '.85–.95', min: 0.85, max: 0.95 },
  { label: '.95–1.05', min: 0.95, max: 1.05 },
  { label: '1.05–1.15', min: 1.05, max: 1.15 },
  { label: '>1.15', min: 1.15, max: Infinity },
] as const;

const HIST_COLORS = ['#60a5fa', '#93c5fd', '#4ade80', '#fb923c', '#f87171'];

function RatioHistogram({ sales }: { sales: SalePoint[] }) {
  const ratios = sales.map((s) => s.ratio).filter((r) => r > 0);
  if (ratios.length === 0) return null;

  const counts = HIST_BANDS.map(({ min, max }) => ratios.filter((r) => r >= min && r < max).length);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/60">
      <div className="flex items-end gap-1 h-8">
        {counts.map((count, i) => {
          const h = Math.max(2, Math.round((count / maxCount) * 32));
          return (
            <div key={HIST_BANDS[i].label} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                style={{ height: h, backgroundColor: HIST_COLORS[i], opacity: 0.75 }}
                className="w-full rounded-[1px]"
                title={`${HIST_BANDS[i].label}: ${count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-0.5">
        {HIST_BANDS.map(({ label }, i) => (
          <span key={label} className="flex-1 text-center text-[7px] text-slate-600 leading-none">{label}</span>
        ))}
      </div>
    </div>
  );
}

async function patchQualification(saleId: string, decision: string) {
  const res = await fetch(`/api/geoforge/sales/${saleId}/qualification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function SortHeader({
  label, field, current, dir, onClick,
}: {
  label: string; field: SortField; current: SortField | null; dir: 'asc' | 'desc'; onClick: () => void;
}) {
  return (
    <th
      className="py-1.5 px-2 text-right cursor-pointer select-none hover:text-slate-300 transition-colors"
      onClick={onClick}
    >
      {label}
      {current === field && <span className="ml-0.5 text-[8px]">{dir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

export function SalesDrillDownPanel() {
  const { selectedNeighborhoodCode, salePoints } = useGeoForgeStore();
  const qc = useQueryClient();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortField, setSortField] = useState<SortField | null>('ratio');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const mutation = useMutation({
    mutationFn: ({ saleId, decision }: { saleId: string; decision: string }) =>
      patchQualification(saleId, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geoforge-outliers'] });
      qc.invalidateQueries({ queryKey: ['geoforge-nbhd-stats'] });
      qc.invalidateQueries({ queryKey: ['geoforge-sales'] });
      qc.invalidateQueries({ queryKey: ['geoforge-certification'] });
    },
  });

  const base: SalePoint[] = selectedNeighborhoodCode
    ? salePoints.filter((s) => s.neighborhoodCode === selectedNeighborhoodCode)
    : salePoints;

  const filtered = useMemo(() => {
    let out = base;
    if (filterMode === 'outlier') out = out.filter((s) => s.isOutlier);
    else if (filterMode === 'qualified') out = out.filter((s) => s.qualificationDecision === 'qualified' && !s.isOutlier);
    else if (filterMode === 'disqualified') out = out.filter((s) => s.qualificationDecision === 'disqualified');
    if (sortField) {
      out = [...out].sort((a, b) => {
        const av = a[sortField as keyof SalePoint] as number | string;
        const bv = b[sortField as keyof SalePoint] as number | string;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [base, filterMode, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  const outlierCount = base.filter((s) => s.isOutlier).length;
  const dqCount = base.filter((s) => s.qualificationDecision === 'disqualified').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats header */}
      <div className="px-4 py-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">{base.length} sales</span>
          {outlierCount > 0 && <span className="text-yellow-400">{outlierCount} outlier{outlierCount !== 1 ? 's' : ''}</span>}
          {dqCount > 0 && <span className="text-red-400">{dqCount} DQ</span>}
          {selectedNeighborhoodCode && <span className="text-terra-cyan font-mono">{selectedNeighborhoodCode}</span>}
        </div>
      </div>

      {/* Ratio distribution histogram */}
      <RatioHistogram sales={base} />

      {/* Filter pills */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-slate-800 flex-shrink-0">
        {(Object.keys(FILTER_LABELS) as FilterMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
              filterMode === mode
                ? 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/40'
                : 'text-slate-500 border-slate-700 hover:text-slate-300'
            }`}
          >
            {FILTER_LABELS[mode]}
            {mode === 'outlier' && outlierCount > 0 && ` (${outlierCount})`}
            {mode === 'disqualified' && dqCount > 0 && ` (${dqCount})`}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-slate-600">{filtered.length} shown</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No sales match filter.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="text-[9px] text-slate-500 uppercase border-b border-slate-800">
                <th className="text-left py-1.5 px-3">Parcel</th>
                <SortHeader label="Sale" field="salePrice" current={sortField} dir={sortDir} onClick={() => toggleSort('salePrice')} />
                <SortHeader label="AV" field="assessedValue" current={sortField} dir={sortDir} onClick={() => toggleSort('assessedValue')} />
                <SortHeader label="Ratio" field="ratio" current={sortField} dir={sortDir} onClick={() => toggleSort('ratio')} />
                <SortHeader label="Date" field="saleDate" current={sortField} dir={sortDir} onClick={() => toggleSort('saleDate')} />
                <th className="py-1.5 px-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 400).map((s) => (
                <tr
                  key={s.saleId}
                  className={`border-b border-slate-900 hover:bg-slate-900/40 transition-colors ${
                    s.isOutlier ? 'bg-yellow-950/10' : s.qualificationDecision === 'disqualified' ? 'bg-red-950/10' : ''
                  }`}
                >
                  <td className="py-1.5 px-3">
                    <div className="font-mono text-[10px] text-slate-300 truncate max-w-[100px]">
                      {s.parcelId}
                      {s.isOutlier && <span className="ml-1 text-yellow-400">⚠</span>}
                    </div>
                    <div className={`text-[8px] mt-0.5 ${DQ_BADGE[s.qualificationDecision] ?? 'text-slate-600'}`}>
                      {s.qualificationDecision === 'qualified' ? 'qld'
                        : s.qualificationDecision === 'disqualified' ? 'DQ'
                        : s.qualificationDecision.slice(0, 6)}
                      {s.propertyClass && <span className="ml-1 text-slate-600">{s.propertyClass}</span>}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400 font-mono text-[10px]">
                    {(s.salePrice / 1000).toFixed(0)}k
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-400 font-mono text-[10px]">
                    {(s.assessedValue / 1000).toFixed(0)}k
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-[11px]" style={{ color: ratioPointColor(s.ratio) }}>
                    {s.ratio.toFixed(3)}
                  </td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground text-[10px]">
                    {s.saleDate.slice(2, 7)}
                  </td>
                  <td className="py-1.5 px-2">
                    {s.qualificationDecision === 'disqualified' ? (
                      <button
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ saleId: s.saleId, decision: 'qualified' })}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-300 hover:bg-green-800/60 disabled:opacity-40 whitespace-nowrap"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ saleId: s.saleId, decision: 'disqualified' })}
                        className="text-[8px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 hover:bg-red-900/60 disabled:opacity-40"
                      >
                        DQ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > 400 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Showing 400 of {filtered.length}
          </p>
        )}
      </div>

      {mutation.isSuccess && (
        <div className="px-4 py-1.5 text-[10px] text-green-400 border-t border-slate-800 flex-shrink-0">
          ✓ Qualification updated — ratio study recomputes on next load.
        </div>
      )}
    </div>
  );
}
