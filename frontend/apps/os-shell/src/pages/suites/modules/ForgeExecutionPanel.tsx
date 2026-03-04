/**
 * ForgeExecutionPanel.tsx
 *
 * Lane U: Governed Execution UI Spine
 * ====================================================================
 * Composes useToolInvocation + ExecutionConsole to fire `run_valuation_model`
 * through the full governed path:
 *
 *   UI form → useToolInvocation → pilotApi → PilotController → backend
 *            → trace events → EvidenceRail (via ExecutionConsole toggle)
 *
 * This is the R1 Week 2 integration proof: invoke run_valuation_model
 * from os-shell, see lifecycle + trace in real time.
 *
 * The form collects params matching RunValuationModelParams from the
 * tool registry (parcelId, taxYear, modelType, county).
 */

import { useCallback, useState } from 'react';
import { useToolInvocation } from '../../../hooks/useToolInvocation';
import { ExecutionConsole } from '../../../components/pilot/ExecutionConsole';
import type { PilotTool } from '../../../api/pilotApi';
import { getSession } from '../../../auth/session';

// ============================================================================
// Tool metadata (matches terrapilot.tools.json entry for run_valuation_model)
// ============================================================================

const RUN_VALUATION_TOOL: PilotTool = {
  toolId: 'run_valuation_model',
  displayName: 'Run Valuation Model',
  suite: 'forge',
  mode: 'pilot',
  risk: 'write_high',
  description: 'Execute valuation model and persist results',
  requiresConfirmation: true,
  reasonCodes: [
    'annual_certification',
    'market_adjustment',
    'new_construction',
    'correction',
  ],
};

// ============================================================================
// Reason code labels (human-readable)
// ============================================================================

const REASON_LABELS: Record<string, string> = {
  annual_certification: 'Annual Certification',
  market_adjustment: 'Market Adjustment',
  new_construction: 'New Construction',
  correction: 'Data Correction',
};

// ============================================================================
// Model types
// ============================================================================

const MODEL_TYPES = [
  { value: 'cost', label: 'Cost Approach' },
  { value: 'income', label: 'Income Approach' },
  { value: 'sales', label: 'Sales Comparison' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const TAX_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ============================================================================
// Component
// ============================================================================

export default function ForgeExecutionPanel() {
  const invocation = useToolInvocation();

  // Form state
  const [parcelId, setParcelId] = useState('');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [modelType, setModelType] = useState<string>('cost');

  // County from session — required for county-isolated invocations
  const county = getSession()?.countyId;

  const canInvoke = !!county && !!parcelId.trim();

  const handleInvoke = useCallback(() => {
    if (!canInvoke || !county) return;

    invocation.invoke('run_valuation_model', {
      parcelId: parcelId.trim(),
      taxYear,
      modelType,
      county,
    });
  }, [canInvoke, county, parcelId, taxYear, modelType, invocation]);

  const isRunning =
    invocation.state.phase === 'preflight' ||
    invocation.state.phase === 'executing';

  const isIdle = invocation.state.phase === 'idle';

  return (
    <div className="space-y-6">
      {/* ── Form: Valuation Parameters ── */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'hsl(var(--tf-surface))',
          border: '1px solid hsl(var(--tf-border))',
        }}
      >
        <h3
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <span>⚡</span> Governed Valuation Run
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Parcel ID */}
          <div>
            <label
              htmlFor="exec-parcel-id"
              className="block text-sm mb-1"
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Parcel ID
            </label>
            <input
              id="exec-parcel-id"
              type="text"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              placeholder="e.g. 1-0531-100-0001-000"
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'hsl(var(--tf-bg))',
                border: '1px solid hsl(var(--tf-border))',
                color: 'hsl(var(--tf-fg))',
              }}
            />
          </div>

          {/* Tax Year */}
          <div>
            <label
              htmlFor="exec-tax-year"
              className="block text-sm mb-1"
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Tax Year
            </label>
            <select
              id="exec-tax-year"
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'hsl(var(--tf-bg))',
                border: '1px solid hsl(var(--tf-border))',
                color: 'hsl(var(--tf-fg))',
              }}
            >
              {TAX_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Model Type */}
          <div>
            <label
              htmlFor="exec-model-type"
              className="block text-sm mb-1"
              style={{ color: 'hsl(var(--tf-muted))' }}
            >
              Model Type
            </label>
            <select
              id="exec-model-type"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'hsl(var(--tf-bg))',
                border: '1px solid hsl(var(--tf-border))',
                color: 'hsl(var(--tf-fg))',
              }}
            >
              {MODEL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Invoke Button */}
        <button
          onClick={handleInvoke}
          disabled={isRunning || !canInvoke}
          className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
          style={{
            background:
              isRunning || !canInvoke
                ? 'hsl(var(--tf-muted) / 0.3)'
                : 'hsl(var(--tf-suite-forge))',
            color:
              isRunning || !canInvoke
                ? 'hsl(var(--tf-muted))'
                : 'hsl(var(--tf-fg))',
            cursor: isRunning || !canInvoke ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? 'Running…' : 'Run Valuation Model'}
        </button>

        {/* Missing county session warning */}
        {!county && (
          <p
            className="text-xs mt-3 font-medium"
            style={{ color: 'hsl(0 70% 60%)' }}
          >
            No county context in session. Re-authenticate or select a county to enable invocation.
          </p>
        )}

        {/* Governed execution note */}
        {isIdle && county && (
          <p
            className="text-xs mt-3"
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            This tool is <strong>write_high</strong> — requires confirmation + reason code
            before execution. All invocations are traced.
          </p>
        )}
      </div>

      {/* ── ExecutionConsole: lifecycle + evidence rail ── */}
      {invocation.state.phase !== 'idle' && (
        <ExecutionConsole
          invocation={invocation}
          tool={RUN_VALUATION_TOOL}
          showReset
        />
      )}

      {/* ── Reason Code Legend (idle state helper) ── */}
      {isIdle && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'hsl(var(--tf-surface))',
            border: '1px solid hsl(var(--tf-border))',
          }}
        >
          <h4
            className="text-sm font-medium mb-2"
            style={{ color: 'hsl(var(--tf-muted))' }}
          >
            Reason Codes (required for confirmation)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {RUN_VALUATION_TOOL.reasonCodes?.map((code) => (
              <div
                key={code}
                className="px-3 py-1.5 rounded text-xs"
                style={{
                  background: 'hsl(var(--tf-bg))',
                  border: '1px solid hsl(var(--tf-border))',
                  color: 'hsl(var(--tf-fg))',
                }}
              >
                <span className="font-mono" style={{ opacity: 0.6 }}>
                  {code}
                </span>
                <span className="block" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {REASON_LABELS[code] ?? code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
