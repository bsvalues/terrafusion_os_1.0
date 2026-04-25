/**
 * LevyCalculatorPanel — P3.1
 *
 * Single-district rate calculator panel. Calls POST /api/levy-calculation/calculate-rate.
 * Uses dryRun=true to skip persistence when in scenario mode.
 *
 * Honesty notes:
 * - "Rate adjustment" label replaces the legacy rate adjustment factor (P5.3)
 *   naming. The factor is a v1 tuning multiplier, not AI. Rename tracked in LEV-136.
 * - Limit factor is 1.01 hardcoded in the backend until LEV-136 (IPD lookup) ships.
 */
import React, { useState } from 'react';
import { calculateLevyRate, type LevyMeasureRequest } from '../../services/levyService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
  success: 'var(--levy-success, hsl(var(--tf-success)))',
  warning: 'var(--levy-warning, hsl(var(--tf-warning)))',
  danger: 'var(--levy-danger, hsl(var(--tf-destructive)))',
  textPrimary: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  textMuted: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
  textDim: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))',
  cardBg: 'hsl(var(--tf-fg) / 0.03)',
  cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
} as const;

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals);
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface FormState {
  districtId: string;
  districtName: string;
  districtType: string;
  measureType: string;
  assessedValue: string;
  budgetAmount: string;
  countyCode: string;
  dryRun: boolean;
}

const DISTRICT_TYPES = [
  'county-regular', 'county-roads', 'city', 'school-district',
  'fire-district', 'library-district', 'hospital-district',
  'port-district', 'ems-district', 'cemetery-district',
];

const MEASURE_TYPES = [
  'regular', 'excess', 'bond',
];

interface CalcResult {
  baseRate: number;
  aiOptimalRate: number;
  confidenceScore: number;
  statutoryLimit: number;
  isCompliant: boolean;
  projectedRevenue: number;
  riskLevel: string;
  warnings: string[];
  calculationTimestamp: string;
  legacyAdjustmentFactor: number;
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; result: CalcResult; dryRun: boolean };

interface LevyCalculatorPanelProps {
  /** Pre-fill district code from context (e.g. from district detail drill-down) */
  initialDistrictId?: string;
  /** Called on a successful non-dry-run calculation */
  onResult?: (result: CalcResult) => void;
}

export default function LevyCalculatorPanel({ initialDistrictId, onResult }: LevyCalculatorPanelProps) {
  const [form, setForm] = useState<FormState>({
    districtId: initialDistrictId ?? '',
    districtName: '',
    districtType: 'county-regular',
    measureType: 'regular',
    assessedValue: '',
    budgetAmount: '',
    countyCode: 'benton',
    dryRun: true,
  });
  const [panelState, setPanelState] = useState<PanelState>({ status: 'idle' });

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const av = parseFloat(form.assessedValue.replace(/,/g, ''));
    const budget = parseFloat(form.budgetAmount.replace(/,/g, ''));

    if (!form.districtId.trim()) {
      setPanelState({ status: 'error', message: 'District ID is required.' });
      return;
    }
    if (!Number.isFinite(av) || av <= 0) {
      setPanelState({ status: 'error', message: 'Assessed value must be a positive number.' });
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      setPanelState({ status: 'error', message: 'Budget amount must be a positive number.' });
      return;
    }

    setPanelState({ status: 'loading' });

    const request: LevyMeasureRequest = {
      districtId: form.districtId.trim(),
      districtName: form.districtName.trim() || form.districtId.trim(),
      assessedValue: av,
      budgetAmount: budget,
      districtType: form.districtType,
      measureType: form.measureType,
      countyCode: form.countyCode,
    };

    try {
      // dryRun query param prevents persistence when true
      const result = await calculateLevyRate(request, form.dryRun);
      setPanelState({ status: 'ok', result, dryRun: form.dryRun });
      if (!form.dryRun) onResult?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calculation failed.';
      setPanelState({ status: 'error', message });
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid hsl(var(--tf-fg) / 0.12)',
    background: 'hsl(var(--tf-fg) / 0.03)',
    color: T.textPrimary,
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 13,
  };
  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 5,
    fontSize: 12, color: T.textMuted,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🧮</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.cyan }}>Rate Calculator</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            Single-district levy rate — formula: rate = (budget ÷ AV) × 1000
          </div>
        </div>
      </div>

      {/* Scenario mode banner */}
      {form.dryRun && (
        <div style={{
          padding: '8px 14px', borderRadius: 8,
          background: 'hsl(var(--tf-warning) / 0.08)',
          border: '1px solid hsl(var(--tf-warning) / 0.3)',
          color: T.warning, fontSize: 12,
        }}>
          <strong>Scenario mode</strong> — results are not persisted. Uncheck "Scenario mode" to save a calculation to the audit log.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            District ID
            <input
              value={form.districtId}
              onChange={e => handleChange('districtId', e.target.value)}
              placeholder="e.g. BC-REG"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            District Name (optional)
            <input
              value={form.districtName}
              onChange={e => handleChange('districtName', e.target.value)}
              placeholder="e.g. Benton County Current Expense"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            District Type
            <select value={form.districtType} onChange={e => handleChange('districtType', e.target.value)} style={inputStyle}>
              {DISTRICT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Measure Type
            <select value={form.measureType} onChange={e => handleChange('measureType', e.target.value)} style={inputStyle}>
              {MEASURE_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            Assessed Value ($)
            <input
              type="text"
              inputMode="numeric"
              value={form.assessedValue}
              onChange={e => handleChange('assessedValue', e.target.value)}
              placeholder="e.g. 1500000000"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Budget Amount ($)
            <input
              type="text"
              inputMode="numeric"
              value={form.budgetAmount}
              onChange={e => handleChange('budgetAmount', e.target.value)}
              placeholder="e.g. 45000000"
              style={inputStyle}
            />
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textMuted, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.dryRun}
            onChange={e => handleChange('dryRun', e.target.checked)}
          />
          Scenario mode (do not persist result)
        </label>

        <button
          type="submit"
          disabled={panelState.status === 'loading'}
          style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1px solid ${T.cyan}`,
            background: 'hsl(var(--tf-accent) / 0.1)',
            color: T.cyan, cursor: panelState.status === 'loading' ? 'wait' : 'pointer',
            fontWeight: 700, fontSize: 13,
          }}
        >
          {panelState.status === 'loading' ? 'Calculating…' : 'Calculate Rate'}
        </button>
      </form>

      {/* Results */}
      {panelState.status === 'error' && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'hsl(var(--tf-destructive) / 0.08)',
          border: '1px solid hsl(var(--tf-destructive) / 0.3)',
          color: T.danger, fontSize: 13,
        }}>
          {panelState.message}
        </div>
      )}

      {panelState.status === 'ok' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {panelState.dryRun && (
            <div style={{
              fontSize: 11, color: T.textDim, fontStyle: 'italic',
              padding: '6px 10px', borderRadius: 6,
              background: 'hsl(var(--tf-warning) / 0.05)',
              border: '1px solid hsl(var(--tf-warning) / 0.15)',
            }}>
              Scenario result — not persisted to audit log
            </div>
          )}

          {/* Compliance banner */}
          <div style={{
            padding: '10px 16px', borderRadius: 8,
            background: panelState.result.isCompliant
              ? 'hsl(var(--tf-success) / 0.08)'
              : 'hsl(var(--tf-destructive) / 0.08)',
            border: `1px solid ${panelState.result.isCompliant
              ? 'hsl(var(--tf-success) / 0.3)'
              : 'hsl(var(--tf-destructive) / 0.3)'}`,
            color: panelState.result.isCompliant ? T.success : T.danger,
            fontWeight: 700, fontSize: 14,
          }}>
            {panelState.result.isCompliant ? '✓ COMPLIANT' : '✗ EXCEEDS STATUTORY LIMIT'}
            <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 12, color: T.textMuted }}>
              Statutory limit: {fmt(panelState.result.statutoryLimit)} / $1,000 AV — Risk: {panelState.result.riskLevel}
            </span>
          </div>

          {/* Rate breakdown */}
          <div style={{ padding: 20, borderRadius: 12, background: T.cardBg, border: T.cardBorder }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Calculation Breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Base Rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.cyan }}>{fmt(panelState.result.baseRate)} / $1,000 AV</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>= (budget ÷ AV) × 1,000</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Filed Rate (after v1 adjustment)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.cyan }}>{fmt(panelState.result.aiOptimalRate)} / $1,000 AV</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                  IPD-adjusted rate · WA OFM limit factor applied · RCW 84.55.010
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Projected Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtCurrency(panelState.result.projectedRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textDim }}>Confidence Score</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{(panelState.result.confidenceScore * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* IPD context note (LEV-136 — live from ReferenceSources table) */}
            <div
              style={{
                marginTop: 14,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'hsl(var(--tf-accent) / 0.05)',
                border: '1px solid hsl(var(--tf-accent) / 0.15)',
                fontSize: 11,
                color: T.textDim,
              }}
            >
              Rate adjustment applies WA OFM IPD limit factor (RCW 84.55.010).
              Use the HLL Calculator tab for full highest-lawful-levy computation with banked capacity, new construction, and lid-lift components.
            </div>
          </div>

          {/* Warnings */}
          {panelState.result.warnings.length > 0 && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'hsl(var(--tf-warning) / 0.08)',
              border: '1px solid hsl(var(--tf-warning) / 0.3)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.warning, marginBottom: 8 }}>Warnings</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {panelState.result.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 12, color: T.textMuted }}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ fontSize: 11, color: T.textDim }}>
            Computed: {new Date(panelState.result.calculationTimestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
