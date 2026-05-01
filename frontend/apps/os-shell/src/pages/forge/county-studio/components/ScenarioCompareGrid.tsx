// ScenarioCompareGrid.tsx
// Side-by-side projected impact comparison for two scenarios.
// User picks Scenario A and Scenario B from the study's scenario list,
// then hits "Compare" to see metric deltas with a winner indicator.
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi, ScenarioCompareDto, ScenarioCompareRowDto } from '../countyStudyApi';
import type { CountyScenarioDto, ScenarioStatus } from '../types/countyStudio.types';

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

type DecisionState = 'ready' | 'watch' | 'blocked';
type Recommendation = 'A' | 'B' | 'Tie';

const decisionTone: Record<DecisionState, { label: string; color: string; bg: string }> = {
  ready: {
    label: 'Ready',
    color: 'hsl(var(--tf-success, 142 71% 45%))',
    bg: 'hsl(var(--tf-success, 142 71% 45%) / 0.14)',
  },
  watch: {
    label: 'Review',
    color: 'hsl(var(--tf-warning, 38 92% 50%))',
    bg: 'hsl(var(--tf-warning, 38 92% 50%) / 0.14)',
  },
  blocked: {
    label: 'Blocked',
    color: 'hsl(var(--tf-danger, 0 84% 60%))',
    bg: 'hsl(var(--tf-danger, 0 84% 60%) / 0.14)',
  },
};

interface DecisionStep {
  label: string;
  state: DecisionState;
  detail: string;
}

interface ScenarioDecision {
  aWins: number;
  bWins: number;
  tieCount: number;
  recommendation: Recommendation;
  candidate: CountyScenarioDto | null;
  candidateLabel: string;
  nextAction: string;
  approvalState: DecisionState;
  approvalDetail: string;
}

function statusApprovalPosture(status: ScenarioStatus | undefined, candidateLabel: string): Pick<ScenarioDecision, 'approvalState' | 'approvalDetail' | 'nextAction'> {
  switch (status) {
    case 'Saved':
    case 'Reviewed':
      return {
        approvalState: 'ready',
        approvalDetail: `${candidateLabel} is ${status}; it can be promoted into governed approval.`,
        nextAction: `Advance ${candidateLabel} to approval`,
      };
    case 'Promoted':
      return {
        approvalState: 'watch',
        approvalDetail: `${candidateLabel} is already promoted; approval closure is still required before application.`,
        nextAction: 'Open approval workflow',
      };
    case 'Approved':
      return {
        approvalState: 'ready',
        approvalDetail: `${candidateLabel} is approved; application remains a separate governed action.`,
        nextAction: 'Prepare apply packet',
      };
    case 'Draft':
      return {
        approvalState: 'blocked',
        approvalDetail: `${candidateLabel} is still Draft; save it before approval review.`,
        nextAction: `Save ${candidateLabel}`,
      };
    case 'Rejected':
    case 'Archived':
      return {
        approvalState: 'blocked',
        approvalDetail: `${candidateLabel} is ${status}; it cannot be advanced without a new decision.`,
        nextAction: 'Select another scenario',
      };
    default:
      return {
        approvalState: 'watch',
        approvalDetail: 'No approval candidate has been selected.',
        nextAction: 'Resolve comparison result',
      };
  }
}

function buildDecision(result: ScenarioCompareDto): ScenarioDecision {
  const aWins = result.rows.filter(r => r.winner === 'A').length;
  const bWins = result.rows.filter(r => r.winner === 'B').length;
  const tieCount = result.rows.filter(r => r.winner === 'Tie').length;
  const recommendation: Recommendation = aWins > bWins ? 'A' : bWins > aWins ? 'B' : 'Tie';
  const candidate = recommendation === 'A' ? result.scenarioA : recommendation === 'B' ? result.scenarioB : null;
  const candidateLabel = recommendation === 'Tie' ? 'Manual review' : `Scenario ${recommendation}`;

  if (!candidate) {
    return {
      aWins,
      bWins,
      tieCount,
      recommendation,
      candidate,
      candidateLabel,
      approvalState: 'watch',
      approvalDetail: 'No scenario leads the comparison. A reviewer must choose a candidate or rerun with clearer alternatives.',
      nextAction: 'Resolve tied comparison',
    };
  }

  return {
    aWins,
    bWins,
    tieCount,
    recommendation,
    candidate,
    candidateLabel,
    ...statusApprovalPosture(candidate.status, candidateLabel),
  };
}

function DecisionPill({ state }: { state: DecisionState }) {
  const tone = decisionTone[state];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px 7px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 800,
      color: tone.color,
      background: tone.bg,
      textTransform: 'uppercase',
    }}>
      {tone.label}
    </span>
  );
}

function DecisionStepRow({ step, index }: { step: DecisionStep; index: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '22px 70px 1fr',
      gap: 8,
      alignItems: 'start',
      padding: '7px 0',
      borderBottom: '1px solid hsl(var(--tf-border))',
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--tf-muted))' }}>{index + 1}</span>
      <DecisionPill state={step.state} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800 }}>{step.label}</span>
        <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{step.detail}</span>
      </div>
    </div>
  );
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
      <div style={{ fontWeight: 700, fontSize: 11, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0 }}>
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
          {(() => {
            const decision = buildDecision(result);
            const decisionSteps: DecisionStep[] = [
              {
                label: 'Comparison computed',
                state: result.rows.length > 0 ? 'ready' : 'blocked',
                detail: `${result.rows.length} metric${result.rows.length === 1 ? '' : 's'} compared against baseline.`,
              },
              {
                label: 'Candidate selected',
                state: decision.recommendation === 'Tie' ? 'watch' : 'ready',
                detail: decision.recommendation === 'Tie'
                  ? `A ${decision.aWins}-${decision.bWins} split needs reviewer judgment.`
                  : `${decision.candidateLabel} leads ${Math.max(decision.aWins, decision.bWins)}/${result.rows.length} metrics.`,
              },
              {
                label: 'Approval posture',
                state: decision.approvalState,
                detail: decision.approvalDetail,
              },
              {
                label: 'Apply posture',
                state: decision.candidate?.status === 'Approved' ? 'ready' : decision.recommendation === 'Tie' ? 'blocked' : 'watch',
                detail: decision.candidate?.status === 'Approved'
                  ? `${decision.candidateLabel} can move toward application evidence.`
                  : decision.recommendation === 'Tie'
                    ? 'Application is blocked until a scenario is selected.'
                    : 'Application remains blocked until approval is complete.',
              },
            ];

            return (
              <section
                data-testid="scenario-decision-ladder"
                style={{
                  border: '1px solid hsl(var(--tf-border))',
                  borderRadius: 4,
                  background: 'hsl(var(--tf-bg))',
                  padding: '2px 10px',
                }}
              >
                <div style={{ padding: '8px 0 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0 }}>
                    Decision ladder
                  </span>
                  <span data-testid="scenario-next-action" style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                    Recommended candidate: <strong style={{ color: 'hsl(var(--tf-fg))' }}>{decision.candidateLabel}</strong> · Next: <strong style={{ color: 'hsl(var(--tf-fg))' }}>{decision.nextAction}</strong>
                  </span>
                </div>
                {decisionSteps.map((step, index) => (
                  <DecisionStepRow key={step.label} step={step} index={index} />
                ))}
              </section>
            );
          })()}

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

          {(() => {
            const decision = buildDecision(result);
            if (!decision.candidate) {
              return (
                <div data-testid="candidate-impact-view" style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                  Candidate impact view waits for a non-tied approval candidate.
                </div>
              );
            }
            const candidateKey = decision.recommendation;
            return (
              <section data-testid="candidate-impact-view" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0 }}>
                  Candidate impact view
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'hsl(var(--tf-surface))' }}>
                      <th style={{ ...cell, textAlign: 'left', fontWeight: 700, fontSize: 10 }}>Metric</th>
                      <th style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>Baseline</th>
                      <th style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>{decision.candidateLabel}</th>
                      <th style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map(row => {
                      const after = candidateKey === 'A' ? row.afterA : row.afterB;
                      const delta = after - row.baseline;
                      return (
                        <tr key={`candidate-${row.metricLabel}`}>
                          <td style={{ ...cell, fontWeight: 600 }}>{row.metricLabel}</td>
                          <td style={{ ...cell, textAlign: 'right', color: 'hsl(var(--tf-muted))' }}>{formatMetric(row.metricLabel, row.baseline)}</td>
                          <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{formatMetric(row.metricLabel, after)}</td>
                          <td style={{ ...cell, textAlign: 'right', color: delta <= 0 && row.metricLabel !== 'Median Ratio' ? 'hsl(var(--tf-success, 142 71% 45%))' : 'hsl(var(--tf-muted))' }}>
                            {delta >= 0 ? '+' : ''}{formatMetric(row.metricLabel, delta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })()}

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
