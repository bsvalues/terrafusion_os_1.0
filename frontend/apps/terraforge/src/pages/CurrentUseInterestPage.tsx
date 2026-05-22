import { useEffect, useState } from 'react';

const API = '/api/currentuse';

// ── Types ──────────────────────────────────────────────────────────────────

interface InterestRate {
  year: number;
  rate: number;
  source: string;
  effectiveDate: string;
}

interface InterestCalcResult {
  principal: number;
  totalInterest: number;
  totalDue: number;
  startYear: number;
  endYear: number;
  breakdown: { year: number; rate: number; yearInterest: number; cumulative: number }[];
}

// ── Formatters ─────────────────────────────────────────────────────────────

const fmtPct = (n: number) => (n * 100).toFixed(2) + '%';
const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s: string) => s.slice(0, 10);

// ── Rates Table Section ────────────────────────────────────────────────────

function RatesSection() {
  const [data, setData] = useState<InterestRate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/interest-rates`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tf-section">
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Published Interest Rates</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          DOR-published rates used for rollback interest calculation per WAC 458-30-262.
        </p>
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error && <p className="tf-error">Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Year</th>
                <th className="tf-right">Rate</th>
                <th>Source</th>
                <th>Effective Date</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={4} className="tf-empty">No interest rates loaded. Run seed first.</td></tr>
              )}
              {data.map(r => (
                <tr key={r.year}>
                  <td className="tf-mono">{r.year}</td>
                  <td className="tf-right tf-mono">{fmtPct(r.rate)}</td>
                  <td>{r.source}</td>
                  <td>{fmtDate(r.effectiveDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Interest Calculator Section ────────────────────────────────────────────

function InterestCalculatorSection() {
  const [principal, setPrincipal] = useState('100000');
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2026);
  const [result, setResult] = useState<InterestCalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runCalc() {
    if (!principal.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({
      principal: principal.trim(),
      startYear: String(startYear),
      endYear: String(endYear),
    });

    fetch(`${API}/interest/calculate?${params}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text() || r.statusText);
        return r.json();
      })
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Interest Calculator</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          Compute compound interest on rollback tax principal using DOR rates.
        </p>
      </div>

      <div className="tf-filters" style={{ alignItems: 'flex-end', gap: 12 }}>
        <label>
          Principal ($)
          <input
            type="number"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 120 }}
          />
        </label>
        <label>
          Start Year
          <input
            type="number"
            value={startYear}
            onChange={e => setStartYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        <label>
          End Year
          <input
            type="number"
            value={endYear}
            onChange={e => setEndYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 70 }}
          />
        </label>
        <button
          onClick={runCalc}
          disabled={loading || !principal.trim()}
          className="tf-btn"
        >
          {loading ? 'Calculating…' : 'Calculate Interest'}
        </button>
      </div>

      {error && <p className="tf-error" style={{ marginTop: 12 }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">Principal</div>
              <div className="tf-cardBig">{fmt$(result.principal)}</div>
            </div>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">Total Interest</div>
              <div className="tf-cardBig">{fmt$(result.totalInterest)}</div>
            </div>
            <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default', borderColor: '#00FFAA' }}>
              <div className="tf-cardTag" style={{ color: '#00FFAA' }}>Total Due</div>
              <div className="tf-cardBig" style={{ color: '#00FFAA' }}>{fmt$(result.totalDue)}</div>
            </div>
          </div>

          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="tf-right">Rate</th>
                  <th className="tf-right">Year Interest</th>
                  <th className="tf-right">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map(b => (
                  <tr key={b.year}>
                    <td className="tf-mono">{b.year}</td>
                    <td className="tf-right tf-mono">{fmtPct(b.rate)}</td>
                    <td className="tf-right tf-mono">{fmt$(b.yearInterest)}</td>
                    <td className="tf-right tf-mono">{fmt$(b.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CurrentUseInterestPage() {
  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 24 }}>
        <h2>Current Use Interest</h2>
        <p className="tf-page-sub">
          Benton County WA — DOR interest rates and compound interest calculation for rollback taxes
        </p>
      </div>

      <RatesSection />
      <InterestCalculatorSection />
    </div>
  );
}
