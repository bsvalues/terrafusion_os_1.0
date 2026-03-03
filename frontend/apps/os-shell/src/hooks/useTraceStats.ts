/**
 * useTraceStats.ts
 *
 * Lane J: Fetch global trace-store diagnostics for EvidenceRail.
 *
 * This hook does NOT do role checks. Callers must gate usage to elevated roles.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getTraceStats } from '../api/pilotApi';
import type { EvidenceRailDiagnostics } from '../components/pilot/EvidenceRail';

export interface UseTraceStatsOptions {
  /** Enable fetching (default true). */
  enabled?: boolean;
  /** Optional polling interval in ms. 0 disables polling (default). */
  pollMs?: number;
}

export interface UseTraceStatsResult {
  diagnostics: EvidenceRailDiagnostics | null;
  lastFetchedAt: Date | null;
  fetchFailed: boolean;
  refresh: () => void;
}

const DEFAULT_POLL_MS = 0;

function mapDiagnostics(raw: Awaited<ReturnType<typeof getTraceStats>>): EvidenceRailDiagnostics {
  return {
    perParcelCap: raw.perParcelCap ?? 0,
    cappedParcelsCount: raw.cappedParcelsCount ?? 0,
    maxEventsInParcel: raw.maxEventsInParcel ?? 0,
    oldestEventTimestamp: raw.oldestTimestamp ?? null,
    newestEventTimestamp: raw.newestTimestamp ?? null,
  };
}

export function useTraceStats(options: UseTraceStatsOptions = {}): UseTraceStatsResult {
  const { enabled = true, pollMs = DEFAULT_POLL_MS } = options;

  const [diagnostics, setDiagnostics] = useState<EvidenceRailDiagnostics | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchOnce = useCallback(async () => {
    try {
      const raw = await getTraceStats();
      setDiagnostics(mapDiagnostics(raw));
      setLastFetchedAt(new Date());
      setFetchFailed(false);
    } catch {
      setFetchFailed(true);
      setDiagnostics(null);
    }
  }, []);

  const schedulePoll = useCallback(() => {
    if (pollMs <= 0 || !enabled) return;
    timerRef.current = setTimeout(async () => {
      await fetchOnce();
      schedulePoll();
    }, pollMs);
  }, [enabled, fetchOnce, pollMs]);

  useEffect(() => {
    cleanup();

    if (!enabled) {
      setDiagnostics(null);
      setLastFetchedAt(null);
      setFetchFailed(false);
      return;
    }

    void fetchOnce().then(() => {
      schedulePoll();
    });

    return cleanup;
  }, [enabled, fetchOnce, schedulePoll, cleanup]);

  const refresh = useCallback(() => {
    if (!enabled) return;
    cleanup();
    void fetchOnce().then(() => {
      schedulePoll();
    });
  }, [enabled, cleanup, fetchOnce, schedulePoll]);

  return {
    diagnostics,
    lastFetchedAt,
    fetchFailed,
    refresh,
  };
}

