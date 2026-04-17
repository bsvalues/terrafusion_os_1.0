/**
 * CalibrationWorkbenchTab.tsx
 *
 * Primary fix surface. Given a selected neighborhood (from Triage drill-in),
 * shows current compliance status, AI-suggested adjustment, and lets the
 * appraiser simulate → verify → commit a mass adjustment.
 *
 * API: POST /costforge/calibration/mass-adjust-preview
 *      POST /costforge/calibration/mass-adjust-apply  (commit)
 *
 * Auto-suggest formula: adjustmentPct = (1/medianRatio - 1) × 100
 * e.g., medianRatio=0.92 → auto-suggest +8.7%
 */
import { useEffect, useRef, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

const BENTON_COUNTY_ID =
  (import.meta.env as Record<string, string>).VITE_BENTON_COUNTY_ID ??
  '842a6c54-c7c0-4b2d-aa43-0e3ba63fa57d';

interface NeighborhoodRow {
  hoodCd: string;
  name: string | null;
  saleCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  iaaoCompliant: boolean;
}

// Shapes from /equity/metrics
interface EquityMetricsDto {
  saleCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  iaaoCompliant: boolean;
  bentonCompliant: boolean;
  provenance: 'real' | 'insufficient-sales' | 'no-data';
}
interface EquityMetricsResponse {
  groupCount: number;
  groups: Record<string, EquityMetricsDto>;
}

// Shapes from /equity/rollup
interface StratumRollupRow {
  key: string;
  name: string;
  parcelCount: number;
  saleCount: number;
  totalAv: number | null;
  metrics: EquityMetricsDto;
}
interface RollupResponse {
  strata: StratumRollupRow[];
}

interface PreviewResponse {
  parcelCount: number;
  matchedSales: number;
  totalAvBefore: number;
  totalAvAfter: number;
  totalAvDelta: number;
  medianRatioBefore: number;
  medianRatioAfter: number;
  ratioDelta: number;
  codBefore: number;
  codAfter: number;
  iaaoCompliantAfter: boolean;
  estimatedImpactOnFundingLevel: number | null;
}

/** Returned from POST /costforge/calibration/mass-adjust-apply */
interface ApplyResult {
  parcelsUpdated: number;
  neighborhoodCode: string;
  adjustmentPct: number;
  taxYear: number;
  vintageDecade: string | null;
  conditionGrade: string | null;
  appliedAt: string;
  // Snapshot captured at commit time from preview + equityMetrics
  snap_medianBefore: number | null;
  snap_medianAfter: number | null;
  snap_matchedSales: number;
  snap_prbBefore: number | null;
  snap_codBefore: number | null;
}

function fmt(n: number | null | undefined, dec = 3): string {
  return n == null ? '—' : n.toFixed(dec);
}
function fmtDollar(n: number | null | undefined): string {
  return n == null ? '—' : '$' + Math.round(n).toLocaleString();
}

export function CalibrationWorkbenchTab() {
  const selectedHoodCd = useCostForgeWorkspaceStore((s) => s.selectedHoodCd);
  const taxYear        = useCostForgeWorkspaceStore((s) => s.taxYear);
  const setActiveTab   = useCostForgeWorkspaceStore((s) => s.setActiveTab);

  const [hood, setHood]               = useState<NeighborhoodRow | null>(null);
  const [hoodLoading, setHoodLoading] = useState(false);
  const [adjustPct, setAdjustPct]     = useState('');
  const [preview, setPreview]         = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [applyResult, setApplyResult]       = useState<ApplyResult | null>(null);
  const [commitLoading, setCommitLoading]   = useState(false);
  const [commitError, setCommitError]       = useState<string | null>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const hoodAbortRef = useRef<AbortController | null>(null);

  // Segment filters (Track 3)
  const [vintageDecade, setVintageDecade]     = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  // Equity metrics + rollup for PRB before/after context
  const [equityMetrics, setEquityMetrics] = useState<EquityMetricsDto | null>(null);
  const [rollupStrata, setRollupStrata]   = useState<StratumRollupRow[]>([]);
  const equityAbortRef = useRef<AbortController | null>(null);

  // Post-commit verification snapshot (re-fetched after commit)
  const [verifyMetrics, setVerifyMetrics]   = useState<EquityMetricsDto | null>(null);
  const [verifyLoading, setVerifyLoading]   = useState(false);
  const [verifyError, setVerifyError]       = useState<string | null>(null);
  const verifyAbortRef = useRef<AbortController | null>(null);

  // Load current neighborhood status
  useEffect(() => {
    if (!selectedHoodCd) { setHood(null); return; }
    hoodAbortRef.current?.abort();
    hoodAbortRef.current = new AbortController();
    setHoodLoading(true);
    setPreview(null);
    setApplyResult(null);
    setVerifyMetrics(null);
    apiFetchJson<{ neighborhoods: NeighborhoodRow[] }>(
      `/costforge/calibration/neighborhood-matrix?taxYear=${taxYear}&minSales=1`,
      { signal: hoodAbortRef.current.signal }
    )
      .then((d) => {
        const h = d.neighborhoods.find((n) => n.hoodCd === selectedHoodCd) ?? null;
        setHood(h);
        // Auto-populate suggested adjustment
        if (h?.medianRatio && h.medianRatio > 0) {
          const suggested = Math.round(((1.0 / h.medianRatio) - 1) * 1000) / 10;
          setAdjustPct(String(suggested));
        }
        setHoodLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setHoodLoading(false);
      });
    return () => { hoodAbortRef.current?.abort(); };
  }, [selectedHoodCd, taxYear]);

  // Fetch PRB + BentonCompliant from /equity/metrics + county-wide rollup for rank context
  useEffect(() => {
    if (!selectedHoodCd) { setEquityMetrics(null); setRollupStrata([]); return; }
    equityAbortRef.current?.abort();
    equityAbortRef.current = new AbortController();
    const { signal } = equityAbortRef.current;

    Promise.allSettled([
      apiFetchJson<EquityMetricsResponse>(
        `/equity/metrics?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=neighborhood&segment=${encodeURIComponent(selectedHoodCd)}`,
        { signal }
      ),
      apiFetchJson<RollupResponse>(
        `/equity/rollup?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=neighborhood`,
        { signal }
      ),
    ]).then(([metricsResult, rollupResult]) => {
      if (metricsResult.status === 'fulfilled') {
        const groups = metricsResult.value.groups;
        const dto = groups[selectedHoodCd] ?? Object.values(groups)[0] ?? null;
        setEquityMetrics(dto);
      }
      if (rollupResult.status === 'fulfilled') {
        setRollupStrata(rollupResult.value.strata ?? []);
      }
    });

    return () => { equityAbortRef.current?.abort(); };
  }, [selectedHoodCd, taxYear]);

  const runPreview = async () => {
    if (!selectedHoodCd || !adjustPct) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    setApplyResult(null);
    setVerifyMetrics(null);
    try {
      const data = await apiFetchJson<PreviewResponse>(
        '/costforge/calibration/mass-adjust-preview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neighborhoodCode: selectedHoodCd,
            adjustmentPct: parseFloat(adjustPct),
            taxYear,
            vintageDecade: vintageDecade || null,
            conditionGrade: conditionFilter || null,
          }),
          signal: abortRef.current.signal,
        }
      );
      setPreview(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const commitAdjustment = async () => {
    if (applyResult || !preview || !selectedHoodCd) return;
    setCommitLoading(true);
    setCommitError(null);
    // Snapshot pre-commit metrics before clearing
    const prbSnap = equityMetrics?.prb ?? hood?.prb ?? null;
    const codSnap = equityMetrics?.cod ?? hood?.cod ?? null;
    try {
      const raw = await apiFetchJson<{ parcelsUpdated: number; appliedAt: string; vintageDecade?: string | null; conditionGrade?: string | null }>(
        '/costforge/calibration/mass-adjust-apply',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neighborhoodCode: selectedHoodCd,
            adjustmentPct: parseFloat(adjustPct),
            taxYear,
            vintageDecade: vintageDecade || null,
            conditionGrade: conditionFilter || null,
          }),
        }
      );
      setApplyResult({
        parcelsUpdated: raw.parcelsUpdated,
        neighborhoodCode: selectedHoodCd,
        adjustmentPct: parseFloat(adjustPct),
        taxYear,
        vintageDecade: raw.vintageDecade ?? null,
        conditionGrade: raw.conditionGrade ?? null,
        appliedAt: raw.appliedAt ?? new Date().toISOString(),
        snap_medianBefore: preview.medianRatioBefore,
        snap_medianAfter: preview.medianRatioAfter,
        snap_matchedSales: preview.matchedSales,
        snap_prbBefore: prbSnap,
        snap_codBefore: codSnap,
      });
      setPreview(null);
      setConfirmPending(false);
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setCommitLoading(false);
    }
  };

  const runVerify = () => {
    if (!selectedHoodCd) return;
    verifyAbortRef.current?.abort();
    verifyAbortRef.current = new AbortController();
    setVerifyLoading(true);
    setVerifyError(null);
    apiFetchJson<EquityMetricsResponse>(
      `/equity/metrics?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=neighborhood&segment=${encodeURIComponent(selectedHoodCd)}`,
      { signal: verifyAbortRef.current.signal }
    )
      .then((resp) => {
        const groups = resp.groups;
        const dto = groups[selectedHoodCd] ?? Object.values(groups)[0] ?? null;
        setVerifyMetrics(dto);
        setVerifyLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setVerifyError(err instanceof Error ? err.message : 'Verify failed');
        setVerifyLoading(false);
      });
  };

  if (!selectedHoodCd) {
    return (
      <div className="cf-state">
        Select a neighborhood in the Triage tab to begin calibration.
      </div>
    );
  }

  const autoSuggest = hood?.medianRatio && hood.medianRatio > 0
    ? Math.round(((1.0 / hood.medianRatio) - 1) * 1000) / 10
    : null;

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="cf-action-bar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
          Calibrating hood <strong style={{ color: 'var(--cf-text)' }}>{selectedHoodCd}</strong>
          {hood?.name && <span style={{ color: 'var(--cf-muted)', marginLeft: 6 }}>{hood.name}</span>}
        </span>
        <div className="cf-action-bar__spacer" />
        <button type="button" className="cf-btn cf-btn--ghost"
          onClick={() => setActiveTab('hood-audit')}>
          ← Back to Audit
        </button>
      </div>

      {/* Current status */}
      {hoodLoading && <div className="cf-state">Loading neighborhood status…</div>}
      {hood && (() => {
        const prb = equityMetrics?.prb ?? hood.prb;
        const prbAbs = prb != null ? Math.abs(prb) : null;
        // County rank by |PRB| magnitude (most biased = rank 1)
        const prbRanked = rollupStrata
          .filter((s) => s.metrics.prb != null)
          .sort((a, b) => Math.abs(b.metrics.prb!) - Math.abs(a.metrics.prb!));
        const prbRank = prbRanked.findIndex((s) => s.key === selectedHoodCd) + 1;

        return (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
              marginBottom: 8,
            }}>
              {[
                { label: 'Sales',        value: String(hood.saleCount),          color: 'var(--cf-text)' },
                { label: 'Median Ratio', value: fmt(hood.medianRatio),            color: 'var(--cf-text)' },
                { label: 'COD',          value: fmt(hood.cod, 1),                 color: (hood.cod ?? 0) > 15 ? 'var(--cf-warn)' : 'var(--cf-text)' },
                { label: 'PRB',          value: prb != null ? prb.toFixed(3) : '—',
                                         color: prbAbs != null && prbAbs > 0.05 ? 'var(--cf-warn)' : 'var(--cf-text)' },
                { label: 'IAAO',         value: hood.iaaoCompliant ? '✓ OK' : '✗ Out',
                                         color: hood.iaaoCompliant ? 'var(--cf-success)' : 'var(--cf-danger)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '10px 12px',
                  background: 'var(--cf-surface)',
                  border: '1px solid var(--cf-border)',
                  borderRadius: 6,
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* BentonCompliant badge + county PRB rank */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              {equityMetrics && (
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: equityMetrics.bentonCompliant ? 'hsl(142 40% 12%)' : 'hsl(0 50% 14%)',
                  color: equityMetrics.bentonCompliant ? 'var(--cf-success)' : 'var(--cf-danger)',
                }}
                  title="Benton compliant = IAAO standards + decile spread ≤ 0.10"
                >
                  {equityMetrics.bentonCompliant ? '✓ Benton compliant' : '✗ Benton non-compliant'}
                </span>
              )}
              {prbRank > 0 && prbRanked.length > 0 && (
                <span style={{
                  fontSize: '0.6875rem', color: 'var(--cf-subtle)',
                }}
                  title={`Ranked by |PRB| across ${prbRanked.length} neighborhoods with qualified sales`}
                >
                  PRB rank #{prbRank} of {prbRanked.length} county hoods
                </span>
              )}
            </div>
          </>
        );
      })()}

      {/* AI auto-suggest */}
      {autoSuggest != null && (
        <div className="cf-ai-callout" style={{ marginBottom: 12 }}>
          <div className="cf-ai-callout__label">AI Suggestion</div>
          To bring median ratio to 1.000, apply{' '}
          <strong style={{ color: autoSuggest >= 0 ? 'var(--cf-success)' : 'var(--cf-warn)' }}>
            {autoSuggest >= 0 ? '+' : ''}{autoSuggest}%
          </strong>{' '}
          adjustment. This is pre-filled below — review and simulate before committing.
        </div>
      )}

      {/* Adjustment input */}
      <div className="cf-filterbar">
        <div className="cf-filter-row">
          <div className="cf-filter-group">
            <label className="cf-filter-label" htmlFor="adjustPct">
              Adjustment % (+ increases AV, − decreases)
            </label>
            <input
              id="adjustPct"
              type="number"
              step="0.1"
              className="cf-filter-input"
              style={{ width: 120 }}
              value={adjustPct}
              onChange={(e) => {
                setAdjustPct(e.target.value);
                setPreview(null);
              }}
              placeholder="e.g. +8.7"
            />
          </div>
          <div className="cf-filter-group">
            <label className="cf-filter-label" htmlFor="vintageDecade">
              Vintage (optional)
            </label>
            <select
              id="vintageDecade"
              className="cf-filter-input"
              value={vintageDecade}
              onChange={(e) => { setVintageDecade(e.target.value); setPreview(null); }}
            >
              <option value="">All decades</option>
              {['1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="cf-filter-group">
            <label className="cf-filter-label" htmlFor="conditionFilter">
              Condition (optional)
            </label>
            <select
              id="conditionFilter"
              className="cf-filter-input"
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value); setPreview(null); }}
            >
              <option value="">All conditions</option>
              <option value="POOR">Poor</option>
              <option value="FAIR">Fair</option>
              <option value="GOOD">Good</option>
              <option value="EXCELLENT">Excellent</option>
            </select>
          </div>

          <div className="cf-filter-actions">
            <button
              type="button"
              className="cf-btn cf-btn--primary"
              onClick={() => void runPreview()}
              disabled={previewLoading || !adjustPct}
            >
              {previewLoading ? 'Simulating…' : 'Simulate Impact'}
            </button>
            {autoSuggest != null && adjustPct !== String(autoSuggest) && (
              <button
                type="button"
                className="cf-btn cf-btn--ghost"
                onClick={() => setAdjustPct(String(autoSuggest))}
              >
                Use AI suggestion ({autoSuggest >= 0 ? '+' : ''}{autoSuggest}%)
              </button>
            )}
          </div>
        </div>
      </div>

      {previewError && (
        <div className="cf-state cf-state--error">{previewError}</div>
      )}

      {/* Impact simulation result */}
      {preview && !applyResult && (
        <div
          className={`cf-impact-panel${preview.iaaoCompliantAfter ? '' : ' cf-impact-panel--warn'}`}
        >
          <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--cf-text)', fontSize: '0.875rem' }}>
            Simulated Impact — {preview.parcelCount.toLocaleString()} parcels
            ({preview.matchedSales} with sale ratios)
          </div>
          {[
            {
              label: 'Median ratio',
              before: fmt(preview.medianRatioBefore),
              after: fmt(preview.medianRatioAfter),
              better: Math.abs(preview.medianRatioAfter - 1) < Math.abs(preview.medianRatioBefore - 1),
              note: undefined,
            },
            {
              label: 'COD',
              before: fmt(preview.codBefore, 1),
              after: fmt(preview.codAfter, 1),
              better: preview.codAfter < preview.codBefore,
              note: undefined,
            },
            {
              label: 'PRB (vertical equity)',
              before: equityMetrics?.prb != null ? equityMetrics.prb.toFixed(3) : (hood?.prb != null ? hood.prb.toFixed(3) : '—'),
              after: '~unchanged',
              better: true,
              note: 'Uniform % adj. does not alter regression slope',
            },
            {
              label: 'Total AV change',
              before: fmtDollar(preview.totalAvBefore),
              after: fmtDollar(preview.totalAvAfter),
              better: true,
              note: undefined,
            },
            {
              label: 'IAAO compliant after',
              before: '—',
              after: preview.iaaoCompliantAfter ? '✓ Yes' : '✗ No',
              better: preview.iaaoCompliantAfter,
              note: undefined,
            },
          ].map(({ label, before, after, better, note }) => (
            <div key={label} className="cf-impact-row">
              <span className="cf-impact-row__label" title={note}>{label}{note && <span style={{ marginLeft: 4, fontSize: '0.6875rem', color: 'var(--cf-subtle)' }}>ⓘ</span>}</span>
              <span className="cf-impact-row__before">{before}</span>
              <span className={`cf-impact-row__after cf-impact-row__after--${better ? 'better' : 'worse'}`}>
                → {after}
              </span>
            </div>
          ))}

          {/* Two-step commit: first click opens confirm, second fires the write */}
          {!confirmPending ? (
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="cf-btn cf-btn--commit"
                onClick={() => setConfirmPending(true)}
                disabled={commitLoading}
              >
                {`Commit ${parseFloat(adjustPct) >= 0 ? '+' : ''}${adjustPct}% to ${selectedHoodCd}…`}
              </button>
              <button
                type="button"
                className="cf-btn cf-btn--ghost"
                onClick={() => setPreview(null)}
              >
                Revise
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: 'hsl(0 50% 12%)',
                border: '2px solid var(--cf-danger)',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--cf-danger)', marginBottom: 8, fontSize: '0.875rem' }}>
                ⚠ Confirm mass adjustment — this will update {preview?.parcelCount.toLocaleString()} parcel records in the county PACS database.
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)', marginBottom: 12 }}>
                Hood <strong style={{ color: 'var(--cf-text)' }}>{selectedHoodCd}</strong>
                {' · '}{parseFloat(adjustPct) >= 0 ? '+' : ''}{adjustPct}% assessed value adjustment
                {' · '}{taxYear} tax year
                {' · '}{preview?.matchedSales} qualified sales
                {(vintageDecade || conditionFilter) && (
                  <span style={{ color: 'var(--cf-warn)', marginLeft: 6 }}>
                    · Segment: {[vintageDecade || 'all decades', conditionFilter || 'all conditions'].join(' / ')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cf-btn cf-btn--commit"
                  onClick={() => void commitAdjustment()}
                  disabled={commitLoading}
                >
                  {commitLoading ? 'Writing to PACS…' : 'Yes — Apply Adjustment'}
                </button>
                <button
                  type="button"
                  className="cf-btn cf-btn--ghost"
                  onClick={() => setConfirmPending(false)}
                  disabled={commitLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {commitError && (
            <div style={{ color: 'var(--cf-danger)', fontSize: '0.8rem', marginTop: 8 }}>
              {commitError}
            </div>
          )}
        </div>
      )}

      {/* ── Calibration Finding Card (post-commit audit record) ── */}
      {applyResult && (
        <div style={{
          marginTop: 12,
          padding: '14px 16px',
          background: 'hsl(142 20% 9%)',
          border: '1px solid hsl(142 35% 20%)',
          borderLeft: '3px solid var(--cf-success)',
          borderRadius: 8,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cf-success)', marginBottom: 2 }}>
                Calibration Finding — Committed
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cf-text)' }}>
                Hood {applyResult.neighborhoodCode} · {applyResult.taxYear} · {applyResult.adjustmentPct >= 0 ? '+' : ''}{applyResult.adjustmentPct}%
              </div>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--cf-success)', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'hsl(142 40% 12%)' }}>
              ✓ RESOLVED
            </span>
          </div>

          {/* Finding detail rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '0.8125rem', marginBottom: 12 }}>
            {[
              { label: 'Target', value: [applyResult.vintageDecade ?? 'All decades', applyResult.conditionGrade ? applyResult.conditionGrade[0] + applyResult.conditionGrade.slice(1).toLowerCase() + ' cond.' : 'All conditions'].join(' / ') },
              { label: 'Parcels updated', value: applyResult.parcelsUpdated.toLocaleString() },
              { label: 'Qualified sales', value: applyResult.snap_matchedSales.toString() },
              { label: 'Median ratio before', value: fmt(applyResult.snap_medianBefore) },
              { label: 'Median ratio after (sim.)', value: fmt(applyResult.snap_medianAfter) },
              { label: 'PRB before', value: applyResult.snap_prbBefore != null ? applyResult.snap_prbBefore.toFixed(3) : '—' },
              { label: 'COD before', value: applyResult.snap_codBefore != null ? applyResult.snap_codBefore.toFixed(1) : '—' },
              { label: 'Applied', value: (() => { try { return new Date(applyResult.appliedAt).toLocaleString(); } catch { return applyResult.appliedAt; } })() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid hsl(222 16% 17%)' }}>
                <span style={{ color: 'var(--cf-muted)' }}>{label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--cf-text)', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Auto-generated evidence narrative */}
          <div style={{ fontSize: '0.75rem', color: 'var(--cf-muted)', fontStyle: 'italic', marginBottom: 12, padding: '8px 10px', background: 'hsl(222 16% 12%)', borderRadius: 4 }}>
            {(() => {
              const ratio = applyResult.snap_medianBefore;
              const deviation = ratio != null ? Math.abs(ratio - 1.0) : null;
              const prb = applyResult.snap_prbBefore;
              const prbFlag = prb != null && Math.abs(prb) > 0.05;
              const segNote = applyResult.vintageDecade ? ` Analysis isolated to ${applyResult.vintageDecade} construction.` : '';
              const condNote = applyResult.conditionGrade ? ` Condition filter: ${applyResult.conditionGrade}.` : '';
              return `Neighborhood ${applyResult.neighborhoodCode} exhibited median ratio ${fmt(ratio)} (deviation ${deviation != null ? deviation.toFixed(3) : '—'} from equity).${segNote}${condNote} PRB ${prb != null ? prb.toFixed(3) : '—'} ${prbFlag ? '— flags vertical inequity.' : '— neutral.'} Applied ${applyResult.adjustmentPct >= 0 ? '+' : ''}${applyResult.adjustmentPct}% to ${applyResult.parcelsUpdated.toLocaleString()} parcels targeting IAAO compliance. Simulated post-adjustment median: ${fmt(applyResult.snap_medianAfter)}.`;
            })()}
          </div>

          {/* Verify Now — re-fetch live equity metrics post-commit */}
          <div style={{ borderTop: '1px solid hsl(222 16% 20%)', paddingTop: 12 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cf-muted)', marginBottom: 8 }}>
              Verification Snapshot
            </div>
            {!verifyMetrics && !verifyLoading && !verifyError && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)', marginBottom: 8 }}>
                Re-fetch live equity metrics to confirm the ratio moved as expected.
              </div>
            )}
            {verifyError && (
              <div style={{ color: 'var(--cf-danger)', fontSize: '0.8rem', marginBottom: 8 }}>{verifyError}</div>
            )}
            {verifyMetrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                {[
                  { label: 'Live Median', before: fmt(applyResult.snap_medianBefore), after: fmt(verifyMetrics.medianRatio) },
                  { label: 'Live COD',    before: fmt(applyResult.snap_codBefore, 1),  after: fmt(verifyMetrics.cod, 1) },
                  { label: 'Live PRB',    before: fmt(applyResult.snap_prbBefore),       after: fmt(verifyMetrics.prb) },
                  { label: 'IAAO',        before: '—',                                   after: verifyMetrics.iaaoCompliant ? '✓ OK' : '✗ Out' },
                ].map(({ label, before, after }) => (
                  <div key={label} style={{ padding: '8px 10px', background: 'var(--cf-surface)', border: '1px solid var(--cf-border)', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cf-subtle)' }}>{before}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cf-success)' }}>→ {after}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cf-btn cf-btn--ghost"
                onClick={runVerify}
                disabled={verifyLoading}
              >
                {verifyLoading ? 'Fetching live metrics…' : verifyMetrics ? '↻ Re-verify' : 'Verify Now'}
              </button>
              <button type="button" className="cf-btn cf-btn--ghost" onClick={() => setActiveTab('triage')}>
                ← Back to Triage
              </button>
              <button type="button" className="cf-btn cf-btn--ghost" onClick={() => setActiveTab('calc-trace')}>
                View Calc Trace →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
