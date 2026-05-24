import { useEffect, useState } from 'react';
import { CuSubNav } from './CurrentUsePage';
import './CUForge.css';

function Tooltip({ text }: { text: string }) {
  return (
    <span title={text} style={{ cursor: 'help', marginLeft: 6, fontSize: 12, color: 'rgba(148,163,184,.7)' }}>ⓘ</span>
  );
}

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

// ── Rate Bar Chart (CSS-only) ──────────────────────────────────────────────

function RateChart({ rates }: { rates: InterestRate[] }) {
  const maxRate = Math.max(...rates.map(r => r.rate), 0.01);
  return (
    <div className="cu-rate-chart">
      {rates.map(r => {
        const height = Math.max((r.rate / maxRate) * 70, 4);
        return (
          <div key={r.year} className="cu-rate-chart__bar-wrap" title={`${r.year}: ${fmtPct(r.rate)}`}>
            <div className="cu-rate-chart__bar" style={{ height }} />
            <span className="cu-rate-chart__label">{String(r.year).slice(2)}</span>
          </div>
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
      <div className="cu-action-bar" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>Published Interest Rates</span>
        {data && <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>{data.length} years</span>}
      </div>

      <div className="cu-rcw-callout" style={{ marginBottom: 14 }}>
        <div className="cu-rcw-callout__label">WAC 458-30-590</div>
        WA DOR (Department of Revenue) inflation rates used for interest on rollback additional tax
      </div>

      {loading && <div className="cu-state" role="status">Loading rates…</div>}
      {error && <div className="cu-state cu-state--error">{error}</div>}

      {data && data.length > 0 && (
        <>
          <RateChart rates={data} />
          <div className="cu-table-scroll tf-table-wrap">
            <table className="tf-table cu-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="cu-right tf-right">Rate</th>
                  <th>Source</th>
                  <th>Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => (
                  <tr key={r.year}>
                    <td className="cu-mono tf-mono">{r.year}</td>
                    <td className="cu-right tf-right cu-mono tf-mono" style={{ color: 'var(--cu-success)' }}>{fmtPct(r.rate)}</td>
                    <td style={{ fontSize: '0.75rem' }}>{r.source}</td>
                    <td style={{ fontSize: '0.75rem' }}>{r.effectiveDate ? new Date(r.effectiveDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
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

  return (
    <section className="tf-section" style={{ marginTop: 24 }}>
      <div className="cu-action-bar" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>Interest Calculator</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>Compound interest on rollback tax principal</span>
      </div>

      <div className="cu-filterbar">
        <div className="cu-filter-row">
          <div className="cu-filter-group">
            <span className="cu-filter-label">Principal ($)</span>
            <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} className="cu-filter-input" style={{ width: 120 }} />
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Start Year</span>
            <input type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} min={2010} max={2026} className="cu-filter-input" style={{ width: 80 }} />
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">End Year</span>
            <input type="number" value={endYear} onChange={e => setEndYear(Number(e.target.value))} min={2010} max={2026} className="cu-filter-input" style={{ width: 80 }} />
          </div>
          <div className="cu-filter-actions">
            <button onClick={runCalc} disabled={loading || !principal.trim()} className="cu-btn cu-btn--primary">
              {loading ? 'Calculating…' : 'Calculate Interest'}
            </button>
            {result && <button onClick={exportCSV} className="cu-btn cu-btn--ghost">Export CSV</button>}
          </div>
        </div>
      </div>

      {error && <div className="cu-state cu-state--error">{error}</div>}

      {result && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, margin: '16px 0' }}>
            <div className="cu-stats-section" style={{ margin: 0, padding: '10px 12px', borderRadius: 8 }}>
              <div className="cu-stats-heading" style={{ marginBottom: 4 }}>Principal</div>
              <div className="cu-stats-kpi__value" style={{ fontSize: '1.125rem' }}>{fmtFull$(result.principal)}</div>
            </div>
            <div className="cu-stats-section" style={{ margin: 0, padding: '10px 12px', borderRadius: 8 }}>
              <div className="cu-stats-heading" style={{ marginBottom: 4 }}>Total Interest</div>
              <div className="cu-stats-kpi__value" style={{ fontSize: '1.125rem' }}>{fmtFull$(result.totalInterest)}</div>
            </div>
            <div className="cu-stats-section" style={{ margin: 0, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--cu-success)' }}>
              <div className="cu-stats-heading" style={{ marginBottom: 4 }}>Total Due</div>
              <div className="cu-stats-kpi__value cu-stats-kpi__value--ok" style={{ fontSize: '1.125rem' }}>{fmtFull$(result.totalDue)}</div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="cu-table-scroll tf-table-wrap">
            <table className="tf-table cu-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="cu-right tf-right">Rate</th>
                  <th className="cu-right tf-right">Year Interest</th>
                  <th className="cu-right tf-right">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map(b => (
                  <tr key={b.year}>
                    <td className="cu-mono tf-mono">{b.year}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmtPct(b.rate)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmtFull$(b.yearInterest)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono" style={{ color: 'var(--cu-success)' }}>{fmtFull$(b.cumulative)}</td>
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function CurrentUseInterestPage() {
  return (
    <div className="tf-page cu-workspace" data-testid="cu-workspace">
      <header className="cu-header">
        <div className="cu-header__row">
          <div>
            <div className="cu-header__eyebrow">TerraFusion · Current Use Program</div>
            <h1 className="cu-header__title">CUForge — Interest Rates</h1>
          </div>
        </div>
        <CuSubNav />
      </header>

      <div className="cu-body">
        <div className="cu-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div className="cu-main">
            <RatesSection />
            <InterestCalculatorSection />
          </div>
        </div>
      </div>
    </div>
  );
}
