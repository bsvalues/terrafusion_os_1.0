/**
 * forge/IncomeApproach.tsx
 *
 * Phase 1: Income Approach sub-tab.
 * Wraps existing IncomeValuationPanel (555 lines, no changes to that component).
 * Also hosts the run_income_valuation governed tool.
 *
 * Extracted from PropertyForge.tsx monolith.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { IncomeValuationPanel } from '../../../../components/workbench/IncomeValuationPanel';
import { DcfPanel } from '../../income/DcfPanel';
import { useIncomeApproach as useIncomeApproachAPI } from '../../../../hooks/forge/useForgeValuation';
import {
  type ForgeSubTabProps,
  type IncomeResult,
  type ToolState,
  fmtCurrency,
  formatCurrency,
  formatConfidence,
} from './types';

// ── NOI Waterfall types ──────────────────────────────────────
interface NoiInputs {
  grossRentalIncome: string;
  vacancyRate: string;
  creditLossRate: string;
  operatingExpenses: string;
  capRateOverride: string;
}

function computeNoi(inputs: NoiInputs) {
  const gri = parseFloat(inputs.grossRentalIncome) || 0;
  const vacancy = Math.min(Math.max(parseFloat(inputs.vacancyRate) || 0, 0), 100) / 100;
  const creditLoss = Math.min(Math.max(parseFloat(inputs.creditLossRate) || 0, 0), 100) / 100;
  const opex = parseFloat(inputs.operatingExpenses) || 0;
  const capRate = Math.max(parseFloat(inputs.capRateOverride) || 0, 0.01) / 100;

  const vacancyLoss = gri * vacancy;
  const creditLossAmt = gri * creditLoss;
  const egi = gri - vacancyLoss - creditLossAmt;
  const noi = egi - opex;
  const indicatedValue = capRate > 0 && noi > 0 ? noi / capRate : 0;

  return { gri, vacancyLoss, creditLossAmt, egi, opex, noi, indicatedValue, capRate };
}

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
  const [showDcf, setShowDcf] = useState(false);

  /* ── NOI Waterfall ──────────────────────────────────────── */
  const [noiInputs, setNoiInputs] = useState<NoiInputs>({
    grossRentalIncome: '',
    vacancyRate: '5',
    creditLossRate: '1',
    operatingExpenses: '',
    capRateOverride: '7.5',
  });
  const [lockConfirmed, setLockConfirmed] = useState(false);
  const [locked, setLocked] = useState(false);

  const waterfall = useMemo(() => computeNoi(noiInputs), [noiInputs]);

  const setNoiField = (field: keyof NoiInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoiInputs((prev) => ({ ...prev, [field]: e.target.value }));
    setLocked(false);
    setLockConfirmed(false);
  };

  const handleLockIncome = useCallback(() => {
    if (!lockConfirmed || waterfall.indicatedValue <= 0) return;
    onValueIndicated?.('income', waterfall.indicatedValue);
    onHistoryRecord({
      id: crypto.randomUUID(),
      toolId: 'lock_income_indication',
      status: 'success',
      correlationId: `income-lock-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date(),
      meta: {
        indicatedValue: waterfall.indicatedValue,
        noi: waterfall.noi,
        capRate: waterfall.capRate,
        taxYear,
      },
    });
    setLocked(true);
    setLockConfirmed(false);
  }, [lockConfirmed, waterfall, onValueIndicated, onHistoryRecord, taxYear]);

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
    <div className="space-y-4" style={{ overflow: 'hidden' }}>
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
            {/* Applicability notice */}
            {!incomeAPI.data.incomeApproachApplicable && (
              <div
                className="px-3 py-2 rounded text-xs"
                style={{ background: 'hsl(var(--tf-warning) / 0.10)', color: 'hsl(var(--tf-warning))' }}
              >
                Notice: Income approach may not be applicable — no income data on file. Residential properties typically use cost/sales approaches only.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">NOI</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(incomeAPI.data.netOperatingIncome)}</div>
                {incomeAPI.data.noiDerived && (
                  <div className="text-xs tf-text-dim mt-0.5">derived {incomeAPI.data.expenseRatio ? `(${((incomeAPI.data.expenseRatio ?? 0) * 100).toFixed(0)}% exp ratio assumed)` : ''}</div>
                )}
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Cap Rate</div>
                <div className="text-lg font-bold tf-text">{incomeAPI.data.capRate}%</div>
                {incomeAPI.data.capRateDefaulted && (
                  <div className="text-xs tf-text-dim mt-0.5">market default (assumed)</div>
                )}
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Valuation</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(incomeAPI.data.valuation)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">Gross Income</span>
                <span className="ml-2 font-mono tf-text">{fmtCurrency(incomeAPI.data.grossIncome)}</span>
              </div>
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">GIM</span>
                <span className="ml-2 font-mono tf-text">{(incomeAPI.data.grossIncomeMultiplier ?? 0).toFixed(2)}</span>
              </div>
              <div className="tf-panel p-3">
                <span className="tf-text-tertiary text-xs">Risk</span>
                <span className="ml-2 font-mono tf-text">{incomeAPI.data.riskClassification}</span>
              </div>
            </div>
            {/* Methodology disclosure */}
            {incomeAPI.data.methodologyNote && (
              <div
                className="px-3 py-2 rounded text-xs"
                style={{ background: 'hsl(var(--tf-info) / 0.08)', color: 'hsl(var(--tf-info))' }}
              >
                Methodology: {incomeAPI.data.methodologyNote.replace(/canonical record/gi, 'assessment records')}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="tf-text-tertiary">Confidence:</span>
              <span className="tf-suite-accent-text font-semibold">{formatConfidence(incomeAPI.data.confidence)}</span>
              <span className="tf-text-dim text-xs ml-auto">
                {!incomeAPI.data.incomeApproachApplicable
                  ? 'Income approach not applicable'
                  : `Source: ${incomeAPI.data.source}`}
              </span>
            </div>
          </div>
        )}
        {!incomeAPI.loading && !incomeAPI.data && incomeAPI.error && (
          <div className="py-4 text-center" data-testid="income-approach-empty">
            <p className="tf-text-tertiary text-sm">No income approach data for tax year {taxYear}</p>
            <p className="tf-text-dim text-xs mt-1">{incomeAPI.error.message}</p>
          </div>
        )}
      </BentoCard>

      {/* Full IncomeValuationPanel — existing 555-line component, no changes */}
      <IncomeValuationPanel taxYear={taxYear} />

      {/* NOI Waterfall — editable direct-cap build-up */}
      <BentoCard
        title="&#128200; NOI Waterfall — Direct Capitalization Build-up"
        variant="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="income-noi-waterfall">
          {/* Inputs column */}
          <div className="space-y-3">
            {(
              [
                { field: 'grossRentalIncome', label: 'Potential Gross Income ($)', placeholder: '120000' },
                { field: 'vacancyRate',        label: 'Vacancy Rate (%)',           placeholder: '5' },
                { field: 'creditLossRate',     label: 'Credit Loss Rate (%)',       placeholder: '1' },
                { field: 'operatingExpenses',  label: 'Operating Expenses ($)',     placeholder: '24000' },
                { field: 'capRateOverride',    label: 'Capitalization Rate (%)',    placeholder: '7.5' },
              ] as { field: keyof NoiInputs; label: string; placeholder: string }[]
            ).map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-1">
                <label htmlFor={`noi-${field}`} className="block tf-text-secondary text-xs">
                  {label}
                </label>
                <input
                  id={`noi-${field}`}
                  type="number"
                  min="0"
                  step={field === 'grossRentalIncome' || field === 'operatingExpenses' ? '1000' : '0.1'}
                  value={noiInputs[field]}
                  onChange={setNoiField(field)}
                  placeholder={placeholder}
                  className="w-full tf-input px-3 py-1.5 text-sm"
                  disabled={locked}
                />
              </div>
            ))}
          </div>

          {/* Waterfall column */}
          <div className="space-y-1.5 text-sm" data-testid="income-waterfall-steps">
            {[
              { label: 'Potential Gross Income',  value: waterfall.gri,            divider: false },
              { label: '  \u2013 Vacancy Loss',   value: -waterfall.vacancyLoss,   divider: false },
              { label: '  \u2013 Credit Loss',    value: -waterfall.creditLossAmt, divider: false },
              { label: 'Effective Gross Income',  value: waterfall.egi,            divider: true  },
              { label: '  \u2013 Oper. Expenses', value: -waterfall.opex,          divider: false },
            ].map(({ label, value, divider }) => (
              <div key={label} className={`flex justify-between ${divider ? 'border-t border-current/10 pt-1.5' : ''}`}>
                <span className="tf-text-tertiary">{label}</span>
                <span className={value < 0 ? 'text-amber-400' : 'tf-text'}>{fmtCurrency(Math.abs(value))}</span>
              </div>
            ))}
            <div className="border-t border-current/20 pt-2 flex justify-between font-semibold">
              <span className="tf-text">Net Operating Income</span>
              <span className={waterfall.noi < 0 ? 'text-destructive' : 'tf-suite-accent-text'}>
                {fmtCurrency(waterfall.noi)}
              </span>
            </div>
            <div className="flex justify-between text-xs tf-text-dim pt-1">
              <span>&#247; Cap Rate {(waterfall.capRate * 100).toFixed(2)}%</span>
            </div>
            <div className="border-t border-current/30 pt-2 flex justify-between text-base font-bold">
              <span className="tf-text">Income-Indicated Value</span>
              <span className="tf-suite-accent-text">{fmtCurrency(waterfall.indicatedValue)}</span>
            </div>

            {/* Human-gated lock */}
            <div
              className="mt-4 p-3 rounded-lg space-y-3"
              style={{ border: '1px solid hsl(var(--tf-border) / 0.2)', background: 'hsl(var(--tf-surface) / 0.5)' }}
              data-testid="income-lock-gate"
            >
              {locked ? (
                <div
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'hsl(var(--tf-success, 142 76% 52%))' }}
                >
                  <span>&#10003;</span>
                  <span>Income indication locked &mdash; {fmtCurrency(waterfall.indicatedValue)}</span>
                </div>
              ) : (
                <>
                  <label className="flex items-start gap-2 cursor-pointer text-xs tf-text-secondary">
                    <input
                      type="checkbox"
                      checked={lockConfirmed}
                      onChange={(e) => setLockConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-current"
                      disabled={waterfall.indicatedValue <= 0}
                      data-testid="income-lock-checkbox"
                    />
                    <span>
                      I confirm the income-indicated value of{' '}
                      <strong>{fmtCurrency(waterfall.indicatedValue)}</strong> is correct and
                      ready to carry into reconciliation.
                    </span>
                  </label>
                  <button
                    onClick={handleLockIncome}
                    disabled={!lockConfirmed || waterfall.indicatedValue <= 0}
                    className="w-full py-1.5 px-4 rounded-lg text-sm font-semibold transition-all tf-suite-forge-cta disabled:opacity-40"
                    data-testid="income-lock-btn"
                  >
                    Lock Income Indication
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Governed Tool: Quick Income Valuation */}
      <BentoCard title="&#128176; Quick Income Valuation" variant="default">
        <p className="tf-text-tertiary text-sm mb-4">
          Income capitalization estimate using entered rental income and a market-derived cap rate.
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
                  {(incomeState.result.grossIncomeMultiplier ?? 0).toFixed(2)}
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

      {/* Advanced: DCF Model (commercial properties) */}
      <BentoCard variant="default" title="">
        <button
          onClick={() => setShowDcf((v) => !v)}
          className="w-full flex items-center justify-between text-sm font-semibold tf-text-secondary hover:tf-text"
        >
          <span>&#128200; DCF Income Model — 10-Year Discounted Cash Flow</span>
          <span className="tf-text-dim text-xs font-normal">{showDcf ? 'Hide ▲' : 'Show ▼'} USPAP SR 1-4(c)</span>
        </button>
        {showDcf && (
          <div className="mt-4">
            <DcfPanel />
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default IncomeApproach;
