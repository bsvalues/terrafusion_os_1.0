import { useEffect, useRef, useState } from 'react';

const API       = '/api/terraforge/sale-qualification';
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

function Skeleton({ rows = 8 }: { rows?: number }) {
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
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
    fontSize:      12,
    color:         'rgba(226,232,240,.65)',
    fontWeight:    600,
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
  const [data,       setData]       = useState<SaleQualificationResponse | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [taxYear,    setTaxYear]    = useState(2026);
  const [status,     setStatus]     = useState('pending');
  const [page,       setPage]       = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pageSize = 50;

  // ── Load list ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    const p = new URLSearchParams({ taxYear: String(taxYear), status, pageSize: String(pageSize), page: String(page) });
    fetch(`${API}?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}: ${r.statusText}`))
      .then((d: SaleQualificationResponse) => setData(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, status, page]);

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
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(s =>
          s.saleId === saleId
            ? { ...s, qualificationDecision: body.qualificationDecision, qualificationDecisionBy: body.decidedBy, researchNotes: body.researchNotes }
            : s
        ),
      };
    });
    setSelectedId(null);
  }

  // ── Export CSV ───────────────────────────────────────────────────────────

  const exportCsv = () => {
    if (!data?.items.length) return;
    const header = 'Parcel,Sale Date,Sale Price,GLA,Hood,Ratio Cd,WAC,Recommendation,Reason,Decision,Decided By,Notes\n';
    const rows = data.items.map(s =>
      `${s.parcelId},${s.saleDate.slice(0,10)},${s.salePrice},${s.gla ?? ''},${s.hood ?? ''},${s.rawCountyRatioCd ?? ''},${s.rawWacCd ?? ''},${s.qualificationRecommendation ?? ''},"${(s.recommendationReason ?? '').replace(/"/g, '""')}",${s.qualificationDecision ?? ''},${s.qualificationDecisionBy ?? ''},"${(s.researchNotes ?? '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `sale_qualification_${taxYear}_${status || 'all'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13 };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>Sale Qualification<Tooltip text="Three-tier workflow: System recommends qualification based on WAC/DOR codes, staff researches, appraiser makes final decision. Per WA DOR guidelines." /></h2>
        <p className="tf-page-sub">
          System recommends · staff researches · appraiser decides — Benton County WA
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Tax Year
          <select value={taxYear} onChange={e => { setTaxYear(Number(e.target.value)); setPage(1); }} style={inputStyle}>
            {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Status
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="pending">Pending (no decision yet)</option>
            <option value="staff-confirmed">Staff confirmed</option>
            <option value="appraiser-final">Appraiser final</option>
            <option value="">All</option>
          </select>
        </label>
        <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'flex-end' }}>⬇ CSV</button>
      </div>

      {/* Summary */}
      {data && (
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,.7)', marginBottom: 8 }}>
          {data.total.toLocaleString()} sales · Click a row to record decision · Page {page} of {totalPages}
        </div>
      )}

      {loading && <Skeleton rows={10} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {!loading && !error && data && (
        <>
          <div className="tf-table-wrap" style={{ maxHeight: 520, overflow: 'auto' }}>
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
                    <tbody key={s.saleId}>
                      <tr
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
                        <tr>
                          <td colSpan={11} style={{ padding: '6px 10px 12px', borderBottom: '1px solid rgba(99,102,241,.15)' }}>
                            <DecisionPanel
                              sale={s}
                              onSave={handleSave}
                              onClose={() => setSelectedId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="tf-btn" style={{ fontSize: 11, padding: '4px 10px' }}>← Prev</button>
              <span style={{ fontSize: 12, color: 'rgba(226,232,240,.6)', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="tf-btn" style={{ fontSize: 11, padding: '4px 10px' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
