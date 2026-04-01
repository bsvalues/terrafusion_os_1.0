/**
 * EvidenceRail.tsx
 *
 * PR-UI2 + Lane I: Presentational trace-event timeline with UX diagnostics.
 * Receives data from parent via props — does NOT fetch on its own.
 *
 * Gate 6 compliant:
 *  - payloadRef shown as "Payload stored: <ref>" (no link, no raw data)
 *  - redactedFields shown as notice, never revealed
 *  - summary text only — no raw payload expansion
 *
 * Lane I additions:
 *  - Staleness indicator (lastFetchedAt / fetchFailed)
 *  - Context-aware empty-state messaging (isFiltered)
 *  - Admin diagnostics drawer (showDiagnostics + diagnostics)
 */

import React, { useState } from 'react';
import type { PilotTraceEvent } from '../../api/pilotApi';
import type { TracePhase } from '../../hooks/useTraceByCorrelationId';
import type { TraceListPhase } from '../../hooks/usePilotTraceList';
import { TactileButton } from '../../ui/materials/TactileButton';

// ============================================================================
// Diagnostics types
// ============================================================================

export interface EvidenceRailDiagnostics {
  perParcelCap: number;
  cappedParcelsCount: number;
  maxEventsInParcel: number;
  oldestEventTimestamp: string | null;
  newestEventTimestamp: string | null;
}

// ============================================================================
// Props
// ============================================================================

export interface EvidenceRailProps {
  phase: TracePhase | TraceListPhase;
  events: PilotTraceEvent[];
  error: string | null;
  onRetry: () => void;

  /** Lane I: Timestamp of last successful data fetch (for staleness display). */
  lastFetchedAt?: Date | null;
  /** Lane I: Whether the last poll/fetch failed (shows "Feed unavailable"). */
  fetchFailed?: boolean;
  /** Lane I: Whether filters are currently active (changes empty-state text). */
  isFiltered?: boolean;
  /** Lane I: Admin diagnostics data (only rendered when showDiagnostics is true). */
  diagnostics?: EvidenceRailDiagnostics | null;
  /** Lane I: Show the diagnostics drawer (admin:trace role gate). */
  showDiagnostics?: boolean;
  /** Lane I: Clock override for deterministic staleness display (test-only). */
  now?: Date;
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
  tool_succeeded:      { icon: '✅', severity: 'success' },
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

/** Relative-time helper (e.g. "2 minutes ago", "just now"). */
function formatRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CorrelationHeader({ events }: { events: PilotTraceEvent[] }) {
  if (events.length === 0) return null;

  // Detect if showing multiple correlations (list mode) or single (detail mode)
  const uniqueCorrelations = new Set(events.map(e => e.correlationId));
  const isList = uniqueCorrelations.size > 1;

  const timestamps = events.map((e) => new Date(e.timestamp).getTime()).filter((t) => !Number.isNaN(t));
  const earliest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
  const latest = timestamps.length > 1 ? new Date(Math.max(...timestamps)) : null;

  return (
    <div className="flex items-center justify-between text-[11px] text-white/50 px-1" data-testid="evidence-header">
      {isList ? (
        <span className="bg-black/30 px-2 py-0.5 rounded">{uniqueCorrelations.size} invocations</span>
      ) : (
        <code className="bg-black/30 px-2 py-0.5 rounded truncate max-w-[60%]">{events[0].correlationId}</code>
      )}
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

/** Lane I: Staleness footer shown below the timeline. */
function StalenessFooter({ lastFetchedAt, fetchFailed, now }: { lastFetchedAt?: Date | null; fetchFailed?: boolean; now?: Date }) {
  if (fetchFailed) {
    return (
      <p className="text-[11px] text-red-400/80 pt-2 border-t border-white/5" data-testid="staleness-unavailable">
        Feed unavailable
      </p>
    );
  }
  if (!lastFetchedAt) return null;
  const relative = formatRelativeTime(lastFetchedAt, now ?? new Date());
  return (
    <p className="text-[11px] text-white/30 pt-2 border-t border-white/5" data-testid="staleness-indicator">
      Last updated: {relative}
    </p>
  );
}

/** Lane I: Admin diagnostics drawer (collapsible). */
function DiagnosticsDrawer({ diagnostics }: { diagnostics: EvidenceRailDiagnostics }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pt-2 border-t border-white/5" data-testid="diagnostics-drawer">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="text-[11px] text-white/40 hover:text-white/60 transition-colors cursor-pointer"
        data-testid="diagnostics-toggle"
        aria-expanded={open}
      >
        {open ? '▾ Hide diagnostics' : '▸ Show diagnostics'}
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]" data-testid="diagnostics-content">
          <dt className="text-white/40">Per-parcel cap</dt>
          <dd className="text-white/70" data-testid="diag-per-parcel-cap">{diagnostics.perParcelCap === 0 ? 'disabled' : diagnostics.perParcelCap}</dd>

          <dt className="text-white/40">Capped parcels</dt>
          <dd className="text-white/70" data-testid="diag-capped-parcels-count">{diagnostics.cappedParcelsCount}</dd>

          <dt className="text-white/40">Max events in parcel</dt>
          <dd className="text-white/70" data-testid="diag-max-events-in-parcel">{diagnostics.maxEventsInParcel}</dd>

          <dt className="text-white/40">Oldest event</dt>
          <dd className="text-white/70" data-testid="diag-oldest-event">
            {diagnostics.oldestEventTimestamp ? formatTimestamp(diagnostics.oldestEventTimestamp) : '—'}
          </dd>

          <dt className="text-white/40">Newest event</dt>
          <dd className="text-white/70" data-testid="diag-newest-event">
            {diagnostics.newestEventTimestamp ? formatTimestamp(diagnostics.newestEventTimestamp) : '—'}
          </dd>
        </dl>
      )}
    </div>
  );
}

export const EvidenceRail: React.FC<EvidenceRailProps> = ({
  phase,
  events,
  error,
  onRetry,
  lastFetchedAt,
  fetchFailed,
  isFiltered,
  diagnostics,
  showDiagnostics,
  now,
}) => {
  // Loading / polling states
  if (phase === 'loading' || phase === 'polling') {
    return (
      <div style={{ background: 'hsl(var(--tf-surface))' }} className="p-4" data-testid="evidence-loading">
        <p className="text-xs text-white/60 animate-pulse">
          {phase === 'loading' ? 'Loading trace…' : 'Waiting for trace events…'}
        </p>
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div style={{ background: 'hsl(var(--tf-surface))' }} className="p-4 space-y-2" data-testid="evidence-error">
        <p className="text-xs text-red-300">Feed unavailable: {error}</p>
        <TactileButton size="sm" onClick={onRetry}>
          Retry
        </TactileButton>
      </div>
    );
  }

  // Empty state — context-aware messaging
  if (phase === 'empty' || (phase === 'ready' && events.length === 0)) {
    return (
      <div style={{ background: 'hsl(var(--tf-surface))' }} className="p-4" data-testid="evidence-empty">
        <p className="text-xs text-white/50">
          {isFiltered
            ? 'No matches for current filters.'
            : 'No trace events returned for this parcel.'}
        </p>
      </div>
    );
  }

  // Idle — nothing to show
  if (phase === 'idle') return null;

  // Ready with events — render timeline
  return (
    <div style={{ background: 'hsl(var(--tf-surface))' }} className="p-4 space-y-3" data-testid="evidence-timeline">
      <CorrelationHeader events={events} />

      <div className="max-h-[28rem] overflow-y-auto pr-1">
        {events.map((event) => (
          <TimelineEvent key={event.eventId} event={event} />
        ))}
      </div>

      {/* Lane I: Staleness indicator */}
      <StalenessFooter lastFetchedAt={lastFetchedAt} fetchFailed={fetchFailed} now={now} />

      {/* Lane I: Admin diagnostics drawer */}
      {showDiagnostics && diagnostics && <DiagnosticsDrawer diagnostics={diagnostics} />}
    </div>
  );
};

export default EvidenceRail;

