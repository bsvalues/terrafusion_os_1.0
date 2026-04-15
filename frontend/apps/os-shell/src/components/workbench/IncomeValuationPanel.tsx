/**
 * IncomeValuationPanel.tsx
 *
 * ADAPTER HOST — not greenfield.
 * Translates existing backend CostForge income-approach endpoints and
 * legacy archived income-module patterns into the Property Workbench Forge tab.
 *
 * Provenance:
 *   - Layout pattern: legacy income module (standalone suite surface)
 *   - NOI waterfall: legacy income module NOI Waterfall section
 *   - Cap rate visualization: legacy income module market range bar
 *   - Backend math: CostForge income-approach/calculate-noi + calculate-valuation
 *   - Expense structure: CostForge NoiCalculationRequest schema
 *   - Client preview: forgeService.ts calculateIncome() (deprecated, offline only)
 *
 * GUARDRAILS:
 *   - All NOI/valuation math stays in backend CostForge endpoints
 *   - Frontend only provides inputs and displays results
 *   - Client-side preview used ONLY when backend is unavailable
 *   - Graceful degradation with clear "preview only" labeling
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkbenchTab } from '../../context/workbenchTabContext';
import { usePropertyStore } from '../../stores/propertyStore';
import {
  calculateIncomeValuation,
  fetchValuationRecord,
  previewValuation,
  saveIncomeValuationRecord,
  totalExpenses,
  DEFAULT_EXPENSES,
  BENTON_LOCATIONS,
  INCOME_PROPERTY_TYPES,
  type IncomeExpenses,
  type IncomeValuationInput,
  type IncomeValuationResult,
} from '../../services/incomeValuationService';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtPct = (n: number) => n.toFixed(1) + '%';
const SUCCESS_COLOR = 'hsl(var(--tf-success))';
const SUCCESS_BG = 'hsl(var(--tf-success) / 0.1)';
const SUCCESS_BORDER = '1px solid hsl(var(--tf-success) / 0.2)';
const WARNING_COLOR = 'hsl(var(--tf-warning))';
const WARNING_BG = 'hsl(var(--tf-warning) / 0.1)';
const WARNING_BG_SUBTLE = 'hsl(var(--tf-warning) / 0.08)';
const WARNING_BORDER = '1px solid hsl(var(--tf-warning) / 0.2)';
const WARNING_BORDER_DASHED = '1px dashed hsl(var(--tf-warning) / 0.3)';
const ERROR_COLOR = 'hsl(var(--tf-error))';
const ERROR_BG = 'hsl(var(--tf-error) / 0.08)';
const ERROR_BORDER = '1px solid hsl(var(--tf-error) / 0.2)';

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/** NOI waterfall display */
const NoiWaterfall: React.FC<{
  pgi: number;
  vacancyLoss: number;
  otherIncome: number;
  egi: number;
  expenses: number;
  noi: number;
}> = ({ pgi, vacancyLoss, otherIncome, egi, expenses, noi }) => (
  <div className="space-y-1 text-xs">
    <div className="flex justify-between">
      <span style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>Potential Gross Income</span>
      <span className="font-mono" style={{ color: SUCCESS_COLOR }}>{fmt(pgi)}</span>
    </div>
    <div className="flex justify-between">
      <span style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>Less: Vacancy & Collection</span>
      <span className="font-mono" style={{ color: ERROR_COLOR }}>({fmt(vacancyLoss)})</span>
    </div>
    <div className="flex justify-between">
      <span style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>Plus: Other Income</span>
      <span className="font-mono" style={{ color: SUCCESS_COLOR }}>{fmt(otherIncome)}</span>
    </div>
    <div
      className="flex justify-between pt-1 mt-1 font-medium"
      style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}
    >
      <span style={{ color: 'hsl(var(--tf-text) / 0.8)' }}>Effective Gross Income</span>
      <span className="font-mono" style={{ color: 'hsl(var(--tf-text))' }}>{fmt(egi)}</span>
    </div>
    <div className="flex justify-between">
      <span style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>Less: Operating Expenses</span>
      <span className="font-mono" style={{ color: ERROR_COLOR }}>({fmt(expenses)})</span>
    </div>
    <div
      className="flex justify-between pt-1 mt-1 font-bold"
      style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}
    >
      <span style={{ color: 'hsl(var(--tf-text))' }}>Net Operating Income</span>
      <span
        className="font-mono"
        style={{ color: noi > 0 ? SUCCESS_COLOR : ERROR_COLOR }}
      >
        {fmt(noi)}
      </span>
    </div>
  </div>
);

/** Capitalization result display */
const CapitalizationResult: React.FC<{ result: IncomeValuationResult }> = ({ result }) => {
  const riskColor =
    result.riskClassification === 'low'
      ? SUCCESS_COLOR
      : result.riskClassification === 'medium'
        ? WARNING_COLOR
        : ERROR_COLOR;

  return (
    <div className="space-y-3">
      {/* NOI / Cap Rate = Value formula */}
      <div
        className="flex items-center justify-center gap-3 py-3 rounded"
        style={{
          background: 'hsl(var(--tf-accent) / 0.04)',
          border: '1px solid hsl(var(--tf-accent) / 0.15)',
        }}
      >
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>NOI</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'hsl(var(--tf-text))' }}>
            {fmt(result.netOperatingIncome)}
          </div>
        </div>
        <span className="text-lg" style={{ color: 'hsl(var(--tf-text) / 0.3)' }}>/</span>
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Cap Rate</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'hsl(var(--tf-text))' }}>
            {fmtPct(result.capRate)}
          </div>
        </div>
        <span style={{ color: 'hsl(var(--tf-accent) / 0.5)' }}>=</span>
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
            Indicated Value
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: 'hsl(var(--tf-accent))' }}>
            {fmt(result.adjustedValuation)}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>GIM</span>
          <span className="font-mono font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {result.grossIncomeMultiplier.toFixed(2)}x
          </span>
        </div>
        <div>
          <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Cash-on-Cash</span>
          <span className="font-mono font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
            {fmtPct(result.cashOnCashReturn)}
          </span>
        </div>
        <div>
          <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Location</span>
          <span style={{ color: 'hsl(var(--tf-text))' }}>
            {result.location} ({result.locationMultiplier}x)
          </span>
        </div>
        <div>
          <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Risk</span>
          <span
            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ background: `${riskColor}15`, color: riskColor }}
          >
            {result.riskClassification}
          </span>
        </div>
      </div>

      {/* Source */}
      <div className="text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.3)' }}>
        {result.source}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export interface IncomeValuationPanelProps {
  taxYear?: number;
}

export const IncomeValuationPanel: React.FC<IncomeValuationPanelProps> = ({
  taxYear = new Date().getFullYear(),
}) => {
  const { parcelId } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  // Income inputs
  const [annualRentalIncome, setAnnualRentalIncome] = useState(0);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [otherIncome, setOtherIncome] = useState(0);
  const [expenses, setExpenses] = useState<IncomeExpenses>(DEFAULT_EXPENSES);
  const [capRate, setCapRate] = useState(7.5);
  const [location, setLocation] = useState('Richland');
  const [propertyType, setPropertyType] = useState('300');

  // Result state
  const [result, setResult] = useState<IncomeValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Derive property type and location from parcel if available
  useEffect(() => {
    if (activeParcel?.propertyType) {
      const match = INCOME_PROPERTY_TYPES.find(
        (t) => t.code === activeParcel.propertyType,
      );
      if (match) setPropertyType(match.id);
    }
    if (activeParcel?.city) {
      const cityNorm = activeParcel.city.trim().toLowerCase();
      const locMatch = BENTON_LOCATIONS.find(
        (l) => l.id.toLowerCase() === cityNorm || l.label.toLowerCase() === cityNorm,
      );
      if (locMatch) setLocation(locMatch.id);
    }
  }, [activeParcel]);

  const updateExpense = useCallback((key: keyof IncomeExpenses, value: number) => {
    setExpenses((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildInput = useCallback((): IncomeValuationInput => ({
    annualRentalIncome,
    vacancyRate,
    otherIncome,
    expenses,
    capRate,
    location,
    propertyType,
  }), [annualRentalIncome, vacancyRate, otherIncome, expenses, capRate, location, propertyType]);

  // Computed NOI waterfall values (for live preview as user types)
  const waterfallPreview = useMemo(() => {
    const vacLoss = Math.round(annualRentalIncome * (vacancyRate / 100));
    const egi = annualRentalIncome - vacLoss + otherIncome;
    const expTotal = totalExpenses(expenses);
    const noi = egi - expTotal;
    return { pgi: annualRentalIncome, vacancyLoss: vacLoss, otherIncome, egi, expenses: expTotal, noi };
  }, [annualRentalIncome, vacancyRate, otherIncome, expenses]);

  /** Run valuation — try backend, fall back to preview */
  const handleCalculate = useCallback(async () => {
    if (annualRentalIncome <= 0) return;
    setLoading(true);
    setBackendError(null);
    setIsPreview(false);
    setRecordNotice(null);
    setRecordError(null);

    const input = buildInput();

    try {
      const backendResult = await calculateIncomeValuation(input);
      setResult(backendResult);

      if (parcelId) {
        try {
          const persisted = await saveIncomeValuationRecord({
            parcelId,
            taxYear,
            propertyType,
            incomeApproachValue: backendResult.adjustedValuation,
            incomeConfidence: backendResult.riskClassification,
            grossIncome: input.annualRentalIncome + input.otherIncome,
            vacancyRate: input.vacancyRate,
            operatingExpenses: totalExpenses(input.expenses),
            netOperatingIncome: backendResult.netOperatingIncome,
            capRate: backendResult.capRate,
            notes: `Income approach valuation (${backendResult.source})`,
          });

          await fetchValuationRecord(persisted.id);
          setRecordNotice(`Valuation record saved (${persisted.status})`);
        } catch {
          setRecordError('Valuation record could not be persisted or retrieved.');
        }
      }
    } catch {
      // Graceful degradation: use client-side preview
      setBackendError('Backend unavailable — showing client-side preview (not authoritative)');
      setIsPreview(true);
      setResult(previewValuation(input));
    } finally {
      setLoading(false);
    }
  }, [annualRentalIncome, buildInput, parcelId, propertyType, taxYear]);

  // No parcel context
  if (!parcelId && !activeParcel) {
    return (
      <div
        className="flex items-center justify-center h-32 text-sm"
        style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
      >
        Select a parcel to run income valuation
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ color: 'hsl(var(--tf-text))' }}>
      {/* Subject context bar */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-xs"
        style={{
          background: 'hsl(var(--tf-accent) / 0.06)',
          borderBottom: '1px solid hsl(var(--tf-border) / 0.15)',
          color: 'hsl(var(--tf-text) / 0.8)',
        }}
      >
        <span className="font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
          Income Approach: {activeParcel?.address || parcelId}
        </span>
        <span>USPAP Direct Capitalization</span>
        <span>Benton County FY 2025</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* LEFT — Inputs */}
        <div
          className="p-4 space-y-4"
          style={{ borderRight: '1px solid hsl(var(--tf-border) / 0.1)' }}
        >
          {/* Property + Location */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded"
                style={{
                  background: 'hsl(var(--tf-bg-surface) / 0.5)',
                  border: '1px solid hsl(var(--tf-border) / 0.2)',
                  color: 'hsl(var(--tf-text))',
                }}
              >
                {INCOME_PROPERTY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded"
                style={{
                  background: 'hsl(var(--tf-bg-surface) / 0.5)',
                  border: '1px solid hsl(var(--tf-border) / 0.2)',
                  color: 'hsl(var(--tf-text))',
                }}
              >
                {BENTON_LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gross Income */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
              Income
            </div>
            <div>
              <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                Annual Rental Income
              </label>
              <input
                type="number"
                value={annualRentalIncome}
                onChange={(e) => setAnnualRentalIncome(Number(e.target.value))}
                min={0}
                step={1000}
                className="w-full text-xs px-2 py-1 rounded font-mono"
                style={{
                  background: 'hsl(var(--tf-bg-surface) / 0.5)',
                  border: '1px solid hsl(var(--tf-border) / 0.2)',
                  color: 'hsl(var(--tf-text))',
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Vacancy %
                </label>
                <input
                  type="number"
                  value={vacancyRate}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.5}
                  className="w-full text-xs px-2 py-1 rounded font-mono"
                  style={{
                    background: 'hsl(var(--tf-bg-surface) / 0.5)',
                    border: '1px solid hsl(var(--tf-border) / 0.2)',
                    color: 'hsl(var(--tf-text))',
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Other Income
                </label>
                <input
                  type="number"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  min={0}
                  className="w-full text-xs px-2 py-1 rounded font-mono"
                  style={{
                    background: 'hsl(var(--tf-bg-surface) / 0.5)',
                    border: '1px solid hsl(var(--tf-border) / 0.2)',
                    color: 'hsl(var(--tf-text))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cap Rate */}
          <div>
            <label className="block text-[10px] mb-1" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
              Capitalization Rate (%)
            </label>
            <input
              type="number"
              value={capRate}
              onChange={(e) => setCapRate(Number(e.target.value))}
              min={0.1}
              max={25}
              step={0.1}
              className="w-full text-xs px-2 py-1 rounded font-mono"
              style={{
                background: 'hsl(var(--tf-bg-surface) / 0.5)',
                border: '1px solid hsl(var(--tf-border) / 0.2)',
                color: 'hsl(var(--tf-text))',
              }}
            />
          </div>
        </div>

        {/* CENTER — Expenses */}
        <div
          className="p-4 space-y-3"
          style={{ borderRight: '1px solid hsl(var(--tf-border) / 0.1)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
            Operating Expenses
          </div>
          {(
            [
              ['propertyTaxes', 'Property Taxes'],
              ['insurance', 'Insurance'],
              ['utilities', 'Utilities'],
              ['maintenance', 'Maintenance'],
              ['managementFees', 'Management'],
              ['replacementReserves', 'Reserves'],
              ['otherExpenses', 'Other'],
            ] as Array<[keyof IncomeExpenses, string]>
          ).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <label
                className="text-xs w-24 shrink-0"
                style={{ color: 'hsl(var(--tf-text) / 0.6)' }}
              >
                {label}
              </label>
              <input
                type="number"
                value={expenses[key]}
                onChange={(e) => updateExpense(key, Number(e.target.value))}
                min={0}
                step={500}
                className="flex-1 text-xs px-2 py-1 rounded font-mono"
                style={{
                  background: 'hsl(var(--tf-bg-surface) / 0.5)',
                  border: '1px solid hsl(var(--tf-border) / 0.2)',
                  color: 'hsl(var(--tf-text))',
                }}
              />
            </div>
          ))}

          <div
            className="flex justify-between text-xs pt-2"
            style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}
          >
            <span style={{ color: 'hsl(var(--tf-text) / 0.6)' }}>Total Expenses</span>
            <span className="font-mono font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
              {fmt(totalExpenses(expenses))}
            </span>
          </div>

          {/* NOI Waterfall (live preview) */}
          <div
            className="mt-3 pt-3"
            style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.1)' }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
            >
              NOI Waterfall
            </div>
            <NoiWaterfall {...waterfallPreview} />
          </div>
        </div>

        {/* RIGHT — Results */}
        <div className="p-4 space-y-4">
          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={loading || annualRentalIncome <= 0}
            className="w-full py-2 px-4 rounded text-xs font-semibold transition-colors"
            style={{
              background: loading ? 'hsl(var(--tf-accent) / 0.05)' : 'hsl(var(--tf-accent) / 0.1)',
              color: 'hsl(var(--tf-accent))',
              border: '1px solid hsl(var(--tf-accent) / 0.2)',
              opacity: loading || annualRentalIncome <= 0 ? 0.5 : 1,
            }}
          >
            {loading ? 'Calculating...' : 'Run Income Valuation'}
          </button>

          {/* Backend error / preview warning */}
          {backendError && (
            <div
              className="text-xs px-3 py-2 rounded"
              style={{
                background: WARNING_BG,
                color: WARNING_COLOR,
                border: WARNING_BORDER,
              }}
            >
              {backendError}
            </div>
          )}

          {recordNotice && (
            <div
              className="text-xs px-3 py-2 rounded"
              style={{
                background: SUCCESS_BG,
                color: SUCCESS_COLOR,
                border: SUCCESS_BORDER,
              }}
            >
              {recordNotice}
            </div>
          )}

          {recordError && (
            <div
              className="text-xs px-3 py-2 rounded"
              style={{
                background: ERROR_BG,
                color: ERROR_COLOR,
                border: ERROR_BORDER,
              }}
            >
              {recordError}
            </div>
          )}

          {/* Valuation result */}
          {result && (
            <>
              {isPreview && (
                <div
                  className="text-[10px] px-2 py-1 rounded text-center"
                  style={{
                    background: WARNING_BG_SUBTLE,
                    color: WARNING_COLOR,
                    border: WARNING_BORDER_DASHED,
                  }}
                >
                  Preview only — not authoritative
                </div>
              )}
              <CapitalizationResult result={result} />
            </>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div
              className="text-xs text-center py-8"
              style={{ color: 'hsl(var(--tf-text) / 0.3)' }}
            >
              Enter income data and run valuation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
