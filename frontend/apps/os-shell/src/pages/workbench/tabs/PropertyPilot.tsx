/**
 * PropertyPilot.tsx
 *
 * PR-UI1: Property Workbench Pilot Tab — Governed Tool Invocation
 *
 * R2.12: Tools grouped by suite with direct-route indicators.
 * Dynamically loads tools from the Pilot manifest via listPilotTools().
 * All invocations go through useToolInvocation → preflight → confirm → execute.
 * Write-risk tools enforce Gate 5 (confirmation + reason code) via RiskConfirmationModal.
 *
 * Production-only tool and trace flows.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkbenchTab } from '../../../context/workbenchTabContext';
import { listPilotTools, type PilotTool, type Risk } from '../../../api/pilotApi';
import {
  InvocationHistory,
  ParcelContextHeader,
  type InvocationRecord,
} from '../../../components/workbench';
import { ExecutionConsole } from '../../../components/pilot/ExecutionConsole';
import { EvidenceRail } from '../../../components/pilot/EvidenceRail';
import { useToolInvocation } from '../../../hooks/useToolInvocation';
import { usePilotTraceList } from '../../../hooks/usePilotTraceList';
import { groupToolsBySuite, SUITE_INFO, hasDirectRoute } from '../../../services/toolServiceRouter';

// ============================================================================
// Risk level display helpers
// ============================================================================

const RISK_ICON: Record<Risk, string> = {
  read_only: '📋',
  write_low: '✏️',
  write_high: '🔶',
  irreversible: '🛑',
};

const RISK_LABEL: Record<Risk, string> = {
  read_only: 'Read-Only',
  write_low: 'Write (Low)',
  write_high: 'Write (High)',
  irreversible: 'Irreversible',
};

const RISK_BADGE_CLASS: Record<Risk, string> = {
  read_only: 'tf-status-success',
  write_low: 'tf-status-info',
  write_high: 'tf-status-warning',
  irreversible: 'tf-status-error',
};

// Suite display order (most relevant for property work first)
const SUITE_ORDER = ['forge', 'atlas', 'dais', 'dossier', 'os', 'pilot', 'gpt'];

// ============================================================================
// Component
// ============================================================================

export const PropertyPilot: React.FC = () => {
  const { parcelId } = useWorkbenchTab();
  const invocation = useToolInvocation();

  // Dynamic tool list from manifest
  const [tools, setTools] = useState<PilotTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  // Invocation history (accumulated across tool runs)
  const [invocationHistory, setInvocationHistory] = useState<InvocationRecord[]>([]);

  // Track the selected tool for ExecutionConsole metadata display
  const [activeTool, setActiveTool] = useState<PilotTool | null>(null);

  // Suite filter (null = show all)
  const [suiteFilter, setSuiteFilter] = useState<string | null>(null);

  // Load tools from the Pilot manifest on mount
  useEffect(() => {
    let cancelled = false;
    setToolsLoading(true);
    setToolsError(null);

    listPilotTools()
      .then((response) => {
        if (!cancelled) {
          setTools(response.tools);
          setToolsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToolsError(err instanceof Error ? err.message : 'Failed to load tools');
          setToolsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Record completed invocations into history
  useEffect(() => {
    const { phase, toolId, correlationId, errorCode } = invocation.state;
    if ((phase === 'succeeded' || phase === 'failed') && toolId && correlationId) {
      setInvocationHistory((prev) => {
        // Avoid duplicate entries for the same correlationId
        if (prev.some((r) => r.correlationId === correlationId)) return prev;
        const record: InvocationRecord = {
          id: `inv-${Date.now()}`,
          toolId,
          status: phase === 'succeeded' ? 'success' : 'error',
          correlationId,
          timestamp: new Date(),
          errorCode: errorCode ?? undefined,
        };
        return [record, ...prev];
      });
    }
  }, [invocation.state.phase, invocation.state.toolId, invocation.state.correlationId, invocation.state.errorCode]);

  // Invoke a tool through the governed lifecycle
  const handleInvokeTool = useCallback(
    (tool: PilotTool) => {
      setActiveTool(tool);
      invocation.invoke(tool.toolId, { parcelId });
    },
    [invocation, parcelId]
  );

  // Memoize the tool currently being invoked (for ExecutionConsole display)
  const activeToolMeta = useMemo(() => {
    if (activeTool) return activeTool;
    if (invocation.state.toolId) {
      return tools.find((t) => t.toolId === invocation.state.toolId) ?? null;
    }
    return null;
  }, [activeTool, invocation.state.toolId, tools]);

  const isInvoking = invocation.state.phase !== 'idle';

  // R2.12: Group tools by suite
  const grouped = useMemo(() => groupToolsBySuite(tools), [tools]);
  const activeSuites = useMemo(
    () => SUITE_ORDER.filter((s) => grouped[s]?.length > 0),
    [grouped]
  );

  // Evidence Rail — parcel-scoped trace list feed
  const traceList = usePilotTraceList({ parcelId });

  return (
    <div className='tf-suite-pilot space-y-6' data-testid='property-pilot-tab'>
      {/* Header */}
      <ParcelContextHeader
        icon='🎮'
        title='Pilot'
        parcelId={parcelId}
        subtitle={`${tools.length} tools available for parcel ${parcelId}`}
        actions={
          <button
            onClick={() => window.open(`/property/${encodeURIComponent(parcelId)}/pilot`, '_blank')}
            className='px-3 py-1.5 text-sm tf-hover-surface rounded-lg transition-colors'
          >
            Full Console →
          </button>
        }
      />

      {/* Tool loading states */}
      {toolsLoading && (
        <div className='tf-status-info rounded-xl p-4' role='status'>
          <div className='flex items-center gap-3'>
            <div className='w-5 h-5 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(var(--tf-text) / 0.3)', borderTopColor: 'hsl(var(--tf-text))' }} />
            <span className='tf-text'>Loading tools from manifest…</span>
          </div>
        </div>
      )}

      {toolsError && (
        <div className='tf-status-error rounded-xl p-4'>
          <p className='tf-text'>Failed to load tools: {toolsError}</p>
          <button
            onClick={() => {
              setToolsLoading(true);
              setToolsError(null);
              listPilotTools()
                .then((r) => { setTools(r.tools); setToolsLoading(false); })
                .catch((e) => { setToolsError(e instanceof Error ? e.message : 'Retry failed'); setToolsLoading(false); });
            }}
            className='mt-2 px-3 py-1 text-sm tf-hover-surface rounded'
          >
            Retry
          </button>
        </div>
      )}

      {/* R2.12: Suite filter chips */}
      {!toolsLoading && !toolsError && tools.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setSuiteFilter(null)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              suiteFilter === null
                ? 'bg-white/20 tf-text font-semibold'
                : 'bg-white/5 tf-text-muted hover:bg-white/10'
            }`}
          >
            All ({tools.length})
          </button>
          {activeSuites.map((suiteId) => {
            const info = SUITE_INFO[suiteId];
            const count = grouped[suiteId]?.length ?? 0;
            return (
              <button
                key={suiteId}
                onClick={() => setSuiteFilter(suiteFilter === suiteId ? null : suiteId)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  suiteFilter === suiteId
                    ? 'bg-white/20 tf-text font-semibold'
                    : 'bg-white/5 tf-text-muted hover:bg-white/10'
                }`}
              >
                {info?.icon ?? '📦'} {info?.name ?? suiteId} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Tool Cards — grouped by suite */}
      {!toolsLoading && !toolsError && tools.length > 0 && (
        <div className='space-y-6'>
          {activeSuites
            .filter((s) => !suiteFilter || s === suiteFilter)
            .map((suiteId) => {
              const suiteTools = grouped[suiteId] ?? [];
              const info = SUITE_INFO[suiteId];
              return (
                <div key={suiteId}>
                  <div className='flex items-center gap-2 mb-3'>
                    <span className='text-lg'>{info?.icon ?? '📦'}</span>
                    <h2 className='tf-text font-semibold text-sm'>
                      {info?.name ?? suiteId}
                    </h2>
                    <span className='tf-text-muted text-xs'>
                      {info?.description}
                    </span>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {suiteTools.map((tool) => (
                      <div
                        key={tool.toolId}
                        className='tf-suite-card rounded-xl p-5'
                      >
                        <div className='flex items-start justify-between mb-3'>
                          <div className='flex items-center gap-2'>
                            <span className='text-2xl'>{RISK_ICON[tool.risk]}</span>
                            <div>
                              <h3 className='tf-text font-semibold'>
                                {tool.displayName ?? tool.toolId}
                              </h3>
                              <div className='flex items-center gap-1.5'>
                                <code className='text-xs tf-text-muted'>{tool.toolId}</code>
                                {hasDirectRoute(tool.toolId) && (
                                  <span className='text-[10px] px-1 py-0.5 rounded bg-green-500/20 text-green-400' title='Direct frontend→backend route available'>
                                    direct
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs ${RISK_BADGE_CLASS[tool.risk]} rounded`}>
                            {RISK_LABEL[tool.risk]}
                          </span>
                        </div>
                        {tool.description && (
                          <p className='tf-text-secondary text-sm mb-4'>{tool.description}</p>
                        )}
                        <button
                          onClick={() => handleInvokeTool(tool)}
                          disabled={isInvoking}
                          className='tf-suite-pilot-cta w-full px-4 py-2 rounded-lg transition-colors disabled:opacity-50'
                        >
                          {isInvoking && invocation.state.toolId === tool.toolId
                            ? 'Running…'
                            : 'Run Tool'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {!toolsLoading && !toolsError && tools.length === 0 && (
        <div className='tf-status-info rounded-xl p-4'>
          <p className='tf-text-muted text-center'>No tools available in the manifest.</p>
        </div>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 items-start'>
        <div className='xl:col-span-2 space-y-4'>
          {/* Execution Console — lifecycle + confirmation gate + correlationId */}
          <ExecutionConsole
            invocation={invocation}
            tool={activeToolMeta}
          />

          {/* Invocation History */}
          <InvocationHistory
            records={invocationHistory}
            title='Invocation History'
            emptyMessage='No tool invocations for this parcel yet.'
          />
        </div>

        <EvidenceRail phase={traceList.phase} events={traceList.events} error={traceList.error} onRetry={traceList.refresh} />
      </div>
    </div>
  );
};

export default PropertyPilot;
