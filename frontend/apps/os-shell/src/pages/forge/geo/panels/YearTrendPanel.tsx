import { useQueries } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { NeighborhoodStat } from '../types/geoforge.types';

interface YearPoint {
  taxYear: number;
  medianRatio: number;
  cod: number;
  prd: number;
  saleCount: number;
}

export function YearTrendPanel() {
  const { selectedNeighborhoodCode, filter } = useGeoForgeStore();
  const currentYear = filter.taxYear;
  const years = [
    currentYear - 4,
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ];

  const results = useQueries({
    queries: years.map((yr) => ({
      queryKey: ['geoforge-nbhd-stats', yr, 'all'],
      queryFn: () =>
        apiFetchJson<NeighborhoodStat[]>(
          `/api/geoforge/ratio-study/neighborhood-stats?taxYear=${yr}`
        ),
      enabled: !!selectedNeighborhoodCode,
      staleTime: 1000 * 60 * 10,
    })),
  });

  if (!selectedNeighborhoodCode) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a neighborhood to see 5-year trend.
      </div>
    );
  }

  const points: YearPoint[] = years
    .map((yr, i) => {
      const ns = results[i].data?.find(
        (n) => n.neighborhoodCode === selectedNeighborhoodCode
      );
      return {
        taxYear: yr,
        medianRatio: ns?.stats.medianRatio ?? 0,
        cod: ns?.stats.cod ?? 0,
        prd: ns?.stats.prd ?? 0,
        saleCount: ns?.saleCount ?? 0,
      };
    })
    .filter((p) => p.medianRatio > 0);

  const anyLoading = results.some((r) => r.isLoading);

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide">
          5-Year Trend — {selectedNeighborhoodCode}
        </h4>
        {anyLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
        )}
      </div>

      <div>
        <p className="text-[11px] text-slate-400 mb-1 font-medium">Median Ratio</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
            <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis
              domain={[0.75, 1.25]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: '#0A0E1A',
                border: '1px solid #334155',
                fontSize: 11,
                borderRadius: 6,
              }}
              formatter={(v: number) => [v.toFixed(3), 'Median Ratio']}
            />
            <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="4 4" />
            <Line
              dataKey="medianRatio"
              stroke="#00FFFF"
              dot={{ r: 3, fill: '#00FFFF' }}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-[11px] text-slate-400 mb-1 font-medium">COD</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
            <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                background: '#0A0E1A',
                border: '1px solid #334155',
                fontSize: 11,
                borderRadius: 6,
              }}
              formatter={(v: number) => [v.toFixed(1), 'COD']}
            />
            <ReferenceLine
              y={15}
              stroke="#eab308"
              strokeDasharray="4 4"
              label={{ value: 'IAAO 15', fill: '#eab308', fontSize: 9, position: 'insideTopRight' }}
            />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" />
            <Line
              dataKey="cod"
              stroke="#f97316"
              dot={{ r: 3, fill: '#f97316' }}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-[11px] text-slate-400 mb-1 font-medium">PRD</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
            <XAxis dataKey="taxYear" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis
              domain={[0.92, 1.08]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: '#0A0E1A',
                border: '1px solid #334155',
                fontSize: 11,
                borderRadius: 6,
              }}
              formatter={(v: number) => [v.toFixed(3), 'PRD']}
            />
            <ReferenceLine y={0.98} stroke="#22c55e" strokeDasharray="4 4" />
            <ReferenceLine y={1.03} stroke="#22c55e" strokeDasharray="4 4" />
            <ReferenceLine y={1.0} stroke="#334155" strokeDasharray="2 2" />
            <Line
              dataKey="prd"
              stroke="#a855f7"
              dot={{ r: 3, fill: '#a855f7' }}
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {points.length === 0 && !anyLoading && (
        <p className="text-xs text-muted-foreground text-center py-4">
          No data available for this neighborhood.
        </p>
      )}
    </div>
  );
}
