/**
 * forge/CostApproach.tsx
 *
 * Phase 1: Cost Approach sub-tab — model input analysis.
 * Extracted from PropertyForge.tsx monolith.
 *
 * Tools hosted here:
 *   - explain_model_inputs: Model input factor breakdown with PII flags
 */

import React, { useCallback, useState } from 'react';
import { useWorkbenchTab } from '../../../../context/workbenchTabContext';
import { invokeTool } from '../../../../api/pilotApi';
import { ErrorDisplay } from '../../../../components/errors/ErrorDisplay';
import { BentoCard } from '../../../../ui/materials/BentoCard';
import { WorkbenchSourceBadge } from '../../../../components/workbench/WorkbenchSourceBadge';
import { useCostApproach as useCostApproachAPI } from '../../../../hooks/forge/useForgeValuation';
import {
  type ForgeSubTabProps,
  type ModelInputsResult,
  type ToolState,
  fmtCurrency,
  formatConfidence,
} from './types';

export const CostApproach: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
}) => {
  const { parcelId } = useWorkbenchTab();

  /* ── Live API data ──────────────────────────────────────── */
  const costAPI = useCostApproachAPI(parcelId, taxYear);

  const [modelId, setModelId] = useState<string>('cost-approach');
  const [modelInputsState, setModelInputsState] = useState<ToolState<ModelInputsResult>>({ status: 'idle' });

  /* ── explain_model_inputs ─────────────────────────────── */

  const handleModelInputs = useCallback(async () => {
    setModelInputsState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'explain_model_inputs',
        params: { county: 'benton', modelId, asOfYear: taxYear },
        parcelId,
      });
      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output)
          : response.result.output;
        setModelInputsState({ status: 'success', result: parsed, correlationId: response.correlationId });
        onHistoryRecord({
          id: crypto.randomUUID(),
          toolId: 'explain_model_inputs',
          status: 'success',
          correlationId: response.correlationId || 'unknown',
          timestamp: new Date(),
          meta: { modelId },
        });
      } else {
        setModelInputsState({
          status: 'error',
          correlationId: response.correlationId,
          error: {
            code: response.error?.code || 'MODEL_INPUTS_FAILED',
            message: response.error?.message || 'Model inputs lookup failed',
            severity: 'error',
            correlationId: response.correlationId,
          },
        });
      }
    } catch (err) {
      const cid = `net-${crypto.randomUUID().slice(0, 8)}`;
      setModelInputsState({
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
  }, [parcelId, modelId, taxYear, onHistoryRecord]);

  /* ── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Live Cost Approach Data */}
      <BentoCard
        title="&#127959;&#65039; Cost Approach Summary"
        variant="default"
        actions={<WorkbenchSourceBadge source={costAPI.source} />}
      >
        {costAPI.loading && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Loading cost approach data...</span>
          </div>
        )}
        {costAPI.data && (
          <div className="space-y-3" data-testid="cost-approach-live">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">RCN</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(costAPI.data.replacementCostNew)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Depreciated Cost</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(costAPI.data.depreciatedCost)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Land Value</div>
                <div className="text-lg font-bold tf-text">{fmtCurrency(costAPI.data.landValue)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Indicated Value</div>
                <div className="text-lg font-bold tf-suite-accent-text">{fmtCurrency(costAPI.data.indicatedValue)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Physical Depr.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.physicalDepreciation)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Functional Obs.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.functionalObsolescence)}</div>
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">External Obs.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.externalObsolescence)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="tf-text-tertiary">Confidence:</span>
              <span className="tf-suite-accent-text font-semibold">{formatConfidence(costAPI.data.confidence)}</span>
              <span className="tf-text-dim text-xs ml-auto">Source: {costAPI.data.source}</span>
            </div>
          </div>
        )}
        {!costAPI.loading && !costAPI.data && costAPI.error && (
          <div className="py-4 text-center" data-testid="cost-approach-empty">
            <p className="tf-text-tertiary text-sm">No cost approach data for tax year {taxYear}</p>
            <p className="tf-text-dim text-xs mt-1">{costAPI.error.message}</p>
          </div>
        )}
        {!costAPI.loading && !costAPI.data && !costAPI.error && (
          <div className="py-4 text-center" data-testid="cost-approach-empty">
            <p className="tf-text-tertiary text-sm">No parcel selected</p>
          </div>
        )}
      </BentoCard>

      {/* Model Inputs */}
      <BentoCard title="&#128269; Model Inputs" variant="default">
        <p className="tf-text-tertiary text-sm mb-4">
          Valuation model factor breakdown with PII flagging for parcel {parcelId}
        </p>

        <div className="mb-4">
          <label htmlFor="model-id" className="block tf-text-secondary text-sm mb-2">Model</label>
          <select
            id="model-id"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full tf-input px-3 py-2"
          >
            <option value="cost-approach">Cost Approach</option>
            <option value="income-approach">Income Approach</option>
            <option value="sales-comparison">Sales Comparison</option>
          </select>
        </div>

        <button
          onClick={handleModelInputs}
          disabled={modelInputsState.status === 'loading'}
          className="w-full py-2 px-4 rounded-lg font-semibold transition-all tf-suite-forge-cta mb-4"
        >
          {modelInputsState.status === 'loading' ? 'Loading...' : `Explain Inputs (${taxYear})`}
        </button>

        {modelInputsState.status === 'loading' && (
          <div role="status" className="flex items-center justify-center py-6 gap-3">
            <div className="tf-spinner h-8 w-8" />
            <span className="tf-text-tertiary">Loading model inputs...</span>
          </div>
        )}

        {modelInputsState.status === 'success' && modelInputsState.result && (
          <div className="space-y-3">
            <p className="tf-text-secondary text-sm">{modelInputsState.result.summary}</p>
            <div className="space-y-1">
              {modelInputsState.result.inputs.map((inp, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 tf-panel rounded">
                  <span className="tf-text-secondary">{inp.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs tf-text-dim">{inp.source}</span>
                    {inp.pii && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'hsl(var(--tf-error) / 0.15)', color: 'hsl(var(--tf-error))' }}
                      >
                        PII
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {modelInputsState.status === 'error' && modelInputsState.error && (
          <ErrorDisplay
            error={{
              message: modelInputsState.error.message,
              errorCode: modelInputsState.error.code,
              correlationId: modelInputsState.correlationId,
            }}
          />
        )}

        {modelInputsState.status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-2">&#128200;</div>
            <p className="tf-text-tertiary">Select a model and click Explain Inputs</p>
            <p className="tf-text-dim text-sm mt-1">See what factors drive the cost approach model</p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default CostApproach;
