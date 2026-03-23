/**
 * forge/IncomeApproach.tsx
 *
 * Phase 1: Income Approach sub-tab.
 * Wraps existing IncomeValuationPanel (555 lines, no changes to that component).
 * Also hosts the run_income_valuation governed tool.
 *
 * Extracted from PropertyForge.tsx monolith.
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { IncomeValuationPanel } from '../../../../components/workbench/IncomeValuationPanel';
import { useIncomeApproach as useIncomeApproachAPI } from '../../../../hooks/forge/useForgeValuation';
import {
  type ForgeSubTabProps,
  type IncomeResult,
  type ToolState,
  fmtCurrency,
  formatCurrency,
  formatConfidence,
} from './types';

export const IncomeApproach: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
}) => {
  const { parcelId } = useWorkbenchTab();

  /* ── Live API data ──────────────────────────────────────── */
  const incomeAPI = useIncomeApproachAPI(parcelId, taxYear);

  const [rentalIncome, setRentalIncome] = useState<string>('');
  const [incomeState, setIncomeState] = useState<ToolState<IncomeResult>>({ status: 'idle' });

  /* ── run_income_valuation ─────────────────────────────── */

  const handleIncomeValuation = useCallback(async () => {
    const income = parseFloat(rentalIncome);
    if (!income || income <= 0) return;
    setIncomeState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'run_income_valuation',
        params: { county: 'benton', annualRentalIncome: income },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output)
          : response.result.output;
        setIncomeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({
          id: crypto.randomUUID(),
          toolId: 'run_income_valuation',
          status: 'success',
          correlationId: response.correlationId || 'unknown',
          timestamp: new Date(),
          meta: { income },
        });
        if (parsed.valuation !== undefined && parsed.valuation !== null && onValueIndicated) {
          onValueIndicated('income', parsed.valuation);
        }
      } else {
        setIncomeState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'INCOME_FAILED',
            message: response.error?.message || 'Income valuation failed',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setIncomeState({
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
  }, [parcelId, rentalIncome, onHistoryRecord, onValueIndicated]);

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Live Income Approach Data */}
      <BentoCard
        title="&#128176; Income Approach Summary"
        variant="default"
        actions={<WorkbenchSourceBadge source={incomeAPI.source} />}
      >
        {incomeAPI.loading && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Loading income approach data...</span>
          </div>
        )}
        {incomeAPI.data && (
          <div className="space-y-3" data-testid="income-approach-live">
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">NOI</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(incomeAPI.data.netOperatingIncome)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Cap Rate</div>
                <div className="text-lg font-bold tf-text">{incomeAPI.data.capRate}%</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Valuation</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(incomeAPI.data.valuation)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">GIM</span>
                <span className="ml-2 font-mono tf-text">{(incomeAPI.data.grossIncomeMultiplier ?? 0).toFixed(2)}</span>
              </div>
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">Risk</span>
                <span className="ml-2 font-mono tf-text">{incomeAPI.data.riskClassification}</span>
              </div>
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">Income Indicated</span>
                <span className="ml-2 font-mono tf-text">{fmtCurrency(incomeAPI.data.incomeIndicatedValue)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="tf-text-tertiary">Confidence:</span>
              <span className="tf-suite-accent-text font-semibold">{formatConfidence(incomeAPI.data.confidence)}</span>
              <span className="tf-text-dim text-xs ml-auto">Source: {incomeAPI.data.source}</span>
            </div>
          </div>
        )}
        {!incomeAPI.loading && !incomeAPI.data && incomeAPI.error && (
          <div className="py-4 text-center">
            <p className="tf-text-tertiary text-sm">Income approach data unavailable from API</p>
            <p className="tf-text-dim text-xs mt-1">{incomeAPI.error.message}</p>
          </div>
        )}
      </BentoCard>

      {/* Full IncomeValuationPanel — existing 555-line component, no changes */}
      <IncomeValuationPanel taxYear={taxYear} />

      {/* Governed Tool: Quick Income Valuation */}
      <BentoCard title="&#128176; Quick Income Valuation" variant="default">
        <p className="tf-text-tertiary text-sm mb-4">
          Income capitalization for commercial property valuation
        </p>

        <div className="mb-4">
          <label htmlFor="rental-income" className="block tf-text-secondary text-sm mb-2">
            Annual Rental Income ($)
          </label>
          <input
            id="rental-income"
            type="number"
            min="0"
            step="1000"
            value={rentalIncome}
            onChange={(e) => setRentalIncome(e.target.value)}
            placeholder="e.g. 120000"
            className="w-full tf-input px-3 py-2"
          />
        </div>

        <button
          onClick={handleIncomeValuation}
          disabled={incomeState.status === 'loading' || !rentalIncome}
          className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4"
        >
          {incomeState.status === 'loading' ? 'Calculating...' : 'Run Income Valuation'}
        </button>

        {incomeState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Running income approach...</span>
          </div>
        )}

        {incomeState.status === 'success' && incomeState.result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">NOI</div>
                <div className="text-lg font-bold tf-text">
                  {formatCurrency(incomeState.result.netOperatingIncome)}
                </div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Cap Rate</div>
                <div className="text-lg font-bold tf-text">{incomeState.result.capRate}%</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Valuation</div>
                <div className="text-lg font-bold tf-suite-accent-text">
                  {formatCurrency(incomeState.result.valuation)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">GIM</span>
                <span className="ml-2 font-mono tf-text">
                  {incomeState.result.grossIncomeMultiplier.toFixed(2)}
                </span>
              </div>
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">Risk</span>
                <span className="ml-2 font-mono tf-text">
                  {incomeState.result.riskClassification}
                </span>
              </div>
            </div>
            <div className="text-xs tf-text-dim">{incomeState.result.source}</div>
          </div>
        )}

        {incomeState.status === 'error' && incomeState.error && (
          <ErrorDisplay
            error={{
              message: incomeState.error.message,
              errorCode: incomeState.error.code,
              correlationId: incomeState.correlationId,
            }}
          />
        )}
      </BentoCard>
    </div>
  );
};

export default IncomeApproach;
