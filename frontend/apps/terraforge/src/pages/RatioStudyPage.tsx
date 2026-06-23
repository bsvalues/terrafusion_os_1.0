import { useEffect, useState } from 'react';

const API = '/api/terraforge/ratio-study';

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtR = (n: number | null) => n == null ? '—' : n.toFixed(4);
const fmtPct = (n: number | null) => n == null ? '—' : n.toFixed(2) + '%';
const fmtDate = (s: string) => s.slice(0, 10);

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

function IaaoGate({ label, value, lo, hi }: { label: string; value: number | null; lo: number; hi: number }) {
  if (value == null) return null;
  const pass = value >= lo && value <= hi;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className={`tf-badge ${pass ? 'tf-badge--green' : 'tf-badge--red'}`}>
        {label}: {label === 'COD' ? fmtPct(value) : fmtR(value)}
        {pass ? ' PASS' : ' FAIL'}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(148,163,184,.5)' }}>
        (target: {label === 'COD' ? `≤${hi}%` : `${lo}–${hi}`})
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RatioStudyPage() {
  const [taxYear, setTaxYear]   = useState(2026);
  const [hood, setHood]         = useState('');
  const [propType, setPropType] = useState('');
  const [page, setPage]         = useState(1);
  const [data, setData]         = useState<RatioStudyResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const pageSize = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ taxYear: String(taxYear), pageSize: String(pageSize), page: String(page) });
    if (hood)     params.set('hood', hood);
    if (propType) params.set('propertyType', propType);
    fetch(`${API}?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, hood, propType, page]);

  const { stats, total, countWithRatio, outliersExcluded, items } = data ?? {};
  const totalPages = total ? Math.ceil(total / pageSize) : 0;

  const exportCsv = () => {
    if (!items?.length) return;
    const header = 'Parcel,Sale Date,Sale Price,GLA,Year Built,Hood,Sales Ratio,Source\n';
    const rows = items.map(r =>
      `${r.parcelId},${fmtDate(r.saleDate)},${r.salePrice},${r.gla ?? ''},${r.yearBuilt ?? ''},${r.hood ?? ''},${r.salesRatio?.toFixed(4) ?? ''},${r.qualificationSource}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ratio_study_${taxYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRatioReport = () => {
    if (!stats) return;
    fetch('/api/reports/ratio-study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        area: hood || 'All Areas',
        taxYear,
        sampleSize: countWithRatio ?? total ?? 0,
        medianRatio: stats.medianRatio ?? 1.0,
        meanRatio: stats.meanRatio ?? 1.0,
        cod: stats.cod ?? 0,
        prd: stats.prd ?? 1.0,
        prb: stats.prb ?? null,
        strata: [],
      }),
    })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ratio-study_${hood || 'all'}_${taxYear}.html`;
        a.click();
      })
      .catch(() => window.print());
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13 };

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>Ratio Study<Tooltip text="IAAO Standard on Ratio Studies — measures assessment uniformity and equity. Median ratio target: 0.95–1.05, COD ≤ 15%, PRD 0.98–1.03." /></h2>
        <p className="tf-page-sub">Benton County WA — IAAO ratio analysis for assessment equity</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Tax Year
          <select value={taxYear} onChange={e => { setTaxYear(Number(e.target.value)); setPage(1); }} style={inputStyle}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Neighborhood
          <input type="text" placeholder="e.g. 15112" value={hood} onChange={e => { setHood(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 100 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Prop Type
          <input type="text" placeholder="e.g. R" value={propType} onChange={e => { setPropType(e.target.value); setPage(1); }} style={{ ...inputStyle, width: 60 }} />
        </label>
        <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'flex-end' }}>⬇ CSV</button>
        {stats && <button onClick={downloadRatioReport} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'flex-end', borderColor: 'rgba(0,255,170,.4)', color: '#00FFAA' }}>↓ Ratio Report</button>}
      </div>

      {/* Summary stats */}
      {data && (
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,.7)', marginBottom: 12 }}>
          {total?.toLocaleString()} qualified · {countWithRatio?.toLocaleString()} with ratio
          {outliersExcluded != null && outliersExcluded > 0 && (
            <span style={{ marginLeft: 8 }}>· {outliersExcluded} IQR outliers excluded from stats</span>
          )}
        </div>
      )}

      {/* IAAO stats cards */}
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
            <IaaoGate label="COD" value={stats.cod} lo={0} hi={15} />
            <IaaoGate label="PRD" value={stats.prd} lo={0.98} hi={1.03} />
          </div>
        </div>
      )}

      {loading && <Skeleton rows={10} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {/* Sales table */}
      {!loading && !error && items && (
        <>
          <div className="tf-table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Sale Date</th>
                  <th className="tf-right">Sale Price</th>
                  <th className="tf-right">GLA</th>
                  <th>Year Built</th>
                  <th>Hood</th>
                  <th className="tf-right">Sales Ratio</th>
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
