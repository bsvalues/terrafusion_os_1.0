/**
 * forge/SalesComparison.tsx
 *
 * Phase 1: Sales Comparison sub-tab.
 * Wraps existing ComparableSalesPanel (612 lines, no changes to that component).
 * Also hosts the summarize_sales_comps_rationale governed tool.
 *
 * Extracted from PropertyForge.tsx monolith.
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { ComparableSalesPanel } from '../../../../components/workbench/ComparableSalesPanel';
import { useSalesComparison as useSalesComparisonAPI } from '../../../../hooks/forge/useForgeValuation';
import {
  type ForgeSubTabProps,
  type SalesCompsResult,
  type ToolState,
  fmtCurrency,
  formatConfidence,
} from './types';

export const SalesComparison: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
}) => {
  const { parcelId } = useWorkbenchTab();

  /* ── Live API data ──────────────────────────────────────── */
  const salesAPI = useSalesComparisonAPI(parcelId, taxYear);

  const [compIds, setCompIds] = useState<string>('');
  const [compsState, setCompsState] = useState<ToolState<SalesCompsResult>>({ status: 'idle' });

  /* ── summarize_sales_comps_rationale ──────────────────── */

  const handleSalesComps = useCallback(async () => {
    const ids = compIds.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    setCompsState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'summarize_sales_comps_rationale',
        params: { county: 'benton', subjectId: parcelId, compIds: ids, adjustments: true },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output)
          : response.result.output;
        setCompsState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({
          id: crypto.randomUUID(),
          toolId: 'summarize_sales_comps_rationale',
          status: 'success',
          correlationId: response.correlationId || 'unknown',
          timestamp: new Date(),
          meta: { comps: ids.length },
        });
      } else {
        setCompsState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'COMPS_FAILED',
            message: response.error?.message || 'Sales comps analysis failed',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setCompsState({
        status: 'error',
        correlationId: cid,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Network error',
          severity: 'error',
          correlationId: cid,
        },
      });
    }
  }, [parcelId, compIds, onHistoryRecord]);

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4" data-testid="sales-comparison-host">
      {/* Live Sales Comparison Data */}
      <BentoCard
        title="&#127968;&#65039; Sales Comparison Summary"
        variant="default"
        actions={<WorkbenchSourceBadge source={salesAPI.source} />}
      >
        {salesAPI.loading && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Loading sales comparison data...</span>
          </div>
        )}
        {salesAPI.data && (
          <div className="space-y-3" data-testid="sales-comparison-live">
            {/* Neighborhood filter disclosure banner when inactive */}
            {!salesAPI.data.neighborhoodFilterActive && salesAPI.data.comparableCount > 0 && (
              <div
                className="px-3 py-2 rounded text-xs"
                style={{ background: 'hsl(var(--tf-warning) / 0.10)', color: 'hsl(var(--tf-warning))' }}
              >
                Notice: Neighborhood filter not active. Comps are drawn from the full county — proximity scoring is a future AI layer.
              </div>
            )}
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Indicated Value</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(salesAPI.data.indicatedValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Comparables</div>
                <div className="text-lg font-bold tf-text">{salesAPI.data.comparableCount}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Median Adj. Price</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(salesAPI.data.medianAdjustedPrice)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Adjustment Range</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(salesAPI.data.adjustmentRange)}</div>
              </div>
            </div>
            {/* IAAO ratio statistics */}
            {salesAPI.data.comparableCount > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="tf-panel p-3 text-center">
                  <div className="tf-text-tertiary text-xs">Sales Ratio Median</div>
                  <div className="text-sm font-semibold tf-text">{salesAPI.data.salesRatioMedian.toFixed(3)}</div>
                  <div className="text-xs tf-text-dim mt-0.5">IAAO target: 0.950\u20131.050</div>
                </div>
                <div className="tf-panel p-3 text-center">
                  <div className="tf-text-tertiary text-xs">COD (IAAO)</div>
                  <div className="text-sm font-semibold tf-text">{salesAPI.data.coefficientOfDispersion.toFixed(1)}%</div>
                  <div className="text-xs tf-text-dim mt-0.5">Target: &lt;15% residential</div>
                </div>
              </div>
            )}
            {salesAPI.data.rationale && (
              <div className="tf-panel p-3">
                <p className="tf-text-secondary text-sm">{salesAPI.data.rationale}</p>
              </div>
            )}
            {salesAPI.data.comparables && salesAPI.data.comparables.length > 0 && (
              <div className="space-y-2">
                <div className="tf-text-tertiary text-xs font-medium">Comparable Sales</div>
                {salesAPI.data.comparables.map((c) => (
                  <div key={c.parcelId} className="tf-panel p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono tf-text text-sm">{c.parcelId}</span>
                      <span className="text-sm font-semibold tf-suite-accent-text">
                        {Math.round(c.similarity * 100)}% match
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs tf-text-dim flex-wrap">
                      <span>Sale: {fmtCurrency(c.salePrice)}</span>
                      <span>Adjusted: {fmtCurrency(c.adjustedPrice)}</span>
                      <span>Ratio: {c.salesRatio.toFixed(3)}</span>
                      {c.saleDate && (
                        <span>
                          {new Date(c.saleDate).toLocaleDateString()}
                          {' \u2014 '}
                          {Math.round((Date.now() - new Date(c.saleDate).getTime()) / 86400000)} days ago
                        </span>
                      )}
                    </div>
                    {c.notes && c.notes.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {c.notes.map((note, i) => (
                          <div key={i} className="text-xs tf-text-dim pl-2 border-l border-current opacity-50">{note}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* OLS Regression model */}
            {salesAPI.data.regressionIndicatedValue != null && (
              <div className="tf-panel p-3 space-y-2" data-testid="ols-regression-panel">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tf-text-secondary">OLS Regression Model</span>
                  <span className="text-xs tf-text-dim">
                    n={salesAPI.data.regressionCompsUsed ?? '—'}
                    &nbsp;·&nbsp;
                    R²={salesAPI.data.regressionRSquared != null ? salesAPI.data.regressionRSquared.toFixed(3) : '—'}
                    &nbsp;·&nbsp;
                    R²adj={salesAPI.data.regressionRSquaredAdj != null ? salesAPI.data.regressionRSquaredAdj.toFixed(3) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="tf-text-tertiary text-xs">Regression-Indicated Value</span>
                  <span className="text-sm font-bold tf-suite-accent-text">
                    {fmtCurrency(salesAPI.data.regressionIndicatedValue)}
                  </span>
                </div>
                {salesAPI.data.regressionBeta && salesAPI.data.regressionBeta.length === 4 && (
                  <div className="grid grid-cols-4 gap-2 text-xs tf-text-dim">
                    <div><span className="opacity-60">β₀</span> {salesAPI.data.regressionBeta[0].toFixed(0)}</div>
                    <div><span className="opacity-60">β_GLA</span> {salesAPI.data.regressionBeta[1].toFixed(2)}</div>
                    <div><span className="opacity-60">β_Lot</span> {salesAPI.data.regressionBeta[2].toFixed(2)}</div>
                    <div><span className="opacity-60">β_Year</span> {salesAPI.data.regressionBeta[3].toFixed(0)}</div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="tf-text-tertiary">Confidence:</span>
              <span className="tf-suite-accent-text font-semibold">{formatConfidence(salesAPI.data.confidence)}</span>
              <span className="tf-text-dim text-xs ml-auto">Source: {salesAPI.data.source}</span>
            </div>
          </div>
        )}
        {!salesAPI.loading && !salesAPI.data && salesAPI.error && (
          <div className="py-4 text-center" data-testid="sales-comparison-empty">
            <p className="tf-text-tertiary text-sm">No sales comparison data for tax year {taxYear}</p>
            <p className="tf-text-dim text-xs mt-1">{salesAPI.error.message}</p>
          </div>
        )}
      </BentoCard>

      {/* Full ComparableSalesPanel — existing 612-line component, no changes */}
      <ComparableSalesPanel
        onReconciledValue={(result) => {
          if (onValueIndicated && typeof result.weightedAverage === 'number') {
            onValueIndicated('sales', result.weightedAverage);
          }
        }}
      />

      {/* Governed Tool: Sales Comps Rationale */}
      <BentoCard title="&#127960; Sales Comps Rationale" variant="default">
        <p className="tf-text-tertiary text-sm mb-4">
          Comparable sales selection logic and similarity analysis
        </p>

        <div className="mb-4">
          <label htmlFor="comp-ids" className="block tf-text-secondary text-sm mb-2">
            Comp Parcel IDs (comma-separated)
          </label>
          <input
            id="comp-ids"
            type="text"
            value={compIds}
            onChange={(e) => setCompIds(e.target.value)}
            placeholder="e.g. 12345, 12346, 12347"
            className="w-full tf-input px-3 py-2"
          />
        </div>

        <button
          onClick={handleSalesComps}
          disabled={compsState.status === 'loading' || !compIds.trim()}
          className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4"
        >
          {compsState.status === 'loading' ? 'Analyzing...' : 'Analyze Comps'}
        </button>

        {compsState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Analyzing comparables...</span>
          </div>
        )}

        {compsState.status === 'success' && compsState.result && (
          <div className="space-y-3">
            <div className="tf-panel p-4">
              <p className="tf-text-secondary">{compsState.result.rationale}</p>
            </div>
            <div className="space-y-2">
              {compsState.result.comps.map((c) => (
                <div key={c.id} className="tf-panel p-3 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono tf-text text-sm">{c.id}</span>
                    <span className="text-sm font-semibold tf-suite-accent-text">
                      {Math.round(c.similarity * 100)}% match
                    </span>
                  </div>
                  {c.notes.length > 0 && (
                    <ul className="list-disc list-inside text-xs tf-text-dim">
                      {c.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {compsState.status === 'error' && compsState.error && (
          <ErrorDisplay
            error={{
              message: compsState.error.message,
              errorCode: compsState.error.code,
              correlationId: compsState.correlationId,
            }}
          />
        )}
      </BentoCard>
    </div>
  );
};

export default SalesComparison;
