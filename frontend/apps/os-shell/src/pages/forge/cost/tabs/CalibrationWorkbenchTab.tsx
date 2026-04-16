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
import { apiFetch } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

interface NeighborhoodRow {
  hoodCd: string;
  name: string | null;
  saleCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  iaaoCompliant: boolean;
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
  const [committed, setCommitted]           = useState(false);
  const [commitLoading, setCommitLoading]   = useState(false);
  const [commitError, setCommitError]       = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load current neighborhood status
  useEffect(() => {
    if (!selectedHoodCd) { setHood(null); return; }
    setHoodLoading(true);
    setPreview(null);
    setCommitted(false);
    apiFetch<{ neighborhoods: NeighborhoodRow[] }>(
      `/costforge/calibration/neighborhood-matrix?taxYear=${taxYear}&minSales=1`
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
      .catch(() => setHoodLoading(false));
  }, [selectedHoodCd, taxYear]);

  const runPreview = async () => {
    if (!selectedHoodCd || !adjustPct) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    setCommitted(false);
    try {
      const data = await apiFetch<PreviewResponse>(
        '/costforge/calibration/mass-adjust-preview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neighborhoodCode: selectedHoodCd,
            adjustmentPct: parseFloat(adjustPct),
            taxYear,
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
    if (!preview || !selectedHoodCd) return;
    setCommitLoading(true);
    setCommitError(null);
    try {
      await apiFetch('/costforge/calibration/mass-adjust-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neighborhoodCode: selectedHoodCd,
          adjustmentPct: parseFloat(adjustPct),
          taxYear,
        }),
      });
      setCommitted(true);
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Commit failed');
    } finally {
      setCommitLoading(false);
    }
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
      {hood && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}>
          {[
            { label: 'Sales', value: String(hood.saleCount) },
            { label: 'Median Ratio', value: fmt(hood.medianRatio) },
            { label: 'COD', value: fmt(hood.cod, 1) },
            { label: 'IAAO', value: hood.iaaoCompliant ? '✓ OK' : '✗ Out' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding: '10px 12px',
              background: 'var(--cf-surface)',
              border: '1px solid var(--cf-border)',
              borderRadius: 6,
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: label === 'IAAO' ? (hood.iaaoCompliant ? 'var(--cf-success)' : 'var(--cf-danger)') : 'var(--cf-text)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

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
                setCommitted(false);
              }}
              placeholder="e.g. +8.7"
            />
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
      {preview && !committed && (
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
            },
            {
              label: 'COD',
              before: fmt(preview.codBefore, 1),
              after: fmt(preview.codAfter, 1),
              better: preview.codAfter < preview.codBefore,
            },
            {
              label: 'Total AV change',
              before: fmtDollar(preview.totalAvBefore),
              after: fmtDollar(preview.totalAvAfter),
              better: true,
            },
            {
              label: 'IAAO compliant after',
              before: '—',
              after: preview.iaaoCompliantAfter ? '✓ Yes' : '✗ No',
              better: preview.iaaoCompliantAfter,
            },
          ].map(({ label, before, after, better }) => (
            <div key={label} className="cf-impact-row">
              <span className="cf-impact-row__label">{label}</span>
              <span className="cf-impact-row__before">{before}</span>
              <span className={`cf-impact-row__after cf-impact-row__after--${better ? 'better' : 'worse'}`}>
                → {after}
              </span>
            </div>
          ))}

          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="cf-btn cf-btn--commit"
              onClick={() => void commitAdjustment()}
              disabled={commitLoading}
            >
              {commitLoading ? 'Committing…' : `Commit ${parseFloat(adjustPct) >= 0 ? '+' : ''}${adjustPct}% to ${selectedHoodCd}`}
            </button>
            <button
              type="button"
              className="cf-btn cf-btn--ghost"
              onClick={() => setPreview(null)}
            >
              Revise
            </button>
          </div>
          {commitError && (
            <div style={{ color: 'var(--cf-danger)', fontSize: '0.8rem', marginTop: 8 }}>
              {commitError}
            </div>
          )}
        </div>
      )}

      {/* Committed success */}
      {committed && (
        <div className="cf-impact-panel">
          <div style={{ fontWeight: 700, color: 'var(--cf-success)', marginBottom: 8 }}>
            ✓ Adjustment committed — {adjustPct}% applied to {preview?.parcelCount.toLocaleString()} parcels
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
            Return to Triage to verify the neighborhood has moved into compliance, or audit the next neighborhood.
          </p>
          <button
            type="button"
            className="cf-btn cf-btn--ghost"
            style={{ marginTop: 8 }}
            onClick={() => setActiveTab('triage')}
          >
            ← Back to Triage
          </button>
        </div>
      )}
    </div>
  );
}
