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
import { useReconciliation as useReconciliationAPI, useCommitReconciliation } from '../../../../hooks/forge/useForgeValuation';
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
type ReconciliationReadState = 'loading' | 'live' | 'unavailable';

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

/* ── Reconciliation Sub-Tab ─────────────────────────────── */

export const Reconciliation: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
}) => {
  const { parcelId } = useWorkbenchTab();

  /* ── Live API data ──────────────────────────────────────── */
  const reconAPI = useReconciliationAPI(parcelId, taxYear);
  const commitMutation = useCommitReconciliation(parcelId);

  /* Commit panel state */
  const [commitConfirmed, setCommitConfirmed] = useState(false);
  const [appraiserNote, setAppraiserNote] = useState('');
  const [committedResult, setCommittedResult] = useState<{ flagId: number; finalValue: number } | null>(null);

  /* Local state */
  const [indications, setIndications] = useState<ApproachIndication[]>([]);
  const [readState, setReadState] = useState<ReconciliationReadState>('loading');

  /* Seed indications from live API data when available */
  useEffect(() => {
    if (reconAPI.loading) {
      setReadState('loading');
      return;
    }

    if (reconAPI.data && reconAPI.data.costApproach && reconAPI.data.salesApproach && reconAPI.data.incomeApproach) {
      const liveIndications: ApproachIndication[] = [
        {
          approach: 'cost',
          indicatedValue: Number(reconAPI.data.costApproach.indicatedValue) || 0,
          weight: reconAPI.data.costApproach.weight || 40,
          confidence: reconAPI.data.costApproach.confidence,
          note: reconAPI.data.costApproach.note || 'From cost approach model',
        },
        {
          approach: 'sales',
          indicatedValue: Number(reconAPI.data.salesApproach.indicatedValue) || 0,
          weight: reconAPI.data.salesApproach.weight || 45,
          confidence: reconAPI.data.salesApproach.confidence,
          note: reconAPI.data.salesApproach.note || 'From sales comparison analysis',
        },
        {
          approach: 'income',
          indicatedValue: Number(reconAPI.data.incomeApproach.indicatedValue) || 0,
          weight: reconAPI.data.incomeApproach.weight || 15,
          confidence: reconAPI.data.incomeApproach.confidence,
          note: reconAPI.data.incomeApproach.note || 'From income approach analysis',
        },
      ];
      setIndications(liveIndications);
      setReadState('live');
      setReconciled(false);
      return;
    }

    setIndications([]);
    setReadState('unavailable');
    setReconciled(false);
    setReconciledValue(null);
  }, [reconAPI.data, reconAPI.loading]);
  const [method, setMethod] = useState<ReconciliationMethod>('weighted_average');
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [reconciled, setReconciled] = useState(false);
  const [reconciledValue, setReconciledValue] = useState<number | null>(null);

  /* Derived: total weight */
  const totalWeight = useMemo(
    () => indications.reduce((s, a) => s + a.weight, 0),
    [indications],
  );

  /* Derived: weighted-average value — only normalize over active (>0) approaches */
  const weightedAvg = useMemo(() => {
    const active = indications.filter(a => a.indicatedValue > 0);
    if (active.length === 0) return 0;
    const activeWeightTotal = active.reduce((s, a) => s + a.weight, 0);
    if (activeWeightTotal === 0) return 0;
    const sum = active.reduce((s, a) => s + a.indicatedValue * a.weight, 0);
    return Math.round(sum / activeWeightTotal);
  }, [indications]);

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

  /* Commit action — submits reconciled value for supervisor review */
  const handleCommit = useCallback(async () => {
    if (!commitConfirmed || reconciledValue == null) return;
    try {
      const result = await commitMutation.mutateAsync({
        method,
        finalValue: reconciledValue,
        taxYear,
        appraiserNote: appraiserNote.trim() || undefined,
        approaches: indications.map((a) => ({
          approach: a.approach,
          indicatedValue: a.indicatedValue,
          weight: a.weight,
        })),
      });
      setCommittedResult({ flagId: result.flagId, finalValue: result.finalValue });
      onHistoryRecord({
        id: crypto.randomUUID(),
        toolId: 'reconciliation_commit',
        status: 'success',
        correlationId: `commit-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: new Date(),
        meta: { parcelId, taxYear, method, finalValue: reconciledValue, flagId: result.flagId },
      });
    } catch {
      // commitMutation.error will surface the message
    }
  }, [commitConfirmed, reconciledValue, method, taxYear, appraiserNote, indications, commitMutation, onHistoryRecord, parcelId]);

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
          {readState === 'live'
            ? 'Approach indications from live assessment data'
            : 'Live approach indications unavailable'}
        </span>
        <WorkbenchSourceBadge source={readState === 'live' ? 'live' : 'unavailable'} />
      </div>

      {reconAPI.loading && (
        <div role="status" className="flex items-center justify-center py-4 gap-3">
          <div className="tf-spinner h-6 w-6" />
          <span className="tf-text-tertiary text-sm">Loading reconciliation data...</span>
        </div>
      )}

      {readState === 'unavailable' && !reconAPI.loading && (
        <div
          data-testid="forge-reconciliation-unavailable"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
        >
          <div className="font-medium text-amber-100">Reconciliation unavailable.</div>
          <p className="mt-1 text-amber-50/90">
            Live cost, sales, and income indications are required for this lane, and no Benton fixture indications are rendered here.
          </p>
          {reconAPI.error && (
            <p className="mt-2 text-xs text-amber-100/80">{reconAPI.error.message}</p>
          )}
        </div>
      )}

      {/* ── Approach Cards ─────────────────────────────── */}
      {readState === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ overflow: 'hidden' }}>
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
                    {ind.indicatedValue > 0 && (
                      <p className="text-xs tf-text-tertiary mt-0.5">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(ind.indicatedValue)}
                      </p>
                    )}
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <label className="block tf-text-secondary text-xs mb-1">
                      {ind.indicatedValue === 0 ? (
                        <span className="tf-text-dim">Weight: <span className="font-semibold line-through">{ind.weight}%</span> <span className="italic">(excluded — no value)</span></span>
                      ) : (
                        <>Weight: <span className="font-semibold">{ind.weight}%</span></>
                      )}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ind.weight}
                      onChange={(e) => updateApproach(idx, { weight: Number(e.target.value) })}
                      className="w-full accent-current"
                      disabled={ind.indicatedValue === 0}
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
      )}

      {/* ── Weight Summary Bar ─────────────────────────── */}
      {readState === 'live' && (
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
      )}

      {/* ── Reconciliation Controls ────────────────────── */}
      {readState === 'live' && (
        <BentoCard
          title="⚖️ Reconciliation"
          variant="default"
          actions={
            <WorkbenchSourceBadge
              source={reconciled || readState === 'live' ? 'live' : 'unavailable'}
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
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg"
            style={{
              background: 'hsl(var(--tf-surface) / 0.8)',
              border: '1px solid hsl(var(--tf-border) / 0.6)',
            }}
          >
            <div>
              <div className="text-xs tf-text-tertiary">Preview</div>
              <div
                className="text-2xl font-bold"
                style={{ color: 'hsl(var(--tf-text))' }}
                data-testid="preview-value"
              >
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

          {/* ── Submit for Supervisor Review (human gate) ──── */}
          {reconciled && reconciledValue != null && !committedResult && (
            <div
              className="space-y-3 px-4 py-4 rounded-lg border"
              style={{ borderColor: 'hsl(var(--tf-border) / 0.6)', background: 'hsl(var(--tf-surface) / 0.6)' }}
              data-testid="reconciliation-submit-panel"
            >
              <div className="text-sm font-medium" style={{ color: 'hsl(var(--tf-text))' }}>
                Submit for Supervisor Review
              </div>
              <p className="text-xs tf-text-tertiary">
                This submits a review flag for{' '}
                <span className="font-semibold">{fmtCurrency(reconciledValue)}</span>.
                Your supervisor must approve before any assessed value changes.
              </p>

              <div>
                <label className="block tf-text-secondary text-xs mb-1">Appraiser Note (optional)</label>
                <textarea
                  value={appraiserNote}
                  onChange={(e) => setAppraiserNote(e.target.value)}
                  maxLength={400}
                  rows={2}
                  placeholder="Rationale for this reconciliation..."
                  className="tf-input w-full px-3 py-1.5 text-sm resize-none"
                  data-testid="appraiser-note"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitConfirmed}
                  onChange={(e) => setCommitConfirmed(e.target.checked)}
                  className="mt-0.5"
                  data-testid="commit-confirm-check"
                />
                <span className="text-xs tf-text-secondary">
                  I have reviewed the reconciled value and confirm this submission is accurate.
                </span>
              </label>

              {commitMutation.isError && (
                <p className="text-xs text-red-400" role="alert">
                  {commitMutation.error?.message ?? 'Submission failed. Please try again.'}
                </p>
              )}

              <button
                onClick={handleCommit}
                disabled={!commitConfirmed || commitMutation.isPending}
                className="w-full px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-testid="commit-btn"
              >
                {commitMutation.isPending ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          )}

          {/* ── Committed confirmation ─────────────────────── */}
          {committedResult && (
            <div
              className="px-4 py-3 rounded-lg border border-blue-500/40 bg-blue-500/10"
              data-testid="commit-success"
            >
              <div className="text-xs tf-text-tertiary mb-1">Submitted for Supervisor Review</div>
              <div className="text-lg font-bold" style={{ color: 'hsl(var(--tf-accent))' }}>
                {fmtCurrency(committedResult.finalValue)}
              </div>
              <div className="text-xs tf-text-tertiary mt-1">
                Flag ID: {committedResult.flagId} — Status: RECONCILIATION_PENDING
              </div>
            </div>
          )}
        </div>
        </BentoCard>
      )}
    </div>
  );
};

export default Reconciliation;

