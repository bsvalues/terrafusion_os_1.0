import { useMemo, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { useQueries } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { NeighborhoodStat } from '../types/geoforge.types';

type SortKey = 'deviation' | 'cod' | 'n' | 'trend';
type ViewMode = 'list' | 'matrix';

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

function prdBandColor(prd: number) {
  return prd >= 0.98 && prd <= 1.03 ? '#4ade80' : prd >= 0.95 && prd <= 1.06 ? '#fbbf24' : '#f87171';
}

// Tiny inline SVG sparkline — no Recharts overhead per row
function RatioSparkline({ points, width = 44, height = 16 }: { points: (number | null)[]; width?: number; height?: number }) {
  const yMin = 0.80, yMax = 1.20;
  const toX = (i: number) => (i / (points.length - 1)) * width;
  const toY = (v: number) => height - ((v - yMin) / (yMax - yMin)) * height;
  const parity = toY(1.0);

  const valid = points.map((v, i) => v !== null ? { x: toX(i), y: toY(v!), v: v! } : null);
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < valid.length - 1; i++) {
    const a = valid[i], b = valid[i + 1];
    if (a && b) segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  const lastValid = [...valid].reverse().find((v) => v !== null);
  const firstValid = valid.find((v) => v !== null);
  const trend = lastValid && firstValid ? lastValid.v - firstValid.v : 0;
  const improving = trend !== 0 && Math.abs(lastValid?.v ?? 1) < Math.abs(firstValid?.v ?? 1) - 0.002;
  const strokeColor = improving ? '#4ade80' : trend < -0.005 ? '#ef4444' : '#94a3b8';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      {/* Parity reference line */}
      <line x1={0} y1={parity} x2={width} y2={parity} stroke="#334155" strokeWidth={0.5} strokeDasharray="2 2" />
      {/* Trend segments */}
      {segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={strokeColor} strokeWidth={1.2} />
      ))}
      {/* Dots */}
      {valid.map((pt, i) => pt ? (
        <circle key={i} cx={pt.x} cy={pt.y} r={1.5} fill={strokeColor} />
      ) : null)}
    </svg>
  );
}

export function NeighborhoodRankingPanel() {
  const { neighborhoodStats, selectNeighborhood, filter, loadingStats } = useGeoForgeStore();
  const [sortKey, setSortKey] = useState<SortKey>('deviation');
  const [minSales, setMinSales] = useState(5);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Fetch prior 4 years for sparklines
  const priorYears = useMemo(
    () => [filter.taxYear - 4, filter.taxYear - 3, filter.taxYear - 2, filter.taxYear - 1],
    [filter.taxYear],
  );
  const priorQueries = useQueries({
    queries: priorYears.map((yr) => ({
      queryKey: ['geoforge-nbhd-stats', yr],
      queryFn: () => apiFetchJson<NeighborhoodStat[]>(
        `/api/geoforge/ratio-study/neighborhood-stats?taxYear=${yr}`
      ),
      staleTime: 1000 * 60 * 30,
    })),
  });
  const priorDataByYear = useMemo(() => {
    const m: Record<number, Record<string, number>> = {};
    priorYears.forEach((yr, i) => {
      const data = priorQueries[i]?.data ?? [];
      m[yr] = {};
      for (const ns of data) m[yr][ns.neighborhoodCode] = ns.stats.medianRatio;
    });
    return m;
  }, [priorYears, priorQueries]);

  const filtered = useMemo(() =>
    neighborhoodStats.filter(ns => ns.saleCount >= minSales),
    [neighborhoodStats, minSales],
  );

  const sparklineMap = useMemo(() => {
    const m: Record<string, (number | null)[]> = {};
    for (const ns of filtered) {
      const code = ns.neighborhoodCode;
      m[code] = [
        ...priorYears.map((yr) => priorDataByYear[yr]?.[code] ?? null),
        ns.stats.medianRatio,
      ];
    }
    return m;
  }, [filtered, priorYears, priorDataByYear]);

  const trendDelta = (code: string): number => {
    const pts = sparklineMap[code];
    if (!pts) return 0;
    const first = pts.find((v) => v !== null);
    const last = [...pts].reverse().find((v) => v !== null);
    if (first == null || last == null) return 0;
    return Math.abs(last - 1) - Math.abs(first - 1);
  };

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sortKey === 'deviation')
      copy.sort((a, b) => Math.abs(b.stats.medianRatio - 1) - Math.abs(a.stats.medianRatio - 1));
    else if (sortKey === 'cod')
      copy.sort((a, b) => b.stats.cod - a.stats.cod);
    else if (sortKey === 'trend')
      copy.sort((a, b) => trendDelta(b.neighborhoodCode) - trendDelta(a.neighborhoodCode));
    else
      copy.sort((a, b) => b.saleCount - a.saleCount);
    return copy;
  }, [filtered, sortKey, sparklineMap]);

  const maxDev = useMemo(
    () => Math.max(...sorted.map(ns => Math.abs(ns.stats.medianRatio - 1)), 0.01),
    [sorted],
  );

  const matrixData = useMemo(() =>
    filtered.map(ns => ({
      x: ns.stats.cod,
      y: ns.stats.medianRatio,
      code: ns.neighborhoodCode,
      prd: ns.stats.prd,
      n: ns.saleCount,
      fill: prdBandColor(ns.stats.prd),
    })),
    [filtered],
  );

  const compliant = filtered.filter(
    ns => ns.stats.medianRatio >= 0.95 && ns.stats.medianRatio <= 1.05 && ns.stats.cod <= 20,
  ).length;

  if (neighborhoodStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm gap-2">
        {loadingStats ? <><span className="animate-spin inline-block text-terra-cyan">⟳</span> Loading neighborhoods…</> : 'No neighborhood data loaded.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/40 flex-shrink-0">
        {viewMode === 'list' && (
          <div className="flex gap-1">
            {(['deviation', 'cod', 'n', 'trend'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  sortKey === k
                    ? 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/40'
                    : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-white'
                }`}
              >
                {k === 'deviation' ? 'Worst' : k === 'cod' ? 'COD' : k === 'n' ? 'Sales' : 'Drifting'}
              </button>
            ))}
          </div>
        )}
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
          <div className="flex rounded border border-slate-700 overflow-hidden ml-1">
            {(['list', 'matrix'] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`text-[9px] px-1.5 py-0.5 transition-colors ${
                  viewMode === m ? 'bg-terra-cyan/20 text-terra-cyan' : 'bg-slate-900 text-slate-500 hover:text-white'
                }`}
              >
                {m === 'list' ? '☰' : '⊞'}
              </button>
            ))}
          </div>
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

      {viewMode === 'matrix' ? (
        /* Equity Matrix: COD (x) vs MedianRatio (y), colored by PRD compliance */
        <div className="flex-1 flex flex-col px-2 py-3 overflow-hidden">
          <div className="text-[8px] text-slate-500 text-center mb-1">
            COD (uniformity) → · MedianRatio (parity) ↑ · dot color = PRD
            <span className="ml-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-0.5" />ok
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1 mr-0.5" />watch
              <span className="inline-block w-2 h-2 rounded-full bg-red-400 ml-1 mr-0.5" />fail
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: -8 }}>
              <XAxis
                dataKey="x"
                type="number"
                name="COD"
                domain={[0, 'auto']}
                tick={{ fontSize: 8, fill: '#64748b' }}
                label={{ value: 'COD', position: 'insideBottom', offset: -8, fontSize: 8, fill: '#64748b' }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name="Ratio"
                domain={[0.80, 1.20]}
                tick={{ fontSize: 8, fill: '#64748b' }}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 10, borderRadius: 6 }}
                formatter={(v: number, name: string) => name === 'COD' ? [v.toFixed(1), 'COD'] : [v.toFixed(3), 'Ratio']}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload as { x: number; y: number; code: string; prd: number; n: number } | undefined;
                  if (!d) return null;
                  return (
                    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 10 }}>
                      <div style={{ color: '#00FFFF', fontWeight: 700, marginBottom: 2 }}>{d.code}</div>
                      <div>MED <span style={{ color: '#fff' }}>{d.y.toFixed(3)}</span></div>
                      <div>COD <span style={{ color: '#fff' }}>{d.x.toFixed(1)}</span></div>
                      <div>PRD <span style={{ color: '#fff' }}>{d.prd.toFixed(3)}</span></div>
                      <div style={{ color: '#64748b' }}>n={d.n}</div>
                    </div>
                  );
                }}
              />
              {/* IAAO parity band */}
              <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
              {/* COD threshold lines */}
              <ReferenceLine x={15} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine x={20} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
              <Scatter
                data={matrixData}
                onClick={(d: { code: string }) => selectNeighborhood(d.code)}
                cursor="pointer"
              >
                {matrixData.map((entry, i) => (
                  <g key={i}>
                    <circle
                      cx={0} cy={0} r={4}
                      fill={entry.fill}
                      fillOpacity={0.75}
                      stroke={entry.fill}
                      strokeOpacity={0.9}
                      strokeWidth={1}
                    />
                  </g>
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="text-[7px] text-slate-600 text-center mt-0.5">
            Click a dot to open neighborhood · amber line = COD 15 · red line = COD 20
          </div>
        </div>
      ) : (
        /* Ranked list */
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
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: prdBandColor(ns.stats.prd) }}
                    title={`PRD ${ns.stats.prd.toFixed(3)}`}
                  />
                  <span className={`text-[10px] font-mono font-bold shrink-0 ${BAND_TEXT[band]}`}>
                    {direction} {ns.stats.medianRatio.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-slate-500 shrink-0 w-8 text-right">
                    n={ns.saleCount}
                  </span>
                </div>

                {/* Deviation bar + sparkline */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAND_BAR[band]}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className={`text-[8px] font-mono shrink-0 ${ns.stats.cod > 20 ? 'text-red-400' : ns.stats.cod > 15 ? 'text-amber-300' : 'text-slate-500'}`}>
                    COD {ns.stats.cod.toFixed(1)}
                  </span>
                  {sparklineMap[ns.neighborhoodCode] && (
                    <RatioSparkline points={sparklineMap[ns.neighborhoodCode]} />
                  )}
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
      )}
    </div>
  );
}
