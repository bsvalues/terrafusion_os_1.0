import { useEffect, useState } from 'react';
import { CuSubNav } from './CurrentUsePage';

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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtFull$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ padding: '12px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 34, background: 'linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.03) 75%)',
          backgroundSize: '200% 100%', borderRadius: 6, marginBottom: 6,
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6,
          padding: '6px 10px', fontSize: 11, color: '#e2e8f0', whiteSpace: 'nowrap', zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,.5)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ── Rate Bar Chart (CSS-only) ──────────────────────────────────────────────

function RateChart({ rates }: { rates: InterestRate[] }) {
  const maxRate = Math.max(...rates.map(r => r.rate), 0.01);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginBottom: 16, padding: '0 4px' }}>
      {rates.map(r => {
        const height = Math.max((r.rate / maxRate) * 70, 4);
        return (
          <Tip key={r.year} text={`${r.year}: ${fmtPct(r.rate)}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '100%', maxWidth: 28, height, borderRadius: '3px 3px 0 0',
                background: `linear-gradient(180deg, #00FFAA, rgba(0,255,170,.4))`,
                transition: 'height 0.3s ease',
              }} />
              <span style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{String(r.year).slice(2)}</span>
            </div>
          </Tip>
        );
      })}
    </div>
  );
}

// ── Rates Table Section ────────────────────────────────────────────────────

function RatesSection() {
  const [data, setData] = useState<InterestRate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`${API}/interest-rates`)
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tf-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Published Interest Rates
            <Tip text="WA DOR rates per WAC 458-30-262, used for compound interest on rollback taxes">
              <span style={{ fontSize: 13, color: '#64748b', cursor: 'help' }}>?</span>
            </Tip>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            WA Department of Revenue published rates · WAC 458-30-262
          </p>
        </div>
        {data && <span style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,.04)', padding: '4px 10px', borderRadius: 12 }}>{data.length} years</span>}
      </div>

      {loading && <Skeleton rows={6} />}
      {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}

      {data && data.length > 0 && (
        <>
          <RateChart rates={data} />
          <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="tf-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="tf-right">Rate</th>
                  <th>Source</th>
                  <th>Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.year} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td className="tf-mono">{r.year}</td>
                    <td className="tf-right tf-mono" style={{ color: '#00FFAA' }}>{fmtPct(r.rate)}</td>
                    <td style={{ fontSize: 12 }}>{r.source}</td>
                    <td style={{ fontSize: 12 }}>{r.effectiveDate ? new Date(r.effectiveDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

// ── Interest Calculator Section ────────────────────────────────────────────

function InterestCalculatorSection() {
  const [principal, setPrincipal] = useState('100000');
  const [startYear, setStartYear] = useState(2018);
  const [endYear, setEndYear] = useState(2025);
  const [result, setResult] = useState<InterestCalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runCalc() {
    if (!principal.trim()) return;
    setLoading(true); setError(null); setResult(null);
    const params = new URLSearchParams({ principal: principal.trim(), startYear: String(startYear), endYear: String(endYear) });
    fetch(`${API}/interest/calculate?${params}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  function exportCSV() {
    if (!result) return;
    const hdr = 'Year,Rate,Year Interest,Cumulative';
    const rows = result.breakdown.map(b => `${b.year},${b.rate},${b.yearInterest},${b.cumulative}`);
    rows.push('', `Principal,,,${result.principal}`, `Total Interest,,,${result.totalInterest}`, `Total Due,,,${result.totalDue}`);
    const blob = new Blob([hdr + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `interest_calc_${startYear}-${endYear}.csv`;
    a.click();
  }

  const inputStyle = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 };

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16 }}>Interest Calculator</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          Compute compound interest on rollback tax principal using DOR rates
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Principal ($)
          <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Start Year
          <input type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} min={2016} max={2026} style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          End Year
          <input type="number" value={endYear} onChange={e => setEndYear(Number(e.target.value))} min={2016} max={2026} style={inputStyle} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={runCalc} disabled={loading || !principal.trim()} className="tf-btn" style={{ fontSize: 13 }}>
          {loading ? 'Calculating…' : 'Calculate Interest'}
        </button>
        {result && (
          <button onClick={exportCSV} style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
            Export CSV
          </button>
        )}
      </div>

      {error && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Principal</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{fmtFull$(result.principal)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Total Interest</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{fmtFull$(result.totalInterest)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(0,255,170,.3)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#00FFAA', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Total Due</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#00FFAA', fontFamily: 'monospace' }}>{fmtFull$(result.totalDue)}</div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="tf-table" style={{ fontSize: 13 }}>
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
                  <tr key={b.year} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td className="tf-mono">{b.year}</td>
                    <td className="tf-right tf-mono">{fmtPct(b.rate)}</td>
                    <td className="tf-right tf-mono">{fmtFull$(b.yearInterest)}</td>
                    <td className="tf-right tf-mono" style={{ color: '#00FFAA' }}>{fmtFull$(b.cumulative)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid rgba(0,255,170,.25)', fontWeight: 600 }}>
                  <td colSpan={2} style={{ fontSize: 11, color: '#64748b' }}>{result.breakdown.length} years compound</td>
                  <td className="tf-right" style={{ color: '#94a3b8', fontSize: 12 }}>Total</td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA', fontSize: 14 }}>{fmtFull$(result.totalDue)}</td>
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

export default function CurrentUseInterestPage() {
  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, color: '#f1f5f9' }}>Current Use Program</h2>
        <p className="tf-page-sub" style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
          Benton County WA — DOR interest rates and compound interest calculation for rollback taxes
        </p>
      </div>
      <CuSubNav />
      <RatesSection />
      <InterestCalculatorSection />
    </div>
  );
}
