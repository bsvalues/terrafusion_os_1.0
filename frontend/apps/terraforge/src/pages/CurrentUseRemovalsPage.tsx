import { useEffect, useState, useCallback } from 'react';
import { CuSubNav } from './CurrentUsePage';
import './CUForge.css';

const API = '/api/currentuse';

// ── Types ──────────────────────────────────────────────────────────────────

interface Removal {
  id: string;
  parcelId: string;
  classificationCode: string;
  reason: string;
  initiatedDate: string;
  status: string;
  removalDate: string | null;
  rollbackAmount: number | null;
  interestAmount: number | null;
  penaltyAmount: number | null;
  totalDue: number | null;
}

interface PenaltyException {
  code: string;
  description: string;
  rcwReference: string;
  eligible: boolean;
  reason: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtFull$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtDate = (s: string) => s ? new Date(s.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const REMOVAL_REASONS = [
  'Voluntary withdrawal',
  'Change of use',
  'Sale to non-qualifying buyer',
  'Subdivision',
  'Failure to meet requirements',
  'Government acquisition',
  'Owner death — estate transfer',
];

const CU_CODES: Record<string, { label: string; color: string }> = {
  DFL:  { label: 'Designated Forest Land', color: 'green' },
  CUFA: { label: 'Farm & Agriculture', color: 'blue' },
  CUOS: { label: 'Open Space', color: 'purple' },
  CUTL: { label: 'Timber Land', color: 'amber' },
};

// ── Initiate Removal Form ──────────────────────────────────────────────────

function InitiateRemovalForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    parcelId: '', classificationCode: 'CUFA', reason: REMOVAL_REASONS[0],
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    fetch(`${API}/removals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelId: form.parcelId.trim(),
        classificationCode: form.classificationCode,
        reason: form.reason,
      }),
    })
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(() => {
        setSuccess(true);
        setForm({ parcelId: '', classificationCode: 'CUFA', reason: REMOVAL_REASONS[0] });
        onCreated();
        setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
      })
      .catch(e => setError(String(e)))
      .finally(() => setSaving(false));
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="cu-btn cu-btn--primary" style={{ marginBottom: 14 }}>
        + Initiate Removal
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="cu-filterbar" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Initiate Removal from Current Use</span>
        <button type="button" onClick={() => setOpen(false)} className="cu-btn cu-btn--ghost" style={{ padding: '2px 8px' }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
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
          <label className="cu-form-label">Reason for Removal</label>
          <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="cu-form-select">
            {REMOVAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="cu-state cu-state--error" style={{ padding: '6px 0', justifyContent: 'flex-start' }}>{error}</div>}
      {success && <div style={{ fontSize: '0.75rem', color: 'var(--cu-success)', padding: '6px 0' }}>Removal initiated successfully.</div>}
      <div className="cu-action-bar" style={{ marginTop: 12, marginBottom: 0 }}>
        <button type="submit" disabled={saving || !form.parcelId.trim()} className="cu-btn cu-btn--primary">
          {saving ? 'Initiating…' : 'Initiate Removal'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cu-btn cu-btn--ghost">Cancel</button>
      </div>
    </form>
  );
}

// ── Removals List Section ──────────────────────────────────────────────────

function RemovalsSection() {
  const [data, setData] = useState<Removal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true); setError(null);
    fetch(`${API}/removals`)
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'Confirmed': return 'tf-badge--red';
      case 'Pending': return 'tf-badge--gray';
      case 'Initiated': return 'tf-badge--blue';
      default: return 'tf-badge--green';
    }
  };

  return (
    <section className="tf-section">
      <div className="cu-action-bar" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>Removal Proceedings</span>
        {data && <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>{data.length} removal{data.length !== 1 ? 's' : ''}</span>}
      </div>

      <div className="cu-rcw-callout" style={{ marginBottom: 14 }}>
        <div className="cu-rcw-callout__label">RCW 84.33.140 / RCW 84.34.108</div>
        Active and completed removals with rollback tax obligations
      </div>

      <InitiateRemovalForm onCreated={fetchData} />

      {loading && <div className="cu-state" role="status">Loading removals…</div>}
      {error && <div className="cu-state cu-state--error">{error}</div>}

      {!loading && data && (
        <div className="cu-table-scroll tf-table-wrap">
          <table className="tf-table cu-table">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Code</th>
                <th>Reason</th>
                <th>Initiated</th>
                <th>Status</th>
                <th>Removal Date</th>
                <th className="cu-right tf-right">Rollback</th>
                <th className="cu-right tf-right">Interest</th>
                <th className="cu-right tf-right">Penalty</th>
                <th className="cu-right tf-right">Total Due</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={10} className="cu-state">No removal proceedings found. Initiate one above.</td></tr>
              )}
              {data.map(r => (
                <tr key={r.id}>
                  <td className="cu-mono tf-mono">{r.parcelId}</td>
                  <td>
                    <span className={`cu-class-badge cu-class-badge--${r.classificationCode?.toLowerCase()}`}>
                      {r.classificationCode}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                  <td style={{ fontSize: '0.75rem' }}>{fmtDate(r.initiatedDate)}</td>
                  <td><span className={`tf-badge ${statusColor(r.status)}`}>{r.status}</span></td>
                  <td style={{ fontSize: '0.75rem' }}>{r.removalDate ? fmtDate(r.removalDate) : '—'}</td>
                  <td className="cu-right tf-right cu-mono tf-mono">{r.rollbackAmount != null ? fmtFull$(r.rollbackAmount) : '—'}</td>
                  <td className="cu-right tf-right cu-mono tf-mono">{r.interestAmount != null ? fmtFull$(r.interestAmount) : '—'}</td>
                  <td className="cu-right tf-right cu-mono tf-mono">{r.penaltyAmount != null ? fmtFull$(r.penaltyAmount) : '—'}</td>
                  <td className="cu-right tf-right cu-mono tf-mono" style={{ color: r.totalDue && r.totalDue > 0 ? 'var(--cu-alert)' : undefined, fontWeight: r.totalDue ? 600 : 400 }}>
                    {r.totalDue != null ? fmtFull$(r.totalDue) : '—'}
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

// ── Penalty Exceptions Section ─────────────────────────────────────────────

function PenaltyExceptionsSection() {
  const [data, setData] = useState<PenaltyException[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parcelId, setParcelId] = useState('');

  function checkExceptions() {
    if (!parcelId.trim()) return;
    setLoading(true); setError(null); setData(null);
    fetch(`${API}/penalty-exceptions?parcelId=${encodeURIComponent(parcelId.trim())}`)
      .then(async r => { if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <section className="tf-section" style={{ marginTop: 24 }}>
      <div className="cu-action-bar" style={{ marginBottom: 14 }}>
        <span style={{ fontWeight: 600 }}>Penalty Exception Evaluation</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--cu-muted)' }}>20% penalty waiver eligibility check</span>
      </div>

      <div className="cu-filterbar">
        <div className="cu-filter-row">
          <div className="cu-filter-group">
            <span className="cu-filter-label">Parcel ID</span>
            <input type="text" value={parcelId} onChange={e => setParcelId(e.target.value)} placeholder="1-0234-100-0001" className="cu-filter-input" />
          </div>
          <div className="cu-filter-actions">
            <button onClick={checkExceptions} disabled={loading || !parcelId.trim()} className="cu-btn cu-btn--primary">
              {loading ? 'Evaluating…' : 'Evaluate Exceptions'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="cu-state cu-state--error">{error}</div>}

      {data && (
        <div className="cu-table-scroll tf-table-wrap" style={{ marginTop: 14 }}>
          <table className="tf-table cu-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>RCW Reference</th>
                <th>Eligible</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={5} className="cu-state">No exceptions evaluated.</td></tr>
              )}
              {data.map(pe => (
                <tr key={pe.code}>
                  <td className="cu-mono tf-mono" style={{ fontWeight: 600 }}>{pe.code}</td>
                  <td style={{ fontSize: '0.75rem' }}>{pe.description}</td>
                  <td className="cu-mono tf-mono" style={{ fontSize: '0.6875rem', color: 'var(--cu-muted)' }}>{pe.rcwReference}</td>
                  <td>
                    <span className={`tf-badge ${pe.eligible ? 'tf-badge--green' : 'tf-badge--red'}`}>
                      {pe.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: pe.eligible ? 'var(--cu-success)' : 'var(--cu-muted)' }}>{pe.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reference card */}
      <div className="cu-rcw-callout" style={{ marginTop: 16 }}>
        <div className="cu-rcw-callout__label">Penalty Exception Reference</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 6, marginTop: 8 }}>
          {[
            { code: 'DEATH', desc: 'Owner death', rcw: 'RCW 84.33.140(6)(a)' },
            { code: 'GOVT_ACQUISITION', desc: 'Government acquisition / eminent domain', rcw: 'RCW 84.33.140(6)(b)' },
            { code: 'TRADE_LAND_CONSERVATION', desc: 'Trade for conservation land', rcw: 'RCW 84.34.108(6)(a)' },
            { code: 'FORCED_SALE', desc: 'Forced sale / condemnation', rcw: 'RCW 84.34.108(6)(b)' },
            { code: 'TRANSFER_TO_GOVT', desc: 'Transfer to government entity', rcw: 'RCW 84.34.108(6)(c)' },
          ].map(ex => (
            <div key={ex.code} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '0.75rem' }}>
              <span className="cu-mono" style={{ minWidth: 140, color: 'var(--cu-success)' }}>{ex.code}</span>
              <span style={{ color: 'var(--cu-muted)' }}>{ex.desc}</span>
              <span style={{ color: 'var(--cu-dim)', fontSize: '0.625rem', marginLeft: 'auto' }}>{ex.rcw}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CurrentUseRemovalsPage() {
  return (
    <div className="tf-page cu-workspace" data-testid="cu-workspace">
      <header className="cu-header">
        <div className="cu-header__row">
          <div>
            <div className="cu-header__eyebrow">TerraFusion · Current Use Program</div>
            <h1 className="cu-header__title">CUForge — Removals & Exceptions</h1>
          </div>
        </div>
        <CuSubNav />
      </header>

      <div className="cu-body">
        <div className="cu-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div className="cu-main">
            <RemovalsSection />
            <PenaltyExceptionsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
