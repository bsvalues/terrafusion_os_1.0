// ScenarioCompareGrid.tsx
// Side-by-side projected impact comparison for two scenarios.
// User picks Scenario A and Scenario B from the study's scenario list,
// then hits "Compare" to see metric deltas with a winner indicator.
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi, ScenarioCompareDto, ScenarioCompareRowDto } from '../countyStudyApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMetric(label: string, value: number): string {
  if (label === 'Exceptions') return value.toFixed(0);
  return value.toFixed(3);
}

function winnerBadge(winner: 'A' | 'B' | 'Tie') {
  const colors: Record<string, string> = { A: '#3b82f6', B: '#8b5cf6', Tie: '#6b7280' };
  return (
    <span style={{
      padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
      background: `${colors[winner]}22`, color: colors[winner],
    }}>
      {winner === 'Tie' ? 'Tie' : `${winner} wins`}
    </span>
  );
}

function rowColor(row: ScenarioCompareRowDto, col: 'A' | 'B'): string {
  if (row.winner === 'Tie') return 'inherit';
  return row.winner === col ? '#22c55e' : '#ef4444';
}

const cell: React.CSSProperties = {
  padding: '5px 8px', fontSize: 11, borderBottom: '1px solid hsl(var(--tf-border))',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ScenarioCompareGrid() {
  const { scenarios } = useCountyStudioStore();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [result, setResult] = useState<ScenarioCompareDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCompare = !!idA && !!idB && idA !== idB;

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const dto = await scenarioApi.compare(idA, idB);
      setResult(dto);
    } catch {
      setError('Failed to compare scenarios. Make sure both have been previewed.');
    } finally {
      setLoading(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    flex: 1, fontSize: 11, padding: '4px 6px',
    background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))',
    borderRadius: 4, color: 'hsl(var(--tf-fg))',
  };

  if (scenarios.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'hsl(var(--tf-muted))', fontSize: 12 }}>
        No scenarios in this study yet.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Compare Scenarios
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <select value={idA} onChange={e => setIdA(e.target.value)} style={selectStyle}>
          <option value="">Scenario A…</option>
          {scenarios.map(s => (
            <option key={s.scenarioId} value={s.scenarioId}>
              {s.adjustmentType} {JSON.stringify((s.parameters as Record<string, unknown>)?.magnitude ?? '')} ({s.status})
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>vs</span>
        <select value={idB} onChange={e => setIdB(e.target.value)} style={selectStyle}>
          <option value="">Scenario B…</option>
          {scenarios.filter(s => s.scenarioId !== idA).map(s => (
            <option key={s.scenarioId} value={s.scenarioId}>
              {s.adjustmentType} {JSON.stringify((s.parameters as Record<string, unknown>)?.magnitude ?? '')} ({s.status})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCompare}
        disabled={!canCompare || loading}
        style={{
          padding: '5px 12px', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700,
          background: canCompare ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
          color: canCompare ? '#000' : 'hsl(var(--tf-muted))',
          cursor: canCompare ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Computing…' : 'Compare'}
      </button>

      {error && (
        <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>
      )}

      {result && (
        <>
          {/* Scenario labels */}
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            <span style={{ padding: '2px 8px', background: '#3b82f622', borderRadius: 10, color: '#3b82f6', fontWeight: 700 }}>
              A: {result.scenarioA.adjustmentType}
            </span>
            <span style={{ padding: '2px 8px', background: '#8b5cf622', borderRadius: 10, color: '#8b5cf6', fontWeight: 700 }}>
              B: {result.scenarioB.adjustmentType}
            </span>
          </div>

          {/* Compare table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'hsl(var(--tf-surface))' }}>
                <th style={{ ...cell, textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Metric</th>
                <th style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>Baseline</th>
                <th style={{ ...cell, textAlign: 'right', color: '#3b82f6' }}>After A</th>
                <th style={{ ...cell, textAlign: 'right', color: '#8b5cf6' }}>After B</th>
                <th style={{ ...cell, textAlign: 'center' }}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map(row => (
                <tr key={row.metricLabel}>
                  <td style={{ ...cell, fontWeight: 600 }}>{row.metricLabel}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>
                    {formatMetric(row.metricLabel, row.baseline)}
                  </td>
                  <td style={{ ...cell, textAlign: 'right', color: rowColor(row, 'A'), fontWeight: row.winner === 'A' ? 700 : 400 }}>
                    {formatMetric(row.metricLabel, row.afterA)}
                  </td>
                  <td style={{ ...cell, textAlign: 'right', color: rowColor(row, 'B'), fontWeight: row.winner === 'B' ? 700 : 400 }}>
                    {formatMetric(row.metricLabel, row.afterB)}
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    {winnerBadge(row.winner)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', paddingTop: 4 }}>
            {(() => {
              const aWins = result.rows.filter(r => r.winner === 'A').length;
              const bWins = result.rows.filter(r => r.winner === 'B').length;
              if (aWins > bWins) return `Scenario A leads on ${aWins}/${result.rows.length} metrics.`;
              if (bWins > aWins) return `Scenario B leads on ${bWins}/${result.rows.length} metrics.`;
              return 'Scenarios are evenly matched.';
            })()}
          </div>
        </>
      )}
    </div>
  );
}
