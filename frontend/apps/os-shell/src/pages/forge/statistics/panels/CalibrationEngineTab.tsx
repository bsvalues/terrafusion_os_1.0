/**
 * CalibrationEngineTab.tsx
 *
 * Calibration engine analytics for mass appraisal.
 * Surfaces: Hedonic Regression vs Cost Schedule (planned), Cross-Validation (planned).
 * Shows planned-state UI with data requirement notes.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';

const TAX_YEAR = 2026;

interface HedonicResponse {
  taxYear: number; propertyType: string | null;
  status: string; note: string;
  coefficients: { feature: string; coefficient: number; pValue: number }[];
}
interface CrossValResponse { taxYear: number; status: string; note: string }

export function CalibrationEngineTab() {
  const hedonicQuery = useQuery<HedonicResponse>({
    queryKey: ['hedonic-regression', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/hedonic-regression?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  const cvQuery = useQuery<CrossValResponse>({
    queryKey: ['cross-validation', TAX_YEAR],
    queryFn: () => apiFetch(`/terraforge/ratio-study/cross-validation?taxYear=${TAX_YEAR}`).then(r => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  const isPlanned = hedonicQuery.data?.status === 'planned';

  return (
    <div className="space-y-6 p-4">

      {/* ── Hedonic Regression ── */}
      <Card data-material="bento" className={isPlanned ? 'opacity-70' : undefined}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Hedonic Regression vs Cost Schedule
            {isPlanned && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Planned P2
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hedonicQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : hedonicQuery.data?.status === 'planned' ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground italic">{hedonicQuery.data.note}</p>
              <div className="rounded border border-border/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">When implemented, this surface will show:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>OLS coefficients for GLA, Year Built, quality grade, neighborhood</li>
                  <li>Comparison: hedonic-predicted value vs cost-schedule value per parcel</li>
                  <li>R² goodness-of-fit and coefficient p-values</li>
                  <li>Feature importance ranking for calibration adjustment</li>
                </ul>
              </div>
            </div>
          ) : hedonicQuery.data?.coefficients?.length ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1 pr-4">Feature</th>
                  <th className="text-right py-1 pr-4">Coefficient</th>
                  <th className="text-right py-1">p-value</th>
                </tr>
              </thead>
              <tbody>
                {hedonicQuery.data.coefficients.map((c) => (
                  <tr key={c.feature} className="border-b border-border/40">
                    <td className="py-1 pr-4">{c.feature}</td>
                    <td className="py-1 pr-4 text-right font-mono">{c.coefficient.toFixed(4)}</td>
                    <td className={`py-1 text-right font-mono ${c.pValue < 0.05 ? 'text-green-500' : 'text-amber-500'}`}>
                      {c.pValue.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Cross-Validation ── */}
      <Card data-material="bento" className="opacity-70">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            5-Fold Cross-Validation
            <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Planned P2
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cvQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {cvQuery.data?.note ?? '5-fold cross-validation on hedonic model. Depends on hedonic-regression endpoint. Planned P2.'}
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
