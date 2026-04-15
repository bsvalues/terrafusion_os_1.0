/**
 * forge/ForgeOverview.tsx
 *
 * Phase 1: Forge Overview sub-tab — valuation summary cards + governed AI tools.
 * Extracted from PropertyForge.tsx monolith.
 *
 * Tools hosted here:
 *   - explain_model_results: AI-powered valuation explanation
 *   - explain_value_change: Year-over-year value change analysis
 *   - compare_assessed_value_history: Multi-year value trend with narrative
 *   - run_valuation_model: Execute valuation model (write_high, requires confirmation)
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { InvocationHistory, type InvocationRecord } from '../../../../components/workbench';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { getEnv } from '../../../../runtime/env';
import { usePropertyStore } from '../../../../stores/propertyStore';
import { BentoGrid } from '../../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { AuditTimeline } from '../../../../components/workbench/AuditTimeline';
import { DataLineageViewer } from '../../../../components/workbench/DataLineageViewer';
import {
  useCostApproach,
  useSalesComparison,
  useIncomeApproach,
  useReconciliation,
} from '../../../../hooks/forge/useForgeValuation';
import {
  type ForgeSubTabProps,
  type ExplainState,
  type ValueChangeState,
  type ValueHistoryResult,
  type ValuationModelResult,
  type ExplanationResult,
  type ValueChangeResult,
  type ToolState,
  AUDIENCES,
  type AudienceType,
  TAX_YEARS,
  VALUATION_REASON_CODES,
  fmtCurrency,
  formatCurrency,
  formatConfidence,
} from './types';
import type { ErrorInfo } from '../../../../hooks/useErrorHandler';

interface ForgeOverviewProps extends ForgeSubTabProps {
  /** All invocation records from every sub-tab, displayed here */
  history: InvocationRecord[];
}

export const ForgeOverview: React.FC<ForgeOverviewProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
  history,
}) => {
  const { parcelId } = useWorkbenchTab();
  const assessments = usePropertyStore((s) => s.assessments);
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  /* ── Live Forge API data for overview cards ─────────────── */
  const costAPI = useCostApproach(parcelId, taxYear);
  const salesAPI = useSalesComparison(parcelId, taxYear);
  const incomeAPI = useIncomeApproach(parcelId, taxYear);
  const reconAPI = useReconciliation(parcelId, taxYear);

  /** Determine overall data source from API results */
  const apiSources = [costAPI, salesAPI, incomeAPI, reconAPI];
  const liveCount = apiSources.filter((a) => a.source === 'live').length;
  const overviewSource = liveCount === 4 ? 'live' as const
    : liveCount > 0 ? 'partial' as const
    : 'fallback' as const;

  const [audience, setAudience] = useState<AudienceType>('internal');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareToYear, setCompareToYear] = useState<number>(taxYear - 1);
  const [explainState, setExplainState] = useState<ExplainState>({ status: 'idle' });
  const [valueChangeState, setValueChangeState] = useState<ValueChangeState>({ status: 'idle' });
  const [historyState, setHistoryState] = useState<ToolState<ValueHistoryResult>>({ status: 'idle' });
  const [valuationState, setValuationState] = useState<ToolState<ValuationModelResult>>({ status: 'idle' });
  const [valuationModelType, setValuationModelType] = useState<'cost' | 'income' | 'sales'>('cost');
  const [valuationReasonCode, setValuationReasonCode] = useState<string>('annual_certification');
  const [valuationConfirmed, setValuationConfirmed] = useState(false);

  const isDev = getEnv('MODE') === 'development';

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  /* ── explain_model_results ────────────────────────────── */

  const handleExplain = useCallback(async () => {
    setExplainState({ status: 'loading' });
    const params: Record<string, unknown> = { parcelId, taxYear, audience };
    if (compareEnabled) params.compareToYear = compareToYear;

    try {
      const response = await invokeTool({ toolId: 'explain_model_results', params, parcelId });
      if (response.success && response.result) {
        let parsed: ExplanationResult;
        try {
          parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        } catch { parsed = { parcelId }; }
        setExplainState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { year: taxYear, audience } });
      } else {
        const errorInfo: ErrorInfo = { code: response.error?.code || 'EXPLAIN_FAILED', message: response.error?.message || 'Failed to explain valuation model results', severity: 'error' as const, correlationId: response.correlationId };
        setExplainState({ status: 'error', correlationId: response.correlationId, error: errorInfo });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'error', correlationId: response.correlationId || 'unknown', timestamp: new Date(), errorCode: response.error?.code || 'EXPLAIN_FAILED', meta: { year: taxYear, audience } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error occurred', severity: 'error' as const, correlationId: cid };
      setExplainState({ status: 'error', correlationId: cid, error: networkError });
      onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_model_results', status: 'error', correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR', meta: { year: taxYear, audience } });
    }
  }, [parcelId, taxYear, audience, compareEnabled, compareToYear, onHistoryRecord]);

  /* ── explain_value_change ─────────────────────────────── */

  const handleValueChange = useCallback(async () => {
    setValueChangeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'explain_value_change', params: { county: 'benton', parcelId, taxYear }, parcelId });
      if (response.success && response.result) {
        let parsed: ValueChangeResult;
        try { parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output; } catch { parsed = { parcelId }; }
        setValueChangeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { year: taxYear } });
      } else {
        setValueChangeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'VALUE_CHANGE_FAILED', message: response.error?.message || 'Failed to explain value change', severity: 'error', correlationId: response.correlationId } });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'error', correlationId: response.correlationId || 'unknown', timestamp: new Date(), errorCode: response.error?.code || 'VALUE_CHANGE_FAILED', meta: { year: taxYear } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setValueChangeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
      onHistoryRecord({ id: crypto.randomUUID(), toolId: 'explain_value_change', status: 'error', correlationId: cid, timestamp: new Date(), errorCode: 'NETWORK_ERROR', meta: { year: taxYear } });
    }
  }, [parcelId, taxYear, onHistoryRecord]);

  /* ── compare_assessed_value_history ───────────────────── */

  const handleValueHistory = useCallback(async () => {
    setHistoryState({ status: 'loading' });
    try {
      const years = TAX_YEARS.slice(0, 5);
      const response = await invokeTool({ toolId: 'compare_assessed_value_history', params: { county: 'benton', parcelId, years, includeBreakdown: true }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setHistoryState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'compare_assessed_value_history', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { years: years.length } });
      } else {
        setHistoryState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'HISTORY_FAILED', message: response.error?.message || 'Failed to fetch value history', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setHistoryState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, onHistoryRecord]);

  /* ── run_valuation_model (write_high) ─────────────────── */

  const handleRunValuation = useCallback(async () => {
    if (!valuationConfirmed) return;
    setValuationState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'run_valuation_model', params: { county: 'benton', parcelId, taxYear, modelType: valuationModelType, reasonCode: valuationReasonCode }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setValuationState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({ id: crypto.randomUUID(), toolId: 'run_valuation_model', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { modelType: valuationModelType, reason: valuationReasonCode } });
        if (parsed.estimatedValue && onValueIndicated) {
          onValueIndicated(valuationModelType, parsed.estimatedValue);
        }
      } else {
        setValuationState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'VALUATION_FAILED', message: response.error?.message || 'Valuation model run failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setValuationState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    } finally {
      setValuationConfirmed(false);
    }
  }, [parcelId, taxYear, valuationModelType, valuationReasonCode, valuationConfirmed, onHistoryRecord, onValueIndicated]);

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Live Forge API Summary */}
      <BentoCard
        title="🔥 Forge Valuation Summary"
        variant="default"
        actions={<WorkbenchSourceBadge source={overviewSource} />}
      >
        {(costAPI.loading || salesAPI.loading || incomeAPI.loading || reconAPI.loading) && (
          <div role="status" className="flex items-center justify-center py-4 gap-3">
            <div className="tf-spinner h-6 w-6" />
            <span className="tf-text-tertiary text-sm">Loading forge valuation data...</span>
          </div>
        )}
        {liveCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="forge-overview-live">
            {costAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Cost Indicated</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(costAPI.data.indicatedValue)}</div>
              </div>
            )}
            {salesAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Sales Indicated</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(salesAPI.data.indicatedValue)}</div>
              </div>
            )}
            {incomeAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Income Indicated</div>
                <div className="text-lg font-bold tf-text">
                  {incomeAPI.data.valuation > 0 ? fmtCurrency(incomeAPI.data.valuation) : <span className="tf-text-dim text-base">N/A</span>}
                </div>
              </div>
            )}
            {reconAPI.data && (
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Reconciled</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(reconAPI.data.reconciledValue)}</div>
              </div>
            )}
          </div>
        )}
        {!costAPI.loading && !salesAPI.loading && !incomeAPI.loading && !reconAPI.loading && liveCount === 0 && (
          <p className="tf-text-tertiary text-sm py-2">
            Forge API data not yet available. Use the tools below to generate valuations.
          </p>
        )}
      </BentoCard>

      {/* Valuation Context from Store */}
      {(activeParcel || assessments.length > 0) && (
        <BentoGrid columns="auto" gap={0.75} padding={0}>
          {activeParcel && (
            <BentoCard variant="stat" title="Market Value">
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}>
                {fmtCurrency(activeParcel.marketValue)}
              </p>
            </BentoCard>
          )}
          {activeParcel && (
            <BentoCard variant="stat" title="Assessed Value">
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-success))' }}>
                {fmtCurrency(activeParcel.totalAssessedValue)}
              </p>
            </BentoCard>
          )}
          {assessments.slice(0, 2).map((a) => (
            <BentoCard key={a.assessmentId} variant="stat" title={`${a.assessmentYear} Assessed`}>
              <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
                {fmtCurrency(a.totalAssessedValue)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Land: {fmtCurrency(a.landValue)} | Impr: {fmtCurrency(a.improvementValue)}
              </p>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* Main Content Grid — Controls + Results */}
      <BentoGrid columns="auto" gap={1.5} padding={0}>
        {/* Controls Panel */}
        <BentoCard variant="form" title="Valuation Parameters" actions={<span>⚙️</span>}>
          {/* Audience Selector */}
          <div className="mb-4">
            <label htmlFor="audience" className="block tf-text-secondary text-sm mb-2">Audience</label>
            <select id="audience" value={audience} onChange={(e) => setAudience(e.target.value as AudienceType)} className="w-full tf-input px-3 py-2">
              {AUDIENCES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="tf-text-dim text-xs mt-1">{AUDIENCES.find((a) => a.value === audience)?.description}</p>
          </div>

          {/* Compare Toggle */}
          <div className="mb-4">
            <button
              data-testid="compare-year-toggle"
              onClick={() => setCompareEnabled(!compareEnabled)}
              className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-all ${
                compareEnabled ? 'tf-suite-active' : 'tf-panel tf-text-secondary tf-hover-surface'
              }`}
            >
              <span>{compareEnabled ? '📊' : '📈'}</span>
              <span>Year-over-Year Comparison</span>
              {compareEnabled && <span className="ml-auto tf-suite-accent-text">&check;</span>}
            </button>
          </div>

          {/* Compare Year Selector (conditional) */}
          {compareEnabled && (
            <div className="mb-4">
              <label htmlFor="compare-year" className="block tf-text-secondary text-sm mb-2">Compare to Year</label>
              <select id="compare-year" value={compareToYear} onChange={(e) => setCompareToYear(Number(e.target.value))} className="w-full tf-input px-3 py-2">
                {TAX_YEARS.filter((y) => y !== taxYear).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={explainState.status === 'loading'}
            className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta"
          >
            {explainState.status === 'loading' ? 'Analyzing...' : 'Explain Valuation'}
          </button>
        </BentoCard>

        {/* Results Panel */}
        <BentoCard
          span="2x1"
          actions={
            <WorkbenchSourceBadge
              source={explainState.status === 'success' ? 'live' : 'unavailable'}
              className="ml-2"
            />
          }
        >
          {explainState.status === 'loading' ? (
            <div role="status" className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="tf-spinner h-10 w-10" />
              <span className="tf-text-tertiary">Analyzing valuation model...</span>
            </div>
          ) : explainState.status === 'success' && explainState.result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="tf-suite-accent-text font-semibold flex items-center gap-2">
                  ✔️ Valuation Explanation
                </h4>
                {explainState.correlationId && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="tf-text-muted">ID:</span>
                    <code className="tf-suite-accent-text font-mono">{explainState.correlationId.slice(0, 16)}...</code>
                    <button onClick={() => copyToClipboard(explainState.correlationId!)} className="tf-text-tertiary hover:tf-text" aria-label="Copy correlation ID">📋</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="tf-panel p-4">
                  <div className="tf-text-tertiary text-sm">Assessed Value</div>
                  <div className="text-2xl font-bold tf-text">{formatCurrency(explainState.result.assessedValue)}</div>
                </div>
                <div className="tf-panel p-4">
                  <div className="tf-text-tertiary text-sm">Market Value</div>
                  <div className="text-2xl font-bold tf-text">{formatCurrency(explainState.result.marketValue)}</div>
                </div>
              </div>

              {explainState.result.explanation && (
                <div className="tf-panel p-4">
                  <h5 className="tf-text font-medium mb-2" style={{ opacity: 0.8 }}>📝 Explanation</h5>
                  <p className="tf-text-secondary">{explainState.result.explanation}</p>
                </div>
              )}

              {explainState.result.drivers && explainState.result.drivers.length > 0 && (
                <div className="tf-panel p-4">
                  <h5 className="tf-text font-medium mb-3" style={{ opacity: 0.8 }}>📊 Value Drivers</h5>
                  <div className="space-y-2">
                    {explainState.result.drivers.map((driver, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                        <span className="tf-text-secondary">{driver.factor}</span>
                        <span className="font-mono" style={{ color: driver.impact.startsWith('+') ? 'hsl(var(--tf-success))' : driver.impact.startsWith('-') ? 'hsl(var(--tf-error))' : 'hsl(var(--tf-text) / 0.7)' }}>
                          {driver.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explainState.result.confidence !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="tf-text-tertiary">Model Confidence:</span>
                  <span className="tf-suite-accent-text font-semibold">{formatConfidence(explainState.result.confidence)}</span>
                </div>
              )}

              {isDev && explainState.correlationId && (
                <div className="text-xs tf-text-dim border-t tf-border pt-3">
                  <details>
                    <summary className="cursor-pointer tf-hover-surface">Developer Info</summary>
                    <pre className="mt-2 tf-overlay rounded p-2 overflow-x-auto">
                      pnpm run trace:query --correlation {explainState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : explainState.status === 'idle' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-2">🔥</div>
              <p className="tf-text-tertiary">Configure parameters and click Explain Valuation</p>
              <p className="tf-text-dim text-sm mt-1">Get tool-generated analysis of the selected valuation model results</p>
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

      {/* Error Display */}
      {explainState.status === 'error' && explainState.error && (
        <ErrorDisplay error={{ message: explainState.error.message, errorCode: explainState.error.code, correlationId: explainState.correlationId }} />
      )}

      {/* Value Change Analysis */}
      <BentoCard
        title="📈 Value Change Analysis"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={valueChangeState.status === 'success' ? 'live' : 'unavailable'}
            className="ml-2"
          />
        }
      >
        <p className="tf-text-tertiary text-sm mb-4">Year-over-year value change breakdown for {parcelId}</p>
        <p className="tf-text-tertiary text-sm mb-4">Compares the selected tax year to the prior year returned for this parcel.</p>
        <button onClick={handleValueChange} disabled={valueChangeState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4">
          {valueChangeState.status === 'loading' ? 'Analyzing...' : `Explain Value Change (${taxYear})`}
        </button>

        {valueChangeState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Analyzing value changes...</span>
          </div>
        )}

        {valueChangeState.status === 'success' && valueChangeState.result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Prior Year ({taxYear - 1})</div>
                <div className="text-lg font-bold tf-text">{formatCurrency(valueChangeState.result.previousValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Selected Year ({taxYear})</div>
                <div className="text-lg font-bold tf-text">{formatCurrency(valueChangeState.result.currentValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Change</div>
                <div className="text-lg font-bold" style={{ color: (valueChangeState.result.changeAmount ?? 0) > 0 ? 'hsl(var(--tf-success))' : (valueChangeState.result.changeAmount ?? 0) < 0 ? 'hsl(var(--tf-error))' : 'hsl(var(--tf-text) / 0.7)' }}>
                  {formatCurrency(valueChangeState.result.changeAmount)}
                  {valueChangeState.result.changePercent !== undefined && (
                    <span className="text-sm ml-1">({valueChangeState.result.changePercent > 0 ? '+' : ''}{valueChangeState.result.changePercent.toFixed(1)}%)</span>
                  )}
                </div>
              </div>
            </div>

            {valueChangeState.result.explanation && (
              <div className="tf-panel p-4">
                <h5 className="tf-text font-medium mb-2" style={{ opacity: 0.8 }}>📝 Change Explanation</h5>
                <p className="tf-text-secondary">{valueChangeState.result.explanation}</p>
              </div>
            )}

            {valueChangeState.result.factors && valueChangeState.result.factors.length > 0 && (
              <div className="tf-panel p-4">
                <h5 className="tf-text font-medium mb-3" style={{ opacity: 0.8 }}>📊 Contributing Factors</h5>
                <div className="space-y-2">
                  {valueChangeState.result.factors.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                      <span className="tf-text-secondary">{f.name}</span>
                      <span className="font-mono tf-text-tertiary">{f.contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {valueChangeState.correlationId && (
              <div className="flex items-center gap-2 text-xs">
                <span className="tf-text-muted">ID:</span>
                <code className="tf-suite-accent-text font-mono">{valueChangeState.correlationId.slice(0, 16)}...</code>
                <button onClick={() => copyToClipboard(valueChangeState.correlationId!)} className="tf-text-tertiary hover:tf-text" aria-label="Copy correlation ID">📋</button>
              </div>
            )}
          </div>
        )}

        {valueChangeState.status === 'error' && valueChangeState.error && (
          <ErrorDisplay error={{ message: valueChangeState.error.message, errorCode: valueChangeState.error.code, correlationId: valueChangeState.correlationId }} />
        )}
      </BentoCard>

      {/* Value History Trend */}
      <BentoCard
        title="📊 Value History Trend"
        variant="default"
        actions={
          <WorkbenchSourceBadge
            source={historyState.status === 'success' ? 'live' : 'unavailable'}
            className="ml-2"
          />
        }
      >
        <p className="tf-text-tertiary text-sm mb-4">Multi-year assessed value comparison for {parcelId}</p>
        <button onClick={handleValueHistory} disabled={historyState.status === 'loading'} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4">
          {historyState.status === 'loading' ? 'Loading...' : 'Compare Value History'}
        </button>
        {historyState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3"><div className="tf-spinner h-8 w-8" /><span className="tf-text-tertiary">Fetching history...</span></div>
        )}
        {historyState.status === 'success' && historyState.result && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {historyState.result.trend.map((t) => (
                <div key={t.year} className="tf-panel p-3 text-center">
                  <div className="tf-text-tertiary text-xs">{t.year}</div>
                  <div className="text-sm font-bold tf-text">{formatCurrency(t.av)}</div>
                  {t.tv !== undefined && <div className="text-xs tf-text-dim">Tax: {formatCurrency(t.tv)}</div>}
                </div>
              ))}
            </div>
            {historyState.result.narrative && <div className="tf-panel p-4"><p className="tf-text-secondary text-sm">{historyState.result.narrative}</p></div>}
            {historyState.result.flags && historyState.result.flags.length > 0 && (
              <div className="flex gap-2 flex-wrap">{historyState.result.flags.map((f) => <span key={f} className="text-xs tf-panel px-2 py-1 rounded">{f}</span>)}</div>
            )}
          </div>
        )}
        {historyState.status === 'error' && historyState.error && <ErrorDisplay error={{ message: historyState.error.message, errorCode: historyState.error.code, correlationId: historyState.correlationId }} />}
      </BentoCard>

      {/* Run Valuation Model (write_high) */}
      <BentoCard
        title="🏗️ Run Valuation Model"
        actions={
          <>
            <span className="text-xs tf-badge-error px-2 py-0.5 rounded">write_high</span>
            <WorkbenchSourceBadge
              source={valuationState.status === 'success' ? 'live' : 'unavailable'}
              className="ml-2"
            />
          </>
        }
      >
        <p className="tf-text-tertiary text-sm mb-3">Execute a valuation model for parcel {parcelId} — requires confirmation</p>
        <div className="space-y-3 mb-4">
          <div>
            <label htmlFor="valuation-model-type" className="block tf-text-secondary text-sm mb-1">Model Type</label>
            <select id="valuation-model-type" value={valuationModelType} onChange={(e) => setValuationModelType(e.target.value as 'cost' | 'income' | 'sales')} className="w-full tf-input px-3 py-2">
              <option value="cost">Cost Approach</option>
              <option value="income">Income Approach</option>
              <option value="sales">Sales Comparison</option>
            </select>
          </div>
          <div>
            <label htmlFor="valuation-reason" className="block tf-text-secondary text-sm mb-1">Reason Code</label>
            <select id="valuation-reason" value={valuationReasonCode} onChange={(e) => setValuationReasonCode(e.target.value)} className="w-full tf-input px-3 py-2">
              {VALUATION_REASON_CODES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="tf-panel p-3 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={valuationConfirmed} onChange={(e) => setValuationConfirmed(e.target.checked)} className="h-4 w-4" data-testid="valuation-confirm-checkbox" />
              <span className="text-sm tf-text">I confirm this write_high operation: run <strong>{valuationModelType}</strong> model for tax year <strong>{taxYear}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleRunValuation} disabled={valuationState.status === 'loading' || !valuationConfirmed} className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4 disabled:opacity-50">
          {valuationState.status === 'loading' ? 'Running Model...' : valuationConfirmed ? 'Run Valuation Model' : '⚠️ Confirm Above to Enable'}
        </button>
        {valuationState.status === 'loading' && <div role="status" className="flex items-center justify-center py-6 gap-3"><div className="tf-spinner h-8 w-8" /><span className="tf-text-tertiary">Running valuation model...</span></div>}
        {valuationState.status === 'success' && valuationState.result && (
          <div className="space-y-3">
            <div className="tf-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold tf-suite-accent-text">{formatCurrency(valuationState.result.estimatedValue)}</span>
                <span className="text-sm tf-badge px-2 py-0.5 rounded">{valuationState.result.modelType}</span>
              </div>
              <div className="text-sm tf-text-secondary">Confidence: {formatConfidence(valuationState.result.confidence)} | Year: {valuationState.result.taxYear}</div>
            </div>
            {valuationState.result.components && Object.keys(valuationState.result.components).length > 0 && (
              <div className="space-y-1">
                {Object.entries(valuationState.result.components).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                    <span className="tf-text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-semibold tf-text">{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            )}
            {valuationState.correlationId && <div className="text-xs tf-text-dim">ID: <code className="tf-suite-accent-text font-mono">{valuationState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {valuationState.status === 'error' && valuationState.error && <ErrorDisplay error={{ message: valuationState.error.message, errorCode: valuationState.error.code, correlationId: valuationState.correlationId }} />}
      </BentoCard>

      {/* Data Lineage */}
      <div className="rounded-lg p-4" style={{ background: 'hsl(var(--tf-surface) / 0.7)', border: '1px solid hsl(var(--tf-border) / 0.6)' }}>
        <DataLineageViewer />
      </div>

      {/* Audit Timeline */}
      {parcelId && (
        <AuditTimeline parcelId={parcelId} />
      )}

      {/* Invocation History */}
      <InvocationHistory
        records={history}
        title="Forge Tool History"
        emptyMessage="No valuation explanations yet."
      />
    </div>
  );
};

export default ForgeOverview;
