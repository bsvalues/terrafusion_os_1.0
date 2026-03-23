/**
 * forge/Reconciliation.tsx
 *
 * Tranche 1B: Three-approach reconciliation sub-tab.
 * Parcel-scoped — shows Cost / Sales / Income indications side by side,
 * supports weight-based reconciliation, and emits trace events.
 *
 * Write lane: Forge (reconciliation artifacts).
 * Constitutional truth: parcel-scoped, never cross-parcel.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { useReconciliation as useReconciliationAPI } from '../../../../hooks/forge/useForgeValuation';
import type { ForgeSubTabProps } from './types';
import { fmtCurrency, CURRENT_YEAR } from './types';

/* ── Types (mirrors governed core types) ────────────────── */

type ApproachType = 'cost' | 'sales' | 'income';

interface ApproachIndication {
  approach: ApproachType;
  indicatedValue: number;
  weight: number;
  confidence?: number;
  note?: string;
}

type ReconciliationMethod =
  | 'weighted_average'
  | 'appraiser_judgment'
  | 'single_approach'
  | 'ai_assisted';

const APPROACH_LABELS: Record<ApproachType, { label: string; icon: string }> = {
  cost:   { label: 'Cost Approach',       icon: '🏗️' },
  sales:  { label: 'Sales Comparison',    icon: '🏘️' },
  income: { label: 'Income Approach',     icon: '💰' },
};

const METHODS: { value: ReconciliationMethod; label: string }[] = [
  { value: 'weighted_average',   label: 'Weighted Average' },
  { value: 'appraiser_judgment', label: 'Appraiser Judgment' },
  { value: 'single_approach',    label: 'Single Approach' },
  { value: 'ai_assisted',        label: 'AI-Assisted' },
];

/* ── Benton County fixture indications (dev fallback) ──── */

const FIXTURE_INDICATIONS: ApproachIndication[] = [
  { approach: 'cost',   indicatedValue: 385000, weight: 40, confidence: 0.82, note: 'RCN less depreciation + land' },
  { approach: 'sales',  indicatedValue: 392000, weight: 45, confidence: 0.91, note: '3 adjusted comps, median $392k' },
  { approach: 'income', indicatedValue: 378000, weight: 15, confidence: 0.68, note: 'NOI $26,460 / 7.0% cap rate' },
];

/* ── Reconciliation Sub-Tab ─────────────────────────────── */

export const Reconciliation: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
}) => {
  const { parcelId } = useWorkbenchTab();

  /* ── Live API data ──────────────────────────────────────── */
  const reconAPI = useReconciliationAPI(parcelId, taxYear);

  /* Local state */
  const [indications, setIndications] = useState<ApproachIndication[]>(
    () => FIXTURE_INDICATIONS.map((a) => ({ ...a })),
  );
  const [seededFromAPI, setSeededFromAPI] = useState(false);

  /* Seed indications from live API data when available */
  useEffect(() => {
    if (reconAPI.data && !seededFromAPI) {
      const liveIndications: ApproachIndication[] = [
        {
          approach: 'cost',
          indicatedValue: Number(reconAPI.data.costApproach.indicatedValue) || 0,
          weight: reconAPI.data.costApproach.weight || 40,
          confidence: reconAPI.data.costApproach.confidence,
          note: reconAPI.data.costApproach.note || 'From PACS cost approach',
        },
        {
          approach: 'sales',
          indicatedValue: Number(reconAPI.data.salesApproach.indicatedValue) || 0,
          weight: reconAPI.data.salesApproach.weight || 45,
          confidence: reconAPI.data.salesApproach.confidence,
          note: reconAPI.data.salesApproach.note || 'From PACS sales comparison',
        },
        {
          approach: 'income',
          indicatedValue: Number(reconAPI.data.incomeApproach.indicatedValue) || 0,
          weight: reconAPI.data.incomeApproach.weight || 15,
          confidence: reconAPI.data.incomeApproach.confidence,
          note: reconAPI.data.incomeApproach.note || 'From PACS income approach',
        },
      ];
      setIndications(liveIndications);
      setSeededFromAPI(true);
      setReconciled(false);
    }
  }, [reconAPI.data, seededFromAPI]);
  const [method, setMethod] = useState<ReconciliationMethod>('weighted_average');
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [reconciled, setReconciled] = useState(false);
  const [reconciledValue, setReconciledValue] = useState<number | null>(null);

  /* Derived: total weight */
  const totalWeight = useMemo(
    () => indications.reduce((s, a) => s + a.weight, 0),
    [indications],
  );

  /* Derived: weighted-average value */
  const weightedAvg = useMemo(() => {
    if (totalWeight === 0) return 0;
    const sum = indications.reduce((s, a) => s + a.indicatedValue * a.weight, 0);
    return Math.round(sum / totalWeight);
  }, [indications, totalWeight]);

  /* Compute final value based on method */
  const computeFinal = useCallback((): number => {
    if (method === 'appraiser_judgment' || method === 'ai_assisted') {
      const v = Number(overrideValue);
      return Number.isFinite(v) && v > 0 ? v : weightedAvg;
    }
    if (method === 'single_approach') {
      const best = [...indications].sort((a, b) => b.weight - a.weight)[0];
      return best?.indicatedValue ?? weightedAvg;
    }
    return weightedAvg;
  }, [method, overrideValue, weightedAvg, indications]);

  /* Update a single approach */
  const updateApproach = useCallback((idx: number, patch: Partial<ApproachIndication>) => {
    setIndications((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    setReconciled(false);
  }, []);

  /* Reconcile action */
  const handleReconcile = useCallback(() => {
    const finalValue = computeFinal();
    setReconciledValue(finalValue);
    setReconciled(true);
    onValueIndicated?.('reconciled', finalValue);
    onHistoryRecord({
      id: crypto.randomUUID(),
      toolId: 'reconcile_value',
      status: 'success',
      correlationId: `recon-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date(),
      meta: {
        parcelId,
        taxYear,
        method,
        finalValue,
        approaches: indications.map((a) => ({ approach: a.approach, value: a.indicatedValue, weight: a.weight })),
      },
    });
  }, [computeFinal, indications, method, onHistoryRecord, onValueIndicated, parcelId, taxYear]);

  /* Weight bar color */
  const weightBarColor = totalWeight === 100
    ? 'bg-green-500/20 border-green-500/40'
    : totalWeight > 100
      ? 'bg-red-500/20 border-red-500/40'
      : 'bg-yellow-500/20 border-yellow-500/40';

  return (
    <div className="space-y-4" data-testid="forge-reconciliation">
      {/* ── Data Source Indicator ─────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="tf-text-secondary text-sm">
          Approach indications {seededFromAPI ? 'loaded from API' : 'using fallback data'}
        </span>
        <WorkbenchSourceBadge source={reconAPI.source} />
      </div>

      {reconAPI.loading && (
        <div role="status" className="flex items-center justify-center py-4 gap-3">
          <div className="tf-spinner h-6 w-6" />
          <span className="tf-text-tertiary text-sm">Loading reconciliation data...</span>
        </div>
      )}

      {/* ── Approach Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indications.map((ind, idx) => {
          const meta = APPROACH_LABELS[ind.approach];
          return (
            <BentoCard
              key={ind.approach}
              title={`${meta.icon} ${meta.label}`}
              variant="default"
            >
              <div className="space-y-3">
                {/* Indicated Value */}
                <div>
                  <label className="block tf-text-secondary text-xs mb-1">Indicated Value</label>
                  <input
                    type="number"
                    value={ind.indicatedValue}
                    onChange={(e) => updateApproach(idx, { indicatedValue: Number(e.target.value) || 0 })}
                    className="tf-input w-full px-3 py-1.5 text-sm"
                    data-testid={`approach-value-${ind.approach}`}
                  />
                </div>

                {/* Weight Slider */}
                <div>
                  <label className="block tf-text-secondary text-xs mb-1">
                    Weight: <span className="font-semibold">{ind.weight}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ind.weight}
                    onChange={(e) => updateApproach(idx, { weight: Number(e.target.value) })}
                    className="w-full accent-current"
                    data-testid={`approach-weight-${ind.approach}`}
                  />
                </div>

                {/* Confidence */}
                {ind.confidence != null && (
                  <div className="text-xs tf-text-tertiary">
                    Confidence: {Math.round(ind.confidence * 100)}%
                  </div>
                )}

                {/* Note */}
                <div className="text-xs tf-text-tertiary italic">
                  {ind.note || 'No notes'}
                </div>
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* ── Weight Summary Bar ─────────────────────────── */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-lg border ${weightBarColor}`}
        data-testid="weight-summary"
      >
        <span className="text-sm font-medium">
          Total Weight: <span data-testid="total-weight">{totalWeight}%</span>
        </span>
        <span className="text-sm">
          {totalWeight === 100 ? '✓ Balanced' : totalWeight > 100 ? '⚠ Over 100%' : '⚠ Under 100%'}
        </span>
      </div>

      {/* ── Reconciliation Controls ────────────────────── */}
      <BentoCard
        title="⚖️ Reconciliation"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={reconciled ? 'live' : reconAPI.source === 'live' ? 'partial' : 'unavailable'}
            className="ml-2"
          />
        }
      >
        <div className="space-y-4">
          {/* Method Selector */}
          <div className="flex items-center gap-4">
            <label htmlFor="recon-method" className="tf-text-secondary text-sm whitespace-nowrap">
              Method
            </label>
            <select
              id="recon-method"
              value={method}
              onChange={(e) => { setMethod(e.target.value as ReconciliationMethod); setReconciled(false); }}
              className="tf-input px-3 py-1.5 text-sm"
              data-testid="recon-method"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Override input for judgment / AI */}
          {(method === 'appraiser_judgment' || method === 'ai_assisted') && (
            <div>
              <label className="block tf-text-secondary text-xs mb-1">Override Value ($)</label>
              <input
                type="number"
                value={overrideValue}
                onChange={(e) => { setOverrideValue(e.target.value); setReconciled(false); }}
                placeholder={`Default: ${fmtCurrency(weightedAvg)}`}
                className="tf-input w-full px-3 py-1.5 text-sm"
                data-testid="override-value"
              />
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 border tf-border">
            <div>
              <div className="text-xs tf-text-tertiary">Preview</div>
              <div className="text-2xl font-bold" data-testid="preview-value">
                {fmtCurrency(computeFinal())}
              </div>
            </div>
            <button
              onClick={handleReconcile}
              disabled={totalWeight !== 100 && method === 'weighted_average'}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="reconcile-btn"
            >
              Reconcile Value
            </button>
          </div>

          {/* Final Result */}
          {reconciled && reconciledValue != null && (
            <div
              className="px-4 py-3 rounded-lg border border-green-500/40 bg-green-500/10"
              data-testid="reconciled-result"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs tf-text-tertiary">Final Reconciled Value</div>
                  <div className="text-3xl font-bold text-green-400" data-testid="final-value">
                    {fmtCurrency(reconciledValue)}
                  </div>
                </div>
                <div className="text-right text-xs tf-text-tertiary">
                  <div>Parcel: {parcelId}</div>
                  <div>Tax Year: {taxYear}</div>
                  <div>Method: {METHODS.find((m) => m.value === method)?.label}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </BentoCard>
    </div>
  );
};

export default Reconciliation;
