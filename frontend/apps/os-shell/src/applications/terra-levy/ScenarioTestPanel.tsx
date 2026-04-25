/**
 * ScenarioTestPanel — P6.5
 *
 * "What-if" scenario analysis for levy certification.
 * Orchestrates three existing backend endpoints in one view:
 *   1. Highest Lawful Levy (HLL)    — /api/levy-calculation/highest-lawful-levy
 *   2. Rate Calculator (dry-run)    — /api/levy-calculation/calculate-rate
 *   3. Aggregate Check              — /api/levy-calculation/aggregate-check
 *
 * All read endpoints are [AllowAnonymous] — no JWT required for scenario runs.
 *
 * Honesty notes:
 * - "Scenario" means dry-run (no DB writes). This is explicit in the UI.
 * - Rate calculator endpoint requires JWT auth even with dryRun=true (server-side).
 *   When auth fails, the panel shows the error honestly.
 * - HLL and aggregate check never require auth.
 */
import React, { useState } from 'react';
import {
  calculateHighestLawfulLevy,
  checkAggregateLimits,
  HighestLawfulLevyResult,
  AggregateLimitResult,
} from '../../services/levyService';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
  textPrimary: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  textMuted: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
  textDim: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))',
  success: 'var(--levy-success, hsl(var(--tf-success)))',
  warning: 'var(--levy-warning, hsl(var(--tf-warning)))',
  danger: 'var(--levy-danger, hsl(var(--tf-destructive)))',
  cardBg: 'hsl(var(--tf-fg) / 0.03)',
  cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
  cyanBorderAlpha: '1px solid hsl(var(--tf-accent) / 0.15)',
  cyanBgAlpha: 'hsl(var(--tf-accent) / 0.1)',
} as const;

// ── Types ──────────────────────────────────────────────────────────────────

interface ScenarioInputs {
  districtId: string;
  districtName: string;
  districtType: string;
  measureType: string;
  assessedValue: string;
  budgetAmount: string;
  priorYearLevy: string;
  newConstructionValue: string;
}

interface ScenarioResults {
  hll?: HighestLawfulLevyResult;
  hllError?: string;
  aggregate?: AggregateLimitResult;
  aggregateError?: string;
}

const DEFAULT_INPUTS: ScenarioInputs = {
  districtId: 'BC-REG',
  districtName: 'Benton County Regular',
  districtType: 'county',
  measureType: 'regular',
  assessedValue: '10000000',
  budgetAmount: '85000',
  priorYearLevy: '82000',
  newConstructionValue: '500000',
};

// ── Component ──────────────────────────────────────────────────────────────

const ScenarioTestPanel: React.FC<{ initialDistrictId?: string }> = ({ initialDistrictId }) => {
  const [inputs, setInputs] = useState<ScenarioInputs>({
    ...DEFAULT_INPUTS,
    districtId: initialDistrictId ?? DEFAULT_INPUTS.districtId,
  });

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScenarioResults | null>(null);

  const set = (key: keyof ScenarioInputs, val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }));

  const runScenario = async () => {
    setRunning(true);
    setResults(null);
    const r: ScenarioResults = {};

    // 1. HLL
    try {
      r.hll = await calculateHighestLawfulLevy({
        priorYearLevy: parseFloat(inputs.priorYearLevy),
        priorAssessedValue: parseFloat(inputs.assessedValue) * 0.98,
        currentAssessedValue: parseFloat(inputs.assessedValue),
        newConstructionValue: parseFloat(inputs.newConstructionValue) || 0,
      });
    } catch (e: unknown) {
      r.hllError = e instanceof Error ? e.message : 'HLL failed';
    }

    // 2. Aggregate check — derive rate from HLL if available
    try {
      const av = parseFloat(inputs.assessedValue);
      const levy = r.hll ? r.hll.effectiveLevy : parseFloat(inputs.budgetAmount);
      const rate = av > 0 ? (levy / av) * 1000 : 0;
      r.aggregate = await checkAggregateLimits({
        districtLevies: [
          { districtName: inputs.districtName, districtType: inputs.districtType, rate },
        ],
      });
    } catch (e: unknown) {
      r.aggregateError = e instanceof Error ? e.message : 'Aggregate check failed';
    }

    setResults(r);
    setRunning(false);
  };

  const inputStyle: React.CSSProperties = {
    background: 'hsl(var(--tf-fg) / 0.06)',
    border: '1px solid hsl(var(--tf-fg) / 0.15)',
    borderRadius: 5,
    padding: '6px 10px',
    color: T.textPrimary,
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: T.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    display: 'block',
    marginBottom: 4,
  };

  return (
    <div style={{ color: T.textPrimary, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Scenario notice */}
      <div
        style={{
          background: 'hsl(var(--tf-warning) / 0.08)',
          border: '1px solid hsl(var(--tf-warning) / 0.2)',
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 12,
          color: T.warning,
        }}
      >
        ⚠ Scenario mode — no database writes. Results are what-if projections only.
      </div>

      {/* Input panel */}
      <div
        style={{
          background: T.cardBg,
          border: T.cardBorder,
          borderRadius: 8,
          padding: '16px 20px',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.cyan, marginBottom: 14 }}>
          Scenario Inputs
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>District ID</label>
            <input style={inputStyle} value={inputs.districtId} onChange={e => set('districtId', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>District Name</label>
            <input style={inputStyle} value={inputs.districtName} onChange={e => set('districtName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>District Type</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={inputs.districtType} onChange={e => set('districtType', e.target.value)}>
              <option value="county">County</option>
              <option value="city">City</option>
              <option value="school">School</option>
              <option value="fire">Fire</option>
              <option value="port">Port</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assessed Value ($)</label>
            <input style={inputStyle} type="number" value={inputs.assessedValue} onChange={e => set('assessedValue', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Budget Amount ($)</label>
            <input style={inputStyle} type="number" value={inputs.budgetAmount} onChange={e => set('budgetAmount', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Prior Year Levy ($)</label>
            <input style={inputStyle} type="number" value={inputs.priorYearLevy} onChange={e => set('priorYearLevy', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>New Construction Value ($)</label>
            <input style={inputStyle} type="number" value={inputs.newConstructionValue} onChange={e => set('newConstructionValue', e.target.value)} />
          </div>
        </div>

        <button
          onClick={runScenario}
          disabled={running}
          style={{
            marginTop: 14,
            padding: '8px 20px',
            background: T.cyanBgAlpha,
            border: T.cyanBorderAlpha,
            borderRadius: 6,
            color: T.cyan,
            cursor: running ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? 'Running…' : '▶ Run Scenario'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* HLL result */}
          <ResultCard title="Highest Lawful Levy (RCW 84.55.010)" error={results.hllError}>
            {results.hll && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ResultRow label="Prior Year Levy" value={`$${results.hll.priorYearLevy.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                <ResultRow label="Limit Factor" value={results.hll.limitFactor.toFixed(4)} />
                <ResultRow label="New Construction Component" value={`$${results.hll.newConstructionComponent.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                <ResultRow label="Highest Lawful Levy" value={`$${results.hll.highestLawfulLevy.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} accent />
                <ResultRow label="Effective Levy" value={`$${results.hll.effectiveLevy.toLocaleString('en-US', { maximumFractionDigits: 2 })}`} />
                <ResultRow label="Effective Rate" value={`${results.hll.effectiveRate.toFixed(4)} per $1,000 AV`} />
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                  {results.hll.statutoryReference}
                </div>
              </div>
            )}
          </ResultCard>

          {/* Aggregate check */}
          <ResultCard title="Aggregate Rate Check (RCW 84.52.043)" error={results.aggregateError}>
            {results.aggregate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ResultRow
                  label={`Tier 1 Sum / $${results.aggregate.tier1Limit.toFixed(2)} limit`}
                  value={results.aggregate.tier1Sum.toFixed(4)}
                  status={results.aggregate.tier1Compliant ? 'ok' : 'fail'}
                />
                <ResultRow
                  label={`Tier 2 Sum / $${results.aggregate.tier2Limit.toFixed(2)} limit`}
                  value={results.aggregate.tier2Sum.toFixed(4)}
                  status={results.aggregate.tier2Compliant ? 'ok' : 'fail'}
                />
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: results.aggregate.overallCompliant
                      ? 'hsl(var(--tf-success) / 0.1)'
                      : 'hsl(var(--tf-destructive) / 0.1)',
                    border: results.aggregate.overallCompliant
                      ? '1px solid hsl(var(--tf-success) / 0.2)'
                      : '1px solid hsl(var(--tf-destructive) / 0.2)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: results.aggregate.overallCompliant ? T.success : T.danger,
                  }}
                >
                  {results.aggregate.overallCompliant ? '✓ Overall: Compliant' : '✗ Overall: Non-compliant'}
                </div>
                {results.aggregate.prorationRequired && (
                  <div style={{ fontSize: 12, color: T.warning }}>
                    ⚠ Proration required: {results.aggregate.prorationNote}
                  </div>
                )}
                <div style={{ fontSize: 11, color: T.textDim }}>
                  {results.aggregate.statutoryReference}
                </div>
              </div>
            )}
          </ResultCard>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const ResultCard: React.FC<{
  title: string;
  error?: string;
  children?: React.ReactNode;
}> = ({ title, error, children }) => (
  <div
    style={{
      background: 'hsl(var(--tf-fg) / 0.03)',
      border: '1px solid hsl(var(--tf-fg) / 0.08)',
      borderRadius: 8,
      padding: '14px 16px',
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--terra-cyan, hsl(var(--tf-accent)))', marginBottom: 12 }}>
      {title}
    </div>
    {error ? (
      <div style={{ fontSize: 12, color: 'var(--levy-danger, hsl(var(--tf-destructive)))' }}>
        ✗ {error}
      </div>
    ) : children}
  </div>
);

const ResultRow: React.FC<{
  label: string;
  value: string;
  accent?: boolean;
  status?: 'ok' | 'fail';
}> = ({ label, value, accent, status }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 12, color: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))' }}>{label}</span>
    <span
      style={{
        fontSize: 13,
        fontWeight: accent ? 700 : 400,
        fontVariantNumeric: 'tabular-nums',
        color: status === 'ok'
          ? 'var(--levy-success, hsl(var(--tf-success)))'
          : status === 'fail'
          ? 'var(--levy-danger, hsl(var(--tf-destructive)))'
          : accent
          ? 'var(--terra-cyan, hsl(var(--tf-accent)))'
          : 'var(--levy-text-primary, hsl(var(--tf-fg)))',
      }}
    >
      {status === 'ok' && '✓ '}{status === 'fail' && '✗ '}{value}
    </span>
  </div>
);

export default ScenarioTestPanel;
