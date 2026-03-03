/**
 * EvidenceRail.tsx
 *
 * PR-UI2: Presentational trace-event timeline.
 * Receives data from parent via props — does NOT fetch on its own.
 *
 * Gate 6 compliant:
 *  - payloadRef shown as "Payload stored: <ref>" (no link, no raw data)
 *  - redactedFields shown as notice, never revealed
 *  - summary text only — no raw payload expansion
 */

import React from 'react';
import type { PilotTraceEvent } from '../../api/pilotApi';
import type { TracePhase } from '../../hooks/useTraceByCorrelationId';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { TactileButton } from '../../ui/materials/TactileButton';

// ============================================================================
// Props
// ============================================================================

export interface EvidenceRailProps {
  phase: TracePhase;
  events: PilotTraceEvent[];
  error: string | null;
  onRetry: () => void;
}

// ============================================================================
// Event-type visual config
// ============================================================================

interface EventTypeVisual {
  icon: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

const EVENT_TYPE_CONFIG: Record<string, EventTypeVisual> = {
  tool_invoked:        { icon: '⚡', severity: 'info' },
  tool_completed:      { icon: '✅', severity: 'success' },
  tool_failed:         { icon: '❌', severity: 'error' },
  value_changed:       { icon: '📝', severity: 'info' },
  status_changed:      { icon: '🔄', severity: 'info' },
  document_generated:  { icon: '📄', severity: 'success' },
  approval_requested:  { icon: '🔔', severity: 'warning' },
  approval_granted:    { icon: '✅', severity: 'success' },
  approval_denied:     { icon: '🚫', severity: 'error' },
  redaction_requested: { icon: '🔒', severity: 'warning' },
  redaction_ticket_created: { icon: '🎫', severity: 'info' },
};

function getEventVisual(type: string): EventTypeVisual {
  return EVENT_TYPE_CONFIG[type] ?? { icon: '🧾', severity: 'info' };
}

const SEVERITY_COLORS: Record<string, string> = {
  info:    'bg-blue-900/40 text-blue-300',
  success: 'bg-green-900/40 text-green-300',
  warning: 'bg-yellow-900/40 text-yellow-300',
  error:   'bg-red-900/40 text-red-300',
};

// ============================================================================
// Sub-components
// ============================================================================

function formatTimestamp(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CorrelationHeader({ events }: { events: PilotTraceEvent[] }) {
  if (events.length === 0) return null;

  const cid = events[0].correlationId;
  const timestamps = events.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t));
  const earliest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
  const latest = timestamps.length > 1 ? new Date(Math.max(...timestamps)) : null;

  return (
    <div className="flex items-center justify-between text-[11px] text-white/50 px-1" data-testid="evidence-header">
      <code className="bg-black/30 px-2 py-0.5 rounded truncate max-w-[60%]">{cid}</code>
      <span>
        {earliest ? formatTimestamp(earliest.toISOString()) : ''}
        {latest ? ` → ${formatTimestamp(latest.toISOString())}` : ''}
        {' · '}
        {events.length} event{events.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

function TimelineEvent({ event }: { event: PilotTraceEvent }) {
  const visual = getEventVisual(event.type);
  const colorClass = SEVERITY_COLORS[visual.severity] ?? SEVERITY_COLORS.info;

  return (
    <div className="flex gap-3 py-2" data-testid="timeline-event">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <span className="text-base" aria-hidden="true">{visual.icon}</span>
        <div className="flex-1 w-px bg-white/10 mt-1" />
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colorClass}`}
            data-testid="event-type-badge"
          >
            {event.type}
          </span>
          <span className="text-[11px] text-white/40">{formatTimestamp(event.timestamp)}</span>
        </div>

        <p className="text-xs text-white/80" data-testid="event-summary">
          {event.summary}
        </p>

        {/* Gate 6: payloadRef — reference only, no link */}
        {event.payloadRef && (
          <p className="text-[11px] text-white/40 italic" data-testid="payload-ref">
            Payload stored: {event.payloadRef}
          </p>
        )}

        {/* Gate 6: redactedFields — notice only */}
        {event.redactedFields && event.redactedFields.length > 0 && (
          <p className="text-[11px] text-amber-400/80" data-testid="redacted-notice">
            {event.redactedFields.length} field{event.redactedFields.length !== 1 ? 's' : ''} redacted
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export const EvidenceRail: React.FC<EvidenceRailProps> = ({ phase, events, error, onRetry }) => {
  // Loading / polling states
  if (phase === 'loading' || phase === 'polling') {
    return (
      <LiquidPanel variant="infrastructure" radius="xl" className="p-4" data-testid="evidence-loading">
        <p className="text-xs text-white/60 animate-pulse">
          {phase === 'loading' ? 'Loading trace…' : 'Waiting for trace events…'}
        </p>
      </LiquidPanel>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <LiquidPanel variant="infrastructure" radius="xl" className="p-4 space-y-2" data-testid="evidence-error">
        <p className="text-xs text-red-300">Trace error: {error}</p>
        <TactileButton size="sm" onClick={onRetry}>
          Retry
        </TactileButton>
      </LiquidPanel>
    );
  }

  // Empty state
  if (phase === 'empty' || (phase === 'ready' && events.length === 0)) {
    return (
      <LiquidPanel variant="infrastructure" radius="xl" className="p-4" data-testid="evidence-empty">
        <p className="text-xs text-white/50">No trace events recorded for this invocation.</p>
      </LiquidPanel>
    );
  }

  // Idle — nothing to show
  if (phase === 'idle') return null;

  // Ready with events — render timeline
  return (
    <LiquidPanel variant="infrastructure" radius="xl" className="p-4 space-y-3" data-testid="evidence-timeline">
      <CorrelationHeader events={events} />

      <div className="max-h-[28rem] overflow-y-auto pr-1">
        {events.map((event) => (
          <TimelineEvent key={event.eventId} event={event} />
        ))}
      </div>
    </LiquidPanel>
  );
};

export default EvidenceRail;

