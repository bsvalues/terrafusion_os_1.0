import React, { useMemo, useState } from 'react';
import ComplianceBadge from '../components/ComplianceBadge';
import MiniMetric from '../components/MiniMetric';
import SubgroupBars from '../components/SubgroupBars';
import { useRatioStudy } from '../hooks/useRatioStudy';

export const RatioStudyBenton: React.FC = () => {
  const [countyId, setCountyId] = useState('benton');
  const [cohortId, setCohortId] = useState('residential-2024');
  const [low, setLow] = useState(0.05);
  const [high, setHigh] = useState(0.95);
  const { result, loading, error, run } = useRatioStudy();

  const canRun = useMemo(() => !!countyId && !!cohortId && low >= 0 && high <= 1 && low < high, [countyId, cohortId, low, high]);

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <h2>Benton County — IAAO Ratio Study (Residential 2024)</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label>County
          <input value={countyId} onChange={(e) => setCountyId(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>Cohort
          <input value={cohortId} onChange={(e) => setCohortId(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label>Trim low
          <input type="number" step="0.01" value={low} onChange={(e) => setLow(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 90 }} />
        </label>
        <label>Trim high
          <input type="number" step="0.01" value={high} onChange={(e) => setHigh(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 90 }} />
        </label>
        <button disabled={!canRun || loading} onClick={() => run({ countyId, cohortId, trims: { low, high } })}>
          {loading ? 'Running…' : 'Run Ratio Study'}
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      {result && (() => {
        const levelPass = result.median >= 0.90 && result.median <= 1.10;
        const codPass = result.cod <= 0.15;
        const prdPass = result.prd >= 0.98 && result.prd <= 1.03;
        const overallPass = levelPass && codPass && prdPass;

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <ComplianceBadge label="Overall" pass={overallPass} detail="IAAO Median 0.90–1.10, COD ≤ 0.15 (residential), PRD 0.98–1.03" />
              <ComplianceBadge label="Median" pass={levelPass} detail="0.90–1.10" />
              <ComplianceBadge label="COD" pass={codPass} detail="≤ 0.15 (residential)" />
              <ComplianceBadge label="PRD" pass={prdPass} detail="0.98–1.03" />
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <MiniMetric label="Median" value={result.median} min={0.8} max={1.2} />
              <MiniMetric label="COD" value={result.cod} min={0} max={0.3} format={(v) => v.toFixed(3)} />
              <MiniMetric label="PRD" value={result.prd} min={0.9} max={1.1} />
            </div>

            {result.subgroups?.length ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <SubgroupBars
                  title="Subgroup Median"
                  items={result.subgroups.map((s) => ({ name: s.name, value: s.median }))}
                  min={0.8}
                  max={1.2}
                />
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong>Subgroup compliance (Median 0.90–1.10)</strong>
                  <ul>
                    {result.subgroups.map((s, i) => {
                      const ok = s.median >= 0.90 && s.median <= 1.10;
                      return <li key={i} style={{ color: ok ? '#14532d' : '#7f1d1d' }}>{s.name}: {ok ? 'Pass' : 'Fail'} ({s.median.toFixed(3)})</li>;
                    })}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        );
      })()}
    </div>
  );
};

export default RatioStudyBenton;
