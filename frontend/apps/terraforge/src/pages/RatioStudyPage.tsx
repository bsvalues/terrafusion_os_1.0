import { useEffect, useState } from 'react';

const API = '/api/terraforge/ratio-study';

interface Stats {
  medianRatio: number | null;
  meanRatio: number | null;
  cod: number | null;
  prd: number | null;
}

interface SaleRow {
  saleId: string;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  gla: number | null;
  yearBuilt: number | null;
  hood: string | null;
  propertyType: string | null;
  salesRatio: number | null;
  qualificationSource: 'decision' | 'recommendation';
}

interface RatioStudyResponse {
  taxYear: number;
  total: number;
  countWithRatio: number;
  outliersExcluded: number;
  stats: Stats;
  items: SaleRow[];
  page: number;
  pageSize: number;
}

const fmt$  = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtR  = (n: number | null) => n == null ? '—' : n.toFixed(4);
const fmtPct = (n: number | null) => n == null ? '—' : n.toFixed(2) + '%';
const fmtDate = (s: string) => s.slice(0, 10);

function IaaoGate({ label, value, lo, hi }: { label: string; value: number | null; lo: number; hi: number }) {
  if (value == null) return null;
  const pass = value >= lo && value <= hi;
  return (
    <span className={`tf-badge ${pass ? 'tf-badge--green' : 'tf-badge--red'}`}>
      {label}: {typeof value === 'number' && label === 'COD' ? fmtPct(value) : fmtR(value)}
      {pass ? ' ✓' : ' ✗'}
    </span>
  );
}

export default function RatioStudyPage() {
  const [taxYear,   setTaxYear]   = useState(2026);
  const [hood,      setHood]      = useState('');
  const [propType,  setPropType]  = useState('');
  const [data,      setData]      = useState<RatioStudyResponse | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ taxYear: String(taxYear), pageSize: '50' });
    if (hood)     params.set('hood', hood);
    if (propType) params.set('propertyType', propType);
    fetch(`${API}?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, hood, propType]);

  const { stats, total, countWithRatio, outliersExcluded, items } = data ?? {};

  return (
    <div className="tf-page">
      <div className="tf-page-header">
        <h2>Ratio Study</h2>
        <p className="tf-page-sub">County-wide IAAO ratio analysis — Benton County WA</p>
      </div>

      {/* Filters */}
      <div className="tf-filters">
        <label>
          Tax year
          <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          Neighborhood
          <input
            type="text"
            placeholder="e.g. 15112"
            value={hood}
            onChange={e => setHood(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 100 }}
          />
        </label>
        <label>
          Prop type
          <input
            type="text"
            placeholder="e.g. R"
            value={propType}
            onChange={e => setPropType(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 60 }}
          />
        </label>
        {total != null && (
          <span className="tf-count">
            {total.toLocaleString()} qualified · {countWithRatio?.toLocaleString()} with ratio
            {outliersExcluded != null && outliersExcluded > 0 && (
              <span style={{ color: 'rgba(226,232,240,.45)', marginLeft: 6 }}>
                · {outliersExcluded} IQR outliers excluded from stats
              </span>
            )}
          </span>
        )}
      </div>

      {/* IAAO stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">Median Ratio</div>
            <div className="tf-cardBig">{fmtR(stats.medianRatio)}</div>
            <div className="tf-cardSmall">target 0.95–1.05</div>
          </div>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">Mean Ratio</div>
            <div className="tf-cardBig">{fmtR(stats.meanRatio)}</div>
          </div>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">COD</div>
            <div className="tf-cardBig">{fmtPct(stats.cod)}</div>
            <div className="tf-cardSmall">IAAO ≤ 15% residential</div>
          </div>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">PRD</div>
            <div className="tf-cardBig">{fmtR(stats.prd)}</div>
            <div className="tf-cardSmall">IAAO 0.98–1.03</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            <IaaoGate label="COD" value={stats.cod}       lo={0}    hi={15}   />
            <IaaoGate label="PRD" value={stats.prd}       lo={0.98} hi={1.03} />
          </div>
        </div>
      )}

      {loading && <p className="tf-loading">Loading…</p>}
      {error   && <p className="tf-error">Error: {error}</p>}

      {/* Sales table */}
      {items && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Parcel</th>
                <th>Sale Date</th>
                <th className="tf-right">Sale Price</th>
                <th className="tf-right">GLA</th>
                <th>Year Built</th>
                <th>Hood</th>
                <th className="tf-right">Ratio</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td className="tf-empty" colSpan={8}>No qualified sales in this window.</td></tr>
              )}
              {items.map(r => (
                <tr key={r.saleId}>
                  <td className="tf-mono">{r.parcelId}</td>
                  <td>{fmtDate(r.saleDate)}</td>
                  <td className="tf-right tf-mono">{fmt$(r.salePrice)}</td>
                  <td className="tf-right">{r.gla?.toLocaleString() ?? '—'}</td>
                  <td>{r.yearBuilt ?? '—'}</td>
                  <td>{r.hood ?? '—'}</td>
                  <td className="tf-right tf-mono">{fmtR(r.salesRatio)}</td>
                  <td>
                    <span className={`tf-badge ${r.qualificationSource === 'decision' ? 'tf-badge--blue' : 'tf-badge--gray'}`}>
                      {r.qualificationSource}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
