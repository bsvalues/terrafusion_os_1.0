/**
 * ValueDriverPanel.tsx
 *
 * Feature-level ratio attribution — shows which physical improvement features
 * (basement, pool, garage, etc.) are pulling Benton County ratios above or below
 * the county median. Calibration signal for cost schedule adjustments.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';

interface DriverFeature {
  featureCode: string;
  featureLabel: string;
  saleCount: number;
  medianRatio: number | null;
  deviationFromCountyMedian: number | null;
  signal: 'under' | 'over' | 'ok' | 'insufficient';
}

interface DriverResponse {
  taxYear: number;
  countyMedianRatio: number;
  countyQualifiedSaleCount: number;
  features: DriverFeature[];
}

function SignalBadge({ signal }: { signal: DriverFeature['signal'] }) {
  const map: Record<DriverFeature['signal'], { label: string; className: string }> = {
    under: { label: '↑ Under-scheduled', className: 'text-amber-500 font-semibold' },
    over:  { label: '↓ Over-scheduled',  className: 'text-red-500 font-semibold' },
    ok:    { label: 'OK',                 className: 'text-green-500' },
    insufficient: { label: 'Insuff.', className: 'text-muted-foreground text-xs' },
  };
  const { label, className } = map[signal];
  return <span className={className}>{label}</span>;
}

export function ValueDriverPanel() {
  const [threshold, setThreshold] = useState(0.04);
  const [taxYear] = useState(2026);

  const { data, isLoading, error } = useQuery<DriverResponse>({
    queryKey: ['ratio-study-driver-analysis', taxYear],
    queryFn: () =>
      apiFetch(`/terraforge/ratio-study/driver-analysis?taxYear=${taxYear}`).then((r) => r.json()),
    staleTime: 10 * 60_000,
  });

  // Re-apply signal logic client-side based on user threshold
  const features = (data?.features ?? []).map((f) => ({
    ...f,
    signal:
      f.saleCount < 5 || f.deviationFromCountyMedian == null
        ? ('insufficient' as const)
        : Math.abs(f.deviationFromCountyMedian) <= threshold
        ? ('ok' as const)
        : f.deviationFromCountyMedian > 0
        ? ('under' as const)
        : ('over' as const),
  }));

  return (
    <Card data-material="bento" data-testid="value-driver-panel">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Value Driver Attribution</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Ratio deviation by physical feature — calibration signals for cost schedule
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="driver-threshold" className="text-muted-foreground">
              Signal threshold:
            </label>
            <input
              id="driver-threshold"
              type="number"
              min={0.01}
              max={0.15}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.04)}
              className="w-20 rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading driver analysis…</div>
        )}
        {error && (
          <div className="py-8 text-center text-red-500">
            Failed to load driver analysis.
          </div>
        )}
        {data && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              County median ratio: <strong>{data.countyMedianRatio.toFixed(4)}</strong> ·{' '}
              {data.countyQualifiedSaleCount.toLocaleString()} qualified sales ·
              Signal triggers at |deviation| &gt; {threshold.toFixed(2)}
            </p>
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-semibold">Feature</th>
                  <th className="py-2 pr-4 text-right font-semibold">N (sales)</th>
                  <th className="py-2 pr-4 text-right font-semibold">Median Ratio</th>
                  <th className="py-2 pr-4 text-right font-semibold">Deviation</th>
                  <th className="py-2 font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.featureCode} className="border-b hover:bg-white/5">
                    <td className="py-2 pr-4 font-medium">{f.featureLabel}</td>
                    <td className="py-2 pr-4 text-right">{f.saleCount}</td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {f.medianRatio != null ? f.medianRatio.toFixed(4) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {f.deviationFromCountyMedian != null
                        ? (f.deviationFromCountyMedian >= 0 ? '+' : '') +
                          f.deviationFromCountyMedian.toFixed(4)
                        : '—'}
                    </td>
                    <td className="py-2">
                      <SignalBadge signal={f.signal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong>↑ Under-scheduled:</strong> Feature-present parcels assessed below market —
                cost schedule for this feature may be set too low.
              </p>
              <p>
                <strong>↓ Over-scheduled:</strong> Feature-present parcels assessed above market —
                cost schedule may be set too high.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
