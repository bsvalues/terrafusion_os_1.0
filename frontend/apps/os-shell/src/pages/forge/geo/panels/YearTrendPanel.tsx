import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { NeighborhoodStat, MonthlyTrendPoint } from '../types/geoforge.types';

interface McaResult {
  monthlyRatioSlope: number;
  monthlyApprecPct: number;
  annualApprecPct: number;
  r2: number;
  factors: { months: number; factor: number }[];
}

function computeMCA(pts: MonthlyTrendPoint[]): McaResult | null {
  const valid = pts.filter(p => p.medianRatio > 0 && p.n >= 3);
  if (valid.length < 6) return null;

  const n = valid.length;
  const meanX = (n - 1) / 2;
  const meanY = valid.reduce((s, p) => s + p.medianRatio, 0) / n;

  let numr = 0, denr = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    numr += (i - meanX) * (valid[i].medianRatio - meanY);
    denr += (i - meanX) ** 2;
    ssTot += (valid[i].medianRatio - meanY) ** 2;
  }

  const slope = denr > 0 ? numr / denr : 0;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (valid[i].medianRatio - (intercept + slope * i)) ** 2;
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  // slope < 0 → ratio falling → market appreciating
  const monthlyApprecPct = -slope * 100;

  return {
    monthlyRatioSlope: slope,
    monthlyApprecPct,
    annualApprecPct: monthlyApprecPct * 12,
    r2,
    factors: [3, 6, 12, 18, 24].map(months => ({
      months,
      factor: parseFloat((1 + (-slope) * months).toFixed(4)),
    })),
  };
}

interface YearPoint {
  taxYear: number;
  medianRatio: number;
  cod: number;
  prd: number;
  saleCount: number;
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-');
  const abbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${abbr[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

export function YearTrendPanel() {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const { selectedNeighborhoodCode, filter, selectedMonth, setSelectedMonth } = useGeoForgeStore();
  const currentYear = filter.taxYear;
  const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  // Annual queries
  const annualResults = useQueries({
    queries: years.map((yr) => ({
      queryKey: ['geoforge-nbhd-stats', yr, 'all'],
      queryFn: () => apiFetchJson<NeighborhoodStat[]>(
        `/api/geoforge/ratio-study/neighborhood-stats?taxYear=${yr}`
      ),
      enabled: !!selectedNeighborhoodCode && view === 'annual',
      staleTime: 1000 * 60 * 10,
    })),
  });

  // Monthly query
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery<MonthlyTrendPoint[]>({
    queryKey: ['geoforge-monthly-trend', filter.taxYear, selectedNeighborhoodCode],
    queryFn: () => {
      const params = new URLSearchParams({ taxYear: String(filter.taxYear) });
      if (selectedNeighborhoodCode) params.set('neighborhoodCode', selectedNeighborhoodCode);
      return apiFetchJson<MonthlyTrendPoint[]>(`/api/geoforge/ratio-study/monthly-trend?${params}`);
    },
    enabled: !!selectedNeighborhoodCode && view === 'monthly',
    staleTime: 1000 * 60 * 5,
  });

  if (!selectedNeighborhoodCode) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a neighborhood to see trend analysis.
      </div>
    );
  }

  const annualPoints: YearPoint[] = years
    .map((yr, i) => {
      const ns = annualResults[i].data?.find(n => n.neighborhoodCode === selectedNeighborhoodCode);
      return { taxYear: yr, medianRatio: ns?.stats.medianRatio ?? 0, cod: ns?.stats.cod ?? 0, prd: ns?.stats.prd ?? 0, saleCount: ns?.saleCount ?? 0 };
    })
    .filter(p => p.medianRatio > 0);

  const anyAnnualLoading = annualResults.some(r => r.isLoading);

  const tooltipStyle = {
    contentStyle: { background: '#0A0E1A', border: '1px solid #334155', fontSize: 11, borderRadius: 6 },
  };

  return (
    <div className="flex flex-col gap-1 p-4 overflow-y-auto h-full">
      {/* Tab toggle */}
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide">
          {selectedNeighborhoodCode}
        </h4>
        <div className="flex gap-0 rounded overflow-hidden border border-slate-700 text-[10px]">
          {(['monthly', 'annual'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 ${view === v ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {v === 'monthly' ? '30-Month' : '5-Year'}
            </button>
          ))}
        </div>
      </div>

      {view === 'monthly' ? (
        <>
          {/* Monthly median ratio — click to filter map */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-slate-400 font-medium">Median Ratio — click month to filter map</p>
              {selectedMonth && (
                <button
                  className="text-[9px] text-amber-400 hover:text-amber-200"
                  onClick={() => setSelectedMonth(null)}
                >
                  ✕ {selectedMonth}
                </button>
              )}
            </div>
            {monthlyLoading ? (
              <div className="text-xs text-slate-500 animate-pulse py-4 text-center">Computing…</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 4, right: 8, bottom: 4, left: -10 }}
                  onClick={(e) => {
                    const ym = e?.activePayload?.[0]?.payload?.yearMonth;
                    if (ym) setSelectedMonth(selectedMonth === ym ? null : ym);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <defs>
                    <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="yearMonth"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={fmtMonth}
                    interval={5}
                  />
                  <YAxis
                    domain={[0.80, 1.20]}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: number) => [v.toFixed(3), 'Median Ratio']}
                    labelFormatter={fmtMonth}
                  />
                  {/* Parity & IAAO bands */}
                  <ReferenceArea y1={0.95} y2={1.05} fill="#22c55e" fillOpacity={0.06} />
                  <ReferenceArea y1={0.90} y2={0.95} fill="#eab308" fillOpacity={0.05} />
                  <ReferenceArea y1={1.05} y2={1.10} fill="#eab308" fillOpacity={0.05} />
                  <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
                  {/* Highlight selected month */}
                  {selectedMonth && (
                    <ReferenceLine
                      x={selectedMonth}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}
                  <Area
                    dataKey="medianRatio"
                    stroke="#00FFFF"
                    strokeWidth={2}
                    fill="url(#ratioGrad)"
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const isSelected = payload.yearMonth === selectedMonth;
                      return (
                        <circle
                          key={payload.yearMonth}
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 5 : 2.5}
                          fill={isSelected ? '#f59e0b' : '#00FFFF'}
                          stroke="none"
                        />
                      );
                    }}
                    activeDot={{ r: 5, fill: '#f59e0b' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly COD */}
          {monthlyData.some(p => p.cod !== null) && (
            <div>
              <p className="text-[11px] text-slate-400 mb-1 font-medium">COD</p>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={monthlyData} margin={{ top: 2, right: 8, bottom: 2, left: -10 }}>
                  <defs>
                    <linearGradient id="codGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="yearMonth" tick={{ fontSize: 8, fill: '#64748b' }} tickFormatter={fmtMonth} interval={5} />
                  <YAxis tick={{ fontSize: 8, fill: '#64748b' }} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v?.toFixed(1) ?? '—', 'COD']} labelFormatter={fmtMonth} />
                  <ReferenceLine y={15} stroke="#eab308" strokeDasharray="4 4" />
                  <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" />
                  <Area dataKey="cod" stroke="#f97316" strokeWidth={1.5} fill="url(#codGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* n per month — spark bar */}
          <div>
            <p className="text-[11px] text-slate-400 mb-1 font-medium">Sales / Month</p>
            <div className="flex items-end gap-px h-8">
              {monthlyData.map((p) => {
                const maxN = Math.max(...monthlyData.map(d => d.n), 1);
                const h = Math.max(2, Math.round((p.n / maxN) * 32));
                const isSelected = p.yearMonth === selectedMonth;
                return (
                  <div
                    key={p.yearMonth}
                    title={`${fmtMonth(p.yearMonth)}: n=${p.n}`}
                    style={{ height: h }}
                    className={`flex-1 rounded-[1px] cursor-pointer ${isSelected ? 'bg-amber-400' : 'bg-slate-700 hover:bg-slate-500'}`}
                    onClick={() => setSelectedMonth(selectedMonth === p.yearMonth ? null : p.yearMonth)}
                  />
                );
              })}
            </div>
          </div>

          {/* Market Condition Adjustment Calculator */}
          {(() => {
            const mca = computeMCA(monthlyData);
            if (!mca) return null;
            const trending = mca.monthlyApprecPct > 0.1 ? 'appreciating'
              : mca.monthlyApprecPct < -0.1 ? 'declining' : 'stable';
            const trendColor = trending === 'appreciating' ? 'text-emerald-400'
              : trending === 'declining' ? 'text-red-400' : 'text-slate-400';
            return (
              <div className="mt-1 rounded border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Market Condition Adjustment
                  </p>
                  <span className={`text-[9px] font-bold uppercase ${trendColor}`}>
                    {trending}
                  </span>
                </div>

                <div className="flex gap-3 mb-2.5 text-[9px]">
                  <div>
                    <span className="text-slate-600">Monthly</span>
                    <div className={`font-mono font-bold text-[11px] ${trendColor}`}>
                      {mca.monthlyApprecPct >= 0 ? '+' : ''}{mca.monthlyApprecPct.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600">Annual</span>
                    <div className={`font-mono font-bold text-[11px] ${trendColor}`}>
                      {mca.annualApprecPct >= 0 ? '+' : ''}{mca.annualApprecPct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600">R²</span>
                    <div className={`font-mono text-[11px] ${mca.r2 >= 0.5 ? 'text-slate-300' : 'text-slate-600'}`}>
                      {mca.r2.toFixed(2)}
                    </div>
                  </div>
                </div>

                <p className="text-[8px] text-slate-600 mb-1.5">
                  Time-adjustment factors — multiply old sale price by:
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {mca.factors.map(({ months, factor }) => {
                    const devFromParity = Math.abs(factor - 1);
                    const fColor = devFromParity < 0.02 ? 'text-slate-400'
                      : factor > 1 ? 'text-emerald-400' : 'text-red-400';
                    return (
                      <div key={months} className="text-center bg-slate-800/60 rounded py-1 px-0.5">
                        <div className="text-[7px] text-slate-600">{months}mo</div>
                        <div className={`text-[10px] font-mono font-bold ${fColor}`}>
                          {factor.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {mca.r2 < 0.25 && (
                  <p className="text-[8px] text-slate-700 mt-1.5">
                    ⚠ Low R² — trend not reliable with current data
                  </p>
                )}
              </div>
            );
          })()}
        </>
      ) : (
        /* Annual view */
        <>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] text-slate-400 font-medium">Median Ratio</p>
            {anyAnnualLoading && <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={annualPoints} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0.75, 1.25]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toFixed(3), 'Median Ratio']} />
              <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
              <Line dataKey="medianRatio" stroke="#00FFFF" dot={{ r: 3, fill: '#00FFFF' }} strokeWidth={2} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-[11px] text-slate-400 mb-1 font-medium">COD</p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={annualPoints} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toFixed(1), 'COD']} />
              <ReferenceLine y={15} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'IAAO 15', fill: '#eab308', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" />
              <Line dataKey="cod" stroke="#f97316" dot={{ r: 3, fill: '#f97316' }} strokeWidth={2} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>

          <p className="text-[11px] text-slate-400 mb-1 font-medium">PRD</p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={annualPoints} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
              <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[0.92, 1.08]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toFixed(3), 'PRD']} />
              <ReferenceLine y={0.98} stroke="#22c55e" strokeDasharray="4 4" />
              <ReferenceLine y={1.03} stroke="#22c55e" strokeDasharray="4 4" />
              <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="2 2" />
              <Line dataKey="prd" stroke="#a855f7" dot={{ r: 3, fill: '#a855f7' }} strokeWidth={2} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>

          {annualPoints.length === 0 && !anyAnnualLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">No data for this neighborhood.</p>
          )}
        </>
      )}
    </div>
  );
}
