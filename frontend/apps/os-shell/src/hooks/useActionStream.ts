/**
 * Action Stream Hook
 *
 * Subscribes to OS action trace events and maintains a capped in-memory list.
 * Supports filtering by surface, suiteId, and action type.
 * Supports Live mode (real-time) and History mode (persisted events).
 *
 * @module hooks/useActionStream
 * @see Slice 17: Action Observability Surface
 * @see Slice 20: Persisted Telemetry Backend
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    subscribeToAllTraces,
    type CustomTraceEvent,
    type OsActionAnyTraceEvent,
    type OsActionBlockedEvent,
    type OsActionContext,
    type OsActionTraceEvent,
} from '../services/osActions';
import { getTelemetryStore, type StoredTraceEvent } from '../services/telemetry/telemetryStore';

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of events to keep in memory */
export const ACTION_STREAM_CAP = 100;

// ============================================================================
// Types
// ============================================================================

/**
 * Unified action stream event type for display
 */
export interface ActionStreamEvent {
  id: string;
  type: 'invoked' | 'blocked' | 'custom';
  timestamp: number;
  actionId: string;
  actionType: 'navigation' | 'handler' | 'custom';
  intent: string;
  surface: OsActionContext['surface'];
  suiteId: string;
  moduleId?: string;
  href?: string;
  handlerKey?: string;
  /** Blocked events only */
  blockReason?: 'disabled' | 'policy';
  blockReasonDetail?: string;
  /** Custom events only */
  customType?: string;
  customPayload?: Record<string, unknown>;
}

/**
 * Filter options for action stream
 */
export interface ActionStreamFilter {
  surface?: OsActionContext['surface'];
  suiteId?: string;
  status?: 'invoked' | 'blocked' | 'custom' | 'all';
}

/**
 * Stream mode (Live or History)
 */
export type StreamMode = 'live' | 'history';

/**
 * Return type from useActionStream hook
 */
export interface UseActionStreamResult {
  /** All events (newest first, capped) */
  events: ActionStreamEvent[];
  /** Filtered events based on current filter */
  filteredEvents: ActionStreamEvent[];
  /** Current filter settings */
  filter: ActionStreamFilter;
  /** Update filter */
  setFilter: (filter: ActionStreamFilter) => void;
  /** Clear all events (Live mode only) */
  clear: () => void;
  /** Total event count (before filtering) */
  totalCount: number;
  /** Current mode (live or history) */
  mode: StreamMode;
  /** Switch mode */
  setMode: (mode: StreamMode) => void;
  /** History-only: wipe persisted events */
  wipeHistory: () => Promise<void>;
  /** History-only: refresh from store */
  refreshHistory: () => Promise<void>;
  /** History stats from store */
  historyStats: { eventCount: number };
  /** Loading state for history */
  isLoadingHistory: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

let eventIdCounter = 0;

function traceEventToStreamEvent(event: OsActionAnyTraceEvent): ActionStreamEvent {
  eventIdCounter += 1;

  if (event.type === 'os_action_invoked') {
    const invoked = event as OsActionTraceEvent;
    return {
      id: `stream-${eventIdCounter}`,
      type: 'invoked',
      timestamp: invoked.timestamp,
      actionId: invoked.payload.actionId,
      actionType: invoked.payload.actionType,
      intent: invoked.payload.intent,
      surface: invoked.payload.surface,
      suiteId: invoked.payload.suiteId,
      moduleId: invoked.payload.moduleId,
      href: invoked.payload.href,
      handlerKey: invoked.payload.handlerKey,
    };
  } else if (event.type === 'os_action_blocked') {
    const blocked = event as OsActionBlockedEvent;
    return {
      id: `stream-${eventIdCounter}`,
      type: 'blocked',
      timestamp: blocked.timestamp,
      actionId: blocked.payload.actionId,
      actionType: blocked.payload.actionType,
      intent: blocked.payload.intent,
      surface: blocked.payload.surface,
      suiteId: blocked.payload.suiteId,
      blockReason: blocked.payload.blockReason,
      blockReasonDetail:
        blocked.payload.blockReason === 'disabled'
          ? blocked.payload.disabledReason
          : blocked.payload.policyReason,
    };
  } else {
    // Handle custom events (policy_updated, policy_reset, etc.)
    const custom = event as CustomTraceEvent;
    return {
      id: `stream-${eventIdCounter}`,
      type: 'custom',
      timestamp: custom.timestamp,
      actionId: custom.type, // Use custom event type as actionId
      actionType: 'custom',
      intent: 'system',
      surface: 'trace' as OsActionContext['surface'],
      suiteId: 'policy',
      customType: custom.type,
      customPayload: custom.payload,
    };
  }
}

function storedEventToStreamEvent(stored: StoredTraceEvent): ActionStreamEvent {
  return {
    id: stored.id,
    type: stored.type === 'os_action_invoked' ? 'invoked' : 'blocked',
    timestamp: stored.timestamp,
    actionId: stored.payload.actionId,
    actionType: stored.payload.actionType as 'navigation' | 'handler',
    intent: stored.payload.intent,
    surface: stored.payload.surface as OsActionContext['surface'],
    suiteId: stored.payload.suiteId,
    moduleId: stored.payload.moduleId as string | undefined,
    href: stored.payload.href,
    handlerKey: stored.payload.handlerKey as string | undefined,
    blockReason: stored.payload.blockReason as 'disabled' | 'policy' | undefined,
    blockReasonDetail: stored.payload.blockReasonDetail as string | undefined,
  };
}

function matchesFilter(event: ActionStreamEvent, filter: ActionStreamFilter): boolean {
  // Surface filter
  if (filter.surface && event.surface !== filter.surface) {
    return false;
  }

  // SuiteId filter (case-insensitive contains)
  if (filter.suiteId && !event.suiteId.toLowerCase().includes(filter.suiteId.toLowerCase())) {
    return false;
  }

  // Status filter
  if (filter.status && filter.status !== 'all' && event.type !== filter.status) {
    return false;
  }

  return true;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to subscribe to action stream events
 *
 * @param options - Optional configuration options
 * @param options.telemetryStore - Optional telemetry store for testing (defaults to singleton)
 * @returns UseActionStreamResult with events, filtering, and controls
 */
export function useActionStream(options?: {
  telemetryStore?: ReturnType<typeof getTelemetryStore>;
}): UseActionStreamResult {
  const [liveEvents, setLiveEvents] = useState<ActionStreamEvent[]>([]);
  const [historyEvents, setHistoryEvents] = useState<ActionStreamEvent[]>([]);
  const [filter, setFilter] = useState<ActionStreamFilter>({ status: 'all' });
  const [mode, setMode] = useState<StreamMode>('live');
  const [historyStats, setHistoryStats] = useState({ eventCount: 0 });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Get the telemetry store (for history mode) - injectable for testing
  const store = useMemo(
    () => options?.telemetryStore ?? getTelemetryStore(),
    [options?.telemetryStore]
  );

  // Subscribe to live trace events
  useEffect(() => {
    const unsubscribe = subscribeToAllTraces((event) => {
      const streamEvent = traceEventToStreamEvent(event);

      setLiveEvents((prev) => {
        // Add to front (newest first), cap at max
        const next = [streamEvent, ...prev];
        if (next.length > ACTION_STREAM_CAP) {
          return next.slice(0, ACTION_STREAM_CAP);
        }
        return next;
      });
    });

    return unsubscribe;
  }, []);

  // Load history when mode changes to 'history'
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const events = await store.list({ limit: 500 });
      const stats = await store.stats();

      setHistoryEvents(events.map(storedEventToStreamEvent));
      setHistoryStats(stats);
    } catch (error) {
      console.warn('[useActionStream] Failed to load history:', error);
      setHistoryEvents([]);
      setHistoryStats({ eventCount: 0 });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [store]);

  useEffect(() => {
    if (mode === 'history') {
      void loadHistory();
    }
  }, [mode, loadHistory]);

  // Get current events based on mode
  const events = mode === 'live' ? liveEvents : historyEvents;

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => matchesFilter(e, filter));
  }, [events, filter]);

  // Clear function (live mode only)
  const clear = useCallback(() => {
    if (mode === 'live') {
      setLiveEvents([]);
    }
  }, [mode]);

  // Wipe history (history mode only)
  const wipeHistory = useCallback(async () => {
    if (mode === 'history') {
      await store.wipe();
      await loadHistory();
    }
  }, [mode, store, loadHistory]);

  // Refresh history
  const refreshHistory = useCallback(async () => {
    if (mode === 'history') {
      await loadHistory();
    }
  }, [mode, loadHistory]);

  return {
    events,
    filteredEvents,
    filter,
    setFilter,
    clear,
    totalCount: events.length,
    mode,
    setMode,
    wipeHistory,
    refreshHistory,
    historyStats,
    isLoadingHistory,
  };
}
