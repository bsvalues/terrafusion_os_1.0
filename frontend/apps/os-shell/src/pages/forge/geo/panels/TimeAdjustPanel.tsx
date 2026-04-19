import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { deriveMonthlyRate, computeAdjustedStats } from '../utils/timeAdjust';
import type { AdjustedNeighborhoodStat } from '../utils/timeAdjust';

function RatioDiff({ orig, adj }: { orig: number; adj: number }) {
  const delta = adj - orig;
  const color = Math.abs(adj - 1) < Math.abs(orig - 1) ? 'text-emerald-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-mono text-slate-500">{orig.toFixed(3)}</span>
      <span className="text-[8px] text-slate-600">→</span>
      <span className={`text-[9px] font-mono font-semibold ${color}`}>{adj.toFixed(3)}</span>
      {delta !== 0 && (
        <span className={`text-[8px] font-mono ${delta < 0 ? 'text-sky-400' : 'text-orange-400'}`}>
          ({delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp)
        </span>
      )}
    </div>
  );
}

function StatusBadge({ stat }: { stat: AdjustedNeighborhoodStat }) {
  if (stat.gainsParity)
    return <span className="text-[8px] text-emerald-400 bg-emerald-950/30 rounded px-1">GAINS PARITY</span>;
  if (stat.lossesParity)
    return <span className="text-[8px] text-red-400 bg-red-950/30 rounded px-1">LOSES PARITY</span>;
  const pass = stat.adjustedMedianRatio >= 0.90 && stat.adjustedMedianRatio <= 1.10 && stat.cod <= 20;
  if (pass) return <span className="text-[8px] text-slate-600 rounded px-1">Pass</span>;
  return <span className="text-[8px] text-amber-400/70 rounded px-1">Fail</span>;
}

export function TimeAdjustPanel() {
  const { salePoints, neighborhoodStats, filter } = useGeoForgeStore();

  // Study end = Dec 31 of tax year
  const defaultStudyEnd = `${filter.taxYear}-12-31`;

  const derived = useMemo(() => deriveMonthlyRate(salePoints, defaultStudyEnd), [salePoints, defaultStudyEnd]);

  const [manualRate, setManualRate] = useState<string>('');
  const [studyEnd, setStudyEnd] = useState(defaultStudyEnd);

  const effectiveRate = manualRate !== '' ? parseFloat(manualRate) : derived.monthlyRatePct;
  const rateValid = !isNaN(effectiveRate);

  const adjStats = useMemo(() => {
    if (!rateValid || Math.abs(effectiveRate) < 0.001) return [];
    return computeAdjustedStats(salePoints, neighborhoodStats, effectiveRate, studyEnd);
  }, [salePoints, neighborhoodStats, effectiveRate, studyEnd, rateValid]);

  const gainsCount = adjStats.filter((s) => s.gainsParity).length;
  const losesCount = adjStats.filter((s) => s.lossesParity).length;

  // County-wide adjusted stats
  const cwAdj = useMemo(() => {
    if (adjStats.length === 0) return null;
    const totalSales = adjStats.reduce((s, n) => s + n.saleCount, 0);
    if (totalSales === 0) return null;
    const wAdj = adjStats.reduce((s, n) => s + n.adjustedMedianRatio * n.saleCount, 0) / totalSales;
    const wOrig = adjStats.reduce((s, n) => s + n.originalMedianRatio * n.saleCount, 0) / totalSales;
    return { wAdj, wOrig };
  }, [adjStats]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header controls */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[9px] text-slate-500 mb-0.5">Study End Date</div>
            <input
              type="date"
              value={studyEnd}
              onChange={(e) => setStudyEnd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-terra-cyan/50"
            />
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-slate-500 mb-0.5">Monthly Rate Override (%/mo)</div>
            <input
              type="number"
              step="0.01"
              placeholder={derived.monthlyRatePct !== 0 ? derived.monthlyRatePct.toFixed(3) : '0.000'}
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-terra-cyan/50 font-mono"
            />
          </div>
        </div>

        {/* Derived rate info */}
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-slate-500">Auto-derived:</span>
          <span className={`font-mono font-semibold ${Math.abs(derived.monthlyRatePct) > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {derived.monthlyRatePct > 0 ? '+' : ''}{derived.monthlyRatePct.toFixed(3)}%/mo
          </span>
          {derived.rSquared != null && (
            <span className="text-slate-600">R²={derived.rSquared.toFixed(3)}</span>
          )}
          <span className="text-slate-600">n={derived.sampleN}</span>
          {manualRate !== '' && (
            <span className="text-terra-cyan text-[8px] ml-auto">override active</span>
          )}
        </div>

        {derived.rSquared != null && derived.rSquared < 0.05 && (
          <div className="text-[8px] text-amber-400/70">
            Low R² — weak time trend. Manual review of paired sales recommended.
          </div>
        )}

        {/* County-wide summary */}
        {cwAdj && (
          <div className="flex items-center gap-4 pt-1 border-t border-slate-800">
            <div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wide">County Weighted MED</div>
              <RatioDiff orig={cwAdj.wOrig} adj={cwAdj.wAdj} />
            </div>
            <div className="ml-auto flex gap-3">
              {gainsCount > 0 && (
                <span className="text-[9px] text-emerald-400">{gainsCount} gain parity</span>
              )}
              {losesCount > 0 && (
                <span className="text-[9px] text-red-400">{losesCount} lose parity</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Per-neighborhood table */}
      <div className="flex-1 overflow-y-auto">
        {salePoints.length === 0 || neighborhoodStats.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">
            Load neighborhood stats and sales to compute time-adjusted ratios.
          </div>
        ) : !rateValid || Math.abs(effectiveRate) < 0.001 ? (
          <div className="p-4 text-slate-600 text-xs text-center">
            {derived.sampleN < 10
              ? 'Insufficient sales for auto-derivation — enter rate manually.'
              : 'Set a monthly rate or leave blank to use derived rate.'}
          </div>
        ) : adjStats.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">No neighborhoods with ≥ 3 qualified sales.</div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto] px-3 py-1 text-[8px] text-slate-600 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
              <span>Neighborhood · Orig → Adj Ratio</span>
              <span>Status</span>
            </div>
            {adjStats.map((s) => (
              <div
                key={s.neighborhoodCode}
                className={`flex items-center justify-between px-3 py-1.5 border-b border-slate-800/40 hover:bg-slate-800/20 ${
                  s.lossesParity ? 'bg-red-950/10' : s.gainsParity ? 'bg-emerald-950/10' : ''
                }`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-[9px] text-slate-400 truncate">{s.neighborhoodCode} · {s.neighborhoodName}</div>
                  <RatioDiff orig={s.originalMedianRatio} adj={s.adjustedMedianRatio} />
                </div>
                <StatusBadge stat={s} />
              </div>
            ))}
            <p className="px-3 py-2 text-[8px] text-slate-700">
              Rate {effectiveRate > 0 ? '+' : ''}{effectiveRate.toFixed(3)}%/mo · study end {studyEnd}.
              Older sales adjusted upward; adjusted ratio = orig_ratio ÷ (1 + rate × months).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
