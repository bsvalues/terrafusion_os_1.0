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
            {/* WA agricultural/timber classification banner */}
            {costAPI.data.isAgriculturalOrTimber && costAPI.data.waClassificationNote && (
              <div
                className="px-3 py-2 rounded text-xs font-medium"
                style={{ background: 'hsl(var(--tf-warning) / 0.12)', color: 'hsl(var(--tf-warning))' }}
              >
                WA Qualifying Use: {costAPI.data.waClassificationNote}
              </div>
            )}
            {/* Primary value grid */}
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
            {/* Depreciation schedule — dollar + percentage per IAAO standard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Physical Depr.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.physicalDepreciation)}</div>
                {costAPI.data.physicalDepreciationPct > 0 && (
                  <div className="text-xs tf-text-dim mt-0.5">{costAPI.data.physicalDepreciationPct.toFixed(1)}% of RCN</div>
                )}
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">Functional Obs.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.functionalObsolescence)}</div>
                {costAPI.data.functionalObsolescencePct > 0 && (
                  <div className="text-xs tf-text-dim mt-0.5">{costAPI.data.functionalObsolescencePct.toFixed(1)}% of RCN</div>
                )}
              </div>
              <div className="tf-panel p-3 text-center">
                <div className="tf-text-tertiary text-xs">External Obs.</div>
                <div className="text-sm font-semibold tf-text">{fmtCurrency(costAPI.data.externalObsolescence)}</div>
                {costAPI.data.externalObsolescencePct > 0 && (
                  <div className="text-xs tf-text-dim mt-0.5">{costAPI.data.externalObsolescencePct.toFixed(1)}% of RCN</div>
                )}
              </div>
            </div>
            {/* Building + land characteristics */}
            {(costAPI.data.yearBuilt || costAPI.data.buildingSqFt || costAPI.data.qualityGrade || costAPI.data.landAreaSqFt) && (
              <div className="grid grid-cols-2 gap-3">
                {/* Building details */}
                {(costAPI.data.yearBuilt || costAPI.data.buildingSqFt || costAPI.data.qualityGrade) && (
                  <div className="tf-panel p-3 space-y-1">
                    <div className="tf-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Building</div>
                    {costAPI.data.yearBuilt && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Year Built</span>
                        <span className="tf-text-secondary font-medium">{costAPI.data.yearBuilt}</span>
                      </div>
                    )}
                    {costAPI.data.effectiveAge != null && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Effective Age</span>
                        <span className="tf-text-secondary font-medium">{costAPI.data.effectiveAge} yrs</span>
                      </div>
                    )}
                    {costAPI.data.buildingSqFt && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Sq Ft</span>
                        <span className="tf-text-secondary font-medium">{costAPI.data.buildingSqFt.toLocaleString()}</span>
                      </div>
                    )}
                    {costAPI.data.qualityGrade && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Quality</span>
                        <span className="tf-text-secondary font-medium capitalize">{costAPI.data.qualityGrade.toLowerCase()}</span>
                      </div>
                    )}
                    {costAPI.data.conditionGrade && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Condition</span>
                        <span className="tf-text-secondary font-medium capitalize">{costAPI.data.conditionGrade.toLowerCase()}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Land details */}
                {(costAPI.data.landAreaSqFt || costAPI.data.landAreaAcres) && (
                  <div className="tf-panel p-3 space-y-1">
                    <div className="tf-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Land</div>
                    {costAPI.data.landAreaSqFt && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Sq Ft</span>
                        <span className="tf-text-secondary font-medium">{costAPI.data.landAreaSqFt.toLocaleString()}</span>
                      </div>
                    )}
                    {costAPI.data.landAreaAcres && (
                      <div className="flex justify-between text-xs">
                        <span className="tf-text-dim">Acres</span>
                        <span className="tf-text-secondary font-medium">{costAPI.data.landAreaAcres.toFixed(3)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs mt-2">
                      <span className="tf-text-dim">Land Value</span>
                      <span className="tf-text-secondary font-medium">{fmtCurrency(costAPI.data.landValue)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Physical attributes from PACS improvement attributes */}
            {(costAPI.data.foundation || costAPI.data.exteriorWall || costAPI.data.roofType ||
              costAPI.data.hvacType || costAPI.data.bedrooms != null || costAPI.data.fireplaces != null) && (
              <div className="tf-panel p-3">
                <div className="tf-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">Attributes</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {costAPI.data.foundation && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Foundation</span>
                      <span className="tf-text-secondary font-medium text-right">{costAPI.data.foundation}</span>
                    </div>
                  )}
                  {costAPI.data.exteriorWall && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Exterior</span>
                      <span className="tf-text-secondary font-medium text-right">{costAPI.data.exteriorWall}</span>
                    </div>
                  )}
                  {costAPI.data.roofType && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Roof</span>
                      <span className="tf-text-secondary font-medium text-right">{costAPI.data.roofType}</span>
                    </div>
                  )}
                  {costAPI.data.hvacType && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">HVAC</span>
                      <span className="tf-text-secondary font-medium text-right">{costAPI.data.hvacType}</span>
                    </div>
                  )}
                  {costAPI.data.bedrooms != null && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Bedrooms</span>
                      <span className="tf-text-secondary font-medium">{costAPI.data.bedrooms}</span>
                    </div>
                  )}
                  {costAPI.data.bathrooms != null && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Bathrooms</span>
                      <span className="tf-text-secondary font-medium">{costAPI.data.bathrooms}</span>
                    </div>
                  )}
                  {costAPI.data.fireplaces != null && costAPI.data.fireplaces > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="tf-text-dim">Fireplaces</span>
                      <span className="tf-text-secondary font-medium">{costAPI.data.fireplaces}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Per-segment cost breakdown */}
            {costAPI.data.segments && costAPI.data.segments.length > 0 && (
              <div className="tf-panel p-3">
                <div className="tf-text-tertiary text-xs font-semibold uppercase tracking-wide mb-2">
                  Segments ({costAPI.data.segments.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="tf-text-dim">
                        <th className="text-left py-1 pr-3">Type</th>
                        <th className="text-right py-1 pr-3">Area (sf)</th>
                        <th className="text-right py-1 pr-3">Unit $</th>
                        <th className="text-right py-1">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costAPI.data.segments.map((seg, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="py-1 pr-3 tf-text-secondary">
                            {seg.segmentDesc || seg.segmentType || '—'}
                          </td>
                          <td className="text-right py-1 pr-3 tf-text-secondary">
                            {seg.area != null ? seg.area.toLocaleString() : '—'}
                          </td>
                          <td className="text-right py-1 pr-3 tf-text-secondary">
                            {seg.unitPrice != null ? `$${seg.unitPrice.toFixed(2)}` : '—'}
                          </td>
                          <td className="text-right py-1 tf-text-dim">
                            {seg.classCode || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
