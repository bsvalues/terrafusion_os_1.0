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
import type { StatisticsCountyScope } from '../statisticsCountyScope';

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

interface CalibrationEngineTabProps {
  countyScope: StatisticsCountyScope;
  taxYear?: number;
}

function fmt(value: number | null | undefined, digits: number): string {
  return Number.isFinite(value) ? (value as number).toFixed(digits) : '—';
}

function fmtInt(value: number | null | undefined): string {
  return Number.isFinite(value) ? (value as number).toLocaleString() : '—';
}

export function CalibrationEngineTab({ countyScope, taxYear = TAX_YEAR }: CalibrationEngineTabProps) {
  const countyQuery = countyScope.countyId ? `&countyId=${encodeURIComponent(countyScope.countyId)}` : '';

  const hedonicQuery = useQuery<HedonicResponse>({
    queryKey: ['hedonic-regression', taxYear, countyScope.countyId],
    queryFn: () => apiFetch(`/terraforge/ratio-study/hedonic-regression?taxYear=${taxYear}${countyQuery}`, { headers: countyScope.headers }).then(r => r.json()),
    enabled: countyScope.isolated,
    staleTime: 60 * 60 * 1000,
  });

  const cvQuery = useQuery<CrossValResponse>({
    queryKey: ['cross-validation', taxYear, countyScope.countyId],
    queryFn: () => apiFetch(`/terraforge/ratio-study/cross-validation?taxYear=${taxYear}${countyQuery}`, { headers: countyScope.headers }).then(r => r.json()),
    enabled: countyScope.isolated,
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
          ) : hedonicQuery.isError ? (
            <p className="text-amber-500 text-sm">Hedonic regression is unavailable for this county study.</p>
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
                  <div className="font-mono font-semibold">{fmt(hedonicQuery.data.rSquared, 4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Adj. R²</div>
                  <div className="font-mono">{fmt(hedonicQuery.data.adjustedRSquared, 4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">N</div>
                  <div className="font-mono">{fmtInt(hedonicQuery.data.sampleSize)}</div>
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
                      <td className="py-1 pr-4 text-right font-mono">{fmt(c.coefficient, 4)}</td>
                      <td className="py-1 pr-4 text-right font-mono">{fmt(c.stdError, 4)}</td>
                      <td className="py-1 pr-4 text-right font-mono">{fmt(c.tStat, 2)}</td>
                      <td className={`py-1 text-right font-mono ${c.pValue < 0.05 ? 'text-green-500' : 'text-amber-500'}`}>
                        {Number.isFinite(c.pValue) ? c.pValue < 0.001 ? '<0.001' : fmt(c.pValue, 4) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground italic">{hedonicQuery.data.interpretation}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No hedonic model payload is available for this county study yet.
            </p>
          )}
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
          ) : cvQuery.isError ? (
            <p className="text-amber-500 text-sm">Cross-validation is unavailable for this county study.</p>
          ) : cvPlanned ? (
            <p className="text-xs text-muted-foreground italic">
              {cvQuery.data?.note ?? '5-fold cross-validation on hedonic model. Depends on hedonic-regression endpoint. Planned P2.'}
            </p>
          ) : cvLive && cvQuery.data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Mean RMSE</div>
                  <div className="font-mono font-semibold">{fmt(cvQuery.data.meanRmse, 4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Mean R²</div>
                  <div className="font-mono">{fmt(cvQuery.data.meanRSquared, 4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">±SD RMSE</div>
                  <div className="font-mono">{fmt(cvQuery.data.stdDevRmse, 4)}</div>
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
                      <td className="py-1 pr-3 text-right">{fmtInt(f.trainSize)}</td>
                      <td className="py-1 pr-3 text-right">{fmtInt(f.testSize)}</td>
                      <td className="py-1 pr-3 text-right font-mono">{fmt(f.rmse, 4)}</td>
                      <td className="py-1 text-right font-mono">{fmt(f.rSquared, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground italic">{cvQuery.data.interpretation}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No cross-validation payload is available for this county study yet.
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
