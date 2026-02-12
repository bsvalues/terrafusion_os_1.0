import React, { useMemo, useState } from 'react';
import BandChart from '../components/BandChart';
import { useLevyForecast } from '../hooks/useLevyForecast';

export const LevyBenton: React.FC = () => {
  const [districtId, setDistrictId] = useState('benton-sd');
  const [rate, setRate] = useState(0.0125);
  const [seniorCap, setSeniorCap] = useState(0.50);
  const [veteransEx, setVeteransEx] = useState(0.10);
  const { result, loading, error, run } = useLevyForecast();

  const canRun = useMemo(() => !!districtId && rate >= 0, [districtId, rate]);

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h2>Benton County — Levy Forecast (School District)</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label>District
          <input value={districtId} onChange={(e) => setDistrictId(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>Rate
          <input type="number" step="0.0001" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 110 }} />
        </label>
        <label>Senior Cap
          <input type="number" step="0.01" value={seniorCap} onChange={(e) => setSeniorCap(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 110 }} />
        </label>
        <label>Veterans Exemption
          <input type="number" step="0.01" value={veteransEx} onChange={(e) => setVeteransEx(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 140 }} />
        </label>
        <button disabled={!canRun || loading} onClick={() => run({ districtId, rate, caps: { senior: seniorCap }, exemptions: { veterans: veteransEx } })}>
          {loading ? 'Forecasting…' : 'Run Forecast'}
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      {result && (
        <div style={{ display: 'grid', gap: 12 }}>
          <BandChart lower={result.lower} expected={result.expected} upper={result.upper} />
          <div style={{ display: 'flex', gap: 16, color: '#374151' }}>
            <div><strong>Expected:</strong> {result.expected.toLocaleString()}</div>
            <div><strong>Range:</strong> {result.lower.toLocaleString()} – {result.upper.toLocaleString()}</div>
          </div>
          {result.assumptions && (
            <details>
              <summary>Assumptions</summary>
              <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6 }}>
{JSON.stringify(result.assumptions, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default LevyBenton;
