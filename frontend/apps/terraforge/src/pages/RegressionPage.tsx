import { useEffect, useState } from 'react';

const API = '/api/terraforge/regression';

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

const fmt$ = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDate = (s: string) => s.slice(0, 10);

function fmtBeta(name: string, value: number) {
  if (name === 'intercept') return fmt$(value);
  if (name.startsWith('GLA') || name.startsWith('Lot')) {
    return (value >= 0 ? '+' : '') + '$' + value.toFixed(2) + '/sqft';
  }
  return (value >= 0 ? '+' : '') + '$' + value.toFixed(2) + '/yr';
}

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

  return (
    <div className="tf-page">
      <div className="tf-page-header">
        <h2>OLS Regression</h2>
        <p className="tf-page-sub">County-wide hedonic model — SalePrice ~ GLA + LotSqft + YearBuilt</p>
      </div>

      {/* Filters */}
      <div className="tf-filters">
        <label>
          Tax year
          <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          Hood
          <input
            type="text"
            placeholder="e.g. 15112"
            value={hood}
            onChange={e => setHood(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 80 }}
          />
        </label>
        <label>
          Type
          <input
            type="text"
            placeholder="e.g. 11"
            value={propType}
            onChange={e => setPropType(e.target.value)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#e2e8f0', borderRadius: 6, padding: '4px 8px', fontSize: 13, width: 60 }}
          />
        </label>
        {data && (
          <span className="tf-count">
            pool: {data.totalPool.toLocaleString()} · fit: {data.usedForFit.toLocaleString()} · excluded: {data.excludedCount}
          </span>
        )}
      </div>

      {loading && <p className="tf-loading">Running regression…</p>}
      {error   && <p className="tf-error">Error: {error}</p>}

      {data?.insufficientData && (
        <p className="tf-error">
          Insufficient data — need ≥ 5 qualified observations with valid GLA (found {data.usedForFit}).
        </p>
      )}

      {data?.singularMatrix && (
        <p className="tf-error">
          Singular predictor matrix — check for collinear variables in this stratum.
        </p>
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
        </div>
      )}

      {/* Residuals table */}
      {data && data.residuals.length > 0 && (
        <div className="tf-table-wrap">
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
                const pctClass = absPct == null ? '' : absPct > 20 ? 'tf-badge--red' : absPct > 10 ? 'tf-badge--yellow' : '';
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
                        <span className={pctClass ? `tf-badge ${pctClass}` : undefined}>
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
