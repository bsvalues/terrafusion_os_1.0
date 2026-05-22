import { useEffect, useState } from 'react';

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

// ── Formatters ─────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (s: string) => s ? s.slice(0, 10) : '—';

// ── Removals List Section ──────────────────────────────────────────────────

function RemovalsSection() {
  const [data, setData] = useState<Removal[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/removals`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="tf-section">
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Removal Proceedings</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          Active and completed removals from current use classification with rollback tax obligations.
        </p>
      </div>

      {loading && <p className="tf-loading">Loading…</p>}
      {error && <p className="tf-error">Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Parcel</th>
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
                <tr><td colSpan={10} className="tf-empty">No removal proceedings found.</td></tr>
              )}
              {data.map(r => (
                <tr key={r.id}>
                  <td className="tf-mono">{r.parcelId}</td>
                  <td><span className="tf-badge tf-badge--blue">{r.classificationCode}</span></td>
                  <td>{r.reason}</td>
                  <td>{fmtDate(r.initiatedDate)}</td>
                  <td>
                    <span className={`tf-badge ${r.status === 'Confirmed' ? 'tf-badge--red' : r.status === 'Pending' ? 'tf-badge--gray' : 'tf-badge--green'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{fmtDate(r.removalDate ?? '')}</td>
                  <td className="tf-right tf-mono">{r.rollbackAmount != null ? fmt$(r.rollbackAmount) : '—'}</td>
                  <td className="tf-right tf-mono">{r.interestAmount != null ? fmt$(r.interestAmount) : '—'}</td>
                  <td className="tf-right tf-mono">{r.penaltyAmount != null ? fmt$(r.penaltyAmount) : '—'}</td>
                  <td className="tf-right tf-mono" style={{ color: r.totalDue && r.totalDue > 0 ? '#ff6b6b' : undefined }}>
                    {r.totalDue != null ? fmt$(r.totalDue) : '—'}
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
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`${API}/penalty-exceptions?parcelId=${encodeURIComponent(parcelId.trim())}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text() || r.statusText);
        return r.json();
      })
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  return (
    <section className="tf-section" style={{ marginTop: 32 }}>
      <div className="tf-page-header">
        <h3 style={{ margin: 0 }}>Penalty Exception Evaluation</h3>
        <p className="tf-page-sub" style={{ marginTop: 4 }}>
          Check which 20% penalty exceptions apply per RCW 84.33.140 / 84.34.108.
        </p>
      </div>

      <div className="tf-filters" style={{ alignItems: 'flex-end', gap: 12 }}>
        <label>
          Parcel ID
          <input
            type="text"
            placeholder="e.g. 1-0234-100-0001"
            value={parcelId}
            onChange={e => setParcelId(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 160 }}
          />
        </label>
        <button
          onClick={checkExceptions}
          disabled={loading || !parcelId.trim()}
          className="tf-btn"
        >
          {loading ? 'Checking…' : 'Evaluate Exceptions'}
        </button>
      </div>

      {error && <p className="tf-error" style={{ marginTop: 12 }}>Error: {error}</p>}

      {data && (
        <div className="tf-table-wrap" style={{ marginTop: 16 }}>
          <table className="tf-table">
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
                <tr><td colSpan={5} className="tf-empty">No exceptions evaluated.</td></tr>
              )}
              {data.map(pe => (
                <tr key={pe.code}>
                  <td className="tf-mono">{pe.code}</td>
                  <td>{pe.description}</td>
                  <td className="tf-mono" style={{ fontSize: 12 }}>{pe.rcwReference}</td>
                  <td>
                    <span className={`tf-badge ${pe.eligible ? 'tf-badge--green' : 'tf-badge--red'}`}>
                      {pe.eligible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{pe.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CurrentUseRemovalsPage() {
  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 24 }}>
        <h2>Current Use Removals</h2>
        <p className="tf-page-sub">
          Benton County WA — Removal proceedings, rollback obligations, and penalty exception evaluation
        </p>
      </div>

      <RemovalsSection />
      <PenaltyExceptionsSection />
    </div>
  );
}
