import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { SalePoint } from '../types/geoforge.types';

interface NbhdMeanStats {
  neighborhoodCode: string;
  neighborhoodName: string;
  saleCount: number;
  medianRatio: number;
  simpleMean: number;     // unweighted mean of ratios
  weightedMean: number;   // AV-weighted mean (Σ(AV × ratio) / ΣAV)
  spread: number;         // simpleMean - medianRatio
  avWtSpread: number;     // weightedMean - medianRatio
  // positive avWtSpread → higher-AV properties have lower ratios → progressive
  // negative avWtSpread → higher-AV properties have higher ratios → regressive
  equity: 'regressive' | 'progressive' | 'uniform';
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function computeNbhdStats(
  sales: SalePoint[],
  nbhdStats: { neighborhoodCode: string; neighborhoodName: string; stats: { medianRatio: number } }[],
): NbhdMeanStats[] {
  const byCode = new Map<string, SalePoint[]>();
  for (const s of sales) {
    if (s.isOutlier || s.ratio == null || s.assessedValue <= 0) continue;
    const list = byCode.get(s.neighborhoodCode) ?? [];
    list.push(s);
    byCode.set(s.neighborhoodCode, list);
  }

  return nbhdStats
    .map((ns) => {
      const list = byCode.get(ns.neighborhoodCode) ?? [];
      if (list.length < 5) return null;

      const ratios = list.map((s) => s.ratio);
      const totalAV = list.reduce((s, sale) => s + sale.assessedValue, 0);
      const simpleMean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
      const weightedMean = totalAV > 0
        ? list.reduce((s, sale) => s + sale.ratio * sale.assessedValue, 0) / totalAV
        : simpleMean;
      const medianRatio = median(ratios);
      const avWtSpread = weightedMean - medianRatio;

      const equity: NbhdMeanStats['equity'] =
        avWtSpread < -0.02 ? 'regressive'
        : avWtSpread > 0.02 ? 'progressive'
        : 'uniform';

      return {
        neighborhoodCode: ns.neighborhoodCode,
        neighborhoodName: ns.neighborhoodName,
        saleCount: list.length,
        medianRatio,
        simpleMean,
        weightedMean,
        spread: simpleMean - medianRatio,
        avWtSpread,
        equity,
      };
    })
    .filter((x): x is NbhdMeanStats => x !== null)
    .sort((a, b) => Math.abs(b.avWtSpread) - Math.abs(a.avWtSpread));
}

function SpreadBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  const color = value < -0.02 ? '#ef4444' : value > 0.02 ? '#60a5fa' : '#4ade80';
  const left = value < 0;
  return (
    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden w-full">
      <div
        className="absolute h-full rounded-full"
        style={{
          width: `${pct / 2}%`,
          backgroundColor: color,
          left: left ? `${50 - pct / 2}%` : '50%',
        }}
      />
      <div className="absolute w-px h-full bg-slate-600" style={{ left: '50%' }} />
    </div>
  );
}

type SortMode = 'spread' | 'count' | 'median';
type EquityFilter = 'all' | 'regressive' | 'progressive' | 'uniform';

export function WeightedMeanPanel() {
  const { salePoints, neighborhoodStats, filter } = useGeoForgeStore();
  const [sort, setSort] = useState<SortMode>('spread');
  const [equityF, setEquityF] = useState<EquityFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(
    () => computeNbhdStats(salePoints, neighborhoodStats),
    [salePoints, neighborhoodStats],
  );

  const maxSpread = useMemo(() => Math.max(...stats.map((s) => Math.abs(s.avWtSpread)), 0.01), [stats]);

  const visible = useMemo(() => {
    let base = equityF === 'all' ? stats : stats.filter((s) => s.equity === equityF);
    if (sort === 'count') base = [...base].sort((a, b) => b.saleCount - a.saleCount);
    else if (sort === 'median') base = [...base].sort((a, b) => Math.abs(b.medianRatio - 1) - Math.abs(a.medianRatio - 1));
    return base;
  }, [stats, sort, equityF]);

  const regressiveCount = stats.filter((s) => s.equity === 'regressive').length;
  const progressiveCount = stats.filter((s) => s.equity === 'progressive').length;
  const uniformCount = stats.filter((s) => s.equity === 'uniform').length;

  // County-wide weighted mean
  const cwWtMean = useMemo(() => {
    const qualified = salePoints.filter((s) => !s.isOutlier && s.ratio != null && s.assessedValue > 0);
    const totalAV = qualified.reduce((s, sale) => s + sale.assessedValue, 0);
    if (totalAV === 0) return null;
    return qualified.reduce((s, sale) => s + sale.ratio * sale.assessedValue, 0) / totalAV;
  }, [salePoints]);

  const cwMedian = useMemo(() => {
    const ratios = salePoints.filter((s) => !s.isOutlier && s.ratio != null).map((s) => s.ratio);
    return ratios.length ? median(ratios) : null;
  }, [salePoints]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        {/* County-wide KPIs */}
        {cwWtMean != null && cwMedian != null && (
          <div className="flex items-center gap-4 mb-2 pb-2 border-b border-slate-800">
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">County Median</div>
              <div className={`text-[12px] font-bold font-mono ${Math.abs(cwMedian - 1) > 0.1 ? 'text-amber-400' : 'text-slate-200'}`}>
                {cwMedian.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">AV-Weighted Mean</div>
              <div className={`text-[12px] font-bold font-mono ${Math.abs(cwWtMean - 1) > 0.1 ? 'text-amber-400' : 'text-slate-200'}`}>
                {cwWtMean.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider">Mean-Median Gap</div>
              <div className={`text-[12px] font-bold font-mono ${
                Math.abs(cwWtMean - cwMedian) > 0.02
                  ? cwWtMean < cwMedian ? 'text-red-400' : 'text-sky-400'
                  : 'text-emerald-400'
              }`}>
                {(cwWtMean - cwMedian) > 0 ? '+' : ''}{((cwWtMean - cwMedian) * 100).toFixed(2)}pp
              </div>
            </div>
          </div>
        )}

        {/* Equity summary */}
        <div className="flex items-center gap-3 mb-2">
          {[
            { f: 'regressive' as EquityFilter, label: 'Regressive', count: regressiveCount, color: 'text-red-400' },
            { f: 'progressive' as EquityFilter, label: 'Progressive', count: progressiveCount, color: 'text-sky-400' },
            { f: 'uniform' as EquityFilter, label: 'Uniform', count: uniformCount, color: 'text-emerald-400' },
          ].map(({ f, label, count, color }) => (
            <button
              key={f}
              onClick={() => setEquityF(equityF === f ? 'all' : f)}
              className={`text-[9px] rounded border px-1.5 py-0.5 transition-colors ${
                equityF === f ? 'border-slate-400 text-slate-200' : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={color}>{count}</span> {label}
            </button>
          ))}
          <span className="ml-auto text-[8px] text-slate-600">{filter.taxYear}</span>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-slate-600 mr-1">Sort:</span>
          {([['spread', 'By spread'], ['count', 'By sales'], ['median', 'By deviation']] as [SortMode, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                sort === s
                  ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {salePoints.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">Load sales data to compute weighted mean analysis.</div>
        ) : visible.length === 0 ? (
          <div className="p-4 text-slate-500 text-xs text-center">No neighborhoods match the current filter (need ≥ 5 qualified sales).</div>
        ) : (
          visible.map((s) => {
            const exp = expanded === s.neighborhoodCode;
            const equityColor =
              s.equity === 'regressive' ? 'text-red-400' :
              s.equity === 'progressive' ? 'text-sky-400' : 'text-emerald-400';
            return (
              <div
                key={s.neighborhoodCode}
                className="border-b border-slate-800/50 hover:bg-slate-800/15 cursor-pointer"
                onClick={() => setExpanded(exp ? null : s.neighborhoodCode)}
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-300 truncate">{s.neighborhoodCode}</span>
                      <span className="text-[8px] text-slate-600 truncate hidden sm:block">{s.neighborhoodName}</span>
                    </div>
                    <SpreadBar value={s.avWtSpread} max={maxSpread} />
                  </div>
                  <div className="text-right shrink-0 w-28">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[9px] font-mono text-slate-500">{s.medianRatio.toFixed(3)}</span>
                      <span className="text-[8px] text-slate-700">→</span>
                      <span className="text-[9px] font-mono text-slate-300">{s.weightedMean.toFixed(3)}</span>
                    </div>
                    <span className={`text-[8px] ${equityColor}`}>
                      {s.avWtSpread > 0 ? '+' : ''}{(s.avWtSpread * 100).toFixed(1)}pp · {s.equity}
                    </span>
                  </div>
                </div>
                {exp && (
                  <div className="px-3 pb-2 pt-1 bg-slate-900/30 border-t border-slate-800/40 grid grid-cols-3 gap-2">
                    {[
                      ['Median ratio', s.medianRatio.toFixed(4)],
                      ['Simple mean', s.simpleMean.toFixed(4)],
                      ['AV-weighted mean', s.weightedMean.toFixed(4)],
                      ['Mean-median spread', `${(s.spread * 100).toFixed(2)}pp`],
                      ['AV-weighted spread', `${(s.avWtSpread * 100).toFixed(2)}pp`],
                      ['Qualified sales', String(s.saleCount)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[8px] text-slate-600">{label}</div>
                        <div className="text-[9px] font-mono text-slate-300">{value}</div>
                      </div>
                    ))}
                    <div className="col-span-3 text-[9px] text-slate-500 mt-0.5">
                      {s.equity === 'regressive'
                        ? '→ AV-weighted mean < median: higher-AV properties carry relatively higher ratio burden (regressive).'
                        : s.equity === 'progressive'
                        ? '→ AV-weighted mean > median: lower-AV properties carry relatively higher ratio burden (progressive).'
                        : '→ AV-weighted mean ≈ median: no systematic vertical inequity detected.'}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <p className="px-3 py-2 text-[8px] text-slate-700">
          AV-weighted mean = Σ(AV × ratio) / ΣAV. Spread &gt; 2pp signals vertical inequity.
          Regressive (weighted &lt; median) favors larger properties. WAC 458-53A vertical equity.
        </p>
      </div>
    </div>
  );
}
