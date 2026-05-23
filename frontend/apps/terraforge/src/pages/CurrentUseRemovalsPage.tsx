import { useEffect, useState, useCallback } from 'react';
import { CuSubNav } from './CurrentUsePage';

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
    fetch(`${API}/removals/initiate`, {
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
      <button onClick={() => setOpen(true)} className="tf-btn" style={{ marginBottom: 16, fontSize: 13 }}>
        + Initiate Removal
      </button>
    );
  }

  const inputStyle = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13, width: '100%' };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: 14 }}>Initiate Removal from Current Use</h4>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Parcel ID <span style={{ color: '#ff6b6b', fontSize: 10 }}>required</span>
          <input required type="text" value={form.parcelId} onChange={e => setForm(f => ({ ...f, parcelId: e.target.value }))} placeholder="1-0234-100-0001" style={inputStyle} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Classification
          <select value={form.classificationCode} onChange={e => setForm(f => ({ ...f, classificationCode: e.target.value }))} style={inputStyle}>
            {Object.entries(CU_CODES).map(([code, info]) => (
              <option key={code} value={code}>{code} — {info.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Reason for Removal
          <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={inputStyle}>
            {REMOVAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>
      {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: '10px 0 0' }}>{error}</p>}
      {success && <p style={{ color: '#00FFAA', fontSize: 12, margin: '10px 0 0' }}>Removal initiated successfully.</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={saving || !form.parcelId.trim()} className="tf-btn" style={{ fontSize: 13 }}>
          {saving ? 'Initiating…' : 'Initiate Removal'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', color: '#94a3b8', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Removal Proceedings
            <Tip text="Tracks parcels being removed from current use classification with associated rollback obligations">
              <span style={{ fontSize: 13, color: '#64748b', cursor: 'help' }}>?</span>
            </Tip>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            Active and completed removals with rollback tax obligations
          </p>
        </div>
        {data && <span style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,.04)', padding: '4px 10px', borderRadius: 12 }}>{data.length} removal{data.length !== 1 ? 's' : ''}</span>}
      </div>

      <InitiateRemovalForm onCreated={fetchData} />

      {loading && <Skeleton rows={4} />}
      {error && <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>}

      {!loading && data && (
        <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="tf-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Code</th>
                <th>Reason</th>
                <th>Initiated</th>
                <th>Status</th>
                <th>Removal Date</th>
                <th className="tf-right">Rollback</th>
                <th className="tf-right">Interest</th>
                <th className="tf-right">Penalty</th>
                <th className="tf-right">Total Due</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No removal proceedings found. Initiate one above.</td></tr>
              )}
              {data.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td className="tf-mono" style={{ fontSize: 12 }}>{r.parcelId}</td>
                  <td>
                    <span className={`tf-badge tf-badge--${CU_CODES[r.classificationCode]?.color || 'gray'}`} style={{ fontSize: 11 }}>
                      {r.classificationCode}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(r.initiatedDate)}</td>
                  <td><span className={`tf-badge ${statusColor(r.status)}`} style={{ fontSize: 11 }}>{r.status}</span></td>
                  <td style={{ fontSize: 12 }}>{r.removalDate ? fmtDate(r.removalDate) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{r.rollbackAmount != null ? fmtFull$(r.rollbackAmount) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{r.interestAmount != null ? fmtFull$(r.interestAmount) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ fontSize: 12 }}>{r.penaltyAmount != null ? fmtFull$(r.penaltyAmount) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ fontSize: 12, color: r.totalDue && r.totalDue > 0 ? '#ff6b6b' : undefined, fontWeight: r.totalDue ? 600 : 400 }}>
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
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Penalty Exception Evaluation
          <Tip text="20% penalty can be waived under specific RCW exceptions — check eligibility here">
            <span style={{ fontSize: 13, color: '#64748b', cursor: 'help' }}>?</span>
          </Tip>
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          Check which 20% penalty exceptions apply per RCW 84.33.140 / 84.34.108
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
          Parcel ID
          <input type="text" value={parcelId} onChange={e => setParcelId(e.target.value)} placeholder="1-0234-100-0001"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13, width: 180 }} />
        </label>
        <button onClick={checkExceptions} disabled={loading || !parcelId.trim()} className="tf-btn" style={{ fontSize: 13 }}>
          {loading ? 'Evaluating…' : 'Evaluate Exceptions'}
        </button>
      </div>

      {error && <p style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</p>}

      {data && (
        <div className="tf-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="tf-table" style={{ fontSize: 13 }}>
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
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>No exceptions evaluated.</td></tr>
              )}
              {data.map(pe => (
                <tr key={pe.code} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td className="tf-mono" style={{ fontSize: 12, fontWeight: 600 }}>{pe.code}</td>
                  <td style={{ fontSize: 12 }}>{pe.description}</td>
                  <td className="tf-mono" style={{ fontSize: 11, color: '#94a3b8' }}>{pe.rcwReference}</td>
                  <td>
                    <span className={`tf-badge ${pe.eligible ? 'tf-badge--green' : 'tf-badge--red'}`} style={{ fontSize: 11 }}>
                      {pe.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: pe.eligible ? '#00FFAA' : '#94a3b8' }}>{pe.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reference card */}
      <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,255,255,.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#94a3b8' }}>Penalty Exception Reference</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
          {[
            { code: 'DEATH', desc: 'Owner death', rcw: 'RCW 84.33.140(6)(a)' },
            { code: 'GOVT_ACQUISITION', desc: 'Government acquisition / eminent domain', rcw: 'RCW 84.33.140(6)(b)' },
            { code: 'TRADE_LAND_CONSERVATION', desc: 'Trade for conservation land', rcw: 'RCW 84.34.108(6)(a)' },
            { code: 'FORCED_SALE', desc: 'Forced sale / condemnation', rcw: 'RCW 84.34.108(6)(b)' },
            { code: 'TRANSFER_TO_GOVT', desc: 'Transfer to government entity', rcw: 'RCW 84.34.108(6)(c)' },
          ].map(ex => (
            <div key={ex.code} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12 }}>
              <span style={{ color: '#00FFAA', fontFamily: 'monospace', fontSize: 11, minWidth: 140 }}>{ex.code}</span>
              <span style={{ color: '#94a3b8' }}>{ex.desc}</span>
              <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto' }}>{ex.rcw}</span>
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
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, color: '#f1f5f9' }}>Current Use Program</h2>
        <p className="tf-page-sub" style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
          Benton County WA — Removal proceedings, rollback obligations, and penalty exception evaluation
        </p>
      </div>
      <CuSubNav />
      <RemovalsSection />
      <PenaltyExceptionsSection />
    </div>
  );
}
