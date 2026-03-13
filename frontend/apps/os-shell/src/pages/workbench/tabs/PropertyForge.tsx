/**
 * PropertyForge.tsx
 *
 * Phase 5.4 + R2.8: Property Forge Tab - Valuation MWUX Slice
 * Real MWUX with governed tool invocations:
 * - explain_model_results: AI-powered valuation explanation
 * - explain_value_change: Year-over-year value change analysis
 * - compare_assessed_value_history: Multi-year value trend with narrative
 * - run_income_valuation: Income capitalization approach (NOI / cap rate)
 * - explain_model_inputs: Model input factor breakdown with PII flags
 * - summarize_sales_comps_rationale: Comp selection rationale + similarity
 * - run_valuation_model: Execute valuation model (write_high, requires confirmation)
 *
 * Architecture: UI → select params → governed tool → correlationId UX
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { invokeTool } from '../../../api/pilotApi';
import { ErrorDisplay } from '../../../components/errors/ErrorDisplay';
import {
    InvocationHistory,
    ParcelContextHeader,
    type InvocationRecord,
} from '../../../components/workbench';
import type { ErrorInfo } from '../../../hooks/useErrorHandler';
import { getEnv } from '../../../runtime/env';
import { usePropertyStore } from '../../../stores/propertyStore';
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

const fmtCurrency = (v: number) => (v ? `$${v.toLocaleString()}` : '—');

/** Current year for default selection */
const CURRENT_YEAR = new Date().getFullYear();

/** Available tax years */
const TAX_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

/** Audience options */
const AUDIENCES = [
  { value: 'internal', label: 'Internal Review', description: 'Detailed technical analysis' },
  { value: 'taxpayer', label: 'Taxpayer-Friendly', description: 'Plain language explanation' },
] as const;

type AudienceType = (typeof AUDIENCES)[number]['value'];

interface ValueDriver {
  factor: string;
  impact: string;
}

interface ExplanationResult {
  parcelId: string;
  taxYear?: number;
  compareToYear?: number;
  assessedValue?: number;
  marketValue?: number;
  explanation?: string;
  drivers?: ValueDriver[];
  confidence?: number;
}

interface ExplainState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: ExplanationResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Value change explanation from explain_value_change */
interface ValueChangeResult {
  parcelId: string;
  previousValue?: number;
  currentValue?: number;
  changeAmount?: number;
  changePercent?: number;
  explanation?: string;
  factors?: Array<{ name: string; contribution: string }>;
}

interface ValueChangeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: ValueChangeResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/** Assessed value history trend from compare_assessed_value_history */
interface ValueHistoryEntry { year: number; av: number; tv?: number }
interface ValueHistoryResult {
  trend: ValueHistoryEntry[];
  narrative?: string;
  flags?: string[];
}
type ToolState<T> = { status: 'idle' | 'loading' | 'success' | 'error'; result?: T; correlationId?: string; error?: ErrorInfo };

/** Income valuation from run_income_valuation */
interface IncomeResult {
  netOperatingIncome: number;
  capRate: number;
  valuation: number;
  grossIncomeMultiplier: number;
  riskClassification: string;
  source: string;
}

/** Model inputs from explain_model_inputs */
interface ModelInput { name: string; source: string; pii: boolean }
interface ModelInputsResult { inputs: ModelInput[]; summary: string }

/** Sales comps from summarize_sales_comps_rationale */
interface CompEntry { id: string; similarity: number; notes: string[] }
interface SalesCompsResult { rationale: string; comps: CompEntry[] }

/** Valuation model result from run_valuation_model (write_high) */
interface ValuationModelResult {
  parcelId: string;
  taxYear: number;
  modelType: string;
  estimatedValue: number;
  confidence: number;
  components: Record<string, number>;
  correlationId?: string;
}

/** Reason codes for write_high valuation */
const VALUATION_REASON_CODES = [
  { value: 'annual_certification', label: 'Annual Certification' },
  { value: 'market_adjustment', label: 'Market Adjustment' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'correction', label: 'Correction' },
] as const;

export const PropertyForge: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const assessments = usePropertyStore((s) => s.assessments);
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  const [taxYear, setTaxYear] = useState<number>(CURRENT_YEAR);
  const [audience, setAudience] = useState<AudienceType>('internal');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareToYear, setCompareToYear] = useState<number>(CURRENT_YEAR - 1);
  const [explainState, setExplainState] = useState<ExplainState>({ status: 'idle' });
  const [valueChangeState, setValueChangeState] = useState<ValueChangeState>({ status: 'idle' });
  const [historyState, setHistoryState] = useState<ToolState<ValueHistoryResult>>({ status: 'idle' });
  const [incomeState, setIncomeState] = useState<ToolState<IncomeResult>>({ status: 'idle' });
  const [modelInputsState, setModelInputsState] = useState<ToolState<ModelInputsResult>>({ status: 'idle' });
  const [compsState, setCompsState] = useState<ToolState<SalesCompsResult>>({ status: 'idle' });
  const [valuationState, setValuationState] = useState<ToolState<ValuationModelResult>>({ status: 'idle' });
  const [valuationModelType, setValuationModelType] = useState<'cost' | 'income' | 'sales'>('cost');
  const [valuationReasonCode, setValuationReasonCode] = useState<string>('annual_certification');
  const [valuationConfirmed, setValuationConfirmed] = useState(false);
  const [rentalIncome, setRentalIncome] = useState<string>('');
  const [modelId, setModelId] = useState<string>('cost-approach');
  const [compIds, setCompIds] = useState<string>('');
  const [history, setHistory] = useState<InvocationRecord[]>([]);

  const handleExplain = useCallback(async () => {
    setExplainState({ status: 'loading' });

    const params: Record<string, unknown> = {
      parcelId,
      taxYear,
      audience,
    };

    if (compareEnabled) {
      params.compareToYear = compareToYear;
    }

    try {
      const response = await invokeTool({
        toolId: 'explain_model_results',
        params,
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: ExplanationResult;
        try {
          parsed =
            typeof response.result.output === 'string'
              ? JSON.parse(response.result.output)
              : response.result.output;
        } catch {
          parsed = { parcelId };
        }

        setExplainState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'explain_model_results',
            status: 'success',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            meta: { year: taxYear, audience },
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        const errorInfo: ErrorInfo = {
          code: response.error?.code || 'EXPLAIN_FAILED',
          message: response.error?.message || 'Failed to explain valuation model results',
          severity: 'error' as const,
          correlationId: response.correlationId,
        };

        setExplainState({
          status: 'error',
          correlationId: response.correlationId,
          error: errorInfo,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'explain_model_results',
            status: 'error',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            errorCode: response.error?.code || 'EXPLAIN_FAILED',
            meta: { year: taxYear, audience },
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      const clientCorrelationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred',
        severity: 'error' as const,
        correlationId: clientCorrelationId,
      };

      setExplainState({
        status: 'error',
        correlationId: clientCorrelationId,
        error: networkError,
      });

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          toolId: 'explain_model_results',
          status: 'error',
          correlationId: clientCorrelationId,
          timestamp: new Date(),
          errorCode: 'NETWORK_ERROR',
          meta: { year: taxYear, audience },
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [parcelId, taxYear, audience, compareEnabled, compareToYear]);

  /** Invoke explain_value_change — year-over-year value change analysis */
  const handleValueChange = useCallback(async () => {
    setValueChangeState({ status: 'loading' });

    try {
      const response = await invokeTool({
        toolId: 'explain_value_change',
        params: { county: 'benton', parcelId, taxYear },
        parcelId,
      });

      if (response.success && response.result) {
        let parsed: ValueChangeResult;
        try {
          parsed =
            typeof response.result.output === 'string'
              ? JSON.parse(response.result.output)
              : response.result.output;
        } catch {
          parsed = { parcelId };
        }

        setValueChangeState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'explain_value_change',
            status: 'success',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            meta: { year: taxYear },
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        const errorInfo: ErrorInfo = {
          code: response.error?.code || 'VALUE_CHANGE_FAILED',
          message: response.error?.message || 'Failed to explain value change',
          severity: 'error' as const,
          correlationId: response.correlationId,
        };

        setValueChangeState({
          status: 'error',
          correlationId: response.correlationId,
          error: errorInfo,
        });

        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            toolId: 'explain_value_change',
            status: 'error',
            correlationId: response.correlationId || 'unknown',
            timestamp: new Date(),
            errorCode: response.error?.code || 'VALUE_CHANGE_FAILED',
            meta: { year: taxYear },
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      const clientCorrelationId = `net-${crypto.randomUUID().slice(0, 8)}`;
      const networkError: ErrorInfo = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error occurred',
        severity: 'error' as const,
        correlationId: clientCorrelationId,
      };

      setValueChangeState({
        status: 'error',
        correlationId: clientCorrelationId,
        error: networkError,
      });

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          toolId: 'explain_value_change',
          status: 'error',
          correlationId: clientCorrelationId,
          timestamp: new Date(),
          errorCode: 'NETWORK_ERROR',
          meta: { year: taxYear },
        },
        ...prev.slice(0, 9),
      ]);
    }
  }, [parcelId, taxYear]);

  /** Invoke compare_assessed_value_history — multi-year value trend */
  const handleValueHistory = useCallback(async () => {
    setHistoryState({ status: 'loading' });
    try {
      const years = TAX_YEARS.slice(0, 5);
      const response = await invokeTool({ toolId: 'compare_assessed_value_history', params: { county: 'benton', parcelId, years, includeBreakdown: true }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setHistoryState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'compare_assessed_value_history', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { years: years.length } }, ...prev.slice(0, 19)]);
      } else {
        setHistoryState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'HISTORY_FAILED', message: response.error?.message || 'Failed to fetch value history', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setHistoryState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId]);

  /** Invoke run_income_valuation — income capitalization approach */
  const handleIncomeValuation = useCallback(async () => {
    const income = parseFloat(rentalIncome);
    if (!income || income <= 0) return;
    setIncomeState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'run_income_valuation', params: { county: 'benton', annualRentalIncome: income }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setIncomeState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'run_income_valuation', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { income } }, ...prev.slice(0, 19)]);
      } else {
        setIncomeState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'INCOME_FAILED', message: response.error?.message || 'Income valuation failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setIncomeState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, rentalIncome]);

  /** Invoke explain_model_inputs — model factor breakdown */
  const handleModelInputs = useCallback(async () => {
    setModelInputsState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'explain_model_inputs', params: { county: 'benton', modelId, asOfYear: taxYear }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setModelInputsState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'explain_model_inputs', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { modelId } }, ...prev.slice(0, 19)]);
      } else {
        setModelInputsState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'MODEL_INPUTS_FAILED', message: response.error?.message || 'Model inputs lookup failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setModelInputsState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, modelId, taxYear]);

  /** Invoke summarize_sales_comps_rationale — comp analysis */
  const handleSalesComps = useCallback(async () => {
    const ids = compIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    setCompsState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'summarize_sales_comps_rationale', params: { county: 'benton', subjectId: parcelId, compIds: ids, adjustments: true }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setCompsState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'summarize_sales_comps_rationale', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { comps: ids.length } }, ...prev.slice(0, 19)]);
      } else {
        setCompsState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'COMPS_FAILED', message: response.error?.message || 'Sales comps analysis failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setCompsState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    }
  }, [parcelId, compIds]);

  /** Invoke run_valuation_model — write_high, requires confirmation */
  const handleRunValuation = useCallback(async () => {
    if (!valuationConfirmed) return;
    setValuationState({ status: 'loading' });
    try {
      const response = await invokeTool({ toolId: 'run_valuation_model', params: { county: 'benton', parcelId, taxYear, modelType: valuationModelType, reasonCode: valuationReasonCode }, parcelId });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string' ? JSON.parse(response.result.output) : response.result.output;
        setValuationState({ status: 'success', result: parsed, correlationId: response.correlationId });
        setHistory(prev => [{ id: crypto.randomUUID(), toolId: 'run_valuation_model', status: 'success', correlationId: response.correlationId || 'unknown', timestamp: new Date(), meta: { modelType: valuationModelType, reason: valuationReasonCode } }, ...prev.slice(0, 19)]);
      } else {
        setValuationState({ status: 'error', correlationId: response.correlationId, error: { code: response.error?.code || 'VALUATION_FAILED', message: response.error?.message || 'Valuation model run failed', severity: 'error', correlationId: response.correlationId } });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setValuationState({ status: 'error', correlationId: cid, error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error', severity: 'error', correlationId: cid } });
    } finally {
      setValuationConfirmed(false);
    }
  }, [parcelId, taxYear, valuationModelType, valuationReasonCode, valuationConfirmed]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const formatCurrency = (value: number | undefined) =>
    value !== undefined ? `$${value.toLocaleString()}` : 'N/A';

  const formatConfidence = (value: number | undefined) =>
    value !== undefined ? `${Math.round(value * 100)}%` : 'N/A';

  const isDev = getEnv('MODE') === 'development';

  return (
    <div className='tf-suite-forge space-y-6' data-testid='property-forge-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🔥'
        title='TerraForge'
        parcelId={parcelId}
        subtitle={`AI-powered valuation analysis for ${parcelId}`}
      />

      {/* Valuation Context from Store */}
      {(activeParcel || assessments.length > 0) && (
        <BentoGrid columns={4} gap={0.75} padding={0}>
          {activeParcel && (
            <BentoCard variant="stat" title="Current Market Value">
              <p className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-transcend-cyan-hs) 70%)' }}>
                {fmtCurrency(activeParcel.marketValue)}
              </p>
            </BentoCard>
          )}
          {activeParcel && (
            <BentoCard variant="stat" title="Current Assessed">
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

      {/* Main Content Grid */}
      <BentoGrid columns={3} gap={1.5} padding={0}>
        {/* Controls Panel */}
        <BentoCard variant="form" title="Valuation Parameters" actions={<span>⚙️</span>}>

          {/* Tax Year Selector */}
          <div className='mb-4'>
            <label htmlFor='tax-year' className='block tf-text-secondary text-sm mb-2'>
              Tax Year
            </label>
            <select
              id='tax-year'
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className='w-full tf-input px-3 py-2'
            >
              {TAX_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Audience Selector */}
          <div className='mb-4'>
            <label htmlFor='audience' className='block tf-text-secondary text-sm mb-2'>
              Audience
            </label>
            <select
              id='audience'
              value={audience}
              onChange={(e) => setAudience(e.target.value as AudienceType)}
              className='w-full tf-input px-3 py-2'
            >
              {AUDIENCES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className='tf-text-dim text-xs mt-1'>
              {AUDIENCES.find((a) => a.value === audience)?.description}
            </p>
          </div>

          {/* Compare Toggle */}
          <div className='mb-4'>
            <button
              data-testid='compare-year-toggle'
              onClick={() => setCompareEnabled(!compareEnabled)}
              className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-all ${
                compareEnabled
                  ? 'tf-suite-active'
                  : 'tf-panel tf-text-secondary tf-hover-surface'
              }`}
            >
              <span>{compareEnabled ? '📊' : '📈'}</span>
              <span>Year-over-Year Comparison</span>
              {compareEnabled && <span className='ml-auto tf-suite-accent-text'>✓</span>}
            </button>
          </div>

          {/* Compare Year Selector (conditional) */}
          {compareEnabled && (
            <div className='mb-4'>
              <label htmlFor='compare-year' className='block tf-text-secondary text-sm mb-2'>
                Compare to Year
              </label>
              <select
                id='compare-year'
                value={compareToYear}
                onChange={(e) => setCompareToYear(Number(e.target.value))}
                className='w-full tf-input px-3 py-2'
              >
                {TAX_YEARS.filter((y) => y !== taxYear).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Explain Button */}
          <button
            onClick={handleExplain}
            disabled={explainState.status === 'loading'}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
              explainState.status === 'loading'
                ? 'tf-suite-forge-cta' /* disabled state handled by :disabled */
                : 'tf-suite-forge-cta'
            }`}
          >
            {explainState.status === 'loading' ? 'Analyzing...' : 'Explain Valuation'}
          </button>
        </BentoCard>

        {/* Results Panel */}
        <BentoCard span="2x1">
          {explainState.status === 'loading' ? (
            <div role='status' className='flex flex-col items-center justify-center py-12 gap-3'>
              <div className='tf-spinner h-10 w-10' />
              <span className='tf-text-tertiary'>Analyzing valuation model...</span>
            </div>
          ) : explainState.status === 'success' && explainState.result ? (
            <div className='space-y-4'>
              {/* Value Summary */}
              <div className='flex items-center justify-between mb-3'>
                <h4 className='tf-suite-accent-text font-semibold flex items-center gap-2'>
                  <span>✅</span> Valuation Explanation
                </h4>
                {explainState.correlationId && (
                  <div className='flex items-center gap-2 text-xs'>
                    <span className='tf-text-muted'>ID:</span>
                    <code className='tf-suite-accent-text font-mono'>
                      {explainState.correlationId.slice(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(explainState.correlationId!)}
                      className='tf-text-tertiary hover:tf-text'
                      aria-label='Copy correlation ID'
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>

              {/* Value Cards */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Assessed Value</div>
                  <div className='text-2xl font-bold tf-text'>
                    {formatCurrency(explainState.result.assessedValue)}
                  </div>
                </div>
                <div className='tf-panel p-4'>
                  <div className='tf-text-tertiary text-sm'>Market Value</div>
                  <div className='text-2xl font-bold tf-text'>
                    {formatCurrency(explainState.result.marketValue)}
                  </div>
                </div>
              </div>

              {/* Explanation Text */}
              {explainState.result.explanation && (
                <div className='tf-panel p-4'>
                  <h5 className='tf-text font-medium mb-2' style={{ opacity: 0.8 }}>📝 Explanation</h5>
                  <p className='tf-text-secondary'>{explainState.result.explanation}</p>
                </div>
              )}

              {/* Drivers */}
              {explainState.result.drivers && explainState.result.drivers.length > 0 && (
                <div className='tf-panel p-4'>
                  <h5 className='tf-text font-medium mb-3' style={{ opacity: 0.8 }}>📊 Value Drivers</h5>
                  <div className='space-y-2'>
                    {explainState.result.drivers.map((driver, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between py-2 px-3 tf-panel rounded'
                      >
                        <span className='tf-text-secondary'>{driver.factor}</span>
                        <span
                          className='font-mono'
                          style={{
                            color: driver.impact.startsWith('+')
                              ? 'hsl(var(--tf-success))'
                              : driver.impact.startsWith('-')
                                ? 'hsl(var(--tf-error))'
                                : 'hsl(var(--tf-text) / 0.7)',
                          }}
                        >
                          {driver.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {explainState.result.confidence !== undefined && (
                <div className='flex items-center gap-3 text-sm'>
                  <span className='tf-text-tertiary'>Model Confidence:</span>
                  <span className='tf-suite-accent-text font-semibold'>
                    {formatConfidence(explainState.result.confidence)}
                  </span>
                </div>
              )}

              {/* Dev Info */}
              {isDev && explainState.correlationId && (
                <div className='text-xs tf-text-dim border-t tf-border pt-3'>
                  <details>
                    <summary className='cursor-pointer tf-hover-surface'>Developer Info</summary>
                    <pre className='mt-2 tf-overlay rounded p-2 overflow-x-auto'>
                      pnpm run trace:query --correlation {explainState.correlationId}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : explainState.status === 'idle' ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='text-4xl mb-2'>🔥</div>
              <p className='tf-text-tertiary'>Configure parameters and click Explain Valuation</p>
              <p className='tf-text-dim text-sm mt-1'>
                Get AI-powered analysis of valuation model results
              </p>
            </div>
          ) : null}
        </BentoCard>
      </BentoGrid>

      {/* Error Display */}
      {explainState.status === 'error' && explainState.error && (
        <ErrorDisplay
          error={{
            message: explainState.error.message,
            errorCode: explainState.error.code,
            correlationId: explainState.correlationId,
          }}
        />
      )}

      {/* Value Change Analysis */}
      <BentoCard title='📈 Value Change Analysis' variant='default'>
        <p className='tf-text-tertiary text-sm mb-4'>
          Year-over-year value change breakdown for {parcelId}
        </p>
        <button
          onClick={handleValueChange}
          disabled={valueChangeState.status === 'loading'}
          className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4'
        >
          {valueChangeState.status === 'loading' ? 'Analyzing...' : `Explain Value Change (${taxYear})`}
        </button>

        {valueChangeState.status === 'loading' && (
          <div role='status' className='flex items-center justify-center py-6 gap-3'>
            <div className='tf-spinner h-8 w-8' />
            <span className='tf-text-tertiary'>Analyzing value changes...</span>
          </div>
        )}

        {valueChangeState.status === 'success' && valueChangeState.result && (
          <div className='space-y-4'>
            {/* Value comparison */}
            <div className='grid grid-cols-3 gap-3'>
              <div className='tf-panel p-3 text-center'>
                <div className='tf-text-tertiary text-xs'>Previous</div>
                <div className='text-lg font-bold tf-text'>
                  {formatCurrency(valueChangeState.result.previousValue)}
                </div>
              </div>
              <div className='tf-panel p-3 text-center'>
                <div className='tf-text-tertiary text-xs'>Current</div>
                <div className='text-lg font-bold tf-text'>
                  {formatCurrency(valueChangeState.result.currentValue)}
                </div>
              </div>
              <div className='tf-panel p-3 text-center'>
                <div className='tf-text-tertiary text-xs'>Change</div>
                <div
                  className='text-lg font-bold'
                  style={{
                    color:
                      (valueChangeState.result.changeAmount ?? 0) > 0
                        ? 'hsl(var(--tf-success))'
                        : (valueChangeState.result.changeAmount ?? 0) < 0
                          ? 'hsl(var(--tf-error))'
                          : 'hsl(var(--tf-text) / 0.7)',
                  }}
                >
                  {formatCurrency(valueChangeState.result.changeAmount)}
                  {valueChangeState.result.changePercent !== undefined && (
                    <span className='text-sm ml-1'>
                      ({valueChangeState.result.changePercent > 0 ? '+' : ''}
                      {valueChangeState.result.changePercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation */}
            {valueChangeState.result.explanation && (
              <div className='tf-panel p-4'>
                <h5 className='tf-text font-medium mb-2' style={{ opacity: 0.8 }}>📝 Change Explanation</h5>
                <p className='tf-text-secondary'>{valueChangeState.result.explanation}</p>
              </div>
            )}

            {/* Contributing Factors */}
            {valueChangeState.result.factors && valueChangeState.result.factors.length > 0 && (
              <div className='tf-panel p-4'>
                <h5 className='tf-text font-medium mb-3' style={{ opacity: 0.8 }}>📊 Contributing Factors</h5>
                <div className='space-y-2'>
                  {valueChangeState.result.factors.map((f, idx) => (
                    <div key={idx} className='flex items-center justify-between py-2 px-3 tf-panel rounded'>
                      <span className='tf-text-secondary'>{f.name}</span>
                      <span className='font-mono tf-text-tertiary'>{f.contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlation ID */}
            {valueChangeState.correlationId && (
              <div className='flex items-center gap-2 text-xs'>
                <span className='tf-text-muted'>ID:</span>
                <code className='tf-suite-accent-text font-mono'>
                  {valueChangeState.correlationId.slice(0, 16)}...
                </code>
                <button
                  onClick={() => copyToClipboard(valueChangeState.correlationId!)}
                  className='tf-text-tertiary hover:tf-text'
                  aria-label='Copy correlation ID'
                >
                  📋
                </button>
              </div>
            )}
          </div>
        )}

        {valueChangeState.status === 'error' && valueChangeState.error && (
          <ErrorDisplay
            error={{
              message: valueChangeState.error.message,
              errorCode: valueChangeState.error.code,
              correlationId: valueChangeState.correlationId,
            }}
          />
        )}
      </BentoCard>

      {/* Value History Trend */}
      <BentoCard title='📊 Value History Trend' variant='default'>
        <p className='tf-text-tertiary text-sm mb-4'>
          Multi-year assessed value comparison for {parcelId}
        </p>
        <button onClick={handleValueHistory} disabled={historyState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4'>
          {historyState.status === 'loading' ? 'Loading...' : 'Compare Value History'}
        </button>
        {historyState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Fetching history...</span></div>}
        {historyState.status === 'success' && historyState.result && (
          <div className='space-y-4'>
            <div className='grid grid-cols-5 gap-2'>
              {historyState.result.trend.map(t => (
                <div key={t.year} className='tf-panel p-3 text-center'>
                  <div className='tf-text-tertiary text-xs'>{t.year}</div>
                  <div className='text-sm font-bold tf-text'>{formatCurrency(t.av)}</div>
                  {t.tv !== undefined && <div className='text-xs tf-text-dim'>Tax: {formatCurrency(t.tv)}</div>}
                </div>
              ))}
            </div>
            {historyState.result.narrative && <div className='tf-panel p-4'><p className='tf-text-secondary text-sm'>{historyState.result.narrative}</p></div>}
            {historyState.result.flags && historyState.result.flags.length > 0 && (
              <div className='flex gap-2 flex-wrap'>{historyState.result.flags.map(f => <span key={f} className='text-xs tf-panel px-2 py-1 rounded'>{f}</span>)}</div>
            )}
          </div>
        )}
        {historyState.status === 'error' && historyState.error && <ErrorDisplay error={{ message: historyState.error.message, errorCode: historyState.error.code, correlationId: historyState.correlationId }} />}
      </BentoCard>

      {/* Income Approach */}
      <BentoCard title='💰 Income Approach' variant='default'>
        <p className='tf-text-tertiary text-sm mb-4'>Income capitalization for commercial property valuation</p>
        <div className='mb-4'>
          <label htmlFor='rental-income' className='block tf-text-secondary text-sm mb-2'>Annual Rental Income ($)</label>
          <input id='rental-income' type='number' min='0' step='1000' value={rentalIncome} onChange={e => setRentalIncome(e.target.value)} placeholder='e.g. 120000' className='w-full tf-input px-3 py-2' />
        </div>
        <button onClick={handleIncomeValuation} disabled={incomeState.status === 'loading' || !rentalIncome} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4'>
          {incomeState.status === 'loading' ? 'Calculating...' : 'Run Income Valuation'}
        </button>
        {incomeState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Running income approach...</span></div>}
        {incomeState.status === 'success' && incomeState.result && (
          <div className='space-y-3'>
            <div className='grid grid-cols-3 gap-3'>
              <div className='tf-panel p-3 text-center'><div className='tf-text-tertiary text-xs'>NOI</div><div className='text-lg font-bold tf-text'>{formatCurrency(incomeState.result.netOperatingIncome)}</div></div>
              <div className='tf-panel p-3 text-center'><div className='tf-text-tertiary text-xs'>Cap Rate</div><div className='text-lg font-bold tf-text'>{incomeState.result.capRate}%</div></div>
              <div className='tf-panel p-3 text-center'><div className='tf-text-tertiary text-xs'>Valuation</div><div className='text-lg font-bold tf-suite-accent-text'>{formatCurrency(incomeState.result.valuation)}</div></div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='tf-panel p-3'><span className='tf-text-tertiary text-xs'>GIM</span><span className='ml-2 font-mono tf-text'>{incomeState.result.grossIncomeMultiplier.toFixed(2)}</span></div>
              <div className='tf-panel p-3'><span className='tf-text-tertiary text-xs'>Risk</span><span className='ml-2 font-mono tf-text'>{incomeState.result.riskClassification}</span></div>
            </div>
            <div className='text-xs tf-text-dim'>{incomeState.result.source}</div>
          </div>
        )}
        {incomeState.status === 'error' && incomeState.error && <ErrorDisplay error={{ message: incomeState.error.message, errorCode: incomeState.error.code, correlationId: incomeState.correlationId }} />}
      </BentoCard>

      {/* Model Inputs */}
      <BentoCard title='🔍 Model Inputs' variant='default'>
        <p className='tf-text-tertiary text-sm mb-4'>Valuation model factor breakdown with PII flagging</p>
        <div className='mb-4'>
          <label htmlFor='model-id' className='block tf-text-secondary text-sm mb-2'>Model</label>
          <select id='model-id' value={modelId} onChange={e => setModelId(e.target.value)} className='w-full tf-input px-3 py-2'>
            <option value='cost-approach'>Cost Approach</option>
            <option value='income-approach'>Income Approach</option>
            <option value='sales-comparison'>Sales Comparison</option>
          </select>
        </div>
        <button onClick={handleModelInputs} disabled={modelInputsState.status === 'loading'} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4'>
          {modelInputsState.status === 'loading' ? 'Loading...' : `Explain Inputs (${taxYear})`}
        </button>
        {modelInputsState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Loading model inputs...</span></div>}
        {modelInputsState.status === 'success' && modelInputsState.result && (
          <div className='space-y-3'>
            <p className='tf-text-secondary text-sm'>{modelInputsState.result.summary}</p>
            <div className='space-y-1'>
              {modelInputsState.result.inputs.map((inp, idx) => (
                <div key={idx} className='flex items-center justify-between py-2 px-3 tf-panel rounded'>
                  <span className='tf-text-secondary'>{inp.name}</span>
                  <span className='flex items-center gap-2'>
                    <span className='text-xs tf-text-dim'>{inp.source}</span>
                    {inp.pii && <span className='text-xs px-1.5 py-0.5 rounded' style={{ background: 'hsl(var(--tf-error) / 0.15)', color: 'hsl(var(--tf-error))' }}>PII</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {modelInputsState.status === 'error' && modelInputsState.error && <ErrorDisplay error={{ message: modelInputsState.error.message, errorCode: modelInputsState.error.code, correlationId: modelInputsState.correlationId }} />}
      </BentoCard>

      {/* Sales Comps */}
      <BentoCard title='🏘️ Sales Comps Rationale' variant='default'>
        <p className='tf-text-tertiary text-sm mb-4'>Comparable sales selection logic and similarity analysis</p>
        <div className='mb-4'>
          <label htmlFor='comp-ids' className='block tf-text-secondary text-sm mb-2'>Comp Parcel IDs (comma-separated)</label>
          <input id='comp-ids' type='text' value={compIds} onChange={e => setCompIds(e.target.value)} placeholder='e.g. 12345, 12346, 12347' className='w-full tf-input px-3 py-2' />
        </div>
        <button onClick={handleSalesComps} disabled={compsState.status === 'loading' || !compIds.trim()} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4'>
          {compsState.status === 'loading' ? 'Analyzing...' : 'Analyze Comps'}
        </button>
        {compsState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Analyzing comparables...</span></div>}
        {compsState.status === 'success' && compsState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'><p className='tf-text-secondary'>{compsState.result.rationale}</p></div>
            <div className='space-y-2'>
              {compsState.result.comps.map(c => (
                <div key={c.id} className='tf-panel p-3 rounded'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='font-mono tf-text text-sm'>{c.id}</span>
                    <span className='text-sm font-semibold tf-suite-accent-text'>{Math.round(c.similarity * 100)}% match</span>
                  </div>
                  {c.notes.length > 0 && <ul className='list-disc list-inside text-xs tf-text-dim'>{c.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
                </div>
              ))}
            </div>
          </div>
        )}
        {compsState.status === 'error' && compsState.error && <ErrorDisplay error={{ message: compsState.error.message, errorCode: compsState.error.code, correlationId: compsState.correlationId }} />}
      </BentoCard>

      {/* Run Valuation Model (write_high) */}
      <BentoCard title='🏗️ Run Valuation Model' actions={<span className='text-xs tf-badge-error px-2 py-0.5 rounded'>write_high</span>}>
        <p className='tf-text-tertiary text-sm mb-3'>Execute a valuation model for parcel {parcelId} — requires confirmation</p>
        <div className='space-y-3 mb-4'>
          <div>
            <label htmlFor='valuation-model-type' className='block tf-text-secondary text-sm mb-1'>Model Type</label>
            <select id='valuation-model-type' value={valuationModelType} onChange={e => setValuationModelType(e.target.value as 'cost' | 'income' | 'sales')} className='w-full tf-input px-3 py-2'>
              <option value='cost'>Cost Approach</option>
              <option value='income'>Income Approach</option>
              <option value='sales'>Sales Comparison</option>
            </select>
          </div>
          <div>
            <label htmlFor='valuation-reason' className='block tf-text-secondary text-sm mb-1'>Reason Code</label>
            <select id='valuation-reason' value={valuationReasonCode} onChange={e => setValuationReasonCode(e.target.value)} className='w-full tf-input px-3 py-2'>
              {VALUATION_REASON_CODES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className='tf-panel p-3 rounded-lg border-l-4' style={{ borderLeftColor: 'hsl(var(--tf-warning))' }}>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input type='checkbox' checked={valuationConfirmed} onChange={e => setValuationConfirmed(e.target.checked)} className='h-4 w-4' data-testid='valuation-confirm-checkbox' />
              <span className='text-sm tf-text'>I confirm this write_high operation: run <strong>{valuationModelType}</strong> model for tax year <strong>{taxYear}</strong></span>
            </label>
          </div>
        </div>
        <button onClick={handleRunValuation} disabled={valuationState.status === 'loading' || !valuationConfirmed} className='w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4 disabled:opacity-50'>
          {valuationState.status === 'loading' ? 'Running Model...' : valuationConfirmed ? 'Run Valuation Model' : '⚠️ Confirm Above to Enable'}
        </button>
        {valuationState.status === 'loading' && <div role='status' className='flex items-center justify-center py-6 gap-3'><div className='tf-spinner h-8 w-8' /><span className='tf-text-tertiary'>Running valuation model...</span></div>}
        {valuationState.status === 'success' && valuationState.result && (
          <div className='space-y-3'>
            <div className='tf-panel p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-2xl font-bold tf-suite-accent-text'>{formatCurrency(valuationState.result.estimatedValue)}</span>
                <span className='text-sm tf-badge px-2 py-0.5 rounded'>{valuationState.result.modelType}</span>
              </div>
              <div className='text-sm tf-text-secondary'>Confidence: {formatConfidence(valuationState.result.confidence)} | Year: {valuationState.result.taxYear}</div>
            </div>
            {valuationState.result.components && Object.keys(valuationState.result.components).length > 0 && (
              <div className='space-y-1'>
                {Object.entries(valuationState.result.components).map(([key, val]) => (
                  <div key={key} className='flex items-center justify-between py-2 px-3 tf-panel rounded'>
                    <span className='tf-text-secondary capitalize'>{key.replace(/_/g, ' ')}</span>
                    <span className='font-semibold tf-text'>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            )}
            {valuationState.correlationId && <div className='text-xs tf-text-dim'>ID: <code className='tf-suite-accent-text font-mono'>{valuationState.correlationId.slice(0, 16)}...</code></div>}
          </div>
        )}
        {valuationState.status === 'error' && valuationState.error && <ErrorDisplay error={{ message: valuationState.error.message, errorCode: valuationState.error.code, correlationId: valuationState.correlationId }} />}
      </BentoCard>

      {/* History */}
      <InvocationHistory
        records={history}
        title='Forge Tool History'
        emptyMessage='No valuation explanations yet.'
      />
    </div>
  );
};

export default PropertyForge;
