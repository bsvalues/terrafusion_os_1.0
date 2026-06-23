import { useEffect, useState } from 'react';

const API = '/api/terraforge/comps-pool';

// ── Types ──────────────────────────────────────────────────────────────────

interface CompSale {
  saleId: string;
  parcelId: string;
  address: string | null;
  hood: string | null;
  propertyType: string | null;
  saleDate: string;
  salePrice: number;
  rawSalePrice: number;
  adjustedSalePrice: number | null;
  gla: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  condition: string | null;
  qualityGrade: string | null;
  salesRatio: number | null;
  qualificationSource: 'decision' | 'recommendation';
}

interface CompsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: CompSale[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDate = (s: string) => s.slice(0, 10);
const fmtR = (n: number | null) => (n == null ? '—' : n.toFixed(3));

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 18, background: 'rgba(255,255,255,.04)', borderRadius: 4, width: `${70 + Math.random() * 30}%`, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span title={text} style={{ cursor: 'help', marginLeft: 6, fontSize: 12, color: 'rgba(148,163,184,.7)' }}>ⓘ</span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CompsPage() {
  const [taxYear, setTaxYear]     = useState(2026);
  const [hood, setHood]           = useState('');
  const [propType, setPropType]   = useState('');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [minGla, setMinGla]       = useState('');
  const [maxGla, setMaxGla]       = useState('');
  const [page, setPage]           = useState(1);
  const [data, setData]           = useState<CompsResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const pageSize = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams({ taxYear: String(taxYear), pageSize: String(pageSize), page: String(page) });
    if (hood)     p.set('hood', hood);
    if (propType) p.set('propertyType', propType);
    if (minPrice) p.set('minPrice', minPrice);
    if (maxPrice) p.set('maxPrice', maxPrice);
    if (minGla)   p.set('minGla', minGla);
    if (maxGla)   p.set('maxGla', maxGla);

    fetch(`${API}?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((d: CompsResponse) => setData(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, hood, propType, minPrice, maxPrice, minGla, maxGla, page]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const exportCsv = () => {
    if (!data?.items.length) return;
    const header = 'Parcel,Sale Date,Sale Price,GLA,Lot Sqft,Year Built,Condition,Grade,Hood,Sales Ratio,Source\n';
    const rows = data.items.map(s =>
      `${s.parcelId},${fmtDate(s.saleDate)},${s.salePrice},${s.gla ?? ''},${s.lotSizeSqft ?? ''},${s.yearBuilt ?? ''},${s.condition ?? ''},${s.qualityGrade ?? ''},${s.hood ?? ''},${s.salesRatio?.toFixed(4) ?? ''},${s.qualificationSource}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `comps_pool_${taxYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13 };

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>Comparable Sales<Tooltip text="Qualified comparable sales pool used for ratio studies and mass appraisal. Per IAAO Standard on Ratio Studies." /></h2>
        <p className="tf-page-sub">Benton County WA — Effective qualified comps pool</p>
      </div>

      {/* Filters */}
      <div className="tf-filters" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Tax Year
          <select value={taxYear} onChange={e => { setTaxYear(Number(e.target.value)); setPage(1); }} style={inputStyle}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Neighborhood
          <input type="text" placeholder="e.g. 15112" value={hood} onChange={e => { setHood(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Type
          <input type="text" placeholder="e.g. 11" value={propType} onChange={e => { setPropType(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 60 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Min $
          <input type="number" placeholder="100000" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Max $
          <input type="number" placeholder="1000000" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Min GLA
          <input type="number" placeholder="800" value={minGla} onChange={e => { setMinGla(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 70 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Max GLA
          <input type="number" placeholder="5000" value={maxGla} onChange={e => { setMaxGla(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 70 }} />
        </label>
        <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'flex-end' }}>⬇ CSV</button>
      </div>

      {/* Summary bar */}
      {data && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, color: 'rgba(148,163,184,.7)' }}>
          <span>{data.total.toLocaleString()} qualified sales · Page {page} of {totalPages}</span>
        </div>
      )}

      {loading && <Skeleton rows={10} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {!loading && !error && data && (
        <>
          <div className="tf-table-wrap" style={{ maxHeight: 520, overflow: 'auto' }}>
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Sale Date</th>
                  <th className="tf-right">Sale Price</th>
                  <th className="tf-right">GLA</th>
                  <th className="tf-right">Lot sqft</th>
                  <th>Year</th>
                  <th>Cond</th>
                  <th>Grade</th>
                  <th>Hood</th>
                  <th className="tf-right">Sales Ratio</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr><td colSpan={11} className="tf-empty">No sales match these filters.</td></tr>
                )}
                {data.items.map(s => (
                  <tr key={s.saleId}>
                    <td className="tf-mono">{s.parcelId}</td>
                    <td>{fmtDate(s.saleDate)}</td>
                    <td className="tf-right tf-mono">{fmt$(s.salePrice)}</td>
                    <td className="tf-right">{s.gla?.toLocaleString() ?? '—'}</td>
                    <td className="tf-right">{s.lotSizeSqft?.toLocaleString() ?? '—'}</td>
                    <td>{s.yearBuilt ?? '—'}</td>
                    <td>{s.condition ?? '—'}</td>
                    <td>{s.qualityGrade ?? '—'}</td>
                    <td>{s.hood ?? '—'}</td>
                    <td className="tf-right tf-mono">{fmtR(s.salesRatio)}</td>
                    <td>
                      <span className={`tf-badge ${s.qualificationSource === 'decision' ? 'tf-badge--blue' : 'tf-badge--gray'}`}>
                        {s.qualificationSource}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="tf-btn" style={{ fontSize: 11, padding: '4px 10px' }}>← Prev</button>
              <span style={{ fontSize: 12, color: 'rgba(226,232,240,.6)', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="tf-btn" style={{ fontSize: 11, padding: '4px 10px' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
