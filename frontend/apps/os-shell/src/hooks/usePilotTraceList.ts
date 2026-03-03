/**
 * usePilotTraceList.ts
 *
 * Lane A: Parcel-scoped trace list feed with incremental polling.
 *
 * States: idle | loading | ready | error
 *
 * Behavior:
 *   - Initial fetch: GET /pilot/traces?parcelId=&limit=50&offset=0
 *   - Poll refresh: from=lastSeenTimestamp (newest event) to fetch only new events
 *   - Merges new events at front, dedupes by eventId
 *   - Newest-first ordering maintained
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PilotTraceEvent, PilotTraceListParams } from '../api/pilotApi';
import { listPilotTraces } from '../api/pilotApi';

// ============================================================================
// Types
// ============================================================================

export type TraceListPhase = 'idle' | 'loading' | 'ready' | 'error';

export interface UsePilotTraceListOptions {
  parcelId: string | null | undefined;
  toolId?: string;
  limit?: number;
  /** Polling interval in ms. Default 5000. Set 0 to disable polling. */
  pollMs?: number;
}

export interface UsePilotTraceListResult {
  phase: TraceListPhase;
  events: PilotTraceEvent[];
  error: string | null;
  refresh: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LIMIT = 50;
const DEFAULT_POLL_MS = 5000;

// ============================================================================
// Hook
// ============================================================================

export function usePilotTraceList(options: UsePilotTraceListOptions): UsePilotTraceListResult {
  const { parcelId, toolId, limit = DEFAULT_LIMIT, pollMs = DEFAULT_POLL_MS } = options;

  const [phase, setPhase] = useState<TraceListPhase>('idle');
  const [events, setEvents] = useState<PilotTraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Track latest seen timestamp for incremental poll
  const newestTimestampRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeParcelRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Merge new events into the existing list, deduping by eventId, newest-first
  const mergeEvents = useCallback(
    (existing: PilotTraceEvent[], incoming: PilotTraceEvent[]): PilotTraceEvent[] => {
      const seen = new Set(existing.map(e => e.eventId));
      const novel = incoming.filter(e => !seen.has(e.eventId));
      if (novel.length === 0) return existing;

      // Prepend new events (they're already newest-first from the API)
      const merged = [...novel, ...existing];
      // Re-sort newest first in case of any ordering edge
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return merged;
    },
    [],
  );

  const fetchList = useCallback(
    async (pid: string, isIncremental: boolean) => {
      if (activeParcelRef.current !== pid) return;

      try {
        const params: PilotTraceListParams = {
          parcelId: pid,
          limit,
        };
        if (toolId) params.toolId = toolId;

        // Incremental: only fetch events newer than what we have
        if (isIncremental && newestTimestampRef.current) {
          params.from = newestTimestampRef.current;
        }

        const response = await listPilotTraces(params);

        if (activeParcelRef.current !== pid) return;

        setEvents(prev => {
          const merged = isIncremental ? mergeEvents(prev, response.events) : response.events;
          // Update newest timestamp
          if (merged.length > 0) {
            newestTimestampRef.current = merged[0].timestamp;
          }
          return merged;
        });
        setPhase('ready');
        setError(null);
      } catch (err) {
        if (activeParcelRef.current !== pid) return;
        setError(err instanceof Error ? err.message : String(err));
        setPhase('error');
      }

      // Schedule next poll
      if (pollMs > 0 && activeParcelRef.current === pid) {
        timerRef.current = setTimeout(() => fetchList(pid, true), pollMs);
      }
    },
    [limit, toolId, pollMs, mergeEvents],
  );

  // Manual refresh (full re-fetch, not incremental)
  const refresh = useCallback(() => {
    if (!parcelId) return;
    cleanup();
    newestTimestampRef.current = null;
    setPhase('loading');
    fetchList(parcelId, false);
  }, [parcelId, cleanup, fetchList]);

  // Start/restart when parcelId or toolId changes
  useEffect(() => {
    cleanup();

    if (!parcelId) {
      activeParcelRef.current = null;
      setPhase('idle');
      setEvents([]);
      setError(null);
      return;
    }

    activeParcelRef.current = parcelId;
    newestTimestampRef.current = null;
    setPhase('loading');
    setEvents([]);
    setError(null);

    fetchList(parcelId, false);

    return cleanup;
  }, [parcelId, toolId, cleanup, fetchList]);

  return { phase, events, error, refresh };
}
