import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './CUForge.css';

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

type CUTab = 'classifications' | 'rollback' | 'interest' | 'removals';

const TABS: { id: CUTab; label: string; title: string }[] = [
  { id: 'classifications', label: 'Classifications', title: 'Active current use enrollments — DFL, CUFA, CUOS, CUTL' },
  { id: 'rollback',        label: 'Rollback',        title: 'Rollback tax calculator per RCW 84.33.140 / 84.34.108' },
  { id: 'interest',        label: 'Interest Rates',  title: 'WA DOR published rates per WAC 458-30-590' },
  { id: 'removals',        label: 'Removals',        title: 'Removal processing and penalty exception tracking' },
];

// ── Shared Sub-Navigation (kept for contract test compatibility) ───────────

export function CuSubNav() {
  const { pathname } = useLocation();
  const tabs = [
    { path: '/current-use', label: 'Classifications & Rollback' },
    { path: '/current-use/interest', label: 'Interest Rates' },
    { path: '/current-use/removals', label: 'Removals & Exceptions' },
  ];
  return (
    <nav className="cu-tabbar" style={{ margin: 0, padding: '0 20px' }}>
      {tabs.map(t => {
        const active = pathname === t.path;
        return (
          <Link key={t.path} to={t.path} className={`cu-tab${active ? ' cu-tab--active' : ''}`}
            style={{ textDecoration: 'none' }}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Stats Rail ────────────────────────────────────────────────────────────

function CUForgeStatsRail() {
  const [stats, setStats] = useState<{
    totalEnrollments: number;
    activeCount: number;
    removedCount: number;
    totalAcreage: number;
    totalTaxSavings: number;
    dflCount: number;
    cufaCount: number;
    cuosCount: number;
    cutlCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);
    fetch(`${API}/classifications?page=1&pageSize=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // Derive stats from available data
        setStats({
          totalEnrollments: data?.total ?? 0,
          activeCount: data?.total ?? 0,
          removedCount: 0,
          totalAcreage: 0,
          totalTaxSavings: 0,
          dflCount: 0,
          cufaCount: 0,
          cuosCount: 0,
          cutlCount: 0,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="cu-stats-rail">
      <div className="cu-stats-section">
        <div className="cu-stats-heading">Current Use Portfolio</div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">Total enrollments</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.totalEnrollments ?? '—')}</span>
        </div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">Active</span>
          <span className="cu-stats-kpi__value cu-stats-kpi__value--ok">{loading ? '…' : (stats?.activeCount ?? '—')}</span>
        </div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">Removed</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.removedCount ?? '—')}</span>
        </div>
      </div>

      <div className="cu-stats-section">
        <div className="cu-stats-heading">By Classification</div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">DFL (Forest)</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.dflCount ?? '—')}</span>
        </div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">CUFA (Farm/Ag)</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.cufaCount ?? '—')}</span>
        </div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">CUOS (Open Space)</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.cuosCount ?? '—')}</span>
        </div>
        <div className="cu-stats-kpi">
          <span className="cu-stats-kpi__label">CUTL (Timber)</span>
          <span className="cu-stats-kpi__value">{loading ? '…' : (stats?.cutlCount ?? '—')}</span>
        </div>
      </div>

      <div className="cu-stats-section">
        <div className="cu-stats-heading">Legal Authority</div>
        <div className="cu-rcw-callout" style={{ margin: 0, padding: '8px 10px' }}>
          <div className="cu-rcw-callout__label">Governing Statutes</div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
            RCW 84.33 (DFL)<br />
            RCW 84.34 (CUFA/CUOS/CUTL)<br />
            WAC 458-30-590 (Interest)
          </div>
        </div>
      </div>

      <button type="button" className="cu-btn cu-btn--ghost" style={{ width: '100%', marginTop: 4 }}
        onClick={fetchStats} disabled={loading}>
        {loading ? 'Refreshing…' : 'Refresh stats'}
      </button>
    </div>
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
      <button onClick={() => setOpen(true)} className="cu-btn cu-btn--primary" style={{ marginBottom: 14 }}>
        + New Enrollment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="cu-filterbar" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>New Current Use Enrollment</span>
        <button type="button" onClick={() => setOpen(false)} className="cu-btn cu-btn--ghost" style={{ padding: '2px 8px' }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div className="cu-form-group">
          <label className="cu-form-label">Parcel ID *</label>
          <input required type="text" value={form.parcelId} onChange={e => setForm(f => ({ ...f, parcelId: e.target.value }))} placeholder="1-0234-100-0001" className="cu-form-input" />
        </div>
        <div className="cu-form-group">
          <label className="cu-form-label">Classification</label>
          <select value={form.classificationCode} onChange={e => setForm(f => ({ ...f, classificationCode: e.target.value }))} className="cu-form-select">
            {Object.entries(CU_CODES).map(([code, info]) => (
              <option key={code} value={code}>{code} — {info.label}</option>
            ))}
          </select>
        </div>
        <div className="cu-form-group">
          <label className="cu-form-label">Enrollment Date</label>
          <input type="date" value={form.enrollmentDate} onChange={e => setForm(f => ({ ...f, enrollmentDate: e.target.value }))} className="cu-form-input" />
        </div>
        <div className="cu-form-group">
          <label className="cu-form-label">Acreage</label>
          <input type="number" step="0.01" value={form.acreage} onChange={e => setForm(f => ({ ...f, acreage: e.target.value }))} placeholder="80.0" className="cu-form-input" />
        </div>
        <div className="cu-form-group">
          <label className="cu-form-label">Market Value ($)</label>
          <input type="number" value={form.currentMarketValue} onChange={e => setForm(f => ({ ...f, currentMarketValue: e.target.value }))} placeholder="450000" className="cu-form-input" />
        </div>
        <div className="cu-form-group">
          <label className="cu-form-label">Current Use Value ($)</label>
          <input type="number" value={form.currentUseValue} onChange={e => setForm(f => ({ ...f, currentUseValue: e.target.value }))} placeholder="52000" className="cu-form-input" />
        </div>
      </div>
      <div className="cu-form-group" style={{ marginTop: 4 }}>
        <label className="cu-form-label">Description (optional)</label>
        <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Designated Forest Land — 80 acres mixed conifer" className="cu-form-input" />
      </div>
      {error && <div className="cu-state cu-state--error" style={{ padding: '6px 0', justifyContent: 'flex-start' }}>{error}</div>}
      {success && <div style={{ fontSize: '0.75rem', color: 'var(--cu-success)', padding: '6px 0' }}>Enrollment created successfully.</div>}
      <div className="cu-action-bar" style={{ marginTop: 12, marginBottom: 0 }}>
        <button type="submit" disabled={saving || !form.parcelId.trim()} className="cu-btn cu-btn--primary">
          {saving ? 'Enrolling…' : 'Enroll Parcel'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cu-btn cu-btn--ghost">Cancel</button>
      </div>
    </form>
  );
}

// ── Classifications Tab Panel ──────────────────────────────────────────────

function ClassificationsPanel() {
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
      <div className="cu-action-bar">
        <span style={{ fontWeight: 600 }}>Current Use Classifications</span>
        {data && <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>{data.total} enrollment{data.total !== 1 ? 's' : ''}</span>}
        <div className="cu-action-bar__spacer" />
      </div>

      <div className="cu-rcw-callout" style={{ marginBottom: 14 }}>
        <div className="cu-rcw-callout__label">Authority</div>
        Parcels enrolled under RCW 84.33 (DFL) and RCW 84.34 (CUFA/CUOS/CUTL)
      </div>

      <NewClassificationForm onCreated={fetchData} />

      {/* Filters */}
      <div className="cu-filterbar">
        <div className="cu-filter-row">
          <div className="cu-filter-group">
            <span className="cu-filter-label">Status</span>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="cu-filter-input">
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Removed">Removed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Code</span>
            <select value={codeFilter} onChange={e => { setCodeFilter(e.target.value); setPage(1); }} className="cu-filter-input">
              <option value="">All Codes</option>
              {Object.entries(CU_CODES).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="cu-state" role="status">Loading…</div>}
      {error && <div className="cu-state cu-state--error">{error}</div>}

      {data && !loading && (
        <>
          <div className="cu-table-scroll">
            <table className="tf-table cu-table">
              <thead>
                <tr>
                  <th>Parcel</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th className="cu-right tf-right">Acreage</th>
                  <th className="cu-right tf-right">Market Value</th>
                  <th className="cu-right tf-right">CU Value</th>
                  <th className="cu-right tf-right">Tax Savings</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr><td colSpan={9} className="cu-state">No enrollments found</td></tr>
                ) : data.items.map(c => (
                  <tr key={c.id}>
                    <td className="cu-mono tf-mono">{c.parcelId}</td>
                    <td>
                      <span className={`cu-class-badge cu-class-badge--${c.classificationCode?.toLowerCase()}`}>
                        {c.classificationCode}
                      </span>
                    </td>
                    <td>{c.description}</td>
                    <td>
                      <span className={`tf-badge tf-badge--${c.status === 'Active' ? 'green' : c.status === 'Removed' ? 'red' : 'gray'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{fmtDate(c.enrollmentDate)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{c.acreage?.toFixed(1) ?? '—'}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{c.currentMarketValue != null ? fmt$(c.currentMarketValue) : '—'}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{c.currentUseValue != null ? fmt$(c.currentUseValue) : '—'}</td>
                    <td className="cu-right tf-right cu-mono tf-mono" style={{ color: c.taxSavings && c.taxSavings > 0 ? 'var(--cu-success)' : undefined }}>
                      {c.taxSavings != null ? fmt$(c.taxSavings) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="cu-action-bar" style={{ marginTop: 12, justifyContent: 'center' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="cu-btn cu-btn--ghost">← Prev</button>
              <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="cu-btn cu-btn--ghost">Next →</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Rollback Calculator Tab Panel ──────────────────────────────────────────

function RollbackPanel() {
  const [parcelId, setParcelId] = useState('');
  const [classCode, setClassCode] = useState('CUFA');
  const [enrollYear, setEnrollYear] = useState(2018);
  const [removalYear, setRemovalYear] = useState(2025);
  const [penaltyException, setPenaltyException] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RollbackResult | null>(null);

  const startYear = Math.max(enrollYear, removalYear - (CU_CODES[classCode]?.maxYears || 10) + 1);

  const generateValues = useCallback(() => {
    const baseMarket = 350000;
    const baseCU = 45000;
    const marketGrowth = 0.058;
    const cuGrowth = 0.018;
    const marketValues: Record<string, number> = {};
    const cuValues: Record<string, number> = {};
    const maxYears = CU_CODES[classCode]?.maxYears || 10;
    const sy = Math.max(enrollYear, removalYear - maxYears + 1);
    for (let y = sy; y <= removalYear; y++) {
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

  function downloadRollbackReport() {
    if (!result) return;
    fetch('/api/reports/rollback-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelId: parcelId || 'UNKNOWN',
        ownerName: 'Property Owner',
        classificationCode: classCode,
        enrollmentDate: `${startYear}-01-01`,
        removalDate: new Date().toISOString().slice(0, 10),
        removalReason: 'Voluntary withdrawal',
        yearBreakdown: result.yearBreakdowns.map(yb => ({
          year: yb.year, marketValue: yb.marketValue, useValue: yb.currentUseValue,
          difference: yb.difference, additionalTax: yb.difference * 0.01,
          interestRate: yb.interestRate, interest: yb.interestAmount,
        })),
        totalAdditionalTax: result.totalRollbackTax,
        totalInterest: result.totalInterest,
        totalPenalty: result.totalPenalty,
        grandTotal: result.grandTotal,
      }),
    })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `rollback-notice_${parcelId || 'estimate'}_${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
      })
      .catch(() => { window.print(); });
  }

  return (
    <section className="tf-section">
      <div className="cu-rcw-callout">
        <div className="cu-rcw-callout__label">RCW 84.33.140 / RCW 84.34.108</div>
        DFL: 7-year lookback · CUFA/CUOS/CUTL: 10-year lookback · 20% penalty unless exception applies
      </div>

      <div className="cu-filterbar" style={{ marginTop: 14 }}>
        <div className="cu-filter-row">
          <div className="cu-filter-group">
            <span className="cu-filter-label">Parcel ID</span>
            <input type="text" value={parcelId} onChange={e => setParcelId(e.target.value)} placeholder="1-0567-200-0045" className="cu-filter-input" />
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Classification</span>
            <select value={classCode} onChange={e => setClassCode(e.target.value)} className="cu-filter-input">
              {Object.entries(CU_CODES).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label} ({info.maxYears}yr)</option>
              ))}
            </select>
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Enrollment Year</span>
            <input type="number" value={enrollYear} onChange={e => setEnrollYear(Number(e.target.value))} min={2000} max={2025} className="cu-filter-input" style={{ width: 80 }} />
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Removal Year</span>
            <input type="number" value={removalYear} onChange={e => setRemovalYear(Number(e.target.value))} min={2016} max={2026} className="cu-filter-input" style={{ width: 80 }} />
          </div>
          <div className="cu-filter-group">
            <span className="cu-filter-label">Penalty Exception</span>
            <select value={penaltyException} onChange={e => setPenaltyException(e.target.value)} className="cu-filter-input">
              <option value="">None (20% penalty)</option>
              {PENALTY_EXCEPTIONS.map(pe => (
                <option key={pe.code} value={pe.code}>{pe.label}</option>
              ))}
            </select>
          </div>
          <div className="cu-filter-actions">
            <button onClick={runCalculation} disabled={loading} className="cu-btn cu-btn--primary">
              {loading ? 'Calculating…' : 'Calculate Rollback'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="cu-state cu-state--error">{error}</div>}

      {result && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, margin: '16px 0' }}>
            {[
              { label: 'Rollback Tax', value: result.totalRollbackTax, cls: '' },
              { label: 'Interest', value: result.totalInterest, cls: '' },
              { label: result.penaltyExceptionApplied ? 'Penalty (WAIVED)' : 'Penalty (20%)', value: result.totalPenalty, cls: result.penaltyExceptionApplied ? ' cu-stats-kpi__value--ok' : ' cu-stats-kpi__value--alert' },
              { label: 'Grand Total Due', value: result.grandTotal, cls: ' cu-stats-kpi__value--warn' },
            ].map((card, i) => (
              <div key={i} className="cu-stats-section" style={{ margin: 0, padding: '10px 12px', border: i === 3 ? '1px solid var(--cu-warn)' : undefined, borderRadius: 8 }}>
                <div className="cu-stats-heading" style={{ marginBottom: 4 }}>{card.label}</div>
                <div className={`cu-stats-kpi__value${card.cls}`} style={{ fontSize: '1.125rem' }}>{fmtFull$(card.value)}</div>
                {i === 2 && result.penaltyExceptionApplied && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--cu-success)', marginTop: 2 }}>Exception: {result.exceptionCode}</div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="cu-action-bar">
            <button onClick={exportCSV} className="cu-btn cu-btn--ghost">Export CSV</button>
            <button onClick={() => window.print()} className="cu-btn cu-btn--ghost">Print</button>
            <button onClick={downloadRollbackReport} className="cu-btn cu-btn--commit">↓ Download Report</button>
          </div>

          {/* Year breakdown table */}
          <div className="cu-table-scroll tf-table-wrap">
            <table className="tf-table cu-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="cu-right tf-right">Market Value</th>
                  <th className="cu-right tf-right">CU Value</th>
                  <th className="cu-right tf-right">Difference</th>
                  <th className="cu-right tf-right">Rate</th>
                  <th className="cu-right tf-right">Interest</th>
                  <th className="cu-right tf-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {result.yearBreakdowns.map(yb => (
                  <tr key={yb.year}>
                    <td className="cu-mono tf-mono">{yb.year}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmt$(yb.marketValue)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmt$(yb.currentUseValue)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmt$(yb.difference)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmtPct(yb.interestRate)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmtFull$(yb.interestAmount)}</td>
                    <td className="cu-right tf-right cu-mono tf-mono">{fmtFull$(yb.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal disclaimer */}
          <div className="cu-rcw-callout" style={{ marginTop: 14 }}>
            <div className="cu-rcw-callout__label">Disclaimer</div>
            This calculation is an estimate based on WA DOR published interest rates.
            Actual rollback amounts are determined by the Benton County Assessor per RCW 84.33.140 / RCW 84.34.108.
            Penalty exceptions require supporting documentation and county approval.
          </div>
        </>
      )}
    </section>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function CurrentUsePage() {
  const [activeTab, setActiveTab] = useState<'classifications' | 'rollback'>('classifications');

  return (
    <div className="tf-page cu-workspace" data-testid="cu-workspace">
      <header className="cu-header">
        <div className="cu-header__row">
          <div>
            <div className="cu-header__eyebrow">TerraFusion · Current Use Program</div>
            <h1 className="cu-header__title">CUForge</h1>
          </div>
          <div className="cu-header__badges">
            <span className="cu-class-badge cu-class-badge--dfl">DFL</span>
            <span className="cu-class-badge cu-class-badge--cufa">CUFA</span>
            <span className="cu-class-badge cu-class-badge--cuos">CUOS</span>
            <span className="cu-class-badge cu-class-badge--cutl">CUTL</span>
          </div>
        </div>
        <CuSubNav />
      </header>

      <div className="cu-body">
        <div className="cu-layout">
          <div className="cu-main">
            {/* Internal tab bar for Classifications vs Rollback */}
            <div className="cu-tabbar" style={{ marginBottom: 16, borderBottom: '1px solid var(--cu-border)', paddingBottom: 0 }}>
              {(['classifications', 'rollback'] as const).map(tab => (
                <button key={tab} type="button"
                  className={`cu-tab${activeTab === tab ? ' cu-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab === 'classifications' ? 'Classifications' : 'Rollback Calculator'}
                </button>
              ))}
            </div>

            {activeTab === 'classifications' && <ClassificationsPanel />}
            {activeTab === 'rollback' && <RollbackPanel />}
          </div>
          <CUForgeStatsRail />
        </div>
      </div>
    </div>
  );
}
