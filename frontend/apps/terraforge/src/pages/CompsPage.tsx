import { useEffect, useState } from 'react';

const API = '/api/terraforge/comps-pool';

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

const fmt$ = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDate = (s: string) => s.slice(0, 10);
const fmtR = (n: number | null) => (n == null ? '—' : n.toFixed(3));

export default function CompsPage() {
  const [taxYear, setTaxYear]     = useState(2026);
  const [hood, setHood]           = useState('');
  const [propType, setPropType]   = useState('');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [minGla, setMinGla]       = useState('');
  const [maxGla, setMaxGla]       = useState('');
  const [data, setData]           = useState<CompsResponse | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams({ taxYear: String(taxYear), pageSize: '50' });
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
  }, [taxYear, hood, propType, minPrice, maxPrice, minGla, maxGla]);

  return (
    <div className="tf-page">
      <div className="tf-page-header">
        <h2>Comparable Sales</h2>
        <p className="tf-page-sub">Effective qualified comps pool — Benton County WA</p>
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
          Hood
          <input
            type="text"
            placeholder="e.g. 15112"
            value={hood}
            onChange={e => setHood(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 80 }}
          />
        </label>
        <label>
          Type
          <input
            type="text"
            placeholder="e.g. 11"
            value={propType}
            onChange={e => setPropType(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 60 }}
          />
        </label>
        <label>
          Min $
          <input
            type="number"
            placeholder="100000"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 90 }}
          />
        </label>
        <label>
          Max $
          <input
            type="number"
            placeholder="1000000"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 90 }}
          />
        </label>
        <label>
          Min GLA
          <input
            type="number"
            placeholder="800"
            value={minGla}
            onChange={e => setMinGla(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        <label>
          Max GLA
          <input
            type="number"
            placeholder="5000"
            value={maxGla}
            onChange={e => setMaxGla(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        {data != null && (
          <span className="tf-count">{data.total.toLocaleString()} qualified sales</span>
        )}
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error   && <p className="tf-error">Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap">
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
                <th className="tf-right">PACS Ratio</th>
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
      )}
    </div>
  );
}
