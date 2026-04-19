import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Line,
  ComposedChart,
} from 'recharts';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { EquitySignatureRadar } from './EquitySignatureRadar';
import { codBand, prdBand, prbBand } from '../utils/bentonMethodCalcs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { NeighborhoodStat } from '../types/geoforge.types';

function olsLine(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 4) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  const slope = den > 0 ? num / den : 0;
  const intercept = my - slope * mx;
  let ssTot = 0, ssRes = 0;
  for (const p of pts) { ssTot += (p.y - my) ** 2; ssRes += (p.y - (slope * p.x + intercept)) ** 2; }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  return { slope, intercept, r2 };
}

function NeighborhoodYearSparkline({ neighborhoodCode }: { neighborhoodCode: string }) {
  const { filter } = useGeoForgeStore();
  const currentYear = filter.taxYear;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

  const results = useQueries({
    queries: years.map((yr) => ({
      queryKey: ['geoforge-nbhd-stats', yr, 'all'],
      queryFn: () => apiFetchJson<NeighborhoodStat[]>(
        `/api/geoforge/ratio-study/neighborhood-stats?taxYear=${yr}`
      ),
      staleTime: 1000 * 60 * 10,
    })),
  });

  const points = years
    .map((yr, i) => {
      const ns = results[i].data?.find((n) => n.neighborhoodCode === neighborhoodCode);
      return { taxYear: yr, medianRatio: ns?.stats.medianRatio ?? null, saleCount: ns?.saleCount ?? 0 };
    })
    .filter((p): p is { taxYear: number; medianRatio: number; saleCount: number } => p.medianRatio !== null);

  const isLoading = results.some((r) => r.isLoading);

  if (isLoading && points.length === 0) {
    return <div className="text-[8px] text-slate-600 animate-pulse text-center py-2">Loading 5-yr trend…</div>;
  }
  if (points.length < 2) return null;

  const first = points[0].medianRatio;
  const last = points[points.length - 1].medianRatio;
  const delta = last - first;
  // Rising ratio = assessments growing relative to market = potential over-assessment
  const trendIcon = Math.abs(delta) < 0.02 ? '→' : delta > 0 ? '↑' : '↓';
  const trendColor = Math.abs(delta) < 0.02 ? '#94a3b8' : delta > 0.05 ? '#f87171' : delta < -0.05 ? '#4ade80' : '#eab308';
  const trendLabel = Math.abs(delta) < 0.02 ? 'Stable'
    : delta > 0 ? `+${(delta * 100).toFixed(1)}pp rising`
    : `${(delta * 100).toFixed(1)}pp falling`;

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-md px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] text-slate-500 uppercase tracking-wider">
          {currentYear - 4}–{currentYear} Ratio Trend
        </span>
        <span className="text-[9px] font-mono" style={{ color: trendColor }}>
          {trendIcon} {trendLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <ComposedChart data={points} margin={{ top: 2, right: 4, bottom: 0, left: -22 }}>
          <XAxis dataKey="taxYear" tick={{ fontSize: 7, fill: '#64748b' }} />
          <YAxis
            domain={[0.80, 1.20]}
            tick={{ fontSize: 7, fill: '#64748b' }}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 9, borderRadius: 4 }}
            formatter={(v: number, name: string) => [v.toFixed(3), name === 'medianRatio' ? 'Median Ratio' : name]}
            labelFormatter={(v: number) => {
              const pt = points.find((p) => p.taxYear === v);
              return `${v}${pt ? ` · n=${pt.saleCount}` : ''}`;
            }}
          />
          <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.08} />
          <ReferenceArea y1={0.90} y2={0.95} fill="#eab308" fillOpacity={0.04} />
          <ReferenceArea y1={1.05} y2={1.10} fill="#eab308" fillOpacity={0.04} />
          <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="medianRatio"
            stroke="#00FFFF"
            strokeWidth={2}
            dot={{ fill: '#00FFFF', r: 2.5 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-[7px] text-slate-700 mt-0.5 text-right">
        WAC 458-53A · IAAO parity band 0.95–1.05
      </p>
    </div>
  );
}

function RegressivityScatter({ neighborhoodCode }: { neighborhoodCode: string }) {
  const { salePoints } = useGeoForgeStore();

  const { qualified, outliers, ols } = useMemo(() => {
    const hood = salePoints.filter(s => s.neighborhoodCode === neighborhoodCode && s.ratio > 0 && s.salePrice > 0);
    const q = hood.filter(s => s.qualificationDecision === 'qualified' && !s.isOutlier)
      .map(s => ({ x: s.salePrice / 1000, y: s.ratio, parcelId: s.parcelId }));
    const o = hood.filter(s => s.isOutlier)
      .map(s => ({ x: s.salePrice / 1000, y: s.ratio, parcelId: s.parcelId }));
    const ols = olsLine(q);
    return { qualified: q, outliers: o, ols };
  }, [salePoints, neighborhoodCode]);

  if (qualified.length < 3) return null;

  const allX = qualified.map(p => p.x);
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);

  const regLine = ols
    ? [
        { x: xMin, y: ols.slope * xMin + ols.intercept },
        { x: xMax, y: ols.slope * xMax + ols.intercept },
      ]
    : [];

  const interpretation = ols
    ? ols.slope < -0.0005
      ? { label: 'Regressive', sub: 'High-value under-assessed', color: 'text-amber-300' }
      : ols.slope > 0.0005
        ? { label: 'Progressive', sub: 'High-value over-assessed', color: 'text-blue-300' }
        : { label: 'Uniform', sub: 'No systematic bias', color: 'text-emerald-400' }
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs text-slate-500 uppercase tracking-wide">Price vs Ratio</h4>
        {interpretation && (
          <div className="text-right leading-tight">
            <span className={`text-[10px] font-bold ${interpretation.color}`}>{interpretation.label}</span>
            <div className="text-[8px] text-slate-600">{interpretation.sub}</div>
            {ols && (
              <div className={`text-[8px] font-mono ${ols.r2 >= 0.5 ? 'text-slate-400' : 'text-slate-700'}`}>
                R²={ols.r2.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <ComposedChart margin={{ top: 4, right: 8, bottom: 4, left: -14 }}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[xMin * 0.95, xMax * 1.05]}
            tick={{ fontSize: 8, fill: '#64748b' }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}k`}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0.75, 1.25]}
            tick={{ fontSize: 8, fill: '#64748b' }}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 10, borderRadius: 6 }}
            formatter={(v: number, name: string) =>
              name === 'y' ? [v.toFixed(3), 'Ratio'] : [`$${v.toFixed(0)}k`, 'Sale Price']
            }
          />
          {/* IAAO target band */}
          <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
          <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
          {/* Regression line */}
          {ols && (
            <Line
              data={regLine}
              dataKey="y"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              strokeDasharray="6 3"
            />
          )}
          {/* Outlier sales */}
          {outliers.length > 0 && (
            <Scatter data={outliers} fill="#ef4444" opacity={0.7} r={3} />
          )}
          {/* Qualified sales */}
          <Scatter data={qualified} fill="#00FFFF" opacity={0.6} r={2.5} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-[8px] text-slate-600 mt-0.5">
        <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-terra-cyan/60 mr-0.5 -mb-px" />Qualified</span>
        {outliers.length > 0 && <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500/60 mr-0.5 -mb-px" />Outlier</span>}
        <span><span className="inline-block w-3 h-px bg-amber-400 mr-0.5 mb-0.5" />OLS trend</span>
      </div>
    </div>
  );
}

function EquityNarrative({ ns }: { ns: import('../types/geoforge.types').NeighborhoodStat }) {
  const { stats, neighborhoodCode, saleCount } = ns;
  const { medianRatio, cod, prd, prb } = stats;

  const ratioStatus = medianRatio >= 0.95 && medianRatio <= 1.05 ? 'within IAAO parity (0.95–1.05)'
    : medianRatio > 1.05 ? `above parity at ${medianRatio.toFixed(3)} — properties appear over-assessed`
    : `below parity at ${medianRatio.toFixed(3)} — properties appear under-assessed`;

  const uniformityStatus = cod <= 15 ? `uniform (COD ${cod.toFixed(1)})`
    : cod <= 20 ? `borderline (COD ${cod.toFixed(1)}, IAAO max is 20)`
    : `non-uniform (COD ${cod.toFixed(1)}, exceeds IAAO 20 threshold)`;

  const verticalStatus = prd >= 0.98 && prd <= 1.03
    ? 'no vertical inequity detected'
    : prd > 1.03
      ? `regressive vertical inequity (PRD ${prd.toFixed(3)}) — lower-value properties over-assessed relative to higher-value`
      : `progressive vertical inequity (PRD ${prd.toFixed(3)}) — higher-value properties over-assessed relative to lower-value`;

  const sampleNote = saleCount < 5 ? ' Sample size is critically low — interpret results with caution.'
    : saleCount < 10 ? ' Sample size is small; conclusions may not be statistically reliable.'
    : '';

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-md px-3 py-2.5">
      <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Equity Assessment</h4>
      <p className="text-[10px] text-slate-300 leading-relaxed">
        Median ratio is <span className={
          medianRatio >= 0.95 && medianRatio <= 1.05 ? 'text-emerald-400 font-semibold' :
          medianRatio >= 0.90 && medianRatio <= 1.10 ? 'text-amber-400 font-semibold' : 'text-red-400 font-semibold'
        }>{ratioStatus}</span> based on {saleCount} qualified sales.
        Assessment uniformity is <span className={
          cod <= 15 ? 'text-emerald-400' : cod <= 20 ? 'text-amber-400' : 'text-red-400'
        }>{uniformityStatus}</span>.
        Vertical equity shows <span className={
          prd >= 0.98 && prd <= 1.03 ? 'text-emerald-400' : 'text-amber-400'
        }>{verticalStatus}</span>.
        {sampleNote && <span className="text-slate-500">{sampleNote}</span>}
      </p>
    </div>
  );
}

const BAND_COLORS: Record<'ok' | 'watch' | 'critical', string> = {
  ok: 'bg-green-900 text-green-300 border-green-700',
  watch: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  critical: 'bg-red-900 text-red-300 border-red-700',
};

function QuintileChart({ stats }: { stats: import('../types/geoforge.types').BentonMethodStats }) {
  const quintiles = [
    { label: 'Q1 Low', ratio: stats.q1Ratio },
    { label: 'Q2', ratio: stats.q2Ratio },
    { label: 'Q3 Mid', ratio: stats.q3Ratio },
    { label: 'Q4', ratio: stats.q4Ratio },
    { label: 'Q5 High', ratio: stats.q5Ratio },
  ];

  const hasData = quintiles.some(q => q.ratio > 0);
  if (!hasData) return null;

  const pct = (r: number) => Math.min(50, Math.abs(r - 1.0) * 200);
  const barColor = (r: number) =>
    r >= 0.95 && r <= 1.05 ? '#22c55e' : r >= 0.90 && r <= 1.10 ? '#eab308' : '#ef4444';

  // Regressivity: high-value under-assessed = Q5 ratio < Q1 ratio
  const spread = stats.q5Ratio > 0 && stats.q1Ratio > 0
    ? stats.q5Ratio / stats.q1Ratio : null;
  const regressivity =
    spread === null ? null :
    spread < 0.95 ? { label: 'Regressive', color: 'text-red-400' } :
    spread > 1.05 ? { label: 'Progressive', color: 'text-blue-400' } :
    { label: 'Uniform', color: 'text-green-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide">
          Value Stratification
        </h4>
        {regressivity && (
          <span className={`text-[10px] font-bold uppercase ${regressivity.color}`}>
            {regressivity.label}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {quintiles.map(({ label, ratio }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-[52px] text-right text-[9px] text-slate-500 shrink-0">{label}</span>
            <div className="flex-1 relative h-3.5 bg-slate-800 rounded overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10" />
              {ratio > 0 && (
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-[2px]"
                  style={{
                    backgroundColor: barColor(ratio),
                    opacity: 0.80,
                    left: ratio < 1.0 ? `${50 - pct(ratio)}%` : '50%',
                    width: `${pct(ratio)}%`,
                  }}
                />
              )}
            </div>
            <span
              className="w-11 text-right font-mono text-[10px] shrink-0"
              style={{ color: barColor(ratio) }}
            >
              {ratio > 0 ? ratio.toFixed(3) : '—'}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 mt-1.5 text-right">
        center = 1.00 parity · Q5/Q1 = {spread ? spread.toFixed(3) : '—'}
      </p>
    </div>
  );
}

const PRICE_BANDS = [
  { label: '< $200k', min: 0, max: 200_000 },
  { label: '$200–$400k', min: 200_000, max: 400_000 },
  { label: '$400–$700k', min: 400_000, max: 700_000 },
  { label: '> $700k', min: 700_000, max: Infinity },
] as const;

function localCod(ratios: number[], med: number): number {
  if (ratios.length < 2 || med === 0) return 0;
  return (ratios.reduce((s, r) => s + Math.abs(r - med) / med, 0) / ratios.length) * 100;
}

function IntraStrataTable({ neighborhoodCode }: { neighborhoodCode: string }) {
  const { salePoints } = useGeoForgeStore();

  const bands = useMemo(() => {
    const hood = salePoints.filter(
      (s) =>
        s.neighborhoodCode === neighborhoodCode &&
        s.ratio > 0 &&
        s.salePrice > 0 &&
        s.qualificationDecision === 'qualified' &&
        !s.isOutlier,
    );
    return PRICE_BANDS.map(({ label, min, max }) => {
      const sales = hood.filter((s) => s.salePrice >= min && s.salePrice < max);
      if (sales.length === 0) return null;
      const ratios = sales.map((s) => s.ratio).sort((a, b) => a - b);
      const med = localMedian(ratios);
      return { label, n: sales.length, median: med, cod: localCod(ratios, med) };
    }).filter(Boolean) as { label: string; n: number; median: number; cod: number }[];
  }, [salePoints, neighborhoodCode]);

  const activeBands = bands.filter((b) => b.n >= 3);
  if (activeBands.length < 2) return null;

  return (
    <div>
      <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-1.5">Price Band Strata</h4>
      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left text-slate-600 py-0.5 font-normal">Band</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">n</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">Median</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">COD</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => {
            const lowN = b.n < 3;
            const medColor = lowN ? 'text-slate-600'
              : b.median >= 0.95 && b.median <= 1.05 ? 'text-emerald-400'
              : b.median >= 0.90 && b.median <= 1.10 ? 'text-amber-400' : 'text-red-400';
            const codColor = lowN || b.cod === 0 ? 'text-slate-600'
              : b.cod > 20 ? 'text-red-400' : b.cod > 15 ? 'text-amber-300' : 'text-slate-400';
            return (
              <tr key={b.label} className="border-b border-slate-800/40">
                <td className="py-0.5 text-slate-400 whitespace-nowrap">{b.label}</td>
                <td className={`py-0.5 text-right font-mono ${lowN ? 'text-slate-700' : 'text-slate-500'}`}>
                  {b.n}
                </td>
                <td className={`py-0.5 text-right font-mono font-semibold ${medColor}`}>
                  {lowN ? <span className="text-slate-700">low n</span> : b.median.toFixed(3)}
                </td>
                <td className={`py-0.5 text-right font-mono ${codColor}`}>
                  {lowN ? '—' : b.cod.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[8px] text-slate-700 mt-0.5">qualified non-outlier · n &lt; 3 = low confidence</p>
    </div>
  );
}

function localMedian(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function McaTimeTrend({ neighborhoodCode }: { neighborhoodCode: string }) {
  const { salePoints } = useGeoForgeStore();

  const { points, olsResult } = useMemo(() => {
    const hood = salePoints.filter(
      (s) =>
        s.neighborhoodCode === neighborhoodCode &&
        s.ratio > 0 &&
        s.saleDate &&
        !s.isOutlier &&
        s.qualificationDecision === 'qualified',
    );

    const byMonth: Record<string, number[]> = {};
    for (const s of hood) {
      const m = s.saleDate.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(s.ratio);
    }

    const sorted = Object.keys(byMonth).sort();
    const pts = sorted
      .filter((m) => byMonth[m].length >= 3)
      .map((m, i) => ({
        month: m,
        x: i,
        y: localMedian(byMonth[m]),
        n: byMonth[m].length,
      }));

    return { points: pts, olsResult: olsLine(pts) };
  }, [salePoints, neighborhoodCode]);

  if (points.length < 4) return null;

  const regLine =
    olsResult && points.length >= 2
      ? [
          { x: points[0].x, y: olsResult.slope * points[0].x + olsResult.intercept },
          {
            x: points[points.length - 1].x,
            y: olsResult.slope * points[points.length - 1].x + olsResult.intercept,
          },
        ]
      : [];

  const monthlyRate = olsResult ? olsResult.slope : null;
  const annualRate = monthlyRate !== null ? monthlyRate * 12 : null;

  const rateColor =
    monthlyRate === null
      ? 'text-slate-400'
      : Math.abs(monthlyRate) < 0.0008
        ? 'text-emerald-400'
        : monthlyRate < 0
          ? 'text-amber-400'
          : 'text-sky-400';

  const interpretation =
    monthlyRate !== null && Math.abs(monthlyRate) >= 0.0008
      ? monthlyRate < 0
        ? `Market rising ${(Math.abs(monthlyRate) * 100).toFixed(2)}%/mo faster than assessments — older sales need upward time adj`
        : `Assessments outpacing market — downward time adj indicated`
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs text-slate-500 uppercase tracking-wide">MCA Time Trend</h4>
        {monthlyRate !== null && (
          <div className="text-right leading-tight">
            <span className={`text-[10px] font-bold font-mono ${rateColor}`}>
              {monthlyRate >= 0 ? '+' : ''}
              {(monthlyRate * 100).toFixed(3)}%/mo
            </span>
            {annualRate !== null && (
              <div className={`text-[8px] font-mono ${rateColor}`}>
                {annualRate >= 0 ? '+' : ''}
                {(annualRate * 100).toFixed(1)}%/yr
              </div>
            )}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <ComposedChart margin={{ top: 4, right: 8, bottom: 4, left: -14 }}>
          <XAxis
            dataKey="x"
            type="number"
            domain={[points[0].x - 0.5, points[points.length - 1].x + 0.5]}
            tick={{ fontSize: 7, fill: '#64748b' }}
            tickFormatter={(v: number) => {
              const pt = points[Math.round(v)];
              return pt ? pt.month.slice(2) : '';
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0.80, 1.20]}
            tick={{ fontSize: 8, fill: '#64748b' }}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{ background: '#0A0E1A', border: '1px solid #334155', fontSize: 10, borderRadius: 6 }}
            formatter={(v: number, name: string) =>
              name === 'y' ? [v.toFixed(3), 'Median Ratio'] : [String(v), name]
            }
            labelFormatter={(v: number) => {
              const pt = points[Math.round(v as number)];
              return pt ? `${pt.month} (n=${pt.n})` : '';
            }}
          />
          <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
          <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
          {olsResult && (
            <Line
              data={regLine}
              dataKey="y"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              strokeDasharray="6 3"
            />
          )}
          <Scatter data={points} fill="#00FFFF" opacity={0.85} r={3} />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 text-[8px] text-slate-600 mt-0.5">
        <span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-terra-cyan/70 mr-0.5 -mb-px" />
          Monthly median ratio
        </span>
        <span>
          <span className="inline-block w-3 h-px bg-amber-400 mr-0.5 mb-0.5" />
          OLS trend
        </span>
      </div>
      {interpretation && (
        <p className="text-[9px] text-slate-500 mt-1 leading-snug">{interpretation}</p>
      )}
    </div>
  );
}

function PeerComparison({ ns }: { ns: import('../types/geoforge.types').NeighborhoodStat }) {
  const { neighborhoodStats, selectNeighborhood } = useGeoForgeStore();

  const peers = useMemo(() => {
    const { medianRatio, cod, prd } = ns.stats;
    return neighborhoodStats
      .filter(n => n.neighborhoodCode !== ns.neighborhoodCode && n.saleCount >= 3)
      .map(n => ({
        ns: n,
        score:
          Math.abs(n.stats.medianRatio - medianRatio) * 6
          + Math.abs(n.stats.cod - cod) * 0.25
          + Math.abs(n.stats.prd - prd) * 8,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [ns, neighborhoodStats]);

  if (peers.length === 0) return null;

  return (
    <div>
      <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Peer Comparison</h4>
      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left text-slate-600 py-0.5 font-normal">Nbhd</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">MED</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">COD</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">Δ</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">n</th>
          </tr>
        </thead>
        <tbody>
          {peers.map(({ ns: p }) => {
            const delta = p.stats.medianRatio - ns.stats.medianRatio;
            const medColor = p.stats.medianRatio >= 0.95 && p.stats.medianRatio <= 1.05 ? 'text-emerald-400'
              : p.stats.medianRatio >= 0.90 && p.stats.medianRatio <= 1.10 ? 'text-amber-400' : 'text-red-400';
            return (
              <tr
                key={p.neighborhoodCode}
                className="border-b border-slate-800/60 cursor-pointer hover:bg-slate-800/40 transition-colors"
                onClick={() => selectNeighborhood(p.neighborhoodCode)}
              >
                <td className="py-1 text-terra-cyan font-mono">{p.neighborhoodCode}</td>
                <td className={`py-1 text-right font-mono ${medColor}`}>{p.stats.medianRatio.toFixed(3)}</td>
                <td className={`py-1 text-right font-mono ${p.stats.cod > 20 ? 'text-red-400' : p.stats.cod > 15 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {p.stats.cod.toFixed(1)}
                </td>
                <td className={`py-1 text-right font-mono ${delta >= 0 ? 'text-amber-400' : 'text-sky-400'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
                </td>
                <td className="py-1 text-right text-slate-500">{p.saleCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function NeighborhoodDetailPanel() {
  const { selectedNeighborhoodCode, neighborhoodStats, openDrawer } = useGeoForgeStore();
  const ns = neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode);

  if (!ns) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a neighborhood on the map.
      </div>
    );
  }

  const { stats } = ns;

  const srtIndex = stats.q1Ratio > 0 && stats.q5Ratio > 0 ? stats.q1Ratio / stats.q5Ratio : null;
  const srtBandVal: 'ok' | 'watch' | 'critical' | undefined = srtIndex === null ? undefined
    : srtIndex >= 0.95 && srtIndex <= 1.05 ? 'ok'
    : srtIndex >= 0.90 && srtIndex <= 1.10 ? 'watch'
    : 'critical';

  type StatRow = { label: string; value: string; band?: 'ok' | 'watch' | 'critical' };
  const rows: StatRow[] = [
    { label: 'Qualified Sales', value: String(stats.count) },
    { label: 'Median Ratio', value: stats.medianRatio.toFixed(3) },
    { label: 'COD', value: stats.cod.toFixed(1), band: codBand(stats.cod) },
    { label: 'PRD', value: stats.prd.toFixed(3), band: prdBand(stats.prd) },
    { label: 'PRB', value: stats.prb.toFixed(3), band: prbBand(stats.prb) },
    { label: 'VEI', value: stats.vei.toFixed(3) },
    { label: 'Mean Ratio', value: stats.mean.toFixed(3) },
    { label: 'Weighted Mean', value: stats.weightedMean.toFixed(3) },
    { label: 'Min', value: stats.min.toFixed(3) },
    { label: 'Max', value: stats.max.toFixed(3) },
    { label: 'Std Dev', value: stats.stdDev.toFixed(3) },
    { label: 'CV', value: (stats.cv * 100).toFixed(1) + '%' },
    ...(srtIndex !== null ? [{ label: 'SRT (Q1/Q5)', value: srtIndex.toFixed(3), band: srtBandVal }] : []),
  ];

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div>
        <h3 className="text-terra-cyan font-semibold text-sm leading-tight">
          {ns.neighborhoodCode}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ns.saleCount} qualified sales
        </p>
      </div>

      <EquityNarrative ns={ns} />

      <NeighborhoodYearSparkline neighborhoodCode={ns.neighborhoodCode} />

      <EquitySignatureRadar stats={stats} label="Equity Signature" />

      <QuintileChart stats={stats} />

      <IntraStrataTable neighborhoodCode={ns.neighborhoodCode} />

      <RegressivityScatter neighborhoodCode={ns.neighborhoodCode} />

      <McaTimeTrend neighborhoodCode={ns.neighborhoodCode} />

      <table className="w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-800">
              <td className="py-1.5 text-muted-foreground pr-3">{r.label}</td>
              <td className="py-1.5 text-right">
                {r.band ? (
                  <Badge className={`${BAND_COLORS[r.band]} text-xs font-mono`}>
                    {r.value}
                  </Badge>
                ) : (
                  <span className="text-white font-mono">{r.value}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PeerComparison ns={ns} />

      <div className="flex gap-2 flex-wrap pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('sales-drilldown')}
        >
          View Sales
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('diagnosis')}
        >
          AI Diagnose
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => openDrawer('year-trend')}
        >
          5-Yr Trend
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 border border-amber-700/50 ml-auto"
          variant="outline"
          onClick={() => openDrawer('workbench')}
        >
          Adjust →
        </Button>
      </div>
    </div>
  );
}
