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
import { ComparableSalesPanel } from '../../../../components/workbench/ComparableSalesPanel';
import {
  type ForgeSubTabProps,
  type SalesCompsResult,
  type ToolState,
} from './types';

export const SalesComparison: React.FC<ForgeSubTabProps> = ({
  taxYear,
  onHistoryRecord,
  onValueIndicated,
}) => {
  const { parcelId } = useWorkbenchTab();

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
    <div className="space-y-6">
      {/* Full ComparableSalesPanel — existing 612-line component, no changes */}
      <ComparableSalesPanel />

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
