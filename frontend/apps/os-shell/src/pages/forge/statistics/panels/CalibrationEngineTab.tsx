/**
 * CalibrationEngineTab.tsx
 *
 * Calibration engine analytics for mass appraisal.
 * Surfaces: Hedonic Regression vs Cost Schedule, Cross-Validation (5-fold).
 * Shows live OLS coefficients and fold results when backend data is available.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/apiBase';

const TAX_YEAR = 2026;

interface HedonicCoefficient {
  feature: string;
  coefficient: number;
  stdError: number;
  tStat: number;
  pValue: number;
}
interface HedonicResponse {
  taxYear: number;
  sampleSize: number;
  rSquared: number;
  adjustedRSquared: number;
  mse: number;
  coefficients: HedonicCoefficient[];
  interpretation: string;
  status?: string;
  note?: string;
}
interface CvFold {
  fold: number;
  trainSize: number;
  testSize: number;
  rmse: number;
  rSquared: number;
}
interface CrossValResponse {
  taxYear: number;
  sampleSize: number;
  folds: number;
  meanRmse: number;
  meanRSquared: number;
  stdDevRmse: number;
  foldResults: CvFold[];
  interpretation: string;
  status?: string;
  note?: string;
}

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

  const hedonicPlanned = hedonicQuery.data?.status === 'planned';
  const hedonicLive = !hedonicPlanned && (hedonicQuery.data?.coefficients?.length ?? 0) > 0;

  const cvPlanned = cvQuery.data?.status === 'planned';
  const cvLive = !cvPlanned && (cvQuery.data?.foldResults?.length ?? 0) > 0;

  return (
    <div className="space-y-6 p-4">

      {/* ── Hedonic Regression ── */}
      <Card data-material="bento" className={hedonicPlanned ? 'opacity-70' : undefined}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Hedonic Regression vs Cost Schedule
            {hedonicPlanned && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Planned P2
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hedonicQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : hedonicPlanned ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground italic">{hedonicQuery.data?.note}</p>
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
          ) : hedonicLive && hedonicQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">R²</div>
                  <div className="font-mono font-semibold">{hedonicQuery.data.rSquared.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Adj. R²</div>
                  <div className="font-mono">{hedonicQuery.data.adjustedRSquared.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">N</div>
                  <div className="font-mono">{hedonicQuery.data.sampleSize.toLocaleString()}</div>
                </div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1 pr-4">Feature</th>
                    <th className="text-right py-1 pr-4">Coef</th>
                    <th className="text-right py-1 pr-4">SE</th>
                    <th className="text-right py-1 pr-4">t</th>
                    <th className="text-right py-1">p</th>
                  </tr>
                </thead>
                <tbody>
                  {hedonicQuery.data.coefficients.map((c) => (
                    <tr key={c.feature} className="border-b border-border/40">
                      <td className="py-1 pr-4">{c.feature}</td>
                      <td className="py-1 pr-4 text-right font-mono">{c.coefficient.toFixed(4)}</td>
                      <td className="py-1 pr-4 text-right font-mono">{c.stdError.toFixed(4)}</td>
                      <td className="py-1 pr-4 text-right font-mono">{c.tStat.toFixed(2)}</td>
                      <td className={`py-1 text-right font-mono ${c.pValue < 0.05 ? 'text-green-500' : 'text-amber-500'}`}>
                        {c.pValue < 0.001 ? '<0.001' : c.pValue.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground italic">{hedonicQuery.data.interpretation}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Cross-Validation ── */}
      <Card data-material="bento" className={cvPlanned ? 'opacity-70' : undefined}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            5-Fold Cross-Validation
            {cvPlanned && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Planned P2
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cvQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : cvPlanned ? (
            <p className="text-xs text-muted-foreground italic">
              {cvQuery.data?.note ?? '5-fold cross-validation on hedonic model. Depends on hedonic-regression endpoint. Planned P2.'}
            </p>
          ) : cvLive && cvQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Mean RMSE</div>
                  <div className="font-mono font-semibold">{cvQuery.data.meanRmse.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Mean R²</div>
                  <div className="font-mono">{cvQuery.data.meanRSquared.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">±SD RMSE</div>
                  <div className="font-mono">{cvQuery.data.stdDevRmse.toFixed(4)}</div>
                </div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1 pr-3">Fold</th>
                    <th className="text-right py-1 pr-3">Train N</th>
                    <th className="text-right py-1 pr-3">Test N</th>
                    <th className="text-right py-1 pr-3">RMSE</th>
                    <th className="text-right py-1">R²</th>
                  </tr>
                </thead>
                <tbody>
                  {cvQuery.data.foldResults.map((f) => (
                    <tr key={f.fold} className="border-b border-border/40">
                      <td className="py-1 pr-3">Fold {f.fold}</td>
                      <td className="py-1 pr-3 text-right">{f.trainSize.toLocaleString()}</td>
                      <td className="py-1 pr-3 text-right">{f.testSize.toLocaleString()}</td>
                      <td className="py-1 pr-3 text-right font-mono">{f.rmse.toFixed(4)}</td>
                      <td className="py-1 text-right font-mono">{f.rSquared.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground italic">{cvQuery.data.interpretation}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
