/**
 * AggregateRateCheckPanel — P3.5
 *
 * Aggregate levy rate check panel. Calls POST /api/levy-calculation/aggregate-check.
 * Tests the $5.90 (Tier 1) and $10.00 (Tier 2) per $1,000 AV aggregate limits
 * per RCW 84.52.043.
 *
 * Accepts a list of district entries. Districts that push aggregate over limit are
 * highlighted in red.
 */
import React, { useState } from 'react';
import api from '../../services/api';

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

const TIER1_DISTRICTS = new Set([
  'county-regular', 'county-roads', 'fire-district', 'library-district',
  'hospital-district', 'cemetery-district', 'flood-district', 'weed-district',
]);

const DISTRICT_TYPES = [
  'county-regular', 'county-roads', 'city', 'school-district',
  'fire-district', 'library-district', 'hospital-district',
  'port-district', 'ems-district', 'cemetery-district',
];

interface DistrictEntry {
  id: string;
  districtName: string;
  districtType: string;
  rate: string;
}

interface AggregateResult {
  tier1Sum: number;
  tier1Limit: number;
  tier1Compliant: boolean;
  tier2Sum: number;
  tier2Limit: number;
  tier2Compliant: boolean;
  overallCompliant: boolean;
  prorationRequired: boolean;
  prorationNote: string;
  statutoryReference: string;
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; result: AggregateResult };

function newEntry(): DistrictEntry {
  return { id: crypto.randomUUID(), districtName: '', districtType: 'county-regular', rate: '' };
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 6,
  border: '1px solid hsl(var(--tf-fg) / 0.12)',
  background: 'hsl(var(--tf-fg) / 0.03)',
  color: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  fontSize: 12,
};

export default function AggregateRateCheckPanel() {
  const [entries, setEntries] = useState<DistrictEntry[]>([newEntry()]);
  const [panelState, setPanelState] = useState<PanelState>({ status: 'idle' });

  function addRow() {
    setEntries(prev => [...prev, newEntry()]);
  }
  function removeRow(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }
  function updateRow(id: string, field: keyof DistrictEntry, value: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  async function handleRun() {
    const valid = entries.filter(e => e.districtName.trim() && parseFloat(e.rate) > 0);
    if (valid.length === 0) {
      setPanelState({ status: 'error', message: 'At least one district with a name and positive rate is required.' });
      return;
    }

    setPanelState({ status: 'loading' });
    try {
      const res = await api.post<AggregateResult>('/levy-calculation/aggregate-check', {
        districtLevies: valid.map(e => ({
          districtName: e.districtName.trim(),
          districtType: e.districtType,
          rate: parseFloat(e.rate),
        })),
      });
      setPanelState({ status: 'ok', result: res.data });
    } catch (err) {
      setPanelState({ status: 'error', message: err instanceof Error ? err.message : 'Aggregate check failed.' });
    }
  }

  // Compute running totals for highlighting
  let tier1Running = 0;
  let tier2Running = 0;
  const entryTotals = entries.map(e => {
    const r = parseFloat(e.rate) || 0;
    tier2Running += r;
    if (TIER1_DISTRICTS.has(e.districtType)) tier1Running += r;
    return { id: e.id, tier1Running, tier2Running };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.cyan }}>Aggregate Rate Check</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            RCW 84.52.043 — $5.90 (Tier 1) and $10.00 (Tier 2) per $1,000 AV limits
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.textDim }}>
        Tier 1 includes county and junior taxing districts (fire, library, hospital, etc.).
        Tier 2 includes all regular levies combined.
      </div>

      {/* District table */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: T.cardBorder }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'hsl(var(--tf-fg) / 0.04)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textMuted, fontWeight: 600 }}>District Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textMuted, fontWeight: 600 }}>Type</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textMuted, fontWeight: 600 }}>Rate / $1,000 AV</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textMuted, fontWeight: 600 }}>T1 Running</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: T.textMuted, fontWeight: 600 }}>T2 Running</th>
              <th style={{ padding: '6px 12px' }} />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const totals = entryTotals[idx];
              const t1Over = totals.tier1Running > 5.90;
              const t2Over = totals.tier2Running > 10.00;
              return (
                <tr key={entry.id} style={{ borderTop: '1px solid hsl(var(--tf-fg) / 0.05)' }}>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      value={entry.districtName}
                      onChange={e => updateRow(entry.id, 'districtName', e.target.value)}
                      placeholder="e.g. Benton County Current Expense"
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <select
                      value={entry.districtType}
                      onChange={e => updateRow(entry.id, 'districtType', e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    >
                      {DISTRICT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="text" inputMode="decimal"
                      value={entry.rate}
                      onChange={e => updateRow(entry.id, 'rate', e.target.value)}
                      placeholder="e.g. 1.8"
                      style={{ ...inputStyle, width: 90, textAlign: 'right' }}
                    />
                  </td>
                  <td style={{
                    padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace',
                    color: t1Over ? T.danger : T.textMuted,
                    fontWeight: t1Over ? 700 : 400,
                  }}>
                    {TIER1_DISTRICTS.has(entry.districtType) ? totals.tier1Running.toFixed(4) : '—'}
                  </td>
                  <td style={{
                    padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace',
                    color: t2Over ? T.danger : T.textMuted,
                    fontWeight: t2Over ? 700 : 400,
                  }}>
                    {totals.tier2Running.toFixed(4)}
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <button
                      onClick={() => removeRow(entry.id)}
                      disabled={entries.length === 1}
                      style={{
                        background: 'none', border: 'none', color: T.textDim,
                        cursor: entries.length === 1 ? 'default' : 'pointer',
                        fontSize: 14, padding: '2px 6px',
                      }}
                      title="Remove row"
                    >✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={addRow}
          style={{
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid hsl(var(--tf-fg) / 0.15)',
            background: 'transparent', color: T.textMuted,
            cursor: 'pointer', fontSize: 12,
          }}
        >
          + Add District
        </button>
        <button
          onClick={handleRun}
          disabled={panelState.status === 'loading'}
          style={{
            padding: '8px 20px', borderRadius: 8,
            border: `1px solid ${T.cyan}`,
            background: 'hsl(var(--tf-accent) / 0.1)',
            color: T.cyan, cursor: panelState.status === 'loading' ? 'wait' : 'pointer',
            fontWeight: 700, fontSize: 13,
          }}
        >
          {panelState.status === 'loading' ? 'Checking…' : 'Run Aggregate Check'}
        </button>
      </div>

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
          {/* Overall result */}
          <div style={{
            padding: '14px 20px', borderRadius: 10,
            background: panelState.result.overallCompliant
              ? 'hsl(var(--tf-success) / 0.08)'
              : 'hsl(var(--tf-destructive) / 0.08)',
            border: `1px solid ${panelState.result.overallCompliant
              ? 'hsl(var(--tf-success) / 0.3)'
              : 'hsl(var(--tf-destructive) / 0.3)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{
              fontSize: 16, fontWeight: 700,
              color: panelState.result.overallCompliant ? T.success : T.danger,
            }}>
              {panelState.result.overallCompliant ? '✓ AGGREGATE CHECK PASS' : '✗ AGGREGATE LIMIT EXCEEDED'}
            </span>
            <span style={{ fontSize: 11, color: T.textMuted }}>{panelState.result.statutoryReference}</span>
          </div>

          {/* Tier breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TierCard
              label="Tier 1 — County + Junior Districts"
              sum={panelState.result.tier1Sum}
              limit={panelState.result.tier1Limit}
              compliant={panelState.result.tier1Compliant}
            />
            <TierCard
              label="Tier 2 — All Regular Levies"
              sum={panelState.result.tier2Sum}
              limit={panelState.result.tier2Limit}
              compliant={panelState.result.tier2Compliant}
            />
          </div>

          {panelState.result.prorationRequired && (
            <div style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'hsl(var(--tf-warning) / 0.08)',
              border: '1px solid hsl(var(--tf-warning) / 0.3)',
              color: T.warning, fontSize: 13,
            }}>
              <strong>Proration required:</strong> {panelState.result.prorationNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TierCard({ label, sum, limit, compliant }: {
  label: string; sum: number; limit: number; compliant: boolean;
}) {
  const pct = Math.min((sum / limit) * 100, 110);
  return (
    <div style={{
      padding: 16, borderRadius: 10, background: T.cardBg, border: T.cardBorder,
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: compliant ? T.success : T.danger, fontFamily: 'monospace' }}>
          {sum.toFixed(4)}
        </span>
        <span style={{ fontSize: 12, color: T.textDim }}>/ {limit.toFixed(2)} limit</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'hsl(var(--tf-fg) / 0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`,
          background: compliant ? T.success : T.danger,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: T.textDim, marginTop: 6, textAlign: 'right' }}>
        {pct.toFixed(1)}% of limit
        {!compliant && (
          <span style={{ color: T.danger, fontWeight: 700, marginLeft: 8 }}>
            Over by {(sum - limit).toFixed(4)}
          </span>
        )}
      </div>
    </div>
  );
}
