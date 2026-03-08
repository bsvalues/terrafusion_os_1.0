/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — ACTIVITY FEED DATA SERVICE
 * Phase I → P4 → R2: Parcel-scoped activity stream hook
 *
 * Provides a React hook that fetches activity entries for a given
 * parcel from the REST backend. Returns an empty array with error
 * state when the backend is unavailable.
 *
 * R2 HONESTY: Mock fallback removed. When the backend is down,
 * the UI receives an empty array + error message instead of fake data.
 *
 * @see components/workbench/ActivityFeed.tsx — Rendering component
 * @see services/api/activityApi.ts — REST client with caching
 * @see contracts/workbench.ts — BadgeOwner type
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import type { ActivityEntry } from '../components/workbench/ActivityFeed';
import { fetchParcelActivity } from './api/activityApi';

// ============================================================================
// Public Hook Interface
// ============================================================================

export interface UseParcelActivityResult {
  entries: ActivityEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches activity entries for a parcel.
 *
 * Strategy: REST-only. No mock fallback.
 *   1. Calls fetchParcelActivity() — REST fetch with 30s cache
 *   2. If the backend returns data → uses it directly
 *   3. If the backend is unavailable → returns empty array + error state
 *
 * R2 HONESTY: Silent mock fallback removed. The UI must represent
 * the real state — if there are no activity events, show "no activity"
 * instead of fabricated entries.
 */
export function useParcelActivity(parcelId: string | null): UseParcelActivityResult {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against stale responses when parcelId changes rapidly
  const activeRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!parcelId) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = parcelId;
    activeRequestRef.current = requestId;
    setLoading(true);
    setError(null);
    let cancelled = false;

    (async () => {
      try {
        // Try REST backend first
        const apiEntries = await fetchParcelActivity(parcelId);

        // Stale guard: if parcelId changed while we waited, discard
        if (cancelled || activeRequestRef.current !== requestId) return;

        if (apiEntries && apiEntries.length > 0) {
          // Real backend data — map ParsedActivityEntry to ActivityEntry
          setEntries(apiEntries.map((e) => ({
            id: e.id,
            source: e.source,
            summary: e.summary,
            severity: e.severity,
            timestamp: e.timestamp,
            detail: e.detail,
          })));
        } else {
          // Backend returned empty or unavailable — show honest empty state
          setEntries([]);
        }
      } catch (e) {
        if (cancelled || activeRequestRef.current !== requestId) return;
        // REST call failed — propagate error honestly instead of masking with mock data
        setError(
          e instanceof Error ? e.message : 'Activity feed unavailable',
        );
        setEntries([]);
      } finally {
        if (!cancelled && activeRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [parcelId]);

  return { entries, loading, error };
}

// Mock data generator removed in R2 frontend honesty pass.
// Activity feed now shows real data only — no fabricated entries.
