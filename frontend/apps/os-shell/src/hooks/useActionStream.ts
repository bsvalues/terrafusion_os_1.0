/**
 * Action Stream Hook
 *
 * Subscribes to OS action trace events and maintains a capped in-memory list.
 * Supports filtering by surface, suiteId, and action type.
 *
 * @module hooks/useActionStream
 * @see Slice 17: Action Observability Surface
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  subscribeToAllTraces,
  type OsActionTraceEvent,
  type OsActionBlockedEvent,
  type OsActionAnyTraceEvent,
  type OsActionContext,
} from '../services/osActions';

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
  type: 'invoked' | 'blocked';
  timestamp: number;
  actionId: string;
  actionType: 'navigation' | 'handler';
  intent: string;
  surface: OsActionContext['surface'];
  suiteId: string;
  moduleId?: string;
  href?: string;
  handlerKey?: string;
  /** Blocked events only */
  blockReason?: 'disabled' | 'policy';
  blockReasonDetail?: string;
}

/**
 * Filter options for action stream
 */
export interface ActionStreamFilter {
  surface?: OsActionContext['surface'];
  suiteId?: string;
  status?: 'invoked' | 'blocked' | 'all';
}

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
  /** Clear all events */
  clear: () => void;
  /** Total event count (before filtering) */
  totalCount: number;
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
  } else {
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
  }
}

function matchesFilter(event: ActionStreamEvent, filter: ActionStreamFilter): boolean {
  // Surface filter
  if (filter.surface && event.surface !== filter.surface) {
    return false;
  }

  // SuiteId filter (case-insensitive contains)
  if (
    filter.suiteId &&
    !event.suiteId.toLowerCase().includes(filter.suiteId.toLowerCase())
  ) {
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
 * @returns UseActionStreamResult with events, filtering, and controls
 */
export function useActionStream(): UseActionStreamResult {
  const [events, setEvents] = useState<ActionStreamEvent[]>([]);
  const [filter, setFilter] = useState<ActionStreamFilter>({ status: 'all' });

  // Subscribe to all trace events
  useEffect(() => {
    const unsubscribe = subscribeToAllTraces((event) => {
      const streamEvent = traceEventToStreamEvent(event);

      setEvents((prev) => {
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

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => matchesFilter(e, filter));
  }, [events, filter]);

  // Clear function
  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    filteredEvents,
    filter,
    setFilter,
    clear,
    totalCount: events.length,
  };
}
