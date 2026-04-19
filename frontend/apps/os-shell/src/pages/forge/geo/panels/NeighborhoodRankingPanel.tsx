import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';

type SortKey = 'deviation' | 'cod' | 'n';

function deviationBand(dev: number): 'ok' | 'watch' | 'critical' {
  if (dev < 0.05) return 'ok';
  if (dev < 0.10) return 'watch';
  return 'critical';
}

const BAND_BAR: Record<'ok' | 'watch' | 'critical', string> = {
  ok:       'bg-emerald-500',
  watch:    'bg-amber-400',
  critical: 'bg-red-500',
};

const BAND_TEXT: Record<'ok' | 'watch' | 'critical', string> = {
  ok:       'text-emerald-400',
  watch:    'text-amber-300',
  critical: 'text-red-400',
};

export function NeighborhoodRankingPanel() {
  const { neighborhoodStats, selectNeighborhood } = useGeoForgeStore();
  const [sortKey, setSortKey] = useState<SortKey>('deviation');
  const [minSales, setMinSales] = useState(5);

  const filtered = useMemo(() =>
    neighborhoodStats.filter(ns => ns.saleCount >= minSales),
    [neighborhoodStats, minSales],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortKey === 'deviation')
      copy.sort((a, b) => Math.abs(b.stats.medianRatio - 1) - Math.abs(a.stats.medianRatio - 1));
    else if (sortKey === 'cod')
      copy.sort((a, b) => b.stats.cod - a.stats.cod);
    else
      copy.sort((a, b) => b.saleCount - a.saleCount);
    return copy;
  }, [filtered, sortKey]);

  const maxDev = useMemo(
    () => Math.max(...sorted.map(ns => Math.abs(ns.stats.medianRatio - 1)), 0.01),
    [sorted],
  );

  const compliant = filtered.filter(
    ns => ns.stats.medianRatio >= 0.95 && ns.stats.medianRatio <= 1.05 && ns.stats.cod <= 20,
  ).length;

  if (neighborhoodStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No neighborhood data loaded.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
        <div className="flex gap-1">
          {(['deviation', 'cod', 'n'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                sortKey === k
                  ? 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/40'
                  : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
              }`}
            >
              {k === 'deviation' ? 'Worst First' : k === 'cod' ? 'High COD' : 'Most Sales'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] text-slate-500">Min n=</span>
          <select
            value={minSales}
            onChange={e => setMinSales(Number(e.target.value))}
            className="text-[9px] bg-slate-900 border border-slate-700 text-white rounded px-1 py-0.5"
          >
            {[1, 3, 5, 10, 20].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/30 border-b border-slate-800 flex-shrink-0">
        <span className="text-[10px] text-slate-400">
          <span className="text-white font-mono font-bold">{compliant}</span>
          <span className="text-slate-500"> / {filtered.length} compliant</span>
        </span>
        <span className="text-[9px] text-slate-600">
          (MED 0.95–1.05 &amp; COD ≤20)
        </span>
        <span className={`ml-auto text-[9px] font-bold ${
          compliant === filtered.length ? 'text-emerald-400'
          : compliant / filtered.length >= 0.75 ? 'text-amber-300' : 'text-red-400'
        }`}>
          {filtered.length > 0 ? Math.round(100 * compliant / filtered.length) : 0}% pass
        </span>
      </div>

      {/* Ranked list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((ns, i) => {
          const dev = Math.abs(ns.stats.medianRatio - 1);
          const band = deviationBand(dev);
          const barPct = maxDev > 0 ? (dev / maxDev) * 100 : 0;
          const direction = ns.stats.medianRatio > 1 ? '▲' : ns.stats.medianRatio < 1 ? '▼' : '–';

          return (
            <button
              key={ns.neighborhoodCode}
              className="w-full text-left px-3 py-2 border-b border-slate-900 hover:bg-slate-800/60 transition-colors"
              onClick={() => selectNeighborhood(ns.neighborhoodCode)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] text-slate-600 font-mono w-4 shrink-0">#{i + 1}</span>
                <span className="text-terra-cyan font-mono text-[10px] font-bold truncate flex-1">
                  {ns.neighborhoodCode}
                </span>
                <span className={`text-[10px] font-mono font-bold shrink-0 ${BAND_TEXT[band]}`}>
                  {direction} {ns.stats.medianRatio.toFixed(3)}
                </span>
                <span className="text-[9px] text-slate-500 shrink-0 w-8 text-right">
                  n={ns.saleCount}
                </span>
              </div>

              {/* Deviation bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAND_BAR[band]}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className={`text-[8px] font-mono ${ns.stats.cod > 20 ? 'text-red-400' : ns.stats.cod > 15 ? 'text-amber-300' : 'text-slate-500'}`}>
                    COD {ns.stats.cod.toFixed(1)}
                  </span>
                  <span className={`text-[8px] font-mono ${Math.abs(dev) < 0.05 ? 'text-slate-600' : BAND_TEXT[band]}`}>
                    Δ {dev.toFixed(3)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {sorted.length === 0 && (
          <div className="p-4 text-slate-600 text-sm text-center">
            No neighborhoods with ≥{minSales} sales.
          </div>
        )}
      </div>
    </div>
  );
}
