/**
 * SpatialTemporalTab.tsx
 *
 * Spatial and temporal analysis for mass appraisal.
 * Surfaces: Monthly Ratio Trend (time series), Moran's I Spatial Autocorrelation (planned),
 * KS Distributional Shift Test (current vs prior year).
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const TAX_YEAR = 2026;

interface MonthlyPoint { month: string; saleCount: number; medianRatio: number }
interface TimeTrendResponse {
  taxYear: number; method: string; note: string;
  monthlyTrend: MonthlyPoint[];
}
interface SpatialResponse {
  taxYear: number; status: string; note: string;
  moransI: number | null; pValue: number | null;
}
interface KsResponse {
  currentYear: number; priorYear: number;
  currentYearCount: number; priorYearCount: number;
  ksStatistic: number; pValue: number;
  significantShift: boolean; interpretation: string;
}

export function SpatialTemporalTab() {
  const trendQuery = useQuery<TimeTrendResponse>({
    queryKey: ['time-trend', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/time-trend?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const spatialQuery = useQuery<SpatialResponse>({
    queryKey: ['spatial-autocorrelation', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/spatial-autocorrelation?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  const ksQuery = useQuery<KsResponse>({
    queryKey: ['ks-shift-test', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/ks-shift-test?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-6 p-4">

      {/* ── Monthly Ratio Trend ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Monthly Median Ratio Trend
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {trendQuery.data?.monthlyTrend?.length
                ? `${trendQuery.data.monthlyTrend.length} months`
                : '…'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading trend data…</p>
          ) : trendQuery.data?.monthlyTrend?.length ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendQuery.data.monthlyTrend} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(3)} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(4), 'Median Ratio']}
                    labelFormatter={(label: string) => label}
                  />
                  <ReferenceLine y={1.0} stroke="var(--forge-info)" strokeDasharray="4 4" label={{ value: '1.000', fontSize: 10 }} />
                  <Line type="monotone" dataKey="medianRatio" stroke="var(--forge-accent)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              {trendQuery.data.note && (
                <p className="mt-2 text-xs text-muted-foreground italic">{trendQuery.data.note}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">No monthly trend data available.</p>
          )}
        </CardContent>
      </Card>

      {/* ── KS Distributional Shift Test ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            KS Distributional Shift Test
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {ksQuery.data ? `${ksQuery.data.priorYear} → ${ksQuery.data.currentYear}` : '…'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ksQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Running KS test…</p>
          ) : ksQuery.isError ? (
            <p className="text-amber-500 text-sm">KS test unavailable.</p>
          ) : ksQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">KS Statistic</div>
                  <div className="font-mono font-semibold">{ksQuery.data.ksStatistic.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">p-value</div>
                  <div className="font-mono font-semibold">{ksQuery.data.pValue.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{ksQuery.data.currentYear} Sales</div>
                  <div className="font-mono">{ksQuery.data.currentYearCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{ksQuery.data.priorYear} Sales</div>
                  <div className="font-mono">{ksQuery.data.priorYearCount.toLocaleString()}</div>
                </div>
              </div>
              <div className={`text-sm rounded px-3 py-2 ${ksQuery.data.significantShift ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}>
                {ksQuery.data.significantShift ? '⚠ ' : '✓ '}{ksQuery.data.interpretation}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Moran's I Spatial Autocorrelation (planned) ── */}
      <Card data-material="bento" className="opacity-60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Spatial Autocorrelation — Moran&apos;s I</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground italic">
            {spatialQuery.data?.note ?? 'Requires parcel centroid lat/lon data. Planned P2.'}
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
