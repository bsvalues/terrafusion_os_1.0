import { useEffect, useState } from 'react';

const API = '/api/costforge';

// ── Types ──────────────────────────────────────────────────────────────────

interface CostMatrixEntry {
  buildingType: string;
  qualityGrade: string;
  baseCostPerSqft: number;
  effectiveYear: number;
  region: string;
}

interface DepreciationBracket {
  ageMin: number;
  ageMax: number;
  conditionGrade: string;
  depreciationPct: number;
}

interface CostEstimateResult {
  baseCost: number;
  regionFactor: number;
  qualityFactor: number;
  conditionFactor: number;
  depreciatedCost: number;
  effectiveAge: number;
  depreciationPct: number;
  replacementCostNew: number;
  landValue: number;
  totalEstimate: number;
}

interface IncomeApproachResult {
  grossIncome: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  indicatedValue: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(1) + '%';
const fmtDec = (n: number) => n.toFixed(4);

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

type Tab = 'matrix' | 'calculator' | 'depreciation' | 'income' | 'analytics';

function SubNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'matrix', label: 'Cost Matrix' },
    { id: 'calculator', label: 'Cost Estimate' },
    { id: 'depreciation', label: 'Depreciation' },
    { id: 'income', label: 'Income Approach' },
    { id: 'analytics', label: 'Analytics' },
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

// ── Cost Matrix Tab ────────────────────────────────────────────────────────

function CostMatrixTab() {
  const [data, setData] = useState<CostMatrixEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  useEffect(() => {
    fetch(`${API}/cost-matrix/benton`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => setData(d.entries || d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.filter(e =>
    (!filterType || e.buildingType.toLowerCase().includes(filterType.toLowerCase())) &&
    (!filterRegion || e.region.toLowerCase().includes(filterRegion.toLowerCase()))
  ) ?? [];

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = 'Building Type,Quality Grade,Base Cost/Sqft,Effective Year,Region\n';
    const rows = filtered.map(e => `${e.buildingType},${e.qualityGrade},${e.baseCostPerSqft},${e.effectiveYear},${e.region}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cost_matrix_benton.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Benton County 2025 Cost Matrix<Tooltip text="Unit costs per square foot by building type and quality grade. Source: WA DOR Cost Manual + local calibration." /></h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>{filtered.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Filter type…" value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 12, width: 120 }} />
          <input type="text" placeholder="Filter region…" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 12, width: 100 }} />
          <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px' }}>⬇ CSV</button>
        </div>
      </div>

      {loading && <Skeleton rows={8} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {!loading && !error && (
        <div className="tf-table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
          <table className="tf-table">
            <thead><tr>
              <th>Building Type</th><th>Quality Grade</th><th className="tf-right">Base Cost/Sqft</th><th>Year</th><th>Region</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="tf-empty">No entries match filter.</td></tr>}
              {filtered.map((e, i) => (
                <tr key={i}>
                  <td>{e.buildingType}</td>
                  <td><span className="tf-badge tf-badge--gray">{e.qualityGrade}</span></td>
                  <td className="tf-right tf-mono">{fmt$(e.baseCostPerSqft)}</td>
                  <td>{e.effectiveYear}</td>
                  <td>{e.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Cost Estimate Calculator Tab ───────────────────────────────────────────

function CostEstimateTab() {
  const [form, setForm] = useState({
    buildingType: 'SFR', squareFeet: '2000', qualityGrade: 'Average',
    conditionGrade: 'Average', yearBuilt: '2005', region: 'Richland', landValue: '80000'
  });
  const [result, setResult] = useState<CostEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildingTypes = ['SFR', 'Duplex', 'Triplex', 'Fourplex', 'MFR', 'Commercial', 'Industrial', 'Agricultural', 'Mobile Home', 'Condo', 'Townhouse'];
  const qualityGrades = ['Low', 'Fair', 'Average', 'Good', 'Very Good', 'Excellent'];
  const conditionGrades = ['Poor', 'Fair', 'Average', 'Good', 'Very Good', 'Excellent'];
  const regions = ['Richland', 'Kennewick', 'West Richland', 'Benton City', 'Prosser', 'Rural'];

  function calculate() {
    setLoading(true); setError(null); setResult(null);
    fetch(`${API}/cost-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildingType: form.buildingType,
        squareFeet: Number(form.squareFeet),
        qualityGrade: form.qualityGrade,
        conditionGrade: form.conditionGrade,
        yearBuilt: Number(form.yearBuilt),
        region: form.region,
        landValue: Number(form.landValue),
      })
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 13, width: '100%' };
  const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600 };

  return (
    <section>
      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Cost Estimate Calculator<Tooltip text="Calculates replacement cost new less depreciation (RCNLD) using the Benton County cost matrix and depreciation schedules." /></h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>Enter property characteristics to compute the cost approach value.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <label style={labelStyle}>Building Type
          <select value={form.buildingType} onChange={e => setForm(f => ({ ...f, buildingType: e.target.value }))} style={inputStyle}>
            {buildingTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Square Feet
          <input type="number" value={form.squareFeet} onChange={e => setForm(f => ({ ...f, squareFeet: e.target.value }))} style={inputStyle} />
        </label>
        <label style={labelStyle}>Quality Grade
          <select value={form.qualityGrade} onChange={e => setForm(f => ({ ...f, qualityGrade: e.target.value }))} style={inputStyle}>
            {qualityGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Condition
          <select value={form.conditionGrade} onChange={e => setForm(f => ({ ...f, conditionGrade: e.target.value }))} style={inputStyle}>
            {conditionGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Year Built
          <input type="number" value={form.yearBuilt} onChange={e => setForm(f => ({ ...f, yearBuilt: e.target.value }))} style={inputStyle} />
        </label>
        <label style={labelStyle}>Region
          <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} style={inputStyle}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={labelStyle}>Land Value ($)
          <input type="number" value={form.landValue} onChange={e => setForm(f => ({ ...f, landValue: e.target.value }))} style={inputStyle} />
        </label>
      </div>

      <button onClick={calculate} disabled={loading} className="tf-btn" style={{ marginBottom: 16 }}>
        {loading ? 'Calculating…' : 'Calculate Cost Estimate'}
      </button>

      {error && <p className="tf-error">Error: {error}</p>}

      {result && (
        <div style={{ background: 'rgba(0,255,170,.03)', border: '1px solid rgba(0,255,170,.15)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Replacement Cost New</span><br /><strong style={{ fontSize: 18, color: '#e2e8f0' }}>{fmt$(result.replacementCostNew)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Depreciation</span><br /><strong style={{ fontSize: 18, color: '#fbbf24' }}>{fmtPct(result.depreciationPct)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Depreciated Cost</span><br /><strong style={{ fontSize: 18, color: '#e2e8f0' }}>{fmt$(result.depreciatedCost)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Land Value</span><br /><strong style={{ fontSize: 18, color: '#e2e8f0' }}>{fmt$(result.landValue)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Total Estimate</span><br /><strong style={{ fontSize: 22, color: '#00FFAA' }}>{fmt$(result.totalEstimate)}</strong></div>
          </div>

          <table className="tf-table" style={{ fontSize: 12 }}>
            <thead><tr><th>Factor</th><th className="tf-right">Value</th></tr></thead>
            <tbody>
              <tr><td>Base Cost</td><td className="tf-right tf-mono">{fmt$(result.baseCost)}</td></tr>
              <tr><td>Region Factor</td><td className="tf-right tf-mono">{fmtDec(result.regionFactor)}</td></tr>
              <tr><td>Quality Factor</td><td className="tf-right tf-mono">{fmtDec(result.qualityFactor)}</td></tr>
              <tr><td>Condition Factor</td><td className="tf-right tf-mono">{fmtDec(result.conditionFactor)}</td></tr>
              <tr><td>Effective Age</td><td className="tf-right tf-mono">{result.effectiveAge} yrs</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Depreciation Tab ───────────────────────────────────────────────────────

function DepreciationTab() {
  const [data, setData] = useState<DepreciationBracket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/depreciation-schedule`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => setData(d.brackets || d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    if (!data?.length) return;
    const header = 'Age Min,Age Max,Condition Grade,Depreciation %\n';
    const rows = data.map(b => `${b.ageMin},${b.ageMax},${b.conditionGrade},${(b.depreciationPct * 100).toFixed(1)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'depreciation_schedule.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16 }}>Depreciation Schedule<Tooltip text="Age-life depreciation brackets by condition grade. Applied to replacement cost new to derive depreciated value." /></h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>Residential and commercial brackets</p>
        </div>
        <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px' }}>⬇ CSV</button>
      </div>

      {loading && <Skeleton rows={10} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {!loading && !error && data && (
        <div className="tf-table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
          <table className="tf-table">
            <thead><tr>
              <th>Age Range</th><th>Condition</th><th className="tf-right">Depreciation %</th>
              <th style={{ width: 200 }}>Visual</th>
            </tr></thead>
            <tbody>
              {data.map((b, i) => (
                <tr key={i}>
                  <td className="tf-mono">{b.ageMin}–{b.ageMax} yrs</td>
                  <td><span className="tf-badge tf-badge--gray">{b.conditionGrade}</span></td>
                  <td className="tf-right tf-mono">{(b.depreciationPct * 100).toFixed(1)}%</td>
                  <td>
                    <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 3, height: 14, width: '100%', overflow: 'hidden' }}>
                      <div style={{ background: b.depreciationPct > 0.5 ? '#ef4444' : b.depreciationPct > 0.3 ? '#fbbf24' : '#00FFAA', height: '100%', width: `${b.depreciationPct * 100}%`, borderRadius: 3, transition: 'width .3s' }} />
                    </div>
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

// ── Income Approach Tab ────────────────────────────────────────────────────

function IncomeApproachTab() {
  const [form, setForm] = useState({
    grossIncome: '48000', vacancyRate: '5', operatingExpenseRatio: '35', capRate: '6.5'
  });
  const [result, setResult] = useState<IncomeApproachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capRates, setCapRates] = useState<{ propertyType: string; rate: number }[] | null>(null);

  useEffect(() => {
    fetch(`${API}/income-approach/cap-rates`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => setCapRates(d.rates || d))
      .catch(() => {});
  }, []);

  function calculate() {
    setLoading(true); setError(null); setResult(null);
    fetch(`${API}/income-approach/calculate-noi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grossIncome: Number(form.grossIncome),
        vacancyRate: Number(form.vacancyRate) / 100,
        operatingExpenseRatio: Number(form.operatingExpenseRatio) / 100,
        capRate: Number(form.capRate) / 100,
      })
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 9px', fontSize: 13, width: '100%' };
  const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600 };

  return (
    <section>
      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Income Approach Valuation<Tooltip text="Capitalizes net operating income (NOI) to derive property value. Used primarily for income-producing properties." /></h3>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(148,163,184,.7)' }}>Direct capitalization method — NOI ÷ Cap Rate = Value</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <label style={labelStyle}>Gross Annual Income ($)
          <input type="number" value={form.grossIncome} onChange={e => setForm(f => ({ ...f, grossIncome: e.target.value }))} style={inputStyle} />
        </label>
        <label style={labelStyle}>Vacancy Rate (%)
          <input type="number" step="0.5" value={form.vacancyRate} onChange={e => setForm(f => ({ ...f, vacancyRate: e.target.value }))} style={inputStyle} />
        </label>
        <label style={labelStyle}>Operating Expense Ratio (%)
          <input type="number" step="1" value={form.operatingExpenseRatio} onChange={e => setForm(f => ({ ...f, operatingExpenseRatio: e.target.value }))} style={inputStyle} />
        </label>
        <label style={labelStyle}>Cap Rate (%)
          <input type="number" step="0.1" value={form.capRate} onChange={e => setForm(f => ({ ...f, capRate: e.target.value }))} style={inputStyle} />
        </label>
      </div>

      <button onClick={calculate} disabled={loading} className="tf-btn" style={{ marginBottom: 16 }}>
        {loading ? 'Calculating…' : 'Calculate Income Value'}
      </button>

      {error && <p className="tf-error">Error: {error}</p>}

      {result && (
        <div style={{ background: 'rgba(99,102,241,.04)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Gross Income</span><br /><strong style={{ color: '#e2e8f0' }}>{fmt$(result.grossIncome)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Effective Gross Income</span><br /><strong style={{ color: '#e2e8f0' }}>{fmt$(result.effectiveGrossIncome)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Operating Expenses</span><br /><strong style={{ color: '#fbbf24' }}>−{fmt$(result.operatingExpenses)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Net Operating Income</span><br /><strong style={{ color: '#e2e8f0' }}>{fmt$(result.netOperatingIncome)}</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Cap Rate</span><br /><strong style={{ color: '#e2e8f0' }}>{(result.capRate * 100).toFixed(2)}%</strong></div>
            <div><span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Indicated Value</span><br /><strong style={{ fontSize: 22, color: '#00FFAA' }}>{fmt$(result.indicatedValue)}</strong></div>
          </div>
        </div>
      )}

      {capRates && capRates.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ fontSize: 13, color: 'rgba(226,232,240,.7)', marginBottom: 8 }}>Reference Cap Rates — Benton County</h4>
          <div className="tf-table-wrap">
            <table className="tf-table" style={{ fontSize: 12 }}>
              <thead><tr><th>Property Type</th><th className="tf-right">Cap Rate</th></tr></thead>
              <tbody>
                {capRates.map((cr, i) => (
                  <tr key={i}><td>{cr.propertyType}</td><td className="tf-right tf-mono">{(cr.rate * 100).toFixed(2)}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [buildingTypes, setBuildingTypes] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [status, setStatus] = useState<{ totalValuations: number; lastSync: string; engineVersion: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/building-types`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/regions`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/status`).then(r => r.ok ? r.json() : null),
    ]).then(([bt, rg, st]) => {
      setBuildingTypes(bt.types || bt || []);
      setRegions(rg.regions || rg || []);
      setStatus(st);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton rows={6} />;

  return (
    <section>
      <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>CostForge Analytics & Status<Tooltip text="System status, supported building types, and regional coverage for the cost approach engine." /></h3>

      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Total Valuations</span><br />
            <strong style={{ fontSize: 20, color: '#e2e8f0' }}>{status.totalValuations?.toLocaleString() ?? '—'}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Engine Version</span><br />
            <strong style={{ fontSize: 20, color: '#e2e8f0' }}>{status.engineVersion ?? '—'}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: 12 }}>
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,.6)' }}>Last Sync</span><br />
            <strong style={{ fontSize: 14, color: '#e2e8f0' }}>{status.lastSync ?? '—'}</strong>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h4 style={{ fontSize: 13, color: 'rgba(226,232,240,.7)', marginBottom: 8 }}>Supported Building Types ({buildingTypes.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {buildingTypes.map(t => (
              <span key={t} className="tf-badge tf-badge--gray" style={{ fontSize: 11 }}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: 13, color: 'rgba(226,232,240,.7)', marginBottom: 8 }}>Supported Regions ({regions.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {regions.map(r => (
              <span key={r} className="tf-badge tf-badge--blue" style={{ fontSize: 11 }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CostSchedulesPage() {
  const [tab, setTab] = useState<Tab>('matrix');

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>Cost Approach</h2>
        <p className="tf-page-sub">
          Benton County WA — Replacement cost new less depreciation (RCNLD) · WA DOR Cost Manual 2025
        </p>
      </div>

      <SubNav active={tab} onChange={setTab} />

      {tab === 'matrix' && <CostMatrixTab />}
      {tab === 'calculator' && <CostEstimateTab />}
      {tab === 'depreciation' && <DepreciationTab />}
      {tab === 'income' && <IncomeApproachTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
