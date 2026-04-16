/**
 * NeighborhoodAuditTab.tsx
 *
 * Shows per-parcel ratio spread for the selected neighborhood.
 * AI root cause: cross-tabs ratios by decade of construction to find
 * which vintage is driving the outlier (e.g., "1970s homes pull median low").
 * Clicking a parcel navigates to Parcel Inspector.
 *
 * Root cause: group parcels by (yearBuilt ÷ 10) decade bucket,
 * compute median ratio per decade, flag the bucket furthest from 1.0.
 */
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

interface CamaParcel {
  parcelId: string;
  parcelNumber: string | null;
  yearBuilt: number | null;
  squareFeet: number;
  qualityGrade: string | null;
  salePrice: number | null;
  assessedValue: number | null;
  ratio: number | null;       // assessedValue / salePrice — computed server-side
}

interface ParcelListResponse {
  parcels: CamaParcel[];
  hood: string;
  taxYear: number;
}

interface DecadeBucket {
  decade: string;
  count: number;
  medianRatio: number | null;
  deviation: number;
}

/** Compute which decade has the worst median ratio (furthest from 1.0) */
function computeDecadeBuckets(parcels: CamaParcel[]): DecadeBucket[] {
  const buckets: Record<string, number[]> = {};
  for (const p of parcels) {
    if (p.ratio == null || p.yearBuilt == null) continue;
    const decade = String(Math.floor(p.yearBuilt / 10) * 10) + 's';
    if (!buckets[decade]) buckets[decade] = [];
    buckets[decade].push(p.ratio);
  }
  return Object.entries(buckets)
    .map(([decade, ratios]) => {
      const sorted = ratios.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      return {
        decade,
        count: ratios.length,
        medianRatio: median,
        deviation: Math.abs(median - 1.0),
      };
    })
    .sort((a, b) => b.deviation - a.deviation);
}

function ratioBadgeClass(ratio: number | null): string {
  if (ratio == null) return 'cf-ratio-badge--missing';
  if (ratio < 0.9)  return 'cf-ratio-badge--low';
  if (ratio > 1.1)  return 'cf-ratio-badge--high';
  return 'cf-ratio-badge--ok';
}

export function NeighborhoodAuditTab() {
  const selectedHoodCd  = useCostForgeWorkspaceStore((s) => s.selectedHoodCd);
  const drillIntoParcel = useCostForgeWorkspaceStore((s) => s.drillIntoParcel);
  const setActiveTab    = useCostForgeWorkspaceStore((s) => s.setActiveTab);
  const taxYear         = useCostForgeWorkspaceStore((s) => s.taxYear);

  const [data, setData]     = useState<ParcelListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!selectedHoodCd) { setData(null); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    apiFetch<ParcelListResponse>(
      `/costforge/neighborhoods/${selectedHoodCd}/parcels?taxYear=${taxYear}`,
      { signal: abortRef.current.signal }
    )
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load neighborhood parcels');
        setLoading(false);
      });

    return () => abortRef.current?.abort();
  }, [selectedHoodCd, taxYear]);

  if (!selectedHoodCd) {
    return (
      <div className="cf-state">
        Select a neighborhood in the Triage tab to drill in.
      </div>
    );
  }
  if (loading) return <div className="cf-state">Loading parcel spread for {selectedHoodCd}…</div>;
  if (error)   return <div className="cf-state cf-state--error">{error}</div>;
  if (!data)   return <div className="cf-state">No data</div>;

  const decadeBuckets = computeDecadeBuckets(data.parcels);
  const worstDecade   = decadeBuckets[0];

  return (
    <div>
      <div className="cf-action-bar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
          Hood <strong style={{ color: 'var(--cf-text)' }}>{selectedHoodCd}</strong>
          {' '}· {data.parcels.length} parcels · {taxYear}
        </span>
        <div className="cf-action-bar__spacer" />
        <button
          type="button"
          className="cf-btn cf-btn--ghost"
          onClick={() => setActiveTab('calibration')}
        >
          → Open Calibration Workbench
        </button>
      </div>

      {/* AI root cause insight */}
      {worstDecade && (
        <div className="cf-ai-callout">
          <div className="cf-ai-callout__label">AI Root Cause</div>
          <strong>{worstDecade.decade}</strong> construction
          ({worstDecade.count} parcels) has median ratio{' '}
          <strong style={{ color: worstDecade.medianRatio != null && worstDecade.medianRatio < 0.9 ? 'var(--cf-warn)' : 'var(--cf-danger)' }}>
            {worstDecade.medianRatio?.toFixed(3) ?? '—'}
          </strong>{' '}
          — dominant outlier driver in this neighborhood.
          {decadeBuckets.length > 1 && (
            <> Other decades: {decadeBuckets.slice(1, 3).map(b =>
              `${b.decade} (${b.medianRatio?.toFixed(3) ?? '—'})`
            ).join(', ')}.</>
          )}
        </div>
      )}

      {/* Decade summary chips */}
      {decadeBuckets.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {decadeBuckets.map((b) => (
            <div key={b.decade} style={{
              padding: '6px 10px',
              background: 'var(--cf-surface)',
              border: '1px solid var(--cf-border)',
              borderRadius: 6,
              fontSize: '0.75rem',
            }}>
              <span style={{ color: 'var(--cf-muted)' }}>{b.decade}</span>
              {' '}
              <span className={`cf-ratio-badge ${ratioBadgeClass(b.medianRatio)}`}>
                {b.medianRatio?.toFixed(3) ?? '—'}
              </span>
              <span style={{ color: 'var(--cf-subtle)', marginLeft: 4 }}>n={b.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Parcel table */}
      <div className="cf-table-scroll">
        <div
          className="cf-table"
          role="table"
          aria-label={`Parcels in neighborhood ${selectedHoodCd}`}
          style={{ gridTemplateColumns: '1.4fr 0.6fr 0.8fr 0.7fr 1fr 1fr 0.8fr' }}
        >
          <div className="cf-row cf-row--head" role="row">
            <span className="cf-cell" role="columnheader">Parcel</span>
            <span className="cf-cell cf-cell--num" role="columnheader">Built</span>
            <span className="cf-cell cf-cell--num" role="columnheader">Sqft</span>
            <span className="cf-cell" role="columnheader">Grade</span>
            <span className="cf-cell cf-cell--num" role="columnheader">Sale Price</span>
            <span className="cf-cell cf-cell--num" role="columnheader">AV</span>
            <span className="cf-cell cf-cell--num" role="columnheader">Ratio</span>
          </div>
          {data.parcels.map((p) => (
            <div
              key={p.parcelId}
              className="cf-row cf-row--data"
              role="row"
              style={{ cursor: 'pointer', gridTemplateColumns: '1.4fr 0.6fr 0.8fr 0.7fr 1fr 1fr 0.8fr' }}
              onClick={() => drillIntoParcel(p.parcelId)}
              title="Click to open in Parcel Inspector"
            >
              <span className="cf-cell" role="cell" style={{ color: 'var(--cf-info)', fontSize: '0.8rem' }}>
                {p.parcelNumber ?? p.parcelId}
              </span>
              <span className="cf-cell cf-cell--num" role="cell">{p.yearBuilt ?? '—'}</span>
              <span className="cf-cell cf-cell--num" role="cell">{p.squareFeet.toLocaleString()}</span>
              <span className="cf-cell" role="cell">{p.qualityGrade ?? '—'}</span>
              <span className="cf-cell cf-cell--num" role="cell">
                {p.salePrice != null ? '$' + p.salePrice.toLocaleString() : '—'}
              </span>
              <span className="cf-cell cf-cell--num" role="cell">
                {p.assessedValue != null ? '$' + p.assessedValue.toLocaleString() : '—'}
              </span>
              <span className="cf-cell cf-cell--num" role="cell">
                <span className={`cf-ratio-badge ${ratioBadgeClass(p.ratio)}`}>
                  {p.ratio?.toFixed(3) ?? '—'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
