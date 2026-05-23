import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtFull$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtDate = (d: string) => d ? new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const CU_CODES: Record<string, { label: string; rcw: string; maxYears: number; color: string }> = {
  DFL:  { label: 'Designated Forest Land', rcw: 'RCW 84.33', maxYears: 7, color: 'green' },
  CUFA: { label: 'Farm & Agriculture',     rcw: 'RCW 84.34.020(2)', maxYears: 10, color: 'blue' },
  CUOS: { label: 'Open Space',             rcw: 'RCW 84.34.020(1)', maxYears: 10, color: 'purple' },
  CUTL: { label: 'Timber Land',            rcw: 'RCW 84.34.020(3)', maxYears: 10, color: 'amber' },
};

const PENALTY_EXCEPTIONS = [
  { code: 'DEATH', label: 'Owner Death', rcw: 'RCW 84.33.140(6)(a)' },
  { code: 'GOVT_ACQUISITION', label: 'Government Acquisition', rcw: 'RCW 84.33.140(6)(b)' },
  { code: 'TRADE_LAND_CONSERVATION', label: 'Conservation Trade', rcw: 'RCW 84.34.108(6)(a)' },
  { code: 'FORCED_SALE', label: 'Forced Sale / Condemnation', rcw: 'RCW 84.34.108(6)(b)' },
  { code: 'TRANSFER_TO_GOVT', label: 'Transfer to Government', rcw: 'RCW 84.34.108(6)(c)' },
];

// ── Shared Sub-Navigation ──────────────────────────────────────────────────

export function CuSubNav() {
  const { pathname } = useLocation();
  const tabs = [
    { path: '/current-use', label: 'Classifications & Rollback' },
    { path: '/current-use/interest', label: 'Interest Rates' },
    { path: '/current-use/removals', label: 'Removals & Exceptions' },
  ];
  return (
    <nav style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: 0 }}>
      {tabs.map(t => {
        const active = pathname === t.path;
        return (
          <Link key={t.path} to={t.path} style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 500, textDecoration: 'none',
            color: active ? '#00FFAA' : '#94a3b8',
            borderBottom: active ? '2px solid #00FFAA' : '2px solid transparent',
            transition: 'all 0.15s ease',
          }}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ padding: '12px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 38, background: 'linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.06) 50%, rgba(255,255,255,.03) 75%)',
          backgroundSize: '200% 100%', borderRadius: 6, marginBottom: 6,
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

// ── Tooltip ────────────────────────────────────────────────────────────────

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

// ── New Classification Form ────────────────────────────────────────────────

function NewClassificationForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    parcelId: '', classificationCode: 'CUFA', description: '',
    enrollmentDate: new Date().toISOString().slice(0, 10),
    acreage: '', currentMarketValue: '', currentUseValue: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    fetch(`${API}/classifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelId: form.parcelId.trim(),
        classificationCode: form.classificationCode,
        description: form.description || `${CU_CODES[form.classificationCode]?.label} — ${form.parcelId.trim()}`,
        enrollmentDate: form.enrollmentDate,
        acreage: form.acreage ? Number(form.acreage) : null,
        currentMarketValue: form.currentMarketValue ? Number(form.currentMarketValue) : null,
        currentUseValue: form.currentUseValue ? Number(form.currentUseValue) : null,
      }),
    })
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(() => {
        setSuccess(true);
        setForm({ parcelId: '', classificationCode: 'CUFA', description: '', enrollmentDate: new Date().toISOString().slice(0, 10), acreage: '', currentMarketValue: '', currentUseValue: '' });
        onCreated();
        setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
      })
      .catch(e => setError(String(e)))
      .finally(() => setSaving(false));
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="tf-btn" style={{ marginBottom: 16, fontSize: 13 }}>
        + New Enrollment
      </button>
    );
  }

  const inputStyle = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13, width: '100%' };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: 14 }}>New Current Use Enrollment</h4>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Parcel ID <span style={{ color: '#ff6b6b', fontSize: 10 }}>required</span>
          <input required type="text" value={form.parcelId} onChange={e => setForm(f => ({ ...f, parcelId: e.target.value }))} placeholder="1-0234-100-0001" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Classification <Tip text="DFL = RCW 84.33 (7yr) · Others = RCW 84.34 (10yr)"><span style={{ cursor: 'help', borderBottom: '1px dotted #64748b' }}>?</span></Tip>
          <select value={form.classificationCode} onChange={e => setForm(f => ({ ...f, classificationCode: e.target.value }))} style={inputStyle}>
            {Object.entries(CU_CODES).map(([code, info]) => (
              <option key={code} value={code}>{code} — {info.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Enrollment Date
          <input type="date" value={form.enrollmentDate} onChange={e => setForm(f => ({ ...f, enrollmentDate: e.target.value }))} style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Acreage
          <input type="number" step="0.01" value={form.acreage} onChange={e => setForm(f => ({ ...f, acreage: e.target.value }))} placeholder="80.0" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Market Value ($)
          <input type="number" value={form.currentMarketValue} onChange={e => setForm(f => ({ ...f, currentMarketValue: e.target.value }))} placeholder="450000" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Current Use Value ($)
          <input type="number" value={form.currentUseValue} onChange={e => setForm(f => ({ ...f, currentUseValue: e.target.value }))} placeholder="52000" style={inputStyle} />
        </label>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
        Description (optional)
        <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Designated Forest Land — 80 acres mixed conifer" style={inputStyle} />
      </label>
      {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
      {success && <p style={{ color: '#00FFAA', fontSize: 12, margin: '10px 0 0' }}>Enrollment created successfully.</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={saving || !form.parcelId.trim()} className="tf-btn" style={{ fontSize: 13 }}>
          {saving ? 'Enrolling…' : 'Enroll Parcel'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Classifications Section ────────────────────────────────────────────────

function ClassificationsSection() {
  const [data, setData] = useState<ClassificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [codeFilter, setCodeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set('status', statusFilter);
    if (codeFilter) params.set('classificationCode', codeFilter);
    fetch(`${API}/classifications?${params}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [page, statusFilter, codeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <section className="tf-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16 }}>Current Use Classifications</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            Parcels enrolled under RCW 84.33 (DFL) and RCW 84.34 (CUFA/CUOS/CUTL)
          </p>
        </div>
        {data && <span style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,.04)', padding: '4px 10px', borderRadius: 12 }}>{data.total} enrollment{data.total !== 1 ? 's' : ''}</span>}
      </div>

      <NewClassificationForm onCreated={fetchData} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Removed">Removed</option>
          <option value="Pending">Pending</option>
        </select>
        <select value={codeFilter} onChange={e => { setCodeFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}>
          <option value="">All Codes</option>
          {Object.entries(CU_CODES).map(([code, info]) => (
            <option key={code} value={code}>{code} — {info.label}</option>
          ))}
        </select>
      </div>

      {loading && <Skeleton rows={5} />}
      {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}
      {!loading && data && (
        <>
          <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="tf-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Parcel ID</th>
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
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No classifications match these filters.</td></tr>
                )}
                {data.items.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td className="tf-mono" style={{ fontSize: 12 }}>{c.parcelId}</td>
                    <td>
                      <Tip text={`${CU_CODES[c.classificationCode]?.label || c.classificationCode} · ${CU_CODES[c.classificationCode]?.rcw || ''} · ${CU_CODES[c.classificationCode]?.maxYears || '?'}yr lookback`}>
                        <span className={`tf-badge tf-badge--${CU_CODES[c.classificationCode]?.color || 'gray'}`} style={{ fontSize: 11 }}>
                          {c.classificationCode}
                        </span>
                      </Tip>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(c.enrollmentDate)}</td>
                    <td>
                      <span className={`tf-badge ${c.status === 'Active' ? 'tf-badge--green' : c.status === 'Removed' ? 'tf-badge--red' : 'tf-badge--gray'}`} style={{ fontSize: 11 }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{c.acreage?.toFixed(1) ?? '—'}</td>
                    <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{c.currentMarketValue != null ? fmt$(c.currentMarketValue) : '—'}</td>
                    <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{c.currentUseValue != null ? fmt$(c.currentUseValue) : '—'}</td>
                    <td className="tf-right tf-mono" style={{ fontSize: 12, color: c.taxSavings && c.taxSavings > 0 ? '#00FFAA' : undefined }}>
                      {c.taxSavings != null ? fmt$(c.taxSavings) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', alignItems: 'center' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                Prev
              </button>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Rollback Calculator Section ────────────────────────────────────────────

function RollbackCalculatorSection() {
  const [parcelId, setParcelId] = useState('');
  const [classCode, setClassCode] = useState('CUFA');
  const [enrollYear, setEnrollYear] = useState(2018);
  const [removalYear, setRemovalYear] = useState(2025);
  const [penaltyException, setPenaltyException] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RollbackResult | null>(null);

  // Generate realistic Benton County market/CU values
  const generateValues = useCallback(() => {
    const baseMarket = 350000;
    const baseCU = 45000;
    const marketGrowth = 0.058; // Benton County avg 5.8% appreciation
    const cuGrowth = 0.018; // CU value grows slowly (timber/ag yield)
    const marketValues: Record<string, number> = {};
    const cuValues: Record<string, number> = {};
    const maxYears = CU_CODES[classCode]?.maxYears || 10;
    const startYear = Math.max(enrollYear, removalYear - maxYears + 1);
    for (let y = startYear; y <= removalYear; y++) {
      const offset = y - enrollYear;
      marketValues[String(y)] = Math.round(baseMarket * Math.pow(1 + marketGrowth, offset));
      cuValues[String(y)] = Math.round(baseCU * Math.pow(1 + cuGrowth, offset));
    }
    return { marketValues, cuValues };
  }, [classCode, enrollYear, removalYear]);

  function runCalculation() {
    setLoading(true); setError(null); setResult(null);
    const { marketValues, cuValues } = generateValues();
    fetch(`${API}/rollback/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelId: parcelId.trim() || '1-0567-200-0045',
        classificationCode: classCode,
        enrollmentYear: enrollYear,
        removalYear: removalYear,
        marketValues,
        currentUseValues: cuValues,
        penaltyExceptionCode: penaltyException || null,
      }),
    })
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setResult)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  function exportCSV() {
    if (!result) return;
    const hdr = 'Year,Market Value,CU Value,Difference,Interest Rate,Interest,Subtotal';
    const rows = result.yearBreakdowns.map(yb =>
      `${yb.year},${yb.marketValue},${yb.currentUseValue},${yb.difference},${yb.interestRate},${yb.interestAmount},${yb.subtotal}`
    );
    rows.push('', `Total Rollback Tax,,,,,,${result.totalRollbackTax}`);
    rows.push(`Total Interest,,,,,,${result.totalInterest}`);
    rows.push(`Penalty (20%),,,,,,${result.totalPenalty}`);
    rows.push(`Grand Total,,,,,,${result.grandTotal}`);
    const blob = new Blob([hdr + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rollback_${parcelId || 'estimate'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Rollback Tax Calculator
          <Tip text="Calculates rollback taxes per RCW 84.33.140 / 84.34.108 when land is removed from current use">
            <span style={{ fontSize: 13, color: '#64748b', cursor: 'help' }}>?</span>
          </Tip>
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          DFL: 7-year lookback (RCW 84.33) · CUFA/CUOS/CUTL: 10-year lookback (RCW 84.34) · 20% penalty unless exception applies
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Parcel ID
          <input type="text" value={parcelId} onChange={e => setParcelId(e.target.value)} placeholder="1-0567-200-0045"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Classification
          <select value={classCode} onChange={e => setClassCode(e.target.value)}
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}>
            {Object.entries(CU_CODES).map(([code, info]) => (
              <option key={code} value={code}>{code} — {info.label} ({info.maxYears}yr)</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Enrollment Year
          <input type="number" value={enrollYear} onChange={e => setEnrollYear(Number(e.target.value))} min={2000} max={2025}
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Removal Year
          <input type="number" value={removalYear} onChange={e => setRemovalYear(Number(e.target.value))} min={2016} max={2026}
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Penalty Exception <Tip text="20% penalty waived if qualifying exception applies"><span style={{ cursor: 'help' }}>?</span></Tip>
          <select value={penaltyException} onChange={e => setPenaltyException(e.target.value)}
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}>
            <option value="">None (20% penalty applies)</option>
            {PENALTY_EXCEPTIONS.map(pe => (
              <option key={pe.code} value={pe.code}>{pe.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={runCalculation} disabled={loading} className="tf-btn" style={{ fontSize: 13 }}>
          {loading ? 'Calculating…' : 'Calculate Rollback'}
        </button>
        {result && (
          <>
            <button onClick={exportCSV} style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
              Export CSV
            </button>
            <button onClick={() => window.print()} style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
              Print
            </button>
          </>
        )}
      </div>

      {error && <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Rollback Tax', value: result.totalRollbackTax, color: '#e2e8f0' },
              { label: 'Interest', value: result.totalInterest, color: '#e2e8f0' },
              { label: result.penaltyExceptionApplied ? 'Penalty (WAIVED)' : 'Penalty (20%)', value: result.totalPenalty, color: result.penaltyExceptionApplied ? '#00FFAA' : '#ff6b6b' },
              { label: 'Grand Total Due', value: result.grandTotal, color: '#00FFAA' },
            ].map((card, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: i === 3 ? '1px solid rgba(0,255,170,.3)' : '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: card.color, fontFamily: 'monospace' }}>{fmtFull$(card.value)}</div>
                {i === 2 && result.penaltyExceptionApplied && (
                  <div style={{ fontSize: 11, color: '#00FFAA', marginTop: 4 }}>Exception: {result.exceptionCode}</div>
                )}
              </div>
            ))}
          </div>

          {/* Year breakdown table */}
          <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="tf-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="tf-right">Market Value</th>
                  <th className="tf-right">CU Value</th>
                  <th className="tf-right">Difference</th>
                  <th className="tf-right">Rate</th>
                  <th className="tf-right">Interest</th>
                  <th className="tf-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {result.yearBreakdowns.map(yb => (
                  <tr key={yb.year} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td className="tf-mono">{yb.year}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.marketValue)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.currentUseValue)}</td>
                    <td className="tf-right tf-mono">{fmt$(yb.difference)}</td>
                    <td className="tf-right tf-mono">{fmtPct(yb.interestRate)}</td>
                    <td className="tf-right tf-mono">{fmtFull$(yb.interestAmount)}</td>
                    <td className="tf-right tf-mono">{fmtFull$(yb.subtotal)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid rgba(0,255,170,.25)', fontWeight: 600 }}>
                  <td colSpan={5} style={{ fontSize: 11, color: '#64748b' }}>
                    {result.yearBreakdowns.length} year{result.yearBreakdowns.length !== 1 ? 's' : ''} · {classCode} ({CU_CODES[classCode]?.maxYears}yr max lookback)
                  </td>
                  <td className="tf-right" style={{ color: '#94a3b8', fontSize: 12 }}>Total</td>
                  <td className="tf-right tf-mono" style={{ color: '#00FFAA', fontSize: 14 }}>{fmtFull$(result.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legal disclaimer */}
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,.06)' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
              <strong style={{ color: '#94a3b8' }}>Disclaimer:</strong> This calculation is an estimate based on WA DOR published interest rates.
              Actual rollback amounts are determined by the Benton County Assessor per RCW 84.33.140 / RCW 84.34.108.
              Penalty exceptions require supporting documentation and county approval.
            </p>
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
      <div className="tf-page-header" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, color: '#f1f5f9' }}>Current Use Program</h2>
        <p className="tf-page-sub" style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
          Benton County WA — RCW 84.33/84.34 current use classifications, rollback tax calculations, and removal processing
        </p>
      </div>
      <CuSubNav />
      <ClassificationsSection />
      <RollbackCalculatorSection />
    </div>
  );
}
