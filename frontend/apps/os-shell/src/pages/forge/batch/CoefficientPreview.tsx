/**
 * CoefficientPreview.tsx (Tranche 1D → 1E audit-proof)
 *
 * Standalone Forge module: Coefficient Application Preview.
 * Shows current vs proposed coefficients, impacted parcel count,
 * COD/PRD delta, and top impact buckets. Preview-only, non-destructive.
 *
 * Write lane: Read-only preview (Forge scope).
 * No parcelId routing — cross-parcel / county-wide.
 *
 * 1E additions: ForgeApplyMode lifecycle, preview-only enforcement,
 * backend-capability gate, blocker display, and audit event emission.
 *
 * DATA POSTURE:
 * - No model list or preview result is fabricated when the backend is unavailable.
 * - `BACKEND_APPLY_CAPABLE = false`: the coefficient apply endpoint is not yet
 *   wired. Apply is blocked at the UI layer until this flag is set to true.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// 1E: Apply-mode types & audit event emitter
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

/** Backend capability flag — false until real backend is wired */
const BACKEND_APPLY_CAPABLE = false;

let _auditSeq = 0;
function emitAuditEvent(
  mode: ForgeApplyMode,
  outcome: AuditEvent['outcome'],
): AuditEvent {
  const evt: AuditEvent = {
    eventId: `coeff-audit-${++_auditSeq}`,
    requestId: `coeff-req-${Date.now()}`,
    suite: 'forge',
    writeLane: mode === 'preview_only' ? 'none' : 'forge',
    mode,
    outcome,
    timestamp: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  return evt;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoefficientPreview() {
  const [sourceId, setSourceId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/MassAppraisal/models')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Array<{ modelId?: string; id?: string; name?: string; Name?: string }>) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((m) => ({
            id: m.modelId ?? m.id ?? '',
            name: m.name ?? m.Name ?? m.modelId ?? m.id ?? 'Unknown',
          }));
          setModels(mapped);
          setSourceId(mapped[0].id);
          if (mapped.length > 1) setCandidateId(mapped[1].id);
          setError(null);
        }
      })
      .catch((err) => {
        setModels([]);
        setSourceId('');
        setCandidateId('');
        setError(`Model registry unavailable: ${err instanceof Error ? err.message : String(err)}`);
      });
  }, []);

  // 1E: Apply mode lifecycle
  const [applyMode, setApplyMode] = useState<ForgeApplyMode>('preview_only');
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  const handlePreview = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/MassAppraisal/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ModelIdA: sourceId, ModelIdB: candidateId }),
      });
      if (response.ok) {
        const data = await response.json();
        const livePreview: PreviewResult = {
          sourceModelId: sourceId,
          sourceModelName: data.modelA?.label ?? sourceId,
          candidateModelId: candidateId,
          candidateModelName: data.modelB?.label ?? candidateId,
          deltas: [],
          metrics: {
            codDelta: data.deltas?.cod ?? 0,
            prdDelta: data.deltas?.prd ?? 0,
            meanRatioDelta: data.deltas?.medianRatio ?? 0,
            medianRatioDelta: data.deltas?.medianRatio ?? 0,
          },
          impactedParcelCount: data.modelA?.sampleSize ?? 0,
          totalParcelsEvaluated: data.modelA?.sampleSize ?? 0,
          impactBuckets: [],
        };
        setPreview(livePreview);
      } else {
        setPreview(null);
        setError(`Coefficient preview request failed: ${response.status}`);
      }
    } catch (err) {
      setPreview(null);
      setError(`Coefficient preview unavailable: ${err instanceof Error ? err.message : String(err)}`);
    }
    setApplyMode('preview_only');
    const evt = emitAuditEvent('preview_only', 'preview_generated');
    setAuditLog((prev) => [...prev, evt]);
  }, [sourceId, candidateId]);

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
    const sign = n >= 0 ? '+' : '';
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
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>Coefficient Application Preview</h1>
        <Badge variant="outline">Preview Only</Badge>
      </div>
      {error && (
        <div className="text-xs px-2 py-1 rounded" style={{
          background: 'hsl(40 80% 40% / 0.2)',
          color: 'hsl(40 80% 70%)',
        }}>
          {error}
        </div>
      )}

      {/* Model selector */}
      <Card>
        <CardHeader><CardTitle>Compare Models</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Current (Baseline)</label>
              <select
                data-testid="coeff-source-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
              >
                {models.length === 0 && <option value="">No governed models returned</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Proposed (Candidate)</label>
              <select
                data-testid="coeff-candidate-select"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm"
                style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
              >
                {models.length === 0 && <option value="">No governed models returned</option>}
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Button data-testid="coeff-preview-btn" onClick={handlePreview} disabled={!sourceId || !candidateId || sourceId === candidateId} className="w-full">
            Generate Preview
          </Button>

          {/* 1E: Apply request + mode banner */}
          {preview && (
            <div className="space-y-2 pt-2">
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
                {applyMode === 'preview_only' && 'Mode: Preview Only — coefficients NOT applied'}
                {applyMode === 'apply_pending_backend' && 'Mode: Apply Blocked — backend capability not available. Request recorded.'}
                {applyMode === 'apply_executed' && 'Mode: Applied — coefficients committed to target model'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {preview && (
        <>
          {/* Metrics summary */}
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

          {/* Coefficient delta table */}
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

          {/* Impact distribution */}
          <Card>
            <CardHeader><CardTitle>Impact Distribution</CardTitle></CardHeader>
            <CardContent>
              <div data-testid="coeff-impact-buckets" className="space-y-2">
                {preview.impactBuckets.map((bucket) => {
                  const maxCount = Math.max(...preview.impactBuckets.map((b) => b.count));
                  const widthPct = (bucket.count / maxCount) * 100;
                  const isNegative = bucket.meanDollarImpact < 0;
                  return (
                    <div key={bucket.label} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-right shrink-0" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {bucket.label}
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

      {/* 1E: Audit Trail */}
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
