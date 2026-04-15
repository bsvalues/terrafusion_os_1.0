/**
 * DiagnosticsTab.tsx
 *
 * Advanced diagnostics for credentialed mass appraisal staff.
 * Surfaces: Confidence Intervals (bootstrap), Vertical Equity by Decile,
 * Cook's D Influence Diagnostics, Variance Decomposition (planned), Sale Chasing (planned).
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ConfidenceIntervalBadge } from '../components/ConfidenceIntervalBadge';

const TAX_YEAR = 2026;

// ── Types ────────────────────────────────────────────────────────────────────

interface CIValue { point: number; lo: number; hi: number }
interface CIResponse {
  taxYear: number; sampleSize: number;
  median: CIValue; cod: CIValue; prd: CIValue; prb: CIValue;
  error?: string;
}

interface DecileRow {
  decile: number; minSalePrice: number; maxSalePrice: number;
  saleCount: number; medianRatio: number; deviationFromCountyMedian: number;
}
interface VerticalEquityResponse {
  taxYear: number; sampleSize: number; countyMedianRatio: number;
  deciles: DecileRow[]; interpretation: string; error?: string;
}

interface InfluenceItem {
  saleId: string; parcelId: string; address: string | null;
  salePrice: number; ratio: number; cookD: number; isInfluential: boolean;
}
interface InfluenceResponse {
  taxYear: number; sampleSize: number; threshold: number;
  influentialCount: number; items: InfluenceItem[]; error?: string;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function DiagnosticsTab() {
  const ciQuery = useQuery<CIResponse>({
    queryKey: ['ratio-ci', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/confidence-intervals?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const veQuery = useQuery<VerticalEquityResponse>({
    queryKey: ['vertical-equity', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/vertical-equity?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const infQuery = useQuery<InfluenceResponse>({
    queryKey: ['influence-diagnostics', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/influence-diagnostics?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-6 p-4">

      {/* ── Section 1: Bootstrap Confidence Intervals ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Bootstrap 95% Confidence Intervals
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({ciQuery.data?.sampleSize?.toLocaleString() ?? '…'} qualified sales · 1,000 resamples)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ciQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Computing intervals…</p>
          ) : ciQuery.data?.error ? (
            <p className="text-amber-500 text-sm">{ciQuery.data.error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Median Ratio', key: 'median' as const, decimals: 4 },
                { label: 'COD', key: 'cod' as const, decimals: 2, suffix: '%' },
                { label: 'PRD', key: 'prd' as const, decimals: 4 },
                { label: 'PRB', key: 'prb' as const, decimals: 4 },
              ].map(({ label, key, decimals, suffix }) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
                  <ConfidenceIntervalBadge
                    value={ciQuery.data?.[key]}
                    decimals={decimals}
                    suffix={suffix}
                    loading={ciQuery.isLoading}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Vertical Equity by Value Decile ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Vertical Equity by Sale Price Decile
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              IAAO Standard 5 §6.3 — County median: {veQuery.data?.countyMedianRatio?.toFixed(4) ?? '…'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {veQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading decile data…</p>
          ) : veQuery.data?.error ? (
            <p className="text-amber-500 text-sm">{veQuery.data.error}</p>
          ) : veQuery.data?.deciles ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={veQuery.data.deciles} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="decile" label={{ value: 'Decile (low→high value)', position: 'insideBottom', offset: -2, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => v.toFixed(2)} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(4), 'Median Ratio']}
                    labelFormatter={(label: number) => `Decile ${label}`}
                  />
                  <ReferenceLine y={veQuery.data.countyMedianRatio} stroke="var(--forge-info)" strokeDasharray="4 4" label={{ value: 'County Median', fontSize: 10 }} />
                  <Bar dataKey="medianRatio" fill="var(--forge-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {veQuery.data.interpretation && (
                <p className="mt-2 text-xs text-muted-foreground italic">{veQuery.data.interpretation}</p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Section 3: Cook's D Influence Diagnostics ── */}
      <Card data-material="bento">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Influential Sales — Cook&apos;s Distance
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {infQuery.data
                ? `${infQuery.data.influentialCount} influential of ${infQuery.data.sampleSize.toLocaleString()} (threshold 4/n = ${infQuery.data.threshold?.toFixed(4)})`
                : '…'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {infQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Computing Cook&apos;s D…</p>
          ) : infQuery.data?.error ? (
            <p className="text-amber-500 text-sm">{infQuery.data.error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1 pr-3">Parcel</th>
                    <th className="text-left py-1 pr-3">Address</th>
                    <th className="text-right py-1 pr-3">Sale Price</th>
                    <th className="text-right py-1 pr-3">Ratio</th>
                    <th className="text-right py-1 pr-3">Cook&apos;s D</th>
                    <th className="text-center py-1">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {infQuery.data?.items.slice(0, 20).map((item) => (
                    <tr key={item.saleId} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="py-1 pr-3 font-mono">{item.parcelId}</td>
                      <td className="py-1 pr-3 text-muted-foreground">{item.address ?? '—'}</td>
                      <td className="py-1 pr-3 text-right">${item.salePrice.toLocaleString()}</td>
                      <td className="py-1 pr-3 text-right font-mono">{item.ratio.toFixed(4)}</td>
                      <td className="py-1 pr-3 text-right font-mono">{item.cookD.toFixed(4)}</td>
                      <td className="py-1 text-center">
                        {item.isInfluential ? (
                          <span className="text-amber-500 font-bold" title="Influential — review this sale">⚠</span>
                        ) : (
                          <span className="text-green-500">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(infQuery.data?.items?.length ?? 0) > 20 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing top 20 of {infQuery.data!.items.length} by influence score
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Planned sections ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Variance Decomposition', note: 'Hierarchical mixed-effects model. Requires neighborhood grouping variable. Planned P2.' },
          { title: 'Sale Chasing Detection', note: 'ΔR² test requires pre-sale and post-sale assessed values for same parcel. Planned P2.' },
        ].map(({ title, note }) => (
          <Card key={title} data-material="bento" className="opacity-60">
            <CardHeader><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
