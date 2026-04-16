/**
 * TriageTab.tsx — AI Priority Triage for CostForge.
 *
 * Fetches neighborhood-matrix, computes AI priority score client-side,
 * sorts neighborhoods by urgency, and lets the appraiser drill in with one click.
 *
 * AI Priority Score = (codDeviation × 2 + ratioDeviation × 100) × √saleCount
 *   codDeviation   = max(0, cod - 15)          — above IAAO threshold
 *   ratioDeviation = |medianRatio - 1.0|        — distance from equity
 *   saleCount      — scales impact by parcel exposure
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
  prb: number | null;
  p25: number | null;
  p75: number | null;
  ratioOk: boolean;
  codOk: boolean;
  iaaoCompliant: boolean;
}

interface MatrixResponse {
  neighborhoods: NeighborhoodRow[];
  outOfCompliance: number;
  source: string;
}

function computePriorityScore(hood: NeighborhoodRow): number {
  const codDeviation  = Math.max(0, (hood.cod ?? 0) - 15);
  const ratioDeviation = Math.abs((hood.medianRatio ?? 1.0) - 1.0);
  const impact = Math.sqrt(Math.max(1, hood.saleCount));
  return (codDeviation * 2 + ratioDeviation * 100) * impact;
}

function PriorityBadge({ score }: { score: number }) {
  const tier = score > 20 ? 'critical' : score > 5 ? 'warn' : 'ok';
  const label = score > 20 ? '!' : score > 5 ? '~' : '✓';
  return (
    <span className={`cf-priority-badge cf-priority-badge--${tier}`}>{label}</span>
  );
}

function fmtRatio(n: number | null): string {
  return n == null ? '—' : n.toFixed(3);
}
function fmtCod(n: number | null): string {
  return n == null ? '—' : n.toFixed(1);
}

export function TriageTab() {
  const drillIntoHood = useCostForgeWorkspaceStore((s) => s.drillIntoHood);
  const taxYear       = useCostForgeWorkspaceStore((s) => s.taxYear);
  const [data, setData]     = useState<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [showOnly, setShowOnly] = useState<'all' | 'noncompliant'>('noncompliant');
  const abortRef = useRef<AbortController | null>(null);

  function load() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    apiFetch<MatrixResponse>(
      `/costforge/calibration/neighborhood-matrix?taxYear=${taxYear}&minSales=3`,
      { signal: abortRef.current.signal }
    )
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load matrix');
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxYear]);

  const rows = (data?.neighborhoods ?? [])
    .filter((h) => showOnly === 'all' || !h.iaaoCompliant)
    .map((h) => ({ ...h, score: computePriorityScore(h) }))
    .sort((a, b) => b.score - a.score);

  const outCount = data?.neighborhoods.filter((h) => !h.iaaoCompliant).length ?? 0;

  return (
    <div>
      <div className="cf-ai-callout">
        <div className="cf-ai-callout__label">AI Triage</div>
        {loading
          ? 'Computing neighborhood priorities…'
          : data
          ? `${outCount} of ${data.neighborhoods.length} neighborhoods out of IAAO compliance. Priority score = (COD deviation × 2 + ratio deviation × 100) × √sales. Click any row to drill in.`
          : 'Load neighborhood matrix to see priority ranking.'}
      </div>

      <div className="cf-action-bar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
          {taxYear} study · {rows.length} neighborhoods shown
        </span>
        <div className="cf-action-bar__spacer" />
        <select
          className="cf-filter-input"
          value={showOnly}
          onChange={(e) => setShowOnly(e.target.value as 'all' | 'noncompliant')}
        >
          <option value="noncompliant">Non-compliant only</option>
          <option value="all">All neighborhoods</option>
        </select>
        <button type="button" className="cf-btn cf-btn--ghost" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="cf-state cf-state--error">{error}</div>}

      {!loading && !error && (
        <div className="cf-table-scroll">
          <div role="table" aria-label="Neighborhood priority triage">
            {/* Header */}
            <div
              className="cf-triage-row cf-triage-row--head"
              role="row"
              style={{ cursor: 'default' }}
            >
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700 }}>Pri</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700 }}>Neighborhood</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textAlign: 'right' }}>Sales</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textAlign: 'right' }}>Median</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textAlign: 'right' }}>COD</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textAlign: 'right' }}>PRD</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700 }}>IAAO</span>
            </div>
            {rows.length === 0 && (
              <div className="cf-state">
                {data ? 'All neighborhoods in compliance ✓' : 'No data loaded'}
              </div>
            )}
            {rows.map((hood) => {
              const ratioBadge = hood.medianRatio == null
                ? 'missing'
                : hood.medianRatio < 0.9
                ? 'low'
                : hood.medianRatio > 1.1
                ? 'high'
                : 'ok';
              return (
                <div
                  key={hood.hoodCd}
                  className="cf-triage-row"
                  role="row"
                  onClick={() => drillIntoHood(hood.hoodCd)}
                  title={`Priority score: ${hood.score.toFixed(1)} — click to audit`}
                >
                  <PriorityBadge score={hood.score} />
                  <span style={{ fontSize: '0.8125rem' }}>
                    <strong>{hood.hoodCd}</strong>
                    {hood.name && (
                      <span style={{ color: 'var(--cf-muted)', marginLeft: 6, fontSize: '0.75rem' }}>
                        {hood.name}
                      </span>
                    )}
                  </span>
                  <span style={{ textAlign: 'right', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                    {hood.saleCount}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span className={`cf-ratio-badge cf-ratio-badge--${ratioBadge}`}>
                      {fmtRatio(hood.medianRatio)}
                    </span>
                  </span>
                  <span style={{ textAlign: 'right', fontSize: '0.8125rem', color: hood.codOk ? 'var(--cf-text)' : 'var(--cf-warn)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCod(hood.cod)}
                  </span>
                  <span style={{ textAlign: 'right', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                    {hood.prd?.toFixed(3) ?? '—'}
                  </span>
                  <span>
                    {hood.iaaoCompliant
                      ? <span style={{ color: 'var(--cf-success)', fontSize: '0.75rem', fontWeight: 600 }}>✓ OK</span>
                      : <span style={{ color: 'var(--cf-danger)', fontSize: '0.75rem', fontWeight: 600 }}>✗ Out</span>
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
