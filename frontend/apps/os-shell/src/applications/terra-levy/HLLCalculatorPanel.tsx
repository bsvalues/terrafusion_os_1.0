/**
 * HLLCalculatorPanel — P3.2
 *
 * Highest-Lawful-Levy calculator. Calls POST /api/levy-calculation/highest-lawful-levy.
 * The limit factor is resolved at runtime from the WA OFM IPD reference table (LEV-136).
 * The backend seeds IPD values for 2022–2026 on startup; fallback to 1.01 only when unseeded.
 */
import React, { useEffect, useState } from 'react';
import { calculateHighestLawfulLevy, getBankedCapacity, getIpdRates, type HighestLawfulLevyRequest, type HighestLawfulLevyResult, type IpdAnnualRate } from '../../services/levyService';

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

function fmtNum(n: number, d = 2) { return n.toFixed(d); }
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface FormState {
  priorYearLevy: string;
  priorAssessedValue: string;
  currentAssessedValue: string;
  newConstructionValue: string;
  annexationValue: string;
  lidLiftAmount: string;
  /** LEV-137: drawn from backend if districtCode is known. */
  bankedCapacityToUse: string;
  /** LEV-138: voter-approved lid lift flag (RCW 84.55.050). */
  voterApprovedLidLift: boolean;
  /** LEV-139: first-time levy flag. */
  isFirstTimeLevy: boolean;
  /** LEV-139: rate per $1,000 AV for first-time levy. */
  firstTimeLevyRequestedRate: string;
  /** LEV-141: senior freeze AV (RCW 84.36.381). */
  seniorExemptionFreezeAv: string;
  /** LEV-142: refund fund outside-cap (RCW 84.69). */
  refundFundAmount: string;
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; result: HighestLawfulLevyResult };

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid hsl(var(--tf-fg) / 0.12)',
  background: 'hsl(var(--tf-fg) / 0.03)',
  color: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  width: '100%', boxSizing: 'border-box', fontSize: 13,
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 12, color: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
};

function parseNum(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

interface HLLCalculatorPanelProps {
  /** Pre-fill prior HLL from district context */
  initialPriorYearLevy?: number;
  /** LEV-137: If provided, enable "Fetch available banked capacity" button. */
  districtCode?: string;
}

export default function HLLCalculatorPanel({ initialPriorYearLevy, districtCode }: HLLCalculatorPanelProps) {
  const [form, setForm] = useState<FormState>({
    priorYearLevy: initialPriorYearLevy != null ? String(initialPriorYearLevy) : '',
    priorAssessedValue: '',
    currentAssessedValue: '',
    newConstructionValue: '0',
    annexationValue: '0',
    lidLiftAmount: '0',
    bankedCapacityToUse: '0',
    voterApprovedLidLift: false,
    isFirstTimeLevy: false,
    firstTimeLevyRequestedRate: '0',
    seniorExemptionFreezeAv: '0',
    refundFundAmount: '0',
  });
  const [panelState, setPanelState] = useState<PanelState>({ status: 'idle' });
  const [bankStatus, setBankStatus] = useState<'idle' | 'loading' | 'fetched' | 'gated' | 'error'>('idle');
  const [ipdRate, setIpdRate] = useState<IpdAnnualRate | null>(null);

  // Fetch current-year IPD rate on mount (LEV-136)
  useEffect(() => {
    const year = new Date().getFullYear();
    getIpdRates()
      .then(env => {
        const match = env.rates.find(r => r.year === year) ?? env.rates[0] ?? null;
        setIpdRate(match);
      })
      .catch(() => { /* fallback: leave ipdRate null — backend handles default */ });
  }, []);

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priorYearLevy = parseNum(form.priorYearLevy);
    const priorAV = parseNum(form.priorAssessedValue);
    const currentAV = parseNum(form.currentAssessedValue);

    if (!form.isFirstTimeLevy && priorYearLevy <= 0) {
      setPanelState({ status: 'error', message: 'Prior Year Levy must be greater than zero. For first-time levies, enable the First-Time Levy toggle.' });
      return;
    }
    if (!form.isFirstTimeLevy && priorAV <= 0) {
      setPanelState({ status: 'error', message: 'Prior Year Assessed Value must be greater than zero.' });
      return;
    }
    if (currentAV <= 0) {
      setPanelState({ status: 'error', message: 'Current Year Assessed Value must be greater than zero.' });
      return;
    }

    setPanelState({ status: 'loading' });

    const request: HighestLawfulLevyRequest = {
      priorYearLevy,
      priorAssessedValue: priorAV,
      currentAssessedValue: currentAV,
      newConstructionValue: parseNum(form.newConstructionValue),
      annexationValue: parseNum(form.annexationValue),
      lidLiftAmount: parseNum(form.lidLiftAmount),
      bankedCapacityToUse: parseNum(form.bankedCapacityToUse),
      voterApprovedLidLift: form.voterApprovedLidLift,
      isFirstTimeLevy: form.isFirstTimeLevy,
      firstTimeLevyRequestedRate: parseNum(form.firstTimeLevyRequestedRate),
      seniorExemptionFreezeAv: parseNum(form.seniorExemptionFreezeAv),
      refundFundAmount: parseNum(form.refundFundAmount),
    };

    try {
      const result = await calculateHighestLawfulLevy(request);
      setPanelState({ status: 'ok', result });
    } catch (err) {
      setPanelState({ status: 'error', message: err instanceof Error ? err.message : 'HLL calculation failed.' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.cyan }}>Highest Lawful Levy</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>RCW 84.55.010 — prior year × limit factor + new construction</div>
        </div>
      </div>

      {/* IPD limit factor info row (LEV-136 — live from ReferenceSources table) */}
      <div style={{
        padding: '8px 14px', borderRadius: 8,
        background: 'hsl(var(--tf-accent) / 0.06)',
        border: '1px solid hsl(var(--tf-accent) / 0.2)',
        color: T.textMuted, fontSize: 12,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span style={{ fontSize: 14 }}>📐</span>
        <span>
          <strong style={{ color: T.cyan }}>WA OFM IPD Limit Factor</strong>{' '}
          {ipdRate
            ? <>— {new Date().getFullYear()}: <strong style={{ color: T.textPrimary }}>{ipdRate.limitFactor != null ? ipdRate.limitFactor.toFixed(4) : '1.0100'}</strong>{ipdRate.ipdPercent != null ? ` (IPD: ${ipdRate.ipdPercent.toFixed(2)}%)` : ''} · Source: ReferenceSources table</>
            : <>— loading from database…</>}
          {' '}· RCW 84.55.010
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* LEV-139: First-time levy toggle */}
        <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isFirstTimeLevy}
            onChange={e => handleChange('isFirstTimeLevy', e.target.checked)}
          />
          <span>
            <strong>First-time levy</strong> (LEV-139) — no prior year HLL (RCW 84.55.005)
          </span>
        </label>
        {form.isFirstTimeLevy && (
          <label style={labelStyle}>
            First-Time Levy Rate (per $1,000 AV) *
            <input
              type="text" inputMode="decimal"
              value={form.firstTimeLevyRequestedRate}
              onChange={e => handleChange('firstTimeLevyRequestedRate', e.target.value)}
              placeholder="e.g. 1.50"
              style={inputStyle}
            />
            <span style={{ fontSize: 10, color: T.textDim }}>
              Rate subject to statutory cap for district type. Prior Year fields ignored when first-time levy is active.
            </span>
          </label>
        )}

        {/* Required inputs — grayed out for first-time levy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            Prior Year HLL ($) *
            <input
              type="text" inputMode="numeric"
              value={form.priorYearLevy}
              onChange={e => handleChange('priorYearLevy', e.target.value)}
              placeholder="e.g. 5200000"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Prior Year AV ($) *
            <input
              type="text" inputMode="numeric"
              value={form.priorAssessedValue}
              onChange={e => handleChange('priorAssessedValue', e.target.value)}
              placeholder="e.g. 4500000000"
              style={inputStyle}
            />
          </label>
        </div>
        <label style={labelStyle}>
          Current Year AV ($) *
          <input
            type="text" inputMode="numeric"
            value={form.currentAssessedValue}
            onChange={e => handleChange('currentAssessedValue', e.target.value)}
            placeholder="e.g. 4750000000"
            style={inputStyle}
          />
        </label>

        {/* Optional inputs */}
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>Optional components</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={labelStyle}>
            New Construction Value ($)
            <input
              type="text" inputMode="numeric"
              value={form.newConstructionValue}
              onChange={e => handleChange('newConstructionValue', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Annexation Value ($)
            <input
              type="text" inputMode="numeric"
              value={form.annexationValue}
              onChange={e => handleChange('annexationValue', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Lid Lift Authority ($)
            <input
              type="text" inputMode="numeric"
              value={form.lidLiftAmount}
              onChange={e => handleChange('lidLiftAmount', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
            {/* LEV-138: voter-approved lid lift flag */}
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6, cursor: 'pointer', display: 'flex', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={form.voterApprovedLidLift}
                onChange={e => handleChange('voterApprovedLidLift', e.target.checked)}
              />
              <span style={{ fontSize: 10, color: T.textDim }}>
                Voter-approved (RCW 84.55.050) — may exceed HLL ceiling
              </span>
            </label>
          </label>

          {/* LEV-137: Banked Capacity */}
          <label style={labelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Banked Capacity to Use ($)
              {districtCode && (
                <button
                  type="button"
                  onClick={async () => {
                    setBankStatus('loading');
                    try {
                      const resp = await getBankedCapacity(districtCode, new Date().getFullYear());
                      if (resp.specialistGated) {
                        setBankStatus('gated');
                      } else {
                        setForm(prev => ({ ...prev, bankedCapacityToUse: String(resp.availableCapacity) }));
                        setBankStatus('fetched');
                      }
                    } catch {
                      setBankStatus('error');
                    }
                  }}
                  disabled={bankStatus === 'loading'}
                  style={{
                    background: 'none', border: `1px solid ${T.cyan}44`, borderRadius: 5,
                    color: T.cyan, cursor: 'pointer', fontSize: 10, padding: '2px 8px',
                  }}
                >
                  {bankStatus === 'loading' ? '…' : 'Fetch available'}
                </button>
              )}
            </div>
            {bankStatus === 'gated' && (
              <div style={{ fontSize: 10, color: T.warning }}>
                No banked capacity ledger entry. District may not have elected to bank (RCW 84.55.0101).
              </div>
            )}
            {bankStatus === 'error' && (
              <div style={{ fontSize: 10, color: T.danger }}>Could not fetch — enter manually.</div>
            )}
            {bankStatus === 'fetched' && (
              <div style={{ fontSize: 10, color: T.success }}>✓ Pre-filled from ledger (RCW 84.55.092)</div>
            )}
            <input
              type="text" inputMode="numeric"
              value={form.bankedCapacityToUse}
              onChange={e => handleChange('bankedCapacityToUse', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </label>

          {/* LEV-141: Senior freeze */}
          <label style={labelStyle}>
            Senior/Disabled Freeze AV ($) (LEV-141 · RCW 84.36.381)
            <input
              type="text" inputMode="numeric"
              value={form.seniorExemptionFreezeAv}
              onChange={e => handleChange('seniorExemptionFreezeAv', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
            <span style={{ fontSize: 10, color: T.textDim }}>
              AV frozen for qualifying seniors/disabled. Reduces effective levy base — rate computed on adjusted AV.
            </span>
          </label>

          {/* LEV-142: Refund fund */}
          <label style={labelStyle}>
            Refund Fund Amount ($) (LEV-142 · RCW 84.69)
            <input
              type="text" inputMode="numeric"
              value={form.refundFundAmount}
              onChange={e => handleChange('refundFundAmount', e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
            <span style={{ fontSize: 10, color: T.textDim }}>
              Outside 1% cap and $5.90/$10.00 aggregate limits. Added to effective levy after HLL computation.
            </span>
          </label>
        </div>

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
          {panelState.status === 'loading' ? 'Computing…' : 'Compute HLL'}
        </button>
      </form>

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
          {/* Components breakdown */}
          <div style={{ padding: 20, borderRadius: 12, background: T.cardBg, border: T.cardBorder }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HLL Calculation Chain
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ChainRow label="Prior Year Levy" value={fmtCurrency(panelState.result.priorYearLevy)} rcw={null} />
              <ChainRow
                label={`× Limit Factor (${panelState.result.limitFactor.toFixed(4)})`}
                value={fmtCurrency(panelState.result.baseHighestLawful)}
                rcw="RCW 84.55.010"
                note={panelState.result.limitFactor === 1.01 && !ipdRate ? 'WA OFM IPD constitutional fallback (1.0100)' : `WA OFM IPD-derived · RCW 84.55.010`}
              />
              {panelState.result.newConstructionComponent > 0 && (
                <ChainRow
                  label="+ New Construction Addition"
                  value={`+${fmtCurrency(panelState.result.newConstructionComponent)}`}
                  rcw="RCW 84.55.010(1)"
                />
              )}
              {panelState.result.annexationComponent > 0 && (
                <ChainRow
                  label="+ Annexation Addition"
                  value={`+${fmtCurrency(panelState.result.annexationComponent)}`}
                  rcw="RCW 84.55.010(2)"
                />
              )}
              <div style={{
                borderTop: '1px solid hsl(var(--tf-fg) / 0.1)',
                paddingTop: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
                  Highest Lawful Levy
                  {panelState.result.lidLiftApplied && (
                    <span style={{ fontSize: 11, color: panelState.result.voterApprovedLidLift ? T.success : T.textDim, marginLeft: 8 }}>
                      ({panelState.result.voterApprovedLidLift ? 'voter-approved lid lift · RCW 84.55.050' : 'lid lift applied'})
                    </span>
                  )}
                  {panelState.result.isFirstTimeLevy && (
                    <span style={{ fontSize: 11, color: T.warning, marginLeft: 8 }}>(first-time levy · RCW 84.55.005)</span>
                  )}
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: T.cyan }}>
                  {fmtCurrency(panelState.result.effectiveLevy)}
                </span>
              </div>
              {panelState.result.seniorExemptionApplied && (
                <ChainRow
                  label="Senior/Disabled Freeze AV Adjustment"
                  value={`AV basis: ${fmtCurrency(panelState.result.adjustedAssessedValue ?? 0)}`}
                  rcw="RCW 84.36.381"
                  note="Rate computed on adjusted AV (frozen parcels reduce base)"
                />
              )}
              <ChainRow
                label="Effective Rate"
                value={`${fmtNum(panelState.result.effectiveRate, 6)} / $1,000 AV`}
                rcw={panelState.result.statutoryReference}
              />
              {(panelState.result.refundFundAmount ?? 0) > 0 && (
                <ChainRow
                  label="+ Refund Fund (outside cap)"
                  value={`+${fmtCurrency(panelState.result.refundFundAmount ?? 0)}`}
                  rcw="RCW 84.69"
                  note={`Total levy incl. refund fund: ${fmtCurrency(panelState.result.totalLevyIncludingRefund ?? 0)}`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChainRow({ label, value, rcw, note }: { label: string; value: string; rcw: string | null; note?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--levy-text-primary, hsl(var(--tf-fg)))' }}>{label}</div>
        {rcw && <div style={{ fontSize: 11, color: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))', marginTop: 2 }}>{rcw}</div>}
        {note && (
          <div style={{
            fontSize: 11, color: 'var(--levy-warning, hsl(var(--tf-warning)))', marginTop: 2,
            fontStyle: 'italic',
          }}>{note}</div>
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
