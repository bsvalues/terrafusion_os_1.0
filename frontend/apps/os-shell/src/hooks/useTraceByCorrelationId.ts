/**
 * useTraceByCorrelationId.ts
 *
 * PR-UI2: Fetch + poll trace events by correlationId with exponential backoff.
 *
 * States: idle | loading | polling | ready | empty | error
 *
 * Polling intervals: 250ms → 500ms → 1s → 2s
 * Total budget: 10s before declaring "empty"
 *
 * Uses getPilotTrace() from pilotApi — no new API clients.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PilotTraceEvent } from '../api/pilotApi';
import { getPilotTrace } from '../api/pilotApi';

// ============================================================================
// Types
// ============================================================================

export type TracePhase = 'idle' | 'loading' | 'polling' | 'ready' | 'empty' | 'error';

export interface UseTraceByCorrelationIdResult {
  phase: TracePhase;
  events: PilotTraceEvent[];
  error: string | null;
  refresh: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Polling intervals in ms: 250 → 500 → 1000 → 2000 */
const POLL_INTERVALS = [250, 500, 1000, 2000];

/** Total budget before declaring empty (ms) */
const POLL_BUDGET_MS = 10_000;

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetch trace events for a correlationId with polling/backoff.
 *
 * @param correlationId - The correlation ID to fetch trace for (null/undefined = idle)
 * @param enabled - Whether polling is active (default true). Set false to pause.
 */
export function useTraceByCorrelationId(
  correlationId: string | null | undefined,
  enabled = true,
): UseTraceByCorrelationIdResult {
  const [phase, setPhase] = useState<TracePhase>('idle');
  const [events, setEvents] = useState<PilotTraceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Track the active correlationId to prevent stale closures
  const activeCorrelationRef = useRef<string | null>(null);
  const pollIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchTrace = useCallback(
    async (cid: string) => {
      // Guard: bail if correlationId changed while we were waiting
      if (activeCorrelationRef.current !== cid) return;

      try {
        const response = await getPilotTrace(cid);

        // Guard again after async
        if (activeCorrelationRef.current !== cid) return;

        if (response.events.length > 0) {
          setEvents(response.events);
          setPhase('ready');
          return; // Done — stop polling
        }

        // No events yet — schedule next poll if within budget
        const interval = POLL_INTERVALS[Math.min(pollIndexRef.current, POLL_INTERVALS.length - 1)];
        elapsedRef.current += interval;

        if (elapsedRef.current >= POLL_BUDGET_MS) {
          setPhase('empty');
          return;
        }

        setPhase('polling');
        pollIndexRef.current += 1;
        timerRef.current = setTimeout(() => fetchTrace(cid), interval);
      } catch (err) {
        // Guard after async
        if (activeCorrelationRef.current !== cid) return;

        // 404 means trace not written yet — keep polling
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404')) {
          const interval = POLL_INTERVALS[Math.min(pollIndexRef.current, POLL_INTERVALS.length - 1)];
          elapsedRef.current += interval;

          if (elapsedRef.current >= POLL_BUDGET_MS) {
            setPhase('empty');
            return;
          }

          setPhase('polling');
          pollIndexRef.current += 1;
          timerRef.current = setTimeout(() => fetchTrace(cid), interval);
          return;
        }

        // Real error
        setError(msg);
        setPhase('error');
      }
    },
    [],
  );

  // Start/restart when correlationId or enabled changes
  useEffect(() => {
    cleanup();

    if (!correlationId || !enabled) {
      activeCorrelationRef.current = null;
      setPhase('idle');
      setEvents([]);
      setError(null);
      return;
    }

    // Reset polling state
    activeCorrelationRef.current = correlationId;
    pollIndexRef.current = 0;
    elapsedRef.current = 0;
    setPhase('loading');
    setEvents([]);
    setError(null);

    fetchTrace(correlationId);

    return cleanup;
  }, [correlationId, enabled, fetchTrace, cleanup]);

  const refresh = useCallback(() => {
    if (!correlationId) return;
    cleanup();
    activeCorrelationRef.current = correlationId;
    pollIndexRef.current = 0;
    elapsedRef.current = 0;
    setPhase('loading');
    setError(null);
    fetchTrace(correlationId);
  }, [correlationId, cleanup, fetchTrace]);

  return { phase, events, error, refresh };
}

