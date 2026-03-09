/**
 * PropertyForge.tsx
 *
 * Phase 5.4 + R2.5: Property Forge Tab - Valuation MWUX Slice
 * Real MWUX with governed tool invocations:
 * - explain_model_results: AI-powered valuation explanation
 * - explain_value_change: Year-over-year value change analysis
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
import { BentoGrid } from '../../../ui/materials/BentoGrid';
import { BentoCard } from '../../../ui/materials/BentoCard';

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

export const PropertyForge: React.FC = () => {
  const { parcelId } = useWorkbenchTab();

  const [taxYear, setTaxYear] = useState<number>(CURRENT_YEAR);
  const [audience, setAudience] = useState<AudienceType>('internal');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareToYear, setCompareToYear] = useState<number>(CURRENT_YEAR - 1);
  const [explainState, setExplainState] = useState<ExplainState>({ status: 'idle' });
  const [valueChangeState, setValueChangeState] = useState<ValueChangeState>({ status: 'idle' });
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
