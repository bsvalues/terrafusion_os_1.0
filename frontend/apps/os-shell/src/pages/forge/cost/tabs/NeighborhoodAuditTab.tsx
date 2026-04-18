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
 *
 * BentonDiagnosticsPanel (Track 2-B):
 *   - Stratified COD by vintage  — GET /equity/stratified-cod
 *   - Condition bias             — GET /equity/condition-bias
 *   - IQR outlier badges on ratio cells (Tukey fences: Q1 − 1.5×IQR, Q3 + 1.5×IQR)
 */
import { useEffect, useRef, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

const BENTON_COUNTY_ID =
  (import.meta.env as Record<string, string>).VITE_BENTON_COUNTY_ID ??
  '19190019-1919-1919-1919-191919191919';

// ── Benton custom metric DTO shapes ──

interface SegmentCod { saleCount: number; medianRatio: number | null; cod: number | null; }
interface StratifiedCodResponse {
  splitBy: string;
  segments: Record<string, SegmentCod>;
}

interface SegmentMedian { saleCount: number; medianRatio: number | null; }
interface ConditionBiasResponse {
  medianRatioByCondition: Record<string, SegmentMedian>;
}

/** Tukey IQR fences for outlier detection on ratio arrays */
function computeIqrFences(ratios: number[]): { lower: number; upper: number } | null {
  if (ratios.length < 4) return null;
  const sorted = ratios.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const q1Arr = sorted.slice(0, mid);
  const q3Arr = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  const q1 = q1Arr[Math.floor(q1Arr.length / 2)];
  const q3 = q3Arr[Math.floor(q3Arr.length / 2)];
  const iqr = q3 - q1;
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
}

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

  const [data, setData]         = useState<ParcelListResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [ratioFilter, setRatioFilter] = useState<'all' | 'low' | 'high' | 'nosale'>('all');
  const abortRef = useRef<AbortController | null>(null);

  // BentonDiagnosticsPanel state
  const [stratCod, setStratCod]   = useState<StratifiedCodResponse | null>(null);
  const [condBias, setCondBias]   = useState<ConditionBiasResponse | null>(null);
  const diagAbortRef = useRef<AbortController | null>(null);

  const load = () => {
    if (!selectedHoodCd) { setData(null); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    apiFetchJson<ParcelListResponse>(
      `/costforge/neighborhoods/${selectedHoodCd}/parcels?taxYear=${taxYear}`,
      { signal: abortRef.current.signal }
    )
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load neighborhood parcels');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHoodCd, taxYear]);

  // Fetch Benton diagnostics (stratified-cod + condition-bias) for selected neighborhood
  useEffect(() => {
    if (!selectedHoodCd) { setStratCod(null); setCondBias(null); return; }
    diagAbortRef.current?.abort();
    diagAbortRef.current = new AbortController();
    const { signal } = diagAbortRef.current;
    const base = `/equity`;
    const qs = `countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=neighborhood&segment=${encodeURIComponent(selectedHoodCd)}`;

    Promise.allSettled([
      apiFetchJson<StratifiedCodResponse>(`${base}/stratified-cod?${qs}&splitBy=vintage`, { signal }),
      apiFetchJson<ConditionBiasResponse>(`${base}/condition-bias?${qs}`, { signal }),
    ]).then(([codResult, biasResult]) => {
      if (codResult.status === 'fulfilled') setStratCod(codResult.value);
      if (biasResult.status === 'fulfilled') setCondBias(biasResult.value);
    });

    return () => { diagAbortRef.current?.abort(); };
  }, [selectedHoodCd, taxYear]);

  if (!selectedHoodCd) {
    return (
      <div className="cf-state">
        Select a neighborhood in the Triage tab to drill in.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="cf-state" style={{ flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 24, height: 24, border: '3px solid var(--cf-border)', borderTopColor: 'var(--cf-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading parcel spread for <strong style={{ color: 'var(--cf-text)' }}>{selectedHoodCd}</strong>…
      </div>
    );
  }
  if (error) {
    return (
      <div className="cf-state cf-state--error" style={{ flexDirection: 'column', gap: 6 }}>
        {error}
        <button type="button" className="cf-btn cf-btn--ghost" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!data) return <div className="cf-state">No data — select a neighborhood in Triage to load parcel spread.</div>;

  const decadeBuckets = computeDecadeBuckets(data.parcels);
  const worstDecade   = decadeBuckets[0];

  // IQR fences for outlier detection
  const parcelRatios = data.parcels.flatMap((p) => p.ratio != null ? [p.ratio] : []);
  const iqrFences = computeIqrFences(parcelRatios);

  const filteredParcels = data.parcels.filter((p) => {
    if (ratioFilter === 'all') return true;
    if (ratioFilter === 'nosale') return p.ratio == null;
    if (ratioFilter === 'low')    return p.ratio != null && p.ratio < 0.9;
    if (ratioFilter === 'high')   return p.ratio != null && p.ratio > 1.1;
    return true;
  });

  const filterCounts = {
    all:    data.parcels.length,
    low:    data.parcels.filter((p) => p.ratio != null && p.ratio < 0.9).length,
    high:   data.parcels.filter((p) => p.ratio != null && p.ratio > 1.1).length,
    nosale: data.parcels.filter((p) => p.ratio == null).length,
  };

  return (
    <div>
      <div className="cf-action-bar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
          Hood <strong style={{ color: 'var(--cf-text)' }}>{selectedHoodCd}</strong>
          {' '}· {filteredParcels.length} of {data.parcels.length} parcels · {taxYear}
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

      {/* BentonDiagnosticsPanel — stratified COD + condition bias */}
      {(stratCod || condBias) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: stratCod && condBias ? '1fr 1fr' : '1fr',
          gap: 8,
          marginBottom: 12,
          padding: '10px',
          background: 'var(--cf-surface)',
          border: '1px solid var(--cf-border)',
          borderRadius: 6,
        }}>
          {stratCod && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cf-muted)', marginBottom: 6 }}>
                Vintage COD (stratified)
              </div>
              {Object.entries(stratCod.segments)
                .sort(([, a], [, b]) => Math.abs((b.medianRatio ?? 1) - 1) - Math.abs((a.medianRatio ?? 1) - 1))
                .slice(0, 4)
                .map(([seg, v]) => (
                  <div key={seg} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                    <span style={{ color: 'var(--cf-muted)' }}>{seg}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: v.cod != null && v.cod > 15 ? 'var(--cf-warn)' : 'var(--cf-text)' }}>
                      {v.medianRatio?.toFixed(3) ?? '—'}
                      {v.cod != null && <span style={{ color: 'var(--cf-subtle)', marginLeft: 6 }}>COD {v.cod.toFixed(1)}</span>}
                    </span>
                  </div>
                ))}
            </div>
          )}
          {condBias && (
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cf-muted)', marginBottom: 6 }}>
                Condition Bias
              </div>
              {Object.entries(condBias.medianRatioByCondition)
                .sort(([, a], [, b]) => (b.saleCount ?? 0) - (a.saleCount ?? 0))
                .slice(0, 4)
                .map(([cond, v]) => {
                  const bias = Math.abs((v.medianRatio ?? 1) - 1);
                  return (
                    <div key={cond} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                      <span style={{ color: 'var(--cf-muted)' }}>{cond}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: bias > 0.05 ? 'var(--cf-warn)' : 'var(--cf-text)' }}>
                        {v.medianRatio?.toFixed(3) ?? '—'}
                        <span style={{ color: 'var(--cf-subtle)', marginLeft: 6 }}>n={v.saleCount}</span>
                      </span>
                    </div>
                  );
                })}
            </div>
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

      {/* Ratio-band filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {(
          [
            { key: 'all',    label: `All (${filterCounts.all})`,         color: 'var(--cf-muted)' },
            { key: 'low',    label: `Low < 0.900 (${filterCounts.low})`, color: 'var(--cf-warn)' },
            { key: 'high',   label: `High > 1.100 (${filterCounts.high})`,color: 'var(--cf-danger)' },
            { key: 'nosale', label: `No sale (${filterCounts.nosale})`,  color: 'var(--cf-subtle)' },
          ] as const
        ).map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setRatioFilter(key)}
            style={{
              padding: '3px 10px',
              borderRadius: 4,
              border: `1px solid ${ratioFilter === key ? color : 'var(--cf-border)'}`,
              background: ratioFilter === key ? 'hsl(222 16% 16%)' : 'transparent',
              color: ratioFilter === key ? color : 'var(--cf-muted)',
              fontSize: '0.75rem',
              fontWeight: ratioFilter === key ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

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
          {filteredParcels.length === 0 && (
            <div className="cf-state" style={{ gridColumn: '1 / -1' }}>
              No parcels match the selected filter.
            </div>
          )}
          {filteredParcels.map((p) => (
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
              <span className="cf-cell cf-cell--num" role="cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                {iqrFences && p.ratio != null && (p.ratio < iqrFences.lower || p.ratio > iqrFences.upper) && (
                  <span
                    title={`Tukey IQR outlier (fence: ${iqrFences.lower.toFixed(3)}–${iqrFences.upper.toFixed(3)})`}
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      background: 'hsl(38 60% 16%)',
                      color: 'var(--cf-warn)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
                    }}
                  >
                    ⚠ IQR
                  </span>
                )}
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
