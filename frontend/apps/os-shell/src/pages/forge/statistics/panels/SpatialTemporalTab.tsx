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
  taxYear: number;
  sampleSize: number;
  sampleWithCoords: number;
  kNeighbors: number;
  moransI: number;
  expectedI: number;
  variance: number;
  zScore: number;
  pValue: number;
  significantClustering: boolean;
  interpretation: string;
  // graceful fallback if backend returns planned state:
  status?: string;
  note?: string;
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

      {/* ── Moran's I Spatial Autocorrelation ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Spatial Autocorrelation — Moran&apos;s I
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {spatialQuery.data?.sampleWithCoords != null
                ? `${spatialQuery.data.sampleWithCoords.toLocaleString()} of ${spatialQuery.data.sampleSize.toLocaleString()} sales geocoded · k=${spatialQuery.data.kNeighbors} neighbors`
                : '…'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {spatialQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Computing Moran&apos;s I…</p>
          ) : spatialQuery.data?.status === 'planned' ? (
            <p className="text-xs text-muted-foreground italic">{spatialQuery.data.note ?? 'Planned — requires geocoded parcel centroids.'}</p>
          ) : spatialQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Moran&apos;s I</div>
                  <div className="font-mono font-semibold">{spatialQuery.data.moransI.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Expected I</div>
                  <div className="font-mono">{spatialQuery.data.expectedI.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">z-score</div>
                  <div className="font-mono">{spatialQuery.data.zScore.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">p-value</div>
                  <div className="font-mono">{spatialQuery.data.pValue < 0.001 ? '<0.001' : spatialQuery.data.pValue.toFixed(4)}</div>
                </div>
              </div>
              <div className={`text-sm rounded px-3 py-2 ${spatialQuery.data.significantClustering ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}>
                {spatialQuery.data.significantClustering ? '⚠ ' : '✓ '}{spatialQuery.data.interpretation}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
