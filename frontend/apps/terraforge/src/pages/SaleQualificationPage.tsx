import { useEffect, useRef, useState } from 'react';

const API      = '/api/terraforge/sale-qualification';
const PATCH_API = (id: string) => `/api/terraforge/sale-qualification/${id}`;

// ── Types ──────────────────────────────────────────────────────────────────

interface SaleQualificationItem {
  saleId:                    string;
  parcelId:                  string;
  saleDate:                  string;
  salePrice:                 number;
  gla:                       number | null;
  hood:                      string | null;
  rawCountyRatioCd:          string | null;
  rawWacCd:                  string | null;
  rawRatioTypeCd:            string | null;
  qualificationRecommendation: string | null;
  recommendationReason:      string | null;
  qualificationDecision:     string | null;
  qualificationDecisionBy:   string | null;
  researchNotes:             string | null;
}

interface SaleQualificationResponse {
  total:    number;
  page:     number;
  pageSize: number;
  items:    SaleQualificationItem[];
}

interface PatchBody {
  qualificationDecision: string;
  researchNotes:         string;
  decidedBy:             string;
  decisionSource:        string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function recBadge(rec: string | null) {
  if (!rec) return <span className="tf-badge tf-badge--gray">—</span>;
  if (rec === 'qualified')     return <span className="tf-badge tf-badge--green">qualified</span>;
  if (rec.startsWith('exempt')) return <span className="tf-badge tf-badge--yellow">{rec}</span>;
  return <span className="tf-badge tf-badge--red">{rec}</span>;
}

function decBadge(dec: string | null) {
  if (!dec) return <span className="tf-badge tf-badge--gray">pending</span>;
  if (dec === 'qualified')      return <span className="tf-badge tf-badge--blue">✓ {dec}</span>;
  if (dec.startsWith('exempt')) return <span className="tf-badge tf-badge--yellow">{dec}</span>;
  return <span className="tf-badge tf-badge--red">{dec}</span>;
}

// ── Inline decision panel ──────────────────────────────────────────────────

interface DecisionPanelProps {
  sale:    SaleQualificationItem;
  onSave:  (saleId: string, body: PatchBody) => Promise<void>;
  onClose: () => void;
}

function DecisionPanel({ sale, onSave, onClose }: DecisionPanelProps) {
  const [decision,   setDecision]   = useState(sale.qualificationDecision ?? '');
  const [notes,      setNotes]      = useState(sale.researchNotes ?? '');
  const [decidedBy,  setDecidedBy]  = useState(sale.qualificationDecisionBy ?? '');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSave() {
    if (!decision) { setSaveError('Select a decision.'); return; }
    if (!decidedBy.trim()) { setSaveError('Enter who is making this decision.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(sale.saleId, {
        qualificationDecision: decision,
        researchNotes:         notes,
        decidedBy:             decidedBy.trim(),
        decisionSource:        'StaffConfirmed',
      });
    } catch (e) {
      setSaveError(String(e));
      setSaving(false);
    }
  }

  const panelStyle: React.CSSProperties = {
    background:   'rgba(99,102,241,.08)',
    border:       '1px solid rgba(99,102,241,.2)',
    borderRadius: 10,
    padding:      '14px 16px',
    display:      'flex',
    gap:          12,
    flexWrap:     'wrap',
    alignItems:   'flex-end',
  };

  const inputStyle: React.CSSProperties = {
    background:   'rgba(255,255,255,.06)',
    border:       '1px solid rgba(255,255,255,.12)',
    color:        '#e2e8f0',
    borderRadius: 6,
    padding:      '5px 9px',
    fontSize:     13,
  };

  const labelStyle: React.CSSProperties = {
    display:   'flex',
    flexDirection: 'column',
    gap:       4,
    fontSize:  12,
    color:     'rgba(226,232,240,.65)',
    fontWeight: 600,
  };

  const btnStyle = (primary: boolean): React.CSSProperties => ({
    padding:      '6px 14px',
    borderRadius: 6,
    fontSize:     12,
    fontWeight:   700,
    cursor:       saving ? 'not-allowed' : 'pointer',
    border:       primary ? 'none' : '1px solid rgba(255,255,255,.12)',
    background:   primary ? 'rgba(99,102,241,.7)' : 'transparent',
    color:        primary ? '#fff' : 'rgba(226,232,240,.65)',
    opacity:      saving ? 0.6 : 1,
  });

  return (
    <div style={panelStyle}>
      {/* Parcel summary */}
      <div style={{ fontSize: 12, color: 'rgba(226,232,240,.5)', alignSelf: 'center', fontFamily: 'ui-monospace,monospace' }}>
        {sale.parcelId}<br />
        {sale.saleDate.slice(0,10)} · {fmt$(sale.salePrice)}
      </div>

      {/* Decision */}
      <label style={labelStyle}>
        Decision
        <select
          value={decision}
          onChange={e => setDecision(e.target.value)}
          disabled={saving}
          style={{ ...inputStyle, minWidth: 160 }}
        >
          <option value="">— select —</option>
          <option value="qualified">qualified</option>
          <option value="non-arms-length">non-arms-length</option>
          <option value="exempt: family">exempt: family</option>
          <option value="exempt: gift">exempt: gift</option>
          <option value="exempt: foreclosure">exempt: foreclosure</option>
          <option value="exclude: land only">exclude: land only</option>
          <option value="exclude: other">exclude: other</option>
        </select>
      </label>

      {/* Decided by */}
      <label style={labelStyle}>
        Decided by
        <input
          ref={inputRef}
          type="text"
          placeholder="Name / initials"
          value={decidedBy}
          onChange={e => setDecidedBy(e.target.value)}
          disabled={saving}
          style={{ ...inputStyle, width: 140 }}
        />
      </label>

      {/* Research notes */}
      <label style={{ ...labelStyle, flex: 1, minWidth: 200 }}>
        Research notes
        <textarea
          placeholder="Optional notes for this decision…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={saving}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', width: '100%' }}
        />
      </label>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={handleSave} disabled={saving} style={btnStyle(true)}>
          {saving ? 'Saving…' : 'Save decision'}
        </button>
        <button onClick={onClose} disabled={saving} style={btnStyle(false)}>
          Cancel
        </button>
        {saveError && (
          <span style={{ fontSize: 11, color: '#fca5a5' }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SaleQualificationPage() {
  const [data,      setData]      = useState<SaleQualificationResponse | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [taxYear,   setTaxYear]   = useState(2026);
  const [status,    setStatus]    = useState('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Load list ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    const p = new URLSearchParams({ taxYear: String(taxYear), status, pageSize: '50' });
    fetch(`${API}?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}: ${r.statusText}`))
      .then((d: SaleQualificationResponse) => setData(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, status]);

  // ── PATCH decision ───────────────────────────────────────────────────────

  async function handleSave(saleId: string, body: PatchBody) {
    const res = await fetch(PATCH_API(saleId), {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    // Update the row in place so the table reflects the new decision immediately.
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(s =>
          s.saleId === saleId
            ? {
                ...s,
                qualificationDecision:   body.qualificationDecision,
                qualificationDecisionBy: body.decidedBy,
                researchNotes:           body.researchNotes,
              }
            : s
        ),
      };
    });
    setSelectedId(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="tf-page">
      <div className="tf-page-header">
        <h2>Sale Qualification</h2>
        <p className="tf-page-sub">
          System recommends · staff researches · appraiser decides — Benton County WA
        </p>
      </div>

      {/* Filters */}
      <div className="tf-filters">
        <label>
          Tax year
          <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))}>
            {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">Pending (no decision yet)</option>
            <option value="staff-confirmed">Staff confirmed</option>
            <option value="appraiser-final">Appraiser final</option>
            <option value="">All</option>
          </select>
        </label>
        {data && (
          <span className="tf-count">
            {data.total.toLocaleString()} sales · click a row to record decision
          </span>
        )}
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error   && <p className="tf-error">Error: {error}</p>}

      {!loading && !error && data && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Parcel</th>
                <th>Sale Date</th>
                <th className="tf-right">Sale Price</th>
                <th className="tf-right">GLA</th>
                <th>Hood</th>
                <th>Ratio Cd</th>
                <th>WAC</th>
                <th>Recommendation</th>
                <th>Reason</th>
                <th>Decision</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={11} className="tf-empty">No sales match this filter.</td>
                </tr>
              )}
              {data.items.map(s => {
                const isOpen = selectedId === s.saleId;
                return (
                  <>
                    <tr
                      key={s.saleId}
                      onClick={() => setSelectedId(isOpen ? null : s.saleId)}
                      style={{ cursor: 'pointer', background: isOpen ? 'rgba(99,102,241,.06)' : undefined }}
                    >
                      <td className="tf-mono">{s.parcelId}</td>
                      <td>{s.saleDate.slice(0, 10)}</td>
                      <td className="tf-right tf-mono">{fmt$(s.salePrice)}</td>
                      <td className="tf-right">{s.gla?.toLocaleString() ?? '—'}</td>
                      <td>{s.hood ?? '—'}</td>
                      <td className="tf-mono">{s.rawCountyRatioCd ?? '—'}</td>
                      <td className="tf-mono">{s.rawWacCd ?? '—'}</td>
                      <td>{recBadge(s.qualificationRecommendation)}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'rgba(226,232,240,.55)' }}>
                        {s.recommendationReason ?? '—'}
                      </td>
                      <td>{decBadge(s.qualificationDecision)}</td>
                      <td style={{ fontSize: 11, color: 'rgba(226,232,240,.5)' }}>
                        {s.qualificationDecisionBy ?? '—'}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={s.saleId + '-panel'}>
                        <td colSpan={11} style={{ padding: '6px 10px 12px', borderBottom: '1px solid rgba(99,102,241,.15)' }}>
                          <DecisionPanel
                            sale={s}
                            onSave={handleSave}
                            onClose={() => setSelectedId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
