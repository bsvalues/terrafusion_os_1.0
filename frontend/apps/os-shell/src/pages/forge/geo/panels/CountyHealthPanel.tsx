import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Line, Area,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoransI } from '../utils/spatialStats';

interface TrendYear {
  taxYear: number;
  noData?: boolean;
  medianRatio?: number;
  cod?: number;
  prd?: number;
  saleCount?: number;
  iaaoPass?: boolean;
}

function GaugeBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-0.5">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function CountyHealthPanel() {
  const { neighborhoodStats, selectNeighborhood, openDrawer, filter } = useGeoForgeStore();

  const { data: trendData } = useQuery<TrendYear[]>({
    queryKey: ['geoforge-county-trend', filter.taxYear],
    queryFn: () =>
      apiFetchJson<TrendYear[]>(
        `/api/geoforge/ratio-study/county-trend?fromYear=${filter.taxYear - 4}&toYear=${filter.taxYear}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const trendRows = useMemo(() => {
    if (!trendData) return [];
    return trendData.filter((r) => !r.noData && r.medianRatio != null);
  }, [trendData]);

  const moransI = useMemo(() => computeMoransI(neighborhoodStats), [neighborhoodStats]);

  const county = useMemo(() => {
    if (neighborhoodStats.length === 0) return null;
    const withSales = neighborhoodStats.filter(ns => ns.saleCount >= 1);
    const totalSales = withSales.reduce((s, ns) => s + ns.saleCount, 0);

    const wAvg = (fn: (ns: typeof withSales[0]) => number) =>
      withSales.reduce((s, ns) => s + fn(ns) * ns.saleCount, 0) / totalSales;

    const medianRatio = wAvg(ns => ns.stats.medianRatio);
    const cod = wAvg(ns => ns.stats.cod);
    const prd = wAvg(ns => ns.stats.prd);
    const prb = wAvg(ns => ns.stats.prb);

    const compliant = withSales.filter(
      ns => ns.stats.medianRatio >= 0.95 && ns.stats.medianRatio <= 1.05 && ns.stats.cod <= 20
    );
    const passRate = withSales.length > 0 ? (compliant.length / withSales.length) * 100 : 0;

    const worst5 = [...withSales]
      .sort((a, b) => Math.abs(b.stats.medianRatio - 1) - Math.abs(a.stats.medianRatio - 1))
      .slice(0, 5);

    const codDistrib = [
      { band: '0-5', count: withSales.filter(ns => ns.stats.cod < 5).length },
      { band: '5-10', count: withSales.filter(ns => ns.stats.cod >= 5 && ns.stats.cod < 10).length },
      { band: '10-15', count: withSales.filter(ns => ns.stats.cod >= 10 && ns.stats.cod < 15).length },
      { band: '15-20', count: withSales.filter(ns => ns.stats.cod >= 15 && ns.stats.cod < 20).length },
      { band: '20+', count: withSales.filter(ns => ns.stats.cod >= 20).length },
    ];

    const ratioDistrib = [
      { band: '<0.85', count: withSales.filter(ns => ns.stats.medianRatio < 0.85).length },
      { band: '0.85-0.90', count: withSales.filter(ns => ns.stats.medianRatio >= 0.85 && ns.stats.medianRatio < 0.90).length },
      { band: '0.90-0.95', count: withSales.filter(ns => ns.stats.medianRatio >= 0.90 && ns.stats.medianRatio < 0.95).length },
      { band: '0.95-1.05', count: withSales.filter(ns => ns.stats.medianRatio >= 0.95 && ns.stats.medianRatio <= 1.05).length },
      { band: '1.05-1.10', count: withSales.filter(ns => ns.stats.medianRatio > 1.05 && ns.stats.medianRatio <= 1.10).length },
      { band: '1.10-1.15', count: withSales.filter(ns => ns.stats.medianRatio > 1.10 && ns.stats.medianRatio <= 1.15).length },
      { band: '>1.15', count: withSales.filter(ns => ns.stats.medianRatio > 1.15).length },
    ];

    return { medianRatio, cod, prd, prb, passRate, compliant: compliant.length, total: withSales.length, totalSales, worst5, codDistrib, ratioDistrib };
  }, [neighborhoodStats]);

  if (!county) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No data loaded.
      </div>
    );
  }

  const passColor = county.passRate >= 90 ? '#4ade80' : county.passRate >= 75 ? '#fbbf24' : '#f87171';
  const ratioColor = county.medianRatio >= 0.95 && county.medianRatio <= 1.05 ? '#4ade80'
    : county.medianRatio >= 0.90 && county.medianRatio <= 1.10 ? '#fbbf24' : '#f87171';
  const codColor = county.cod <= 15 ? '#4ade80' : county.cod <= 20 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">

      {/* Pass rate gauge */}
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-md px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] text-slate-500 uppercase tracking-wider">County Pass Rate</span>
          <span className="text-xs text-slate-500">{county.compliant} / {county.total} nbhds</span>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-3xl font-mono font-bold" style={{ color: passColor }}>
            {county.passRate.toFixed(0)}%
          </span>
          <span className="text-[9px] text-slate-500 mb-1">IAAO compliant<br />(MED 0.95–1.05 &amp; COD ≤20)</span>
        </div>
        <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${county.passRate}%`, backgroundColor: passColor }} />
        </div>
      </div>

      {/* Key metrics */}
      <div>
        <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-2">County-Wide Metrics (Sales-Weighted)</h4>
        <div className="space-y-2">
          <GaugeBar label="Median Ratio (target 0.95–1.05)" value={county.medianRatio} max={1.3} color={ratioColor} />
          <GaugeBar label="COD (target ≤15, max 20)" value={county.cod} max={30} color={codColor} />
          <GaugeBar label="PRD (target 0.98–1.03)" value={county.prd} max={1.10} color={county.prd >= 0.98 && county.prd <= 1.03 ? '#4ade80' : '#fbbf24'} />
        </div>
        <div className="mt-2 flex gap-4 text-[9px] text-slate-500">
          <span>Total sales: <span className="text-white font-mono">{county.totalSales}</span></span>
          <span>PRB: <span className="text-white font-mono">{(county.prb >= 0 ? '+' : '') + county.prb.toFixed(3)}</span></span>
        </div>
      </div>

      {/* Ratio distribution */}
      <div>
        <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-2">Ratio Distribution (Neighborhoods)</h4>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={county.ratioDistrib} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="band" tick={{ fontSize: 7, fill: '#64748b' }} interval={0} />
            <YAxis tick={{ fontSize: 7, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 10 }}
              formatter={(v: number) => [v, 'neighborhoods']}
            />
            <ReferenceLine x="0.95-1.05" stroke="#4ade80" strokeOpacity={0.4} />
            <Bar dataKey="count" fill="#06b6d4" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* COD distribution */}
      <div>
        <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-2">COD Distribution (Neighborhoods)</h4>
        <ResponsiveContainer width="100%" height={75}>
          <BarChart data={county.codDistrib} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="band" tick={{ fontSize: 7, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 7, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 10 }}
              formatter={(v: number) => [v, 'neighborhoods']}
            />
            <Bar dataKey="count" fill="#a855f7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 5-Year County Trend */}
      {trendRows.length >= 2 && (
        <div>
          <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-2">
            5-Year County Trend ({trendRows[0].taxYear}–{trendRows[trendRows.length - 1].taxYear})
          </h4>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={trendRows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="taxYear" tick={{ fontSize: 7, fill: '#64748b' }} />
              <YAxis
                domain={[0.80, 1.20]}
                tick={{ fontSize: 7, fill: '#64748b' }}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 9 }}
                formatter={(v: number, name: string) => [
                  name === 'medianRatio' ? v.toFixed(3) : name === 'cod' ? v.toFixed(1) : v.toFixed(3),
                  name === 'medianRatio' ? 'Median Ratio' : name === 'cod' ? 'COD/20 (scaled)' : 'PRD',
                ]}
              />
              {/* IAAO parity band */}
              <Area
                type="monotone"
                dataKey={() => 1.05}
                stroke="none"
                fill="#4ade80"
                fillOpacity={0.06}
              />
              <ReferenceLine y={1.0} stroke="#4ade80" strokeOpacity={0.5} strokeDasharray="4 2" />
              <ReferenceLine y={0.95} stroke="#4ade80" strokeOpacity={0.25} strokeDasharray="2 4" />
              <ReferenceLine y={1.05} stroke="#4ade80" strokeOpacity={0.25} strokeDasharray="2 4" />
              <Line
                type="monotone"
                dataKey="medianRatio"
                stroke="#00FFFF"
                strokeWidth={2}
                dot={{ fill: '#00FFFF', r: 2.5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={(row: TrendYear) => row.cod != null ? row.cod / 20 : null}
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-1 text-[8px] text-slate-600">
            <span><span className="text-terra-cyan">─</span> Median Ratio</span>
            <span><span className="text-purple-400">- -</span> COD/20 (scaled)</span>
            <span><span className="text-emerald-700">─</span> IAAO band 0.95–1.05</span>
          </div>
        </div>
      )}

      {/* Spatial Autocorrelation (Moran's I) */}
      {moransI && (
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-md px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] text-slate-500 uppercase tracking-wider">Spatial Autocorrelation</span>
            <span className="font-mono text-xs font-bold" style={{ color: moransI.color }}>
              I = {moransI.I.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ color: moransI.color, backgroundColor: moransI.color + '22' }}
            >
              {moransI.label}
            </span>
            <span className="text-[8px] text-slate-600">n={moransI.n} nbhds</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(2, Math.min(100, ((moransI.I + 1) / 2) * 100))}%`,
                backgroundColor: moransI.color,
              }}
            />
          </div>
          {moransI.warning ? (
            <p className="text-[8px] text-red-400">
              ⚠ Geographic clustering detected — assessment ratios are spatially correlated. DOR review required per WAC 458-53A.
            </p>
          ) : (
            <p className="text-[8px] text-slate-600">
              I &gt; 0.30 = geographic bias warranting DOR review. Scale: −1 (dispersed) → 0 (random) → +1 (clustered).
            </p>
          )}
        </div>
      )}

      {/* Worst 5 neighborhoods */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[8px] text-slate-500 uppercase tracking-wider">Worst 5 by Deviation</h4>
          <button
            className="text-[8px] text-terra-cyan hover:text-white transition-colors"
            onClick={() => openDrawer('ranking')}
          >
            View all →
          </button>
        </div>
        <div className="space-y-1">
          {county.worst5.map(ns => {
            const dev = Math.abs(ns.stats.medianRatio - 1);
            const color = dev < 0.05 ? '#4ade80' : dev < 0.10 ? '#fbbf24' : '#f87171';
            return (
              <button
                key={ns.neighborhoodCode}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/60 transition-colors text-left"
                onClick={() => selectNeighborhood(ns.neighborhoodCode)}
              >
                <span className="text-terra-cyan font-mono text-[10px] w-16 shrink-0">{ns.neighborhoodCode}</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, dev * 500)}%`, backgroundColor: color }} />
                </div>
                <span className="font-mono text-[9px] shrink-0" style={{ color }}>
                  {ns.stats.medianRatio.toFixed(3)}
                </span>
                <span className="text-[8px] text-slate-600 w-8 text-right shrink-0">COD {ns.stats.cod.toFixed(0)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
