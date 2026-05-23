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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtRate = (r: number) => r.toFixed(4);
const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

// ── Sub-Navigation ─────────────────────────────────────────────────────────

type Tab = 'rates' | 'calculator';

function SubNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'rates', label: 'Levy Rates' },
    { id: 'calculator', label: 'Bill Calculator' },
  ];
  return (
    <nav style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 0 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: active === t.id ? 700 : 500,
            color: active === t.id ? '#00FFAA' : 'rgba(226,232,240,.6)',
            background: active === t.id ? 'rgba(0,255,170,.06)' : 'transparent',
            border: 'none',
            borderBottom: active === t.id ? '2px solid #00FFAA' : '2px solid transparent',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            transition: 'all .15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ── Rate Table Section ─────────────────────────────────────────────────────

function RatesSection() {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/rates?year=${year}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [year]);

  const filtered = data?.rates.filter(r =>
    !filter || r.levyCd.toLowerCase().includes(filter.toLowerCase()) ||
    (r.levyDescription ?? '').toLowerCase().includes(filter.toLowerCase())
  ) ?? [];

  const totalRate = filtered.reduce((sum, r) => sum + r.levyRate, 0);

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = 'Levy Code,Description,Type,Rate per $1000,Certified\n';
    const rows = filtered.map(r => `${r.levyCd},"${r.levyDescription ?? ''}",${r.levyTypeCd ?? ''},${r.levyRate.toFixed(4)},${r.includeInCertification}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `levy_rates_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Certified Levy Rates<Tooltip text="Levy rates per $1,000 of assessed value as certified by the Benton County Assessor. Per RCW 84.52." /></h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>
            {filtered.length} levy codes · Total composite rate: {fmtRate(totalRate)} / $1,000
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 12 }}>
            {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input type="text" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 12, width: 120 }} />
          <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px' }}>⬇ CSV</button>
        </div>
      </div>

      {loading && <Skeleton rows={10} />}
      {error && <p className="tf-error" style={{ marginTop: 8 }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="tf-table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
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
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="tf-empty">No levy rates found for {year}.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.levyCd}>
                  <td className="tf-mono">{r.levyCd}</td>
                  <td>{r.levyDescription ?? '—'}</td>
                  <td><span className="tf-badge tf-badge--gray">{r.levyTypeCd ?? '—'}</span></td>
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
              {filtered.length > 0 && (
                <tr style={{ borderTop: '1px solid rgba(255,255,255,.15)', fontWeight: 600 }}>
                  <td colSpan={3} style={{ textAlign: 'right', paddingRight: 16, color: '#e2e8f0' }}>Total Composite Rate</td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA' }}>{fmtRate(totalRate)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Bill Calculator Section ────────────────────────────────────────────────

function CalculatorSection() {
  const [year, setYear] = useState(2026);
  const [taxAreaNumber, setTaxAreaNumber] = useState('');
  const [assessedValue, setAssessedValue] = useState('');
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function runCalc() {
    if (!taxAreaNumber.trim() || !assessedValue.trim()) return;
    setLoading(true); setError(null); setResult(null);
    const params = new URLSearchParams({ taxAreaNumber: taxAreaNumber.trim(), assessedValue: assessedValue.trim(), year: String(year) });
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

  const exportCsv = () => {
    if (!result) return;
    const header = 'Levy Code,Description,Type,Rate per $1000,Amount\n';
    const rows = result.breakdown.map(l => `${l.levyCd},"${l.levyDescription ?? ''}",${l.levyTypeCd ?? ''},${l.levyRate.toFixed(4)},${l.amount.toFixed(2)}`).join('\n');
    const blob = new Blob([header + rows + `\nTOTAL,,,, ${result.totalLevy.toFixed(2)}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `levy_bill_${result.taxAreaNumber}_${result.year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadLevyReport = () => {
    if (!result) return;
    fetch('/api/reports/levy-certification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taxYear: result.year,
        certificationDate: new Date().toISOString().slice(0, 10),
        totalAV: result.assessedValue,
        totalLevy: result.totalLevy,
        districts: result.breakdown.map(l => ({
          code: l.levyCd, name: l.levyDescription ?? l.levyCd,
          assessedValue: result.assessedValue, rate: l.levyRate / 1000,
          levyAmount: l.amount, status: 'Certified',
        })),
      }),
    })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `levy-certification_${result.taxAreaNumber}_${result.year}.html`;
        a.click();
      })
      .catch(() => window.print());
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 13 };

  return (
    <section>
      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Levy Bill Calculator<Tooltip text="Computes the itemized property tax bill by applying all certified levy rates to the assessed value for a given tax area." /></h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>Enter a tax area code and assessed value to compute the itemized levy bill.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600 }}>
          Tax Year
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600 }}>
          Tax Area Number
          <input type="text" placeholder="e.g. 1210" value={taxAreaNumber} onChange={e => setTaxAreaNumber(e.target.value)} style={{ ...inputStyle, width: 100 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600 }}>
          Assessed Value ($)
          <input type="number" placeholder="e.g. 400000" value={assessedValue} onChange={e => setAssessedValue(e.target.value)} style={{ ...inputStyle, width: 130 }} />
        </label>
        <button onClick={runCalc} disabled={loading || !taxAreaNumber.trim() || !assessedValue.trim()} className="tf-btn">
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      {error && <p className="tf-error">Error: {error}</p>}

      {result && (
        <div style={{ background: 'rgba(0,255,170,.03)', border: '1px solid rgba(0,255,170,.15)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              Tax area <strong style={{ color: '#e2e8f0' }}>{result.taxAreaNumber}</strong> · AV {fmt$(result.assessedValue)} · Year {result.year}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '4px 8px' }}>⬇ CSV</button>
              <button onClick={() => window.print()} className="tf-btn" style={{ fontSize: 11, padding: '4px 8px' }}>🖨 Print</button>
              <button onClick={downloadLevyReport} className="tf-btn" style={{ fontSize: 11, padding: '4px 8px', borderColor: 'rgba(0,255,170,.4)', color: '#00FFAA' }}>↓ Report</button>
            </div>
          </div>

          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Levy Code</th><th>Description</th><th>Type</th>
                  <th className="tf-right">Rate / $1,000</th><th className="tf-right">Amount</th>
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
                  <td colSpan={4} style={{ textAlign: 'right', paddingRight: 16, color: '#e2e8f0' }}>Total Levy</td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA', fontSize: 16 }}>{fmt$(result.totalLevy)}</td>
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
  const [tab, setTab] = useState<Tab>('rates');

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>Levy Rates</h2>
        <p className="tf-page-sub">
          Benton County WA — Certified levy rates per $1,000 assessed value · Per RCW 84.52
        </p>
      </div>

      <SubNav active={tab} onChange={setTab} />

      {tab === 'rates' && <RatesSection />}
      {tab === 'calculator' && <CalculatorSection />}
    </div>
  );
}
