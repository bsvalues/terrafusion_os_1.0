/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION PILOT CONSOLE
 * Phase 5: GovernanceLock - Single Choke Point UI
 *
 * This console proves the end-to-end loop:
 *   UI → ToolRunner → TraceService → TraceStore → UI
 *
 * ALL tool invocations go through POST /pilot/invoke.
 * There is no other path. This is the single throat to choke.
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  filterMuseReadOnlyTools,
    getPilotHealth,
    getPilotTrace,
    getRiskBadgeColor,
    getSuiteBadgeColor,
    invokePilotTool,
    listPilotTools,
    validatePilotTool,
    type PilotInvokeResponse,
    type PilotTool,
    type PilotTraceEvent,
    type PilotValidateResponse,
} from '../api/pilotApi';

// ═══════════════════════════════════════════════════════════════
// COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════

interface PreflightState {
  status: 'idle' | 'validating' | 'pass' | 'fail';
  validation: PilotValidateResponse | null;
  lastValidatedAt: number | null;
}

interface InvokeModalState {
  isOpen: boolean;
  tool: PilotTool | null;
  params: string;
  reasonCode: string;
  confirmed: boolean;
  supervisorApprover: string;
  supervisorRole: string;
  preflight: PreflightState;
  invoking: boolean;
  result: PilotInvokeResponse | null;
  error: string | null;
}

interface TraceViewerState {
  correlationId: string;
  events: PilotTraceEvent[];
  loading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function PilotConsole(): React.ReactElement {
  // Tools state
  const [tools, setTools] = useState<PilotTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Health state
  const [health, setHealth] = useState<{
    status: string;
    toolCount: number;
    traceEventCount: number;
  } | null>(null);

  // Invoke modal state
  const [invokeModal, setInvokeModal] = useState<InvokeModalState>({
    isOpen: false,
    tool: null,
    params: '{}',
    reasonCode: '',
    confirmed: false,
    supervisorApprover: '',
    supervisorRole: '',
    preflight: {
      status: 'idle',
      validation: null,
      lastValidatedAt: null,
    },
    invoking: false,
    result: null,
    error: null,
  });

  // Trace viewer state
  const [traceViewer, setTraceViewer] = useState<TraceViewerState>({
    correlationId: '',
    events: [],
    loading: false,
    error: null,
  });

  // ═════════════════════════════════════════════════════════════
  // HANDLERS
  // ═════════════════════════════════════════════════════════════

  const loadTools = useCallback(async () => {
    setToolsLoading(true);
    setToolsError(null);
    try {
      const response = await listPilotTools('muse');
      setTools(filterMuseReadOnlyTools(response.tools));
    } catch (err) {
      setToolsError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setToolsLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const response = await getPilotHealth();
      setHealth({
        status: response.status,
        toolCount: response.toolCount,
        traceEventCount: response.traceEventCount,
      });
    } catch {
      setHealth(null);
    }
  }, []);

  const openInvokeModal = useCallback((tool: PilotTool) => {
    setInvokeModal({
      isOpen: true,
      tool,
      params: '{}',
      reasonCode: tool.reasonCodes?.[0] || '',
      confirmed: false,
      supervisorApprover: '',
      supervisorRole: tool.supervisorRoles?.[0] || '',
      preflight: {
        status: 'idle',
        validation: null,
        lastValidatedAt: null,
      },
      invoking: false,
      result: null,
      error: null,
    });
  }, []);

  const closeInvokeModal = useCallback(() => {
    setInvokeModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Preflight validation - runs automatically when inputs change
  const runPreflight = useCallback(async () => {
    const { tool, params, reasonCode, confirmed, supervisorApprover, supervisorRole } = invokeModal;
    if (!tool) return;

    setInvokeModal((prev) => ({
      ...prev,
      preflight: { ...prev.preflight, status: 'validating' },
      error: null,
    }));

    try {
      // Parse params
      let parsedParams: Record<string, unknown>;
      try {
        parsedParams = JSON.parse(params);
      } catch {
        throw new Error('Invalid JSON in params');
      }

      // Call validate endpoint
      const validation = await validatePilotTool({
        toolId: tool.toolId,
        params: parsedParams,
        mode: 'muse',
        confirmation: confirmed,
        reasonCode: reasonCode || undefined,
      });

      // Compute preflight status from tool requirements + user inputs
      const needsConfirmation = tool.requiresConfirmation ?? false;
      const needsReason = (tool.reasonCodes?.length ?? 0) > 0;
      const needsSupervisor = tool.requiresSupervisorApproval ?? false;

      const confirmationOk = !needsConfirmation || confirmed;
      const reasonOk = !needsReason || (reasonCode && reasonCode.length > 0);
      const supervisorOk =
        !needsSupervisor || (supervisorApprover.length > 0 && supervisorRole.length > 0);

      // Override validation.valid based on our UI state
      const allSatisfied = validation.valid && confirmationOk && reasonOk && supervisorOk;

      setInvokeModal((prev) => ({
        ...prev,
        preflight: {
          status: allSatisfied ? 'pass' : 'fail',
          validation: {
            ...validation,
            preflight: {
              confirmationRequired: needsConfirmation,
              confirmationProvided: confirmed,
              reasonCodeRequired: needsReason,
              reasonCodeProvided: !!(reasonCode && reasonCode.length > 0),
              supervisorRequired: needsSupervisor,
              supervisorProvided: supervisorApprover.length > 0 && supervisorRole.length > 0,
            },
          },
          lastValidatedAt: Date.now(),
        },
      }));
    } catch (err) {
      setInvokeModal((prev) => ({
        ...prev,
        preflight: { status: 'fail', validation: null, lastValidatedAt: Date.now() },
        error: err instanceof Error ? err.message : 'Preflight failed',
      }));
    }
  }, [invokeModal]);

  // Auto-run preflight when modal opens or inputs change (debounced)
  useEffect(() => {
    if (!invokeModal.isOpen || !invokeModal.tool) return;

    const timer = setTimeout(() => {
      runPreflight();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [
    invokeModal.isOpen,
    invokeModal.tool?.toolId,
    invokeModal.params,
    invokeModal.reasonCode,
    invokeModal.confirmed,
    invokeModal.supervisorApprover,
    invokeModal.supervisorRole,
  ]);

  const handleInvoke = useCallback(async () => {
    const { tool, params, reasonCode, confirmed, supervisorApprover, supervisorRole, preflight } =
      invokeModal;
    if (!tool) return;

    // Must pass preflight first
    if (preflight.status !== 'pass') {
      setInvokeModal((prev) => ({
        ...prev,
        error: 'Preflight check must pass before invoking',
      }));
      return;
    }

    setInvokeModal((prev) => ({ ...prev, invoking: true, error: null }));

    try {
      // Parse params
      let parsedParams: Record<string, unknown>;
      try {
        parsedParams = JSON.parse(params);
      } catch {
        throw new Error('Invalid JSON in params');
      }

      // Build supervisor approval if required
      const supervisorApproval = tool.requiresSupervisorApproval
        ? { approvedBy: supervisorApprover, role: supervisorRole }
        : undefined;

      // Invoke through the single choke point
      const result = await invokePilotTool({
        toolId: tool.toolId,
        params: parsedParams,
        mode: 'muse',
        confirmation: confirmed,
        reasonCode: reasonCode || undefined,
        supervisorApproval,
      });

      setInvokeModal((prev) => ({
        ...prev,
        invoking: false,
        result,
        error: result.ok ? null : result.error || 'Invocation failed',
      }));

      // Auto-load trace if successful
      if (result.ok && result.correlationId) {
        setTraceViewer((prev) => ({
          ...prev,
          correlationId: result.correlationId,
        }));
      }
    } catch (err) {
      setInvokeModal((prev) => ({
        ...prev,
        invoking: false,
        error: err instanceof Error ? err.message : 'Invocation failed',
      }));
    }
  }, [invokeModal]);

  const loadTrace = useCallback(async () => {
    const { correlationId } = traceViewer;
    if (!correlationId) return;

    setTraceViewer((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await getPilotTrace(correlationId);
      setTraceViewer((prev) => ({
        ...prev,
        loading: false,
        events: response.events,
      }));
    } catch (err) {
      setTraceViewer((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load trace',
      }));
    }
  }, [traceViewer.correlationId]);

  // ═════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═════════════════════════════════════════════════════════════

  const renderToolCard = (tool: PilotTool) => (
    <div
      key={tool.toolId}
      className='bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors'
    >
      <div className='flex justify-between items-start mb-2'>
        <h3 className='text-white font-mono text-sm'>{tool.toolId}</h3>
        <div className='flex gap-2'>
          <span className={`px-2 py-0.5 text-xs rounded border ${getSuiteBadgeColor(tool.suite)}`}>
            {tool.suite}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded border ${getRiskBadgeColor(tool.risk)}`}>
            {tool.risk}
          </span>
        </div>
      </div>
      {tool.displayName && <p className='text-slate-300 text-sm mb-2'>{tool.displayName}</p>}
      {tool.description && <p className='text-slate-400 text-xs mb-3'>{tool.description}</p>}
      <div className='flex justify-between items-center'>
        <div className='flex gap-2 text-xs'>
          {tool.requiresConfirmation && <span className='text-orange-400'>⚠ Confirmation</span>}
          {tool.requiresSupervisorApproval && <span className='text-red-400'>🔒 Supervisor</span>}
          {tool.mode && <span className='text-slate-500'>Mode: {tool.mode}</span>}
        </div>
        <button
          onClick={() => openInvokeModal(tool)}
          className='px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors'
        >
          Invoke
        </button>
      </div>
    </div>
  );

  const renderInvokeModal = () => {
    if (!invokeModal.isOpen || !invokeModal.tool) return null;

    const {
      tool,
      params,
      reasonCode,
      confirmed,
      supervisorApprover,
      supervisorRole,
      preflight,
      invoking,
      result,
      error,
    } = invokeModal;

    const needsConfirmation = tool.requiresConfirmation ?? false;
    const needsReason = (tool.reasonCodes?.length ?? 0) > 0;
    const needsSupervisor = tool.requiresSupervisorApproval ?? false;

    // Compute checklist from preflight state
    const pf = preflight.validation?.preflight;
    const canInvoke = preflight.status === 'pass' && !invoking && !result;

    return (
      <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50'>
        <div className='bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto'>
          <div className='flex justify-between items-start mb-4'>
            <h2 className='text-lg font-semibold text-white'>Invoke Tool</h2>
            <button onClick={closeInvokeModal} className='text-slate-400 hover:text-white'>
              ✕
            </button>
          </div>

          <div className='mb-4'>
            <div className='flex gap-2 mb-2'>
              <span
                className={`px-2 py-0.5 text-xs rounded border ${getSuiteBadgeColor(tool.suite)}`}
              >
                {tool.suite}
              </span>
              <span
                className={`px-2 py-0.5 text-xs rounded border ${getRiskBadgeColor(tool.risk)}`}
              >
                {tool.risk}
              </span>
            </div>
            <p className='font-mono text-cyan-400'>{tool.toolId}</p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              PREFLIGHT CHECK PANEL - Phase 6.2
              Shows required safeguards and their status
          ═════════════════════════════════════════════════════════════ */}
          <div className='mb-4 p-3 bg-slate-800/50 border border-slate-700 rounded'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm font-semibold text-slate-300'>Preflight Check</span>
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  preflight.status === 'pass'
                    ? 'bg-green-500/20 text-green-400'
                    : preflight.status === 'fail'
                      ? 'bg-red-500/20 text-red-400'
                      : preflight.status === 'validating'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-slate-600/50 text-slate-400'
                }`}
              >
                {preflight.status === 'validating'
                  ? '⏳ Validating...'
                  : preflight.status === 'pass'
                    ? '✓ READY'
                    : preflight.status === 'fail'
                      ? '✗ NOT READY'
                      : '○ Pending'}
              </span>
            </div>

            {/* Checklist items */}
            <div className='space-y-1 text-xs'>
              {/* JSON Valid */}
              <div className='flex items-center gap-2'>
                <span
                  className={(() => {
                    try {
                      JSON.parse(params);
                      return 'text-green-400';
                    } catch {
                      return 'text-red-400';
                    }
                  })()}
                >
                  {(() => {
                    try {
                      JSON.parse(params);
                      return '✓';
                    } catch {
                      return '✗';
                    }
                  })()}
                </span>
                <span className='text-slate-400'>Valid JSON parameters</span>
              </div>

              {/* Confirmation */}
              {needsConfirmation && (
                <div className='flex items-center gap-2'>
                  <span className={pf?.confirmationProvided ? 'text-green-400' : 'text-orange-400'}>
                    {pf?.confirmationProvided ? '✓' : '○'}
                  </span>
                  <span className='text-slate-400'>Confirmation required</span>
                </div>
              )}

              {/* Reason code */}
              {needsReason && (
                <div className='flex items-center gap-2'>
                  <span className={pf?.reasonCodeProvided ? 'text-green-400' : 'text-orange-400'}>
                    {pf?.reasonCodeProvided ? '✓' : '○'}
                  </span>
                  <span className='text-slate-400'>Reason code required</span>
                </div>
              )}

              {/* Supervisor approval */}
              {needsSupervisor && (
                <div className='flex items-center gap-2'>
                  <span className={pf?.supervisorProvided ? 'text-green-400' : 'text-red-400'}>
                    {pf?.supervisorProvided ? '✓' : '⚠'}
                  </span>
                  <span className='text-red-400 font-semibold'>
                    Supervisor approval required ({tool.supervisorRoles?.join(', ')})
                  </span>
                </div>
              )}
            </div>

            {/* Violations from server */}
            {preflight.validation?.violations && preflight.validation.violations.length > 0 && (
              <div className='mt-2 pt-2 border-t border-slate-700'>
                <div className='text-xs text-red-400'>
                  {preflight.validation.violations.map((v, i) => (
                    <div key={i}>• {v}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Params input */}
          <div className='mb-4'>
            <label className='block text-sm text-slate-300 mb-1'>Parameters (JSON)</label>
            <textarea
              value={params}
              onChange={(e) => setInvokeModal((prev) => ({ ...prev, params: e.target.value }))}
              className='w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-mono text-sm h-24'
              placeholder='{}'
            />
          </div>

          {/* Reason code select */}
          {needsReason && (
            <div className='mb-4'>
              <label className='block text-sm text-slate-300 mb-1'>
                Reason Code <span className='text-orange-400'>(Required)</span>
              </label>
              <select
                value={reasonCode}
                onChange={(e) =>
                  setInvokeModal((prev) => ({
                    ...prev,
                    reasonCode: e.target.value,
                  }))
                }
                className='w-full bg-slate-800 border border-slate-600 rounded p-2 text-white'
              >
                <option value=''>-- Select reason --</option>
                {tool.reasonCodes?.map((code) => (
                  <option key={code} value={code}>
                    {code.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supervisor approval inputs */}
          {needsSupervisor && (
            <div className='mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded'>
              <div className='text-sm text-red-400 font-semibold mb-2'>
                ⚠ Supervisor Approval Required
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-xs text-slate-400 mb-1'>Approver Name</label>
                  <input
                    type='text'
                    value={supervisorApprover}
                    onChange={(e) =>
                      setInvokeModal((prev) => ({
                        ...prev,
                        supervisorApprover: e.target.value,
                      }))
                    }
                    className='w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm'
                    placeholder='Supervisor name...'
                  />
                </div>
                <div>
                  <label className='block text-xs text-slate-400 mb-1'>Role</label>
                  <select
                    value={supervisorRole}
                    onChange={(e) =>
                      setInvokeModal((prev) => ({
                        ...prev,
                        supervisorRole: e.target.value,
                      }))
                    }
                    className='w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm'
                  >
                    <option value=''>-- Select role --</option>
                    {tool.supervisorRoles?.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation checkbox */}
          {needsConfirmation && (
            <div className='mb-4'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={confirmed}
                  onChange={(e) =>
                    setInvokeModal((prev) => ({
                      ...prev,
                      confirmed: e.target.checked,
                    }))
                  }
                  className='rounded'
                />
                <span className='text-orange-400'>I confirm this {tool.risk} action</span>
              </label>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className='mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm'>
              {error}
            </div>
          )}

          {/* Result display */}
          {result && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                result.ok
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              <div className='font-semibold mb-1'>{result.ok ? '✓ Success' : '✗ Failed'}</div>
              <div className='font-mono text-xs break-all'>
                Correlation ID: {result.correlationId}
              </div>
              {result.result && (
                <pre className='mt-2 text-xs overflow-auto max-h-32'>
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className='flex justify-end gap-2'>
            <button
              onClick={closeInvokeModal}
              className='px-4 py-2 text-slate-400 hover:text-white transition-colors'
            >
              Close
            </button>
            <button
              onClick={handleInvoke}
              disabled={!canInvoke}
              className={`px-4 py-2 font-semibold rounded transition-colors ${
                canInvoke
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {invoking
                ? 'Invoking...'
                : preflight.status !== 'pass'
                  ? 'Preflight Required'
                  : 'Invoke via /pilot/invoke'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTraceEvent = (event: PilotTraceEvent) => (
    <div key={event.eventId} className='bg-slate-800/50 border border-slate-700 rounded p-3 mb-2'>
      <div className='flex justify-between items-start mb-1'>
        <span className='text-cyan-400 font-mono text-sm'>{event.type}</span>
        <span className='text-slate-500 text-xs'>{new Date(event.timestamp).toLocaleString()}</span>
      </div>
      <p className='text-slate-300 text-sm mb-2'>{event.summary}</p>
      <div className='flex flex-wrap gap-2 text-xs'>
        <span className='text-slate-500'>Tool: {event.toolId}</span>
        <span className='text-slate-500'>County: {event.context.countyId}</span>
        <span className='text-slate-500'>User: {event.context.userId}</span>
        <span className='text-slate-500'>Mode: {event.context.mode}</span>
      </div>
      {event.redactedFields && event.redactedFields.length > 0 && (
        <div className='mt-2 text-xs text-orange-400'>
          Redacted: {event.redactedFields.join(', ')}
        </div>
      )}
    </div>
  );

  // ═════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className='min-h-screen bg-slate-950 text-white p-6'>
      {/* Header */}
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-cyan-400 mb-1'>TerraFusion Pilot Console</h1>
            <p className='text-slate-400 text-sm'>
              Single Choke Point • All invocations via POST /pilot/invoke
            </p>
          </div>
          <div className='flex gap-4 items-center'>
            {health && (
              <div className='text-sm text-slate-400'>
                <span className={health.status === 'ok' ? 'text-green-400' : 'text-red-400'}>
                  ● {health.status}
                </span>
                <span className='mx-2'>|</span>
                <span>{health.toolCount} tools</span>
                <span className='mx-2'>|</span>
                <span>{health.traceEventCount} events</span>
              </div>
            )}
            <Link
              to='/pilot/api'
              className='px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-cyan-500/50 transition-colors'
            >
              Pilot API Demo
            </Link>
            <button
              onClick={() => {
                loadTools();
                loadHealth();
              }}
              className='px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-cyan-500/50 transition-colors'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Tools Panel (2/3 width) */}
          <div className='lg:col-span-2'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Available Tools</h2>
              <div className='flex gap-2 items-center'>
                <span className='px-3 py-1 text-xs uppercase tracking-[0.2em] rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10'>
                  Muse / Read-Only
                </span>
                <button
                  onClick={loadTools}
                  disabled={toolsLoading}
                  className='px-4 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50'
                >
                  {toolsLoading ? 'Loading...' : 'Load Tools'}
                </button>
              </div>
            </div>

            {toolsError && (
              <div className='p-4 bg-red-500/20 border border-red-500/30 rounded mb-4 text-red-400'>
                {toolsError}
              </div>
            )}

            {tools.length === 0 && !toolsLoading && !toolsError && (
              <div className='p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded'>
                Click "Load Tools" to fetch Muse-first read-only tools from the registry
              </div>
            )}

            <div className='grid gap-4'>{tools.map(renderToolCard)}</div>
          </div>

          {/* Trace Panel (1/3 width) */}
          <div>
            <h2 className='text-lg font-semibold mb-4'>Trace Viewer</h2>

            <div className='mb-4'>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={traceViewer.correlationId}
                  onChange={(e) =>
                    setTraceViewer((prev) => ({
                      ...prev,
                      correlationId: e.target.value,
                    }))
                  }
                  placeholder='Correlation ID'
                  className='flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm font-mono'
                />
                <button
                  onClick={loadTrace}
                  disabled={traceViewer.loading || !traceViewer.correlationId}
                  className='px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors disabled:opacity-50'
                >
                  {traceViewer.loading ? '...' : 'Load'}
                </button>
              </div>
            </div>

            {traceViewer.error && (
              <div className='p-3 bg-red-500/20 border border-red-500/30 rounded mb-4 text-red-400 text-sm'>
                {traceViewer.error}
              </div>
            )}

            {traceViewer.events.length === 0 && !traceViewer.loading && (
              <div className='p-6 text-center text-slate-500 border border-dashed border-slate-700 rounded text-sm'>
                Enter a Correlation ID to view trace events
              </div>
            )}

            <div>{traceViewer.events.map(renderTraceEvent)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-12 pt-6 border-t border-slate-800 text-center text-slate-500 text-xs'>
          <p>TerraFusion GovernanceLock • Phase 6.2 • Preflight-First Enforcement</p>
          <p className='mt-1 text-cyan-500/50'>Government. Transcended.</p>
        </div>
      </div>

      {/* Modal */}
      {renderInvokeModal()}
    </div>
  );
}

export default PilotConsole;
