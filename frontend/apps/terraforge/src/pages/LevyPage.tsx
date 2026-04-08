import { useEffect, useState } from 'react';

const API = '/api/levy';

// ── Types ──────────────────────────────────────────────────────────────────

interface LevyRate {
  levyCd: string;
  levyTypeCd: string | null;
  levyDescription: string | null;
  levyRate: number;
  taxDistrictId: number;
  includeInCertification: boolean;
}

interface RatesResponse {
  year: number;
  count: number;
  rates: LevyRate[];
}

interface BreakdownLine {
  levyCd: string;
  levyTypeCd: string | null;
  levyDescription: string | null;
  levyRate: number;
  amount: number;
}

interface CalcResponse {
  taxAreaNumber: string;
  assessedValue: number;
  year: number;
  totalLevy: number;
  breakdown: BreakdownLine[];
}

// ── Formatters ─────────────────────────────────────────────────────────────

const fmtRate  = (r: number) => r.toFixed(4);
const fmt$     = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Rate Table ─────────────────────────────────────────────────────────────

function RatesSection() {
  const [year,    setYear]    = useState(2026);
  const [data,    setData]    = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/rates?year=${year}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <section className="tf-section">
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Levy Rates</h3>
        <div className="tf-filters">
          <label>
            Tax year
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          {data && (
            <span className="tf-count">
              {data.count} levy codes · {year}
            </span>
          )}
        </div>
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error   && <p className="tf-error">Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Levy Code</th>
                <th>Description</th>
                <th>Type</th>
                <th className="tf-right">Rate / $1,000 AV</th>
                <th>Certified</th>
              </tr>
            </thead>
            <tbody>
              {data.rates.length === 0 && (
                <tr><td colSpan={5} className="tf-empty">No levy rates seeded for {year}. Run sync first.</td></tr>
              )}
              {data.rates.map(r => (
                <tr key={r.levyCd}>
                  <td className="tf-mono">{r.levyCd}</td>
                  <td>{r.levyDescription ?? '—'}</td>
                  <td>
                    <span className="tf-badge tf-badge--gray">{r.levyTypeCd ?? '—'}</span>
                  </td>
                  <td className="tf-right tf-mono">{fmtRate(r.levyRate)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {r.includeInCertification ? (
                      <span className="tf-badge tf-badge--green">Yes</span>
                    ) : (
                      <span className="tf-badge tf-badge--gray">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Bill Calculator ────────────────────────────────────────────────────────

function CalculatorSection() {
  const [year,          setYear]          = useState(2026);
  const [taxAreaNumber, setTaxAreaNumber] = useState('');
  const [assessedValue, setAssessedValue] = useState('');
  const [result,        setResult]        = useState<CalcResponse | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  function runCalc() {
    if (!taxAreaNumber.trim() || !assessedValue.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const params = new URLSearchParams({
      taxAreaNumber: taxAreaNumber.trim(),
      assessedValue:  assessedValue.trim(),
      year:           String(year)
    });
    fetch(`${API}/calculate?${params}`)
      .then(async r => {
        if (r.status === 404) throw new Error(`Tax area ${taxAreaNumber} not found for ${year}`);
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Levy Bill Calculator</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          Enter a tax area code and assessed value to compute the itemized levy bill.
        </p>
      </div>

      <div className="tf-filters" style={{ alignItems: 'flex-end', gap: 12 }}>
        <label>
          Tax year
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          Tax area number
          <input
            type="text"
            placeholder="e.g. 1210"
            value={taxAreaNumber}
            onChange={e => setTaxAreaNumber(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 100 }}
          />
        </label>
        <label>
          Assessed value ($)
          <input
            type="number"
            placeholder="e.g. 400000"
            value={assessedValue}
            onChange={e => setAssessedValue(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 120 }}
          />
        </label>
        <button
          onClick={runCalc}
          disabled={loading || !taxAreaNumber.trim() || !assessedValue.trim()}
          className="tf-btn"
        >
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      {error  && <p className="tf-error" style={{ marginTop: 12 }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 13 }}>
            Tax area <strong style={{ color: '#e2e8f0' }}>{result.taxAreaNumber}</strong> · AV {fmt$(result.assessedValue)} · Year {result.year}
          </div>

          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Levy Code</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="tf-right">Rate / $1,000</th>
                  <th className="tf-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map(line => (
                  <tr key={line.levyCd}>
                    <td className="tf-mono">{line.levyCd}</td>
                    <td>{line.levyDescription ?? '—'}</td>
                    <td><span className="tf-badge tf-badge--gray">{line.levyTypeCd ?? '—'}</span></td>
                    <td className="tf-right tf-mono">{fmtRate(line.levyRate)}</td>
                    <td className="tf-right tf-mono">{fmt$(line.amount)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid rgba(255,255,255,.15)', fontWeight: 600 }}>
                  <td colSpan={4} style={{ textAlign: 'right', paddingRight: 16, color: '#e2e8f0' }}>
                    Total Levy
                  </td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA' }}>
                    {fmt$(result.totalLevy)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LevyPage() {
  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 24 }}>
        <h2>Levy Rates</h2>
        <p className="tf-page-sub">
          Benton County WA — certified levy rates per $1,000 assessed value · Source: PACS dbo.levy
        </p>
      </div>

      <RatesSection />
      <CalculatorSection />
    </div>
  );
}
