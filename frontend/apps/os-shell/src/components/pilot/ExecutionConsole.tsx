/**
 * ExecutionConsole.tsx
 *
 * PR-UI1 + PR-UI2: Governed Tool Invocation Console + Evidence Rail
 *
 * Renders the full tool invocation lifecycle with correlationId at every stage.
 * Composes with RiskConfirmationModal for Gate 5 enforcement.
 * On terminal states, offers "Show evidence" toggle to display trace timeline.
 *
 * Lifecycle: idle → preflight → confirming → executing → succeeded → failed
 *
 * Uses real pilotApi — no mock data, no demo tools.
 */

import React, { useCallback, useState } from 'react';
import type { ApprovalToken, PilotTool, Risk } from '../../api/pilotApi';
import { exportTraces, requestApprovalToken } from '../../api/pilotApi';
import { getSession } from '../../auth/session';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { TactileButton } from '../../ui/materials/TactileButton';
import type { InvocationPhase, UseToolInvocationResult } from '../../hooks/useToolInvocation';
import { useTraceByCorrelationId } from '../../hooks/useTraceByCorrelationId';
import { useTraceStats } from '../../hooks/useTraceStats';
import { EvidenceRail } from './EvidenceRail';
import { RiskConfirmationModal } from './RiskConfirmationModal';

// Roles that may view store-wide trace diagnostics (mirrors backend ELEVATED_TRACE_ROLES)
const ELEVATED_TRACE_ROLES = new Set([
  'admin',
  'administrator',
  'compliance_officer',
  'auditor',
  'supervisor',
]);

function canViewGlobalTraceDiagnostics(): boolean {
  const session = getSession();
  if (!session) return false;

  const role = (session.role ?? '').toLowerCase();
  if (role && ELEVATED_TRACE_ROLES.has(role)) return true;

  return (session.permissions ?? []).some((permission) => permission.toLowerCase() === 'admin:trace');
}

// ============================================================================
// Types
// ============================================================================

export interface ExecutionConsoleProps {
  /** Hook return from useToolInvocation */
  invocation: UseToolInvocationResult;
  /** Tool metadata (for display) */
  tool?: PilotTool | null;
  /** Whether to show reset button after completion */
  showReset?: boolean;
}

// ============================================================================
// Sub-components
// ============================================================================

const PhaseIndicator: React.FC<{ phase: InvocationPhase }> = ({ phase }) => {
  const config: Record<InvocationPhase, { icon: string; label: string; color: string }> = {
    idle: { icon: '⏸', label: 'Ready', color: 'text-white/50' },
    preflight: { icon: '🔍', label: 'Preflight Check', color: 'text-amber-400' },
    confirming: { icon: '🔐', label: 'Awaiting Confirmation', color: 'text-amber-400' },
    executing: { icon: '⚡', label: 'Executing', color: 'text-cyan-400' },
    succeeded: { icon: '✅', label: 'Succeeded', color: 'text-emerald-400' },
    failed: { icon: '❌', label: 'Failed', color: 'text-red-400' },
  };

  const { icon, label, color } = config[phase];

  return (
    <div className='flex items-center gap-2' data-testid='phase-indicator'>
      <span role='img' aria-label={label}>{icon}</span>
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      {(phase === 'preflight' || phase === 'executing') && (
        <span className='inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin' />
      )}
    </div>
  );
};

const CorrelationBadge: React.FC<{ correlationId: string }> = ({ correlationId }) => {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(correlationId).catch(console.error);
  }, [correlationId]);

  return (
    <div className='flex items-center gap-2' data-testid='correlation-badge'>
      <code className='text-xs text-white/60 bg-black/30 px-2 py-1 rounded font-mono'>
        {correlationId.length > 20 ? `${correlationId.substring(0, 20)}…` : correlationId}
      </code>
      <button
        onClick={handleCopy}
        className='text-xs text-white/40 hover:text-white/70 transition-colors'
        title='Copy full correlationId'
        aria-label='Copy correlation ID'
      >
        📋
      </button>
    </div>
  );
};

const RiskBadge: React.FC<{ risk: Risk }> = ({ risk }) => {
  const styles: Record<Risk, string> = {
    read_only: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    write_low: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    write_high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    irreversible: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${styles[risk]}`}>
      {risk.replace('_', ' ')}
    </span>
  );
};

const ResultDisplay: React.FC<{ result: unknown }> = ({ result }) => {
  if (result === null || result === undefined) return null;

  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  return (
    <div className='mt-3' data-testid='result-display'>
      <pre className='text-xs text-white/70 bg-black/30 rounded p-3 overflow-auto max-h-60 whitespace-pre-wrap font-mono'>
        {text}
      </pre>
    </div>
  );
};

const ErrorDisplay: React.FC<{ error: string; errorCode?: string | null }> = ({ error, errorCode }) => (
  <div className='mt-3 border border-red-500/30 bg-red-500/10 rounded p-3' data-testid='error-display'>
    {errorCode && (
      <code className='text-xs text-red-300 bg-red-500/20 px-2 py-0.5 rounded mb-2 inline-block'>
        {errorCode}
      </code>
    )}
    <p className='text-sm text-red-300'>{error}</p>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  invocation,
  tool,
  showReset = true,
}) => {
  const { state, confirm, cancel, reset } = invocation;
  const { phase, correlationId, error, errorCode, response, confirmation } = state;

  // Approval token state for irreversible tools
  const [approvalToken, setApprovalToken] = useState<ApprovalToken | null>(null);
  const [approvalTokenError, setApprovalTokenError] = useState<string | undefined>();
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const handleRequestApprovalToken = useCallback(
    async (reasonCode: string) => {
      if (!state.toolId || !state.params) return;
      setIsGeneratingToken(true);
      setApprovalTokenError(undefined);
      try {
        const tokenResponse = await requestApprovalToken({
          toolId: state.toolId,
          params: state.params,
          reasonCode,
        });
        if (tokenResponse.success && tokenResponse.token) {
          setApprovalToken(tokenResponse.token);
        } else {
          setApprovalTokenError(tokenResponse.error ?? 'Failed to generate approval token');
        }
      } catch (err) {
        setApprovalTokenError(err instanceof Error ? err.message : 'Token generation failed');
      } finally {
        setIsGeneratingToken(false);
      }
    },
    [state.toolId, state.params]
  );

  const handleConfirm = useCallback(
    async (options?: { reasonCode?: string; approvalToken?: string }) => {
      await confirm({
        confirmation: true,
        reasonCode: options?.reasonCode,
      });
    },
    [confirm]
  );

  const handleCancel = useCallback(() => {
    setApprovalToken(null);
    setApprovalTokenError(undefined);
    cancel();
  }, [cancel]);

  const handleReset = useCallback(() => {
    setApprovalToken(null);
    setApprovalTokenError(undefined);
    setShowEvidence(false);
    reset();
  }, [reset]);

  // K4: Trace export — download NDJSON evidence pack (admin/elevated only)
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    const parcelId = state.params?.parcelId as string | undefined;
    if (!parcelId) return;
    setExportBusy(true);
    setExportError(null);
    try {
      const blob = await exportTraces({
        parcelId,
        correlationId: correlationId ?? undefined,
      });
      const corrPart = correlationId ?? 'all';
      const ts = new Date().toISOString().replace(/[:.]/g, '').replace('Z', 'Z');
      const filename = `trace-export_${parcelId}_${corrPart}_${ts}.ndjson`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const e = err as Error & { correlationId?: string };
      const suffix = e.correlationId ? ` [${e.correlationId}]` : '';
      setExportError(`${e.message}${suffix}`);
    } finally {
      setExportBusy(false);
    }
  }, [state.params, correlationId]);

  // PR-UI2: Evidence Rail — trace polling, only active on terminal states + toggle
  const [showEvidence, setShowEvidence] = useState(false);
  const isTerminal = phase === 'succeeded' || phase === 'failed';
  const traceCorrelationId = isTerminal && showEvidence ? correlationId : null;
  const trace = useTraceByCorrelationId(traceCorrelationId);

  // Lane J: Admin diagnostics — fetch store-wide stats when elevated role + evidence visible
  const showDiagnostics = canViewGlobalTraceDiagnostics();
  const traceStats = useTraceStats({
    enabled: showDiagnostics && showEvidence && isTerminal,
  });

  // Idle state — nothing to show yet
  if (phase === 'idle') {
    return null;
  }

  return (
    <LiquidPanel variant='infrastructure' radius='xl' className='p-4 space-y-3'>
      {/* Header: Phase + Tool Info */}
      <div className='flex items-center justify-between'>
        <PhaseIndicator phase={phase} />
        <div className='flex items-center gap-2'>
          {tool && <RiskBadge risk={tool.risk} />}
          {tool?.suite && (
            <span className='text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded'>
              {tool.suite}
            </span>
          )}
        </div>
      </div>

      {/* Tool ID */}
      {state.toolId && (
        <div className='flex items-center gap-2'>
          <code className='text-sm text-white/80 font-mono'>{state.toolId}</code>
        </div>
      )}

      {/* Correlation ID (shown when available) */}
      {correlationId && <CorrelationBadge correlationId={correlationId} />}

      {/* Confirmation Modal (Gate 5) */}
      {phase === 'confirming' && confirmation && (
        <RiskConfirmationModal
          isOpen={true}
          toolId={confirmation.toolId}
          toolDescription={confirmation.toolDescription}
          risk={confirmation.risk}
          reasonCodes={confirmation.reasonCodes}
          requiresReasonCode={confirmation.reasonCodeRequired}
          requiresSupervisorApproval={confirmation.supervisorRequired}
          supervisorRoles={confirmation.supervisorRoles}
          approvalToken={approvalToken}
          approvalTokenError={approvalTokenError}
          isGeneratingToken={isGeneratingToken}
          onRequestApprovalToken={handleRequestApprovalToken}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Success result */}
      {phase === 'succeeded' && response && (
        <>
          <ResultDisplay result={response.result} />
          {response.traceEventId && (
            <p className='text-xs text-white/40'>
              Trace: <code className='font-mono'>{response.traceEventId}</code>
            </p>
          )}
        </>
      )}

      {/* Error result */}
      {phase === 'failed' && error && (
        <ErrorDisplay error={error} errorCode={errorCode} />
      )}

      {/* K4: Admin-only trace export button */}
      {isTerminal && showDiagnostics && state.params?.parcelId && (
        <div className='space-y-1' data-testid='trace-export-section'>
          <TactileButton
            variant='ghost'
            size='sm'
            onClick={handleExport}
            disabled={exportBusy}
            data-testid='trace-export-btn'
          >
            {exportBusy ? 'Exporting…' : 'Export evidence pack (NDJSON)'}
          </TactileButton>
          {exportError && (
            <p className='text-xs text-red-400' data-testid='trace-export-error'>
              {exportError}
            </p>
          )}
        </div>
      )}

      {/* PR-UI2: Evidence Rail toggle + trace timeline */}
      {isTerminal && correlationId && (
        <div className='space-y-2'>
          <TactileButton
            variant='ghost'
            size='sm'
            onClick={() => setShowEvidence((v) => !v)}
            data-testid='evidence-toggle'
          >
            {showEvidence ? 'Hide evidence' : 'Show evidence'}
          </TactileButton>
          {showEvidence && (
            <div className='space-y-2'>
              {showDiagnostics && (
                <p className='text-xs text-white/40' data-testid='trace-diagnostics-label'>
                  Trace Store Diagnostics (global)
                </p>
              )}
              <EvidenceRail
                phase={trace.phase}
                events={trace.events}
                error={trace.error}
                onRetry={trace.refresh}
                lastFetchedAt={showDiagnostics ? traceStats.lastFetchedAt : null}
                fetchFailed={showDiagnostics ? traceStats.fetchFailed : false}
                diagnostics={showDiagnostics ? traceStats.diagnostics : null}
                showDiagnostics={showDiagnostics}
              />
            </div>
          )}
        </div>
      )}

      {/* Reset button (after terminal states) */}
      {showReset && isTerminal && (
        <div className='pt-2'>
          <TactileButton variant='ghost' size='sm' onClick={handleReset}>
            Dismiss
          </TactileButton>
        </div>
      )}
    </LiquidPanel>
  );
};

export default ExecutionConsole;
