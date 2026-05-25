/**
 * CoefficientPreview.tsx
 *
 * Standalone Forge module: Coefficient Application Preview.
 * Read-only county-scoped comparison of source and candidate tax-year
 * regressions before any coefficient table publication.
 */

import React, { useCallback, useState } from 'react';
import { getToken } from '@/auth/authStorage';
import { getSession } from '@/auth/session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchJson } from '@/lib/apiBase';
import { buildCountyScopedSessionHeaders } from '@/services/countyIsolation';

// ---------------------------------------------------------------------------
// Apply-mode types & audit event emitter
// ---------------------------------------------------------------------------

type ForgeApplyMode = 'preview_only' | 'apply_pending_backend' | 'apply_executed';

interface AuditEvent {
  eventId: string;
  requestId: string;
  suite: 'forge';
  writeLane: 'forge' | 'none';
  mode: ForgeApplyMode;
  outcome: 'preview_generated' | 'apply_accepted' | 'apply_blocked' | 'apply_executed';
  timestamp: string;
}

const BACKEND_APPLY_CAPABLE = false;
const YEAR_OPTIONS = [2026, 2025, 2024] as const;
const DEFAULT_SOURCE_YEAR = 2026;
const DEFAULT_CANDIDATE_YEAR = 2025;

let _auditSeq = 0;
function emitAuditEvent(
  mode: ForgeApplyMode,
  outcome: AuditEvent['outcome'],
): AuditEvent {
  return {
    eventId: `coeff-audit-${++_auditSeq}`,
    requestId: `coeff-req-${Date.now()}`,
    suite: 'forge',
    writeLane: mode === 'preview_only' ? 'none' : 'forge',
    mode,
    outcome,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// API DTOs
// ---------------------------------------------------------------------------

interface RegressionModelDto {
  predictors: string[];
  beta: number[];
  rSquared?: number;
  rSquaredAdj?: number;
  rmse?: number;
  n?: number;
}

interface TerraForgeRegressionDto {
  taxYear: number;
  totalPool?: number;
  usedForFit?: number;
  excludedCount?: number;
  insufficientData?: boolean;
  minimumRequired?: number;
  model: RegressionModelDto | null;
}

interface ModelSummaryDto {
  label: string;
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
  sampleSize: number;
}

interface ModelComparisonDto {
  modelA: ModelSummaryDto;
  modelB: ModelSummaryDto;
  deltas: {
    cod: number;
    prd: number;
    prb: number;
    medianRatio: number;
    sampleSize: number;
  };
  improvedMetrics: string[];
  degradedMetrics: string[];
}

// ---------------------------------------------------------------------------
// Preview data
// ---------------------------------------------------------------------------

interface CoefficientDelta {
  variable: string;
  currentValue: number;
  proposedValue: number;
  delta: number;
  deltaPct: number;
}

interface ImpactMetrics {
  codDelta: number;
  prdDelta: number;
  meanRatioDelta: number;
  medianRatioDelta: number;
}

interface ImpactBucket {
  label: string;
  count: number;
  meanDollarImpact: number;
}

interface PreviewResult {
  sourceModelId: string;
  sourceModelName: string;
  candidateModelId: string;
  candidateModelName: string;
  deltas: CoefficientDelta[];
  metrics: ImpactMetrics;
  impactedParcelCount: number;
  totalParcelsEvaluated: number;
  impactBuckets: ImpactBucket[];
}

interface CountyScope {
  countyId: string;
  headers: Record<string, string>;
}

function getHeaderValue(headers: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const exact = headers[key];
    if (exact) return exact;
    const insensitive = Object.entries(headers).find(
      ([candidate]) => candidate.toLowerCase() === key.toLowerCase(),
    );
    if (insensitive?.[1]) return insensitive[1];
  }
  return undefined;
}

function getCoefficientPreviewScope(): CountyScope {
  const session = getSession();
  const token = getToken();
  const { headers } = buildCountyScopedSessionHeaders(session);
  const countyId = session?.countyId
    ?? getHeaderValue(headers, ['X-TerraFusion-County', 'X-County-Id', 'x-county-id'])
    ?? 'benton-wa';

  return {
    countyId,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
}

function formatUnavailable(label: 'source' | 'candidate', regression: TerraForgeRegressionDto): string | null {
  if (!regression.insufficientData && regression.model) return null;

  const usedForFit = regression.usedForFit ?? regression.model?.n ?? 0;
  const minimumRequired = regression.minimumRequired ?? 5;
  return `Insufficient observations for ${label} regression: ${usedForFit} available, ${minimumRequired} required`;
}

function coefficientAt(model: RegressionModelDto, predictor: string): number {
  const index = model.predictors.findIndex((candidate) => candidate === predictor);
  if (index < 0) return 0;
  return model.beta[index] ?? 0;
}

function buildCoefficientDeltas(
  source: RegressionModelDto,
  candidate: RegressionModelDto,
): CoefficientDelta[] {
  const predictors = Array.from(new Set([...source.predictors, ...candidate.predictors]))
    .filter((predictor) => predictor.toLowerCase() !== 'intercept');

  return predictors.map((variable) => {
    const currentValue = coefficientAt(source, variable);
    const proposedValue = coefficientAt(candidate, variable);
    const delta = proposedValue - currentValue;
    const deltaPct = currentValue === 0 ? 0 : (delta / currentValue) * 100;
    return { variable, currentValue, proposedValue, delta, deltaPct };
  });
}

function buildImpactBuckets(deltas: CoefficientDelta[], sampleSize: number): ImpactBucket[] {
  return deltas
    .slice()
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4)
    .map((delta) => ({
      label: delta.variable,
      count: sampleSize,
      meanDollarImpact: Math.round(delta.delta),
    }));
}

function normalizePreview(
  sourceYear: number,
  candidateYear: number,
  sourceRegression: TerraForgeRegressionDto,
  candidateRegression: TerraForgeRegressionDto,
  comparison: ModelComparisonDto,
): PreviewResult {
  const sourceModel = sourceRegression.model;
  const candidateModel = candidateRegression.model;

  if (!sourceModel || !candidateModel) {
    throw new Error('Regression coefficient model unavailable.');
  }

  const deltas = buildCoefficientDeltas(sourceModel, candidateModel);
  const sampleSize = Math.max(0, comparison.modelB?.sampleSize ?? candidateRegression.usedForFit ?? 0);

  return {
    sourceModelId: String(sourceYear),
    sourceModelName: comparison.modelA?.label || `${sourceYear} regression`,
    candidateModelId: String(candidateYear),
    candidateModelName: comparison.modelB?.label || `${candidateYear} regression`,
    deltas,
    metrics: {
      codDelta: comparison.deltas?.cod ?? 0,
      prdDelta: comparison.deltas?.prd ?? 0,
      meanRatioDelta: comparison.deltas?.medianRatio ?? 0,
      medianRatioDelta: comparison.deltas?.medianRatio ?? 0,
    },
    impactedParcelCount: sampleSize,
    totalParcelsEvaluated: Math.max(
      sampleSize,
      comparison.modelA?.sampleSize ?? sourceRegression.usedForFit ?? sampleSize,
    ),
    impactBuckets: buildImpactBuckets(deltas, sampleSize),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoefficientPreview() {
  const [sourceYear, setSourceYear] = useState<number>(DEFAULT_SOURCE_YEAR);
  const [candidateYear, setCandidateYear] = useState<number>(DEFAULT_CANDIDATE_YEAR);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyMode, setApplyMode] = useState<ForgeApplyMode>('preview_only');
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const scope = getCoefficientPreviewScope();
      const requestInit = { headers: scope.headers };
      const [sourceRegression, candidateRegression, comparison] = await Promise.all([
        apiFetchJson<TerraForgeRegressionDto>(
          `/terraforge/regression?taxYear=${sourceYear}&countyId=${encodeURIComponent(scope.countyId)}`,
          requestInit,
        ),
        apiFetchJson<TerraForgeRegressionDto>(
          `/terraforge/regression?taxYear=${candidateYear}&countyId=${encodeURIComponent(scope.countyId)}`,
          requestInit,
        ),
        apiFetchJson<ModelComparisonDto>('/MassAppraisal/compare', {
          method: 'POST',
          headers: {
            ...scope.headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ModelIdA: String(sourceYear), ModelIdB: String(candidateYear) }),
        }),
      ]);

      const unavailable =
        formatUnavailable('source', sourceRegression)
        ?? formatUnavailable('candidate', candidateRegression);
      if (unavailable) {
        setError(unavailable);
        return;
      }

      setPreview(normalizePreview(
        sourceYear,
        candidateYear,
        sourceRegression,
        candidateRegression,
        comparison,
      ));
      setApplyMode('preview_only');
      const evt = emitAuditEvent('preview_only', 'preview_generated');
      setAuditLog((prev) => [...prev, evt]);
    } catch (err) {
      setError(`Coefficient preview unavailable: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [sourceYear, candidateYear]);

  const handleApplyRequest = useCallback(() => {
    if (BACKEND_APPLY_CAPABLE) {
      setApplyMode('apply_executed');
      const evt = emitAuditEvent('apply_executed', 'apply_executed');
      setAuditLog((prev) => [...prev, evt]);
    } else {
      setApplyMode('apply_pending_backend');
      const evt = emitAuditEvent('apply_pending_backend', 'apply_blocked');
      setAuditLog((prev) => [...prev, evt]);
    }
  }, []);

  const fmtNum = (n: number) => n.toLocaleString();
  const fmtCurrency = (n: number) => {
    const sign = n >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(n).toLocaleString()}`;
  };
  const fmtPct = (n: number) => {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  };
  const fmtDelta = (n: number, digits = 2) => {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(digits)}`;
  };

  const deltaColor = (n: number) =>
    n > 0 ? 'hsl(120 60% 60%)' : n < 0 ? 'hsl(0 60% 60%)' : 'hsl(var(--tf-muted))';

  return (
    <div data-testid="coefficient-preview" className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>
          Coefficient Application Preview
        </h1>
        <Badge variant="outline">Live Preview</Badge>
      </div>
      {error && (
        <div className="text-xs px-2 py-1 rounded" style={{
          background: 'hsl(40 80% 40% / 0.2)',
          color: 'hsl(40 80% 70%)',
        }}>
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Compare Tax-Year Regressions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Current (Baseline)</label>
              <select
                data-testid="coeff-source-select"
                value={String(sourceYear)}
                onChange={(e) => setSourceYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>Tax Year {year} regression</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Proposed (Candidate)</label>
              <select
                data-testid="coeff-candidate-select"
                value={String(candidateYear)}
                onChange={(e) => setCandidateYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>Tax Year {year} regression</option>
                ))}
              </select>
            </div>
          </div>
          <Button
            data-testid="coeff-preview-btn"
            onClick={handlePreview}
            disabled={loading || sourceYear === candidateYear}
            className="w-full"
          >
            {loading ? 'Generating Preview...' : 'Generate Preview'}
          </Button>

          {preview && (
            <div className="space-y-2 pt-2">
              <div
                data-testid="coeff-preview-summary"
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: 'hsl(200 60% 30% / 0.2)',
                  color: 'hsl(200 60% 70%)',
                }}
              >
                <span>{preview.sourceModelName}</span>
                <span> to </span>
                <span>{preview.candidateModelName}</span>
              </div>
              <Button
                data-testid="coeff-apply-btn"
                variant={applyMode === 'apply_executed' ? 'default' : 'outline'}
                onClick={handleApplyRequest}
                disabled={applyMode === 'apply_executed'}
                className="w-full"
              >
                {applyMode === 'apply_executed'
                  ? 'Coefficients Applied'
                  : applyMode === 'apply_pending_backend'
                    ? 'Retry Apply Coefficients'
                    : 'Apply Coefficients'}
              </Button>

              <div data-testid="coeff-apply-mode" className="text-xs px-2 py-1 rounded" style={{
                background: applyMode === 'preview_only'
                  ? 'hsl(200 60% 30% / 0.2)'
                  : applyMode === 'apply_pending_backend'
                    ? 'hsl(40 80% 40% / 0.2)'
                    : 'hsl(120 50% 35% / 0.2)',
                color: applyMode === 'preview_only'
                  ? 'hsl(200 60% 70%)'
                  : applyMode === 'apply_pending_backend'
                    ? 'hsl(40 80% 70%)'
                    : 'hsl(120 60% 60%)',
              }}>
                {applyMode === 'preview_only' && 'Mode: Preview Only - coefficients NOT applied'}
                {applyMode === 'apply_pending_backend' && 'Mode: Apply Blocked - backend capability not available. Request recorded.'}
                {applyMode === 'apply_executed' && 'Mode: Applied - coefficients committed to target model'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {preview && (
        <>
          <div data-testid="coeff-metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>COD Δ</div>
                <div className="text-xl font-bold" style={{ color: deltaColor(preview.metrics.codDelta) }}>
                  {fmtDelta(preview.metrics.codDelta, 1)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {preview.metrics.codDelta < 0 ? 'Improved' : 'Degraded'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>PRD Δ</div>
                <div className="text-xl font-bold" style={{ color: deltaColor(preview.metrics.prdDelta) }}>
                  {fmtDelta(preview.metrics.prdDelta, 3)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {preview.metrics.prdDelta < 0 ? 'Improved' : preview.metrics.prdDelta > 0 ? 'Slight Increase' : 'Unchanged'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Impacted Parcels</div>
                <div className="text-xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(preview.impactedParcelCount)}</div>
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>of {fmtNum(preview.totalParcelsEvaluated)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Mean Ratio Δ</div>
                <div className="text-xl font-bold" style={{ color: deltaColor(preview.metrics.meanRatioDelta) }}>
                  {fmtDelta(preview.metrics.meanRatioDelta, 3)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Median: {fmtDelta(preview.metrics.medianRatioDelta, 3)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Coefficient Deltas</CardTitle></CardHeader>
            <CardContent>
              <table data-testid="coeff-delta-table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                    <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Variable</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Current</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Proposed</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Δ</th>
                    <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Δ%</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.deltas.map((d) => (
                    <tr key={d.variable} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                      <td className="py-2 font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{d.variable}</td>
                      <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>{d.currentValue.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>{d.proposedValue.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono" style={{ color: deltaColor(d.delta) }}>{fmtDelta(d.delta)}</td>
                      <td className="py-2 text-right font-mono" style={{ color: deltaColor(d.deltaPct) }}>{fmtPct(d.deltaPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Impact Distribution</CardTitle></CardHeader>
            <CardContent>
              <div data-testid="coeff-impact-buckets" className="space-y-2">
                {preview.impactBuckets.map((bucket) => {
                  const maxCount = Math.max(1, ...preview.impactBuckets.map((b) => b.count));
                  const widthPct = (bucket.count / maxCount) * 100;
                  const isNegative = bucket.meanDollarImpact < 0;
                  return (
                    <div key={bucket.label} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-right shrink-0" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {bucket.label} impact
                      </div>
                      <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${widthPct}%`,
                            background: isNegative ? 'hsl(0 50% 50% / 0.5)' : 'hsl(120 50% 40% / 0.5)',
                          }}
                        />
                      </div>
                      <div className="w-16 text-xs text-right font-mono shrink-0" style={{ color: 'hsl(var(--tf-fg))' }}>
                        {fmtNum(bucket.count)}
                      </div>
                      <div className="w-24 text-xs text-right font-mono shrink-0" style={{ color: deltaColor(bucket.meanDollarImpact) }}>
                        {fmtCurrency(bucket.meanDollarImpact)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {auditLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
          <CardContent>
            <div data-testid="coeff-audit-trail" className="space-y-1">
              {auditLog.map((evt) => (
                <div key={evt.eventId} className="flex items-center gap-2 text-xs py-1" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                  <Badge variant="outline" className="shrink-0">{evt.outcome}</Badge>
                  <span className="font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>{evt.mode}</span>
                  <span className="font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>lane:{evt.writeLane}</span>
                  <span className="ml-auto font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CoefficientPreview;
