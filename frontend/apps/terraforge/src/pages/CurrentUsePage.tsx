import { useEffect, useState } from 'react';

const API = '/api/currentuse';

// ── Types ──────────────────────────────────────────────────────────────────

interface Classification {
  id: string;
  parcelId: string;
  classificationCode: string;
  description: string;
  enrollmentDate: string;
  status: string;
  acreage: number | null;
  currentMarketValue: number | null;
  currentUseValue: number | null;
  taxSavings: number | null;
  countyId: string | null;
}

interface ClassificationsResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Classification[];
}

interface RollbackInput {
  parcelId: string;
  classificationCode: string;
  enrollmentYear: number;
  removalYear: number;
  marketValues: Record<string, number>;
  currentUseValues: Record<string, number>;
  penaltyExceptionCode: string;
}

interface YearBreakdown {
  year: number;
  marketValue: number;
  currentUseValue: number;
  difference: number;
  interestRate: number;
  interestAmount: number;
  subtotal: number;
}

interface RollbackResult {
  totalRollbackTax: number;
  totalInterest: number;
  totalPenalty: number;
  grandTotal: number;
  yearBreakdowns: YearBreakdown[];
  penaltyApplied: boolean;
  penaltyExceptionApplied: boolean;
  exceptionCode: string | null;
}

// ── Formatters ─────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n: number) => (n * 100).toFixed(2) + '%';
const fmtDate = (s: string) => s.slice(0, 10);

// ── Classifications Section ────────────────────────────────────────────────

function ClassificationsSection() {
  const [status, setStatus] = useState('Active');
  const [code, setCode] = useState('');
  const [data, setData] = useState<ClassificationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ pageSize: '50' });
    if (status) params.set('status', status);
    if (code) params.set('classificationCode', code);
    fetch(`${API}/classifications?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [status, code]);

  return (
    <section className="tf-section">
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Current Use Classifications</h3>
        <div className="tf-filters">
          <label>
            Status
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Removed">Removed</option>
              <option value="Pending">Pending</option>
            </select>
          </label>
          <label>
            Code
            <input
              type="text"
              placeholder="e.g. DFL"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 80 }}
            />
          </label>
          {data && (
            <span className="tf-count">{data.total.toLocaleString()} classifications</span>
          )}
        </div>
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error && <p className="tf-error">Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Parcel</th>
                <th>Code</th>
                <th>Description</th>
                <th>Enrolled</th>
                <th>Status</th>
                <th className="tf-right">Acreage</th>
                <th className="tf-right">Market Value</th>
                <th className="tf-right">CU Value</th>
                <th className="tf-right">Tax Savings</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr><td colSpan={9} className="tf-empty">No classifications match these filters.</td></tr>
              )}
              {data.items.map(c => (
                <tr key={c.id}>
                  <td className="tf-mono">{c.parcelId}</td>
                  <td>
                    <span className="tf-badge tf-badge--blue">{c.classificationCode}</span>
                  </td>
                  <td>{c.description}</td>
                  <td>{fmtDate(c.enrollmentDate)}</td>
                  <td>
                    <span className={`tf-badge ${c.status === 'Active' ? 'tf-badge--green' : c.status === 'Removed' ? 'tf-badge--red' : 'tf-badge--gray'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="tf-right">{c.acreage?.toFixed(1) ?? '—'}</td>
                  <td className="tf-right tf-mono">{c.currentMarketValue != null ? fmt$(c.currentMarketValue) : '—'}</td>
                  <td className="tf-right tf-mono">{c.currentUseValue != null ? fmt$(c.currentUseValue) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ color: c.taxSavings && c.taxSavings > 0 ? '#00FFAA' : undefined }}>
                    {c.taxSavings != null ? fmt$(c.taxSavings) : '—'}
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

// ── Rollback Calculator Section ────────────────────────────────────────────

function RollbackCalculatorSection() {
  const [parcelId, setParcelId] = useState('');
  const [classCode, setClassCode] = useState('DFL');
  const [enrollYear, setEnrollYear] = useState(2018);
  const [removalYear, setRemovalYear] = useState(2026);
  const [result, setResult] = useState<RollbackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runCalculation() {
    if (!parcelId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const body: RollbackInput = {
      parcelId: parcelId.trim(),
      classificationCode: classCode,
      enrollmentYear: enrollYear,
      removalYear: removalYear,
      marketValues: {},
      currentUseValues: {},
      penaltyExceptionCode: '',
    };

    // Generate sample values for the year range
    for (let y = enrollYear; y <= removalYear; y++) {
      body.marketValues[String(y)] = 350000 + (y - enrollYear) * 15000;
      body.currentUseValues[String(y)] = 45000 + (y - enrollYear) * 2000;
    }

    fetch(`${API}/rollback/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || r.statusText);
        }
        return r.json();
      })
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Rollback Tax Calculator</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          Calculate rollback taxes, interest, and penalties per RCW 84.33/84.34 upon removal from current use.
        </p>
      </div>

      <div className="tf-filters" style={{ alignItems: 'flex-end', gap: 12 }}>
        <label>
          Parcel ID
          <input
            type="text"
            placeholder="e.g. 1-0234-100-0001"
            value={parcelId}
            onChange={e => setParcelId(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 160 }}
          />
        </label>
        <label>
          Classification
          <select value={classCode} onChange={e => setClassCode(e.target.value)}>
            <option value="DFL">DFL — Designated Forest Land</option>
            <option value="CUFA">CUFA — Current Use Farm/Ag</option>
            <option value="CUOS">CUOS — Current Use Open Space</option>
            <option value="CUTL">CUTL — Current Use Timber Land</option>
          </select>
        </label>
        <label>
          Enrollment Year
          <input
            type="number"
            value={enrollYear}
            onChange={e => setEnrollYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        <label>
          Removal Year
          <input
            type="number"
            value={removalYear}
            onChange={e => setRemovalYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        <button
          onClick={runCalculation}
          disabled={loading || !parcelId.trim()}
          className="tf-btn"
        >
          {loading ? 'Calculating…' : 'Calculate Rollback'}
        </button>
      </div>

      {error && <p className="tf-error" style={{ marginTop: 12 }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">Rollback Tax</div>
              <div className="tf-cardBig">{fmt$(result.totalRollbackTax)}</div>
            </div>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">Interest</div>
              <div className="tf-cardBig">{fmt$(result.totalInterest)}</div>
            </div>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">Penalty (20%)</div>
              <div className="tf-cardBig">{fmt$(result.totalPenalty)}</div>
              {result.penaltyExceptionApplied && (
                <div className="tf-cardSmall" style={{ color: '#00FFAA' }}>
                  Exception: {result.exceptionCode}
                </div>
              )}
            </div>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default', borderColor: '#00FFAA' }}>
              <div className="tf-cardTag" style={{ color: '#00FFAA' }}>Grand Total</div>
              <div className="tf-cardBig" style={{ color: '#00FFAA' }}>{fmt$(result.grandTotal)}</div>
            </div>
          </div>

          {/* Year breakdown table */}
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="tf-right">Market Value</th>
                  <th className="tf-right">CU Value</th>
                  <th className="tf-right">Difference</th>
                  <th className="tf-right">Interest Rate</th>
                  <th className="tf-right">Interest</th>
                  <th className="tf-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {result.yearBreakdowns.map(yb => (
                  <tr key={yb.year}>
                    <td className="tf-mono">{yb.year}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.marketValue)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.currentUseValue)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.difference)}</td>
                    <td className="tf-right tf-mono">{fmtPct(yb.interestRate)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.interestAmount)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.subtotal)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid rgba(255,255,255,.15)', fontWeight: 600 }}>
                  <td colSpan={5} />
                  <td className="tf-right" style={{ color: '#e2e8f0' }}>Total</td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA' }}>
                    {fmt$(result.grandTotal)}
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

export default function CurrentUsePage() {
  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 24 }}>
        <h2>Current Use</h2>
        <p className="tf-page-sub">
          Benton County WA — RCW 84.33/84.34 current use classifications, rollback tax calculations, and removal processing
        </p>
      </div>

      <ClassificationsSection />
      <RollbackCalculatorSection />
    </div>
  );
}
