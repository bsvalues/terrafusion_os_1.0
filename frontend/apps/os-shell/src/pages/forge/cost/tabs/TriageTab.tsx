/**
 * TriageTab.tsx — AI Priority Triage for CostForge.
 *
 * Fetches neighborhood-matrix, computes AI priority score client-side,
 * sorts neighborhoods by urgency, and lets the appraiser drill in with one click.
 *
 * AI Priority Score = (codDeviation × 2 + ratioDeviation × 100 + prbDeviation × 50) × √saleCount
 *   codDeviation   = max(0, cod - 15)          — above IAAO threshold
 *   ratioDeviation = |medianRatio - 1.0|        — distance from level equity
 *   prbDeviation   = |prb|                      — vertical inequity (PRB ≈ 0 = neutral)
 *   saleCount      — scales impact by parcel exposure
 *
 * Decile indicator: fetches GET /equity/deciles for county-wide regression pattern
 * (regressive / progressive / uniform) and displays in the AI callout.
 */
import { useEffect, useRef, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

const BENTON_COUNTY_ID =
  (import.meta.env as Record<string, string>).VITE_BENTON_COUNTY_ID ??
  '842a6c54-c7c0-4b2d-aa43-0e3ba63fa57d';

// Shape of GET /api/equity/deciles response
interface DecileResponse {
  saleCount: number;
  decileMedianRatios: (number | null)[];  // length 10
  d1D10Spread: number | null;
  pattern: 'regressive' | 'progressive' | 'uniform' | 'insufficient-data';
}

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
  const codDeviation   = Math.max(0, (hood.cod ?? 0) - 15);
  const ratioDeviation = Math.abs((hood.medianRatio ?? 1.0) - 1.0);
  const prbDeviation   = Math.abs(hood.prb ?? 0); // PRB ≈ 0 is neutral; deviation signals vertical inequity
  const impact = Math.sqrt(Math.max(1, hood.saleCount));
  return (codDeviation * 2 + ratioDeviation * 100 + prbDeviation * 50) * impact;
}

/** Tier thresholds: Critical ≥ 20, Watch ≥ 5, OK < 5 (based on priority formula scale) */
function PriorityBadge({ score }: { score: number }) {
  if (score >= 20) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em',
          padding: '2px 7px', borderRadius: 4,
          background: 'hsl(0 60% 22%)', color: 'var(--cf-danger)',
          whiteSpace: 'nowrap',
        }}
        title={`Priority score: ${score.toFixed(1)}`}
      >
        ▲ Critical
      </span>
    );
  }
  if (score >= 5) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em',
          padding: '2px 7px', borderRadius: 4,
          background: 'hsl(38 60% 16%)', color: 'var(--cf-warn)',
          whiteSpace: 'nowrap',
        }}
        title={`Priority score: ${score.toFixed(1)}`}
      >
        ● Watch
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em',
        padding: '2px 7px', borderRadius: 4,
        background: 'hsl(142 40% 12%)', color: 'var(--cf-success)',
        whiteSpace: 'nowrap',
      }}
      title={`Priority score: ${score.toFixed(1)}`}
    >
      ✓ OK
    </span>
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

  // Decile pattern from /equity/deciles — county-wide vertical-equity indicator
  const [decileData, setDecileData] = useState<DecileResponse | null>(null);
  const decileAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    decileAbortRef.current?.abort();
    decileAbortRef.current = new AbortController();
    apiFetchJson<DecileResponse>(
      `/equity/deciles?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}`,
      { signal: decileAbortRef.current.signal }
    )
      .then((d) => { setDecileData(d); })
      .catch(() => { /* non-fatal — decile badge stays hidden */ });
    return () => { decileAbortRef.current?.abort(); };
  }, [taxYear]);

  function load() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    apiFetchJson<MatrixResponse>(
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
        <div className="cf-ai-callout__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          AI Triage
          {decileData && decileData.pattern !== 'insufficient-data' && (
            <span style={{
              fontSize: '0.6875rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              background: decileData.pattern === 'regressive' ? 'hsl(0 60% 22%)' : decileData.pattern === 'progressive' ? 'hsl(220 60% 22%)' : 'hsl(142 40% 12%)',
              color: decileData.pattern === 'regressive' ? 'var(--cf-danger)' : decileData.pattern === 'progressive' ? 'var(--cf-info)' : 'var(--cf-success)',
            }}>
              {decileData.pattern === 'regressive' ? '▼ Regressive' : decileData.pattern === 'progressive' ? '▲ Progressive' : '= Uniform'}
            </span>
          )}
        </div>
        {loading
          ? 'Computing neighborhood priorities…'
          : data
          ? `${outCount} of ${data.neighborhoods.length} neighborhoods out of IAAO compliance. Priority score = (COD deviation × 2 + ratio deviation × 100 + PRB deviation × 50) × √sales.${decileData && decileData.pattern !== 'insufficient-data' ? ` County decile pattern: ${decileData.pattern} (D1−D10 spread: ${decileData.d1D10Spread?.toFixed(3) ?? '—'}).` : ''} Click any row to drill in.`
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

      {error && (
        <div className="cf-state cf-state--error">
          {error}
          <button type="button" className="cf-btn cf-btn--ghost" style={{ marginLeft: 12 }} onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: '8px 0' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 60px 70px 60px 60px 60px',
                gap: 8,
                padding: '10px',
                borderBottom: '1px solid var(--cf-border)',
                opacity: 1 - i * 0.12,
              }}
            >
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  style={{
                    height: 14,
                    borderRadius: 4,
                    background: 'hsl(222 16% 18%)',
                    width: j === 1 ? '70%' : '90%',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

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
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textAlign: 'right' }} title="Price-Related Bias: vertical equity. Near 0 = neutral.">PRB</span>
              <span role="columnheader" style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700 }}>IAAO</span>
            </div>
            {rows.length === 0 && data && (
              <div className="cf-state" style={{ flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '1.25rem' }}>✓</span>
                <span style={{ color: 'var(--cf-success)', fontWeight: 600 }}>
                  All {data.neighborhoods.length} neighborhoods in IAAO compliance
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cf-subtle)' }}>
                  Switch to "All neighborhoods" to review the full matrix.
                </span>
              </div>
            )}
            {rows.length === 0 && !data && !loading && (
              <div className="cf-state">No data — click Refresh to load the neighborhood matrix.</div>
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
                  <span style={{ textAlign: 'right', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums',
                    color: hood.prb == null ? 'var(--cf-subtle)' : Math.abs(hood.prb) > 0.05 ? 'var(--cf-warn)' : 'var(--cf-text)' }}
                    title={hood.prb != null ? `PRB = ${hood.prb.toFixed(4)} (|x| > 0.05 flags vertical inequity)` : 'PRB not computed'}
                  >
                    {hood.prb != null ? hood.prb.toFixed(3) : '—'}
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
