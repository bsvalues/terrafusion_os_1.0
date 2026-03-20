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
import {
  type ForgeSubTabProps,
  type ModelInputsResult,
  type ToolState,
} from './types';

export const CostApproach: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
}) => {
  const { parcelId } = useWorkbenchTab();

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
