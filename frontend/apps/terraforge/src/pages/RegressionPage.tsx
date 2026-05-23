import { useEffect, useState } from 'react';

const API = '/api/terraforge/regression';

// ── Types ──────────────────────────────────────────────────────────────────

interface RegressionModel {
  predictors: string[];
  beta: number[];
  rSquared: number;
  rSquaredAdj: number;
  rmse: number;
  n: number;
}

interface ResidualRow {
  parcelId: string;
  saleDate: string;
  salePrice: number;
  gla: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  fitted: number;
  residual: number;
  percentResidual: number | null;
  hood: string | null;
  propertyType: string | null;
}

interface RegressionResponse {
  taxYear: number;
  hood: string | null;
  propertyType: string | null;
  totalPool: number;
  usedForFit: number;
  excludedCount: number;
  insufficientData: boolean;
  singularMatrix?: boolean;
  model: RegressionModel | null;
  residuals: ResidualRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDate = (s: string) => s.slice(0, 10);

function fmtBeta(name: string, value: number) {
  if (name === 'intercept') return fmt$(value);
  if (name.startsWith('GLA') || name.startsWith('Lot')) {
    return (value >= 0 ? '+' : '') + '$' + value.toFixed(2) + '/sqft';
  }
  return (value >= 0 ? '+' : '') + '$' + value.toFixed(2) + '/yr';
}

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

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RegressionPage() {
  const [taxYear, setTaxYear]   = useState(2026);
  const [hood, setHood]         = useState('');
  const [propType, setPropType] = useState('');
  const [data, setData]         = useState<RegressionResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams({ taxYear: String(taxYear) });
    if (hood)     p.set('hood', hood);
    if (propType) p.set('propertyType', propType);

    fetch(`${API}?${p}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((d: RegressionResponse) => setData(d))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taxYear, hood, propType]);

  const m = data?.model;

  const exportCsv = () => {
    if (!data?.residuals.length) return;
    const header = 'Parcel,Sale Date,Sale Price,Fitted,Residual,% Residual,GLA,Year Built,Hood\n';
    const rows = data.residuals.map(r =>
      `${r.parcelId},${fmtDate(r.saleDate)},${r.salePrice},${r.fitted.toFixed(0)},${r.residual.toFixed(0)},${r.percentResidual?.toFixed(2) ?? ''},${r.gla ?? ''},${r.yearBuilt ?? ''},${r.hood ?? ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `regression_residuals_${taxYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13 };

  return (
    <div className="tf-page">
      <div className="tf-page-header" style={{ marginBottom: 16 }}>
        <h2>OLS Regression<Tooltip text="Ordinary Least Squares hedonic model. Estimates property value as a function of GLA, lot size, and year built. Per IAAO Standard on Mass Appraisal." /></h2>
        <p className="tf-page-sub">Benton County WA — Hedonic model: SalePrice ~ GLA + LotSqft + YearBuilt</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Tax Year
          <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} style={inputStyle}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Neighborhood
          <input type="text" placeholder="e.g. 15112" value={hood} onChange={e => setHood(e.target.value)} style={{ ...inputStyle, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: 'rgba(226,232,240,.65)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
          Type
          <input type="text" placeholder="e.g. 11" value={propType} onChange={e => setPropType(e.target.value)} style={{ ...inputStyle, width: 60 }} />
        </label>
        <button onClick={exportCsv} className="tf-btn" style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'flex-end' }}>⬇ CSV</button>
      </div>

      {/* Pool stats */}
      {data && (
        <div style={{ fontSize: 12, color: 'rgba(148,163,184,.7)', marginBottom: 12 }}>
          Pool: {data.totalPool.toLocaleString()} · Fit: {data.usedForFit.toLocaleString()} · Excluded: {data.excludedCount}
        </div>
      )}

      {loading && <Skeleton rows={8} />}
      {error && <p className="tf-error">Error: {error}</p>}

      {data?.insufficientData && (
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
          Insufficient data — need at least 5 qualified observations with valid GLA (found {data.usedForFit}).
        </div>
      )}

      {data?.singularMatrix && (
        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
          Singular predictor matrix — check for collinear variables in this stratum.
        </div>
      )}

      {/* Model summary cards */}
      {m && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">R²</div>
            <div className="tf-cardBig">{m.rSquared.toFixed(4)}</div>
            <div className="tf-cardSmall">adj R² {m.rSquaredAdj.toFixed(4)}</div>
          </div>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">RMSE</div>
            <div className="tf-cardBig">{fmt$(m.rmse)}</div>
            <div className="tf-cardSmall">root mean squared error</div>
          </div>
          <div className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
            <div className="tf-cardTag tf-indigo">n</div>
            <div className="tf-cardBig">{m.n.toLocaleString()}</div>
            <div className="tf-cardSmall">observations used in fit</div>
          </div>

          {/* Coefficient cards */}
          {m.predictors.map((name, i) => (
            <div key={name} className="tf-card" style={{ padding: '14px 18px', cursor: 'default' }}>
              <div className="tf-cardTag tf-indigo">{name}</div>
              <div className="tf-cardBig" style={{ fontSize: 18 }}>
                {fmtBeta(name, m.beta[i])}
              </div>
              <div className="tf-cardSmall">β[{i}] = {m.beta[i].toFixed(4)}</div>
            </div>
          ))}

          {/* Model quality gate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
            <span className={`tf-badge ${m.rSquared >= 0.7 ? 'tf-badge--green' : m.rSquared >= 0.5 ? 'tf-badge--yellow' : 'tf-badge--red'}`}>
              R² {m.rSquared >= 0.7 ? 'GOOD' : m.rSquared >= 0.5 ? 'FAIR' : 'POOR'} ({(m.rSquared * 100).toFixed(1)}%)
            </span>
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,.5)' }}>
              target: R² ≥ 0.70 for mass appraisal
            </span>
          </div>
        </div>
      )}

      {/* Residuals table */}
      {!loading && !error && data && data.residuals.length > 0 && (
        <div className="tf-table-wrap" style={{ maxHeight: 480, overflow: 'auto' }}>
          <table className="tf-table">
            <thead>
              <tr>
                <th>Parcel</th>
                <th>Sale Date</th>
                <th className="tf-right">Sale Price</th>
                <th className="tf-right">Fitted</th>
                <th className="tf-right">Residual</th>
                <th className="tf-right">% Residual</th>
                <th className="tf-right">GLA</th>
                <th>Year</th>
                <th>Hood</th>
              </tr>
            </thead>
            <tbody>
              {data.residuals.map(r => {
                const absPct = r.percentResidual != null ? Math.abs(r.percentResidual) : null;
                return (
                  <tr key={r.parcelId + r.saleDate}>
                    <td className="tf-mono">{r.parcelId}</td>
                    <td>{fmtDate(r.saleDate)}</td>
                    <td className="tf-right tf-mono">{fmt$(r.salePrice)}</td>
                    <td className="tf-right tf-mono">{fmt$(r.fitted)}</td>
                    <td className="tf-right tf-mono" style={{ color: r.residual < 0 ? '#f87171' : '#34d399' }}>
                      {r.residual >= 0 ? '+' : ''}{fmt$(r.residual)}
                    </td>
                    <td className="tf-right">
                      {r.percentResidual != null ? (
                        <span className={`tf-badge ${absPct! > 20 ? 'tf-badge--red' : absPct! > 10 ? 'tf-badge--yellow' : ''}`}>
                          {r.percentResidual >= 0 ? '+' : ''}{r.percentResidual.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="tf-right">{r.gla?.toLocaleString() ?? '—'}</td>
                    <td>{r.yearBuilt ?? '—'}</td>
                    <td>{r.hood ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
