/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — ACTIVITY FEED DATA SERVICE
 * Phase I → P4: Parcel-scoped activity stream hook
 *
 * Provides a React hook that fetches activity entries for a given
 * parcel. Tries the REST backend first, falls back to deterministic
 * mock data when the API is unavailable.
 *
 * Data flow:
 *   1. fetchParcelActivity(parcelId) — REST call to /api/properties/parcel/{id}/activity
 *   2. If REST returns data → use it (real backend events)
 *   3. If REST returns null → generateMockEntries(parcelId) (deterministic fallback)
 *
 * Mock generation uses a hash-seeded approach so the same parcelId
 * always produces the same entries (stable for demos & screenshots).
 *
 * @see components/workbench/ActivityFeed.tsx — Rendering component
 * @see services/api/activityApi.ts — REST client with caching
 * @see contracts/workbench.ts — BadgeOwner type
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useState } from 'react';
import type { ActivityEntry, ActivitySeverity } from '../components/workbench/ActivityFeed';
import type { BadgeOwner } from '../contracts/workbench';
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
 * Strategy: REST-first with mock fallback.
 *   1. Calls fetchParcelActivity() — REST fetch with 30s cache
 *   2. If the backend returns data → uses it directly
 *   3. If the backend is unavailable (returns null) → falls back to
 *      deterministic mock data seeded from parcelId
 *
 * Mock fallback ensures the activity feed always renders content,
 * even when the backend is offline (demo mode, CI, local dev).
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
          // Backend unavailable or empty — deterministic mock fallback
          setEntries(generateMockEntries(parcelId));
        }
      } catch (e) {
        if (cancelled || activeRequestRef.current !== requestId) return;
        // REST call failed — fall back to mock rather than showing error
        try {
          setEntries(generateMockEntries(parcelId));
        } catch (mockErr) {
          setError(
            mockErr instanceof Error ? mockErr.message : 'Failed to load activity',
          );
        }
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

// ============================================================================
// Mock Data Templates
// ============================================================================

interface EntryTemplate {
  source: BadgeOwner;
  summary: string;
  severity: ActivitySeverity;
  detail?: string;
}

const TEMPLATES: readonly EntryTemplate[] = [
  // Forge events
  { source: 'forge', summary: 'Cost approach recalculated — new estimate $284,500', severity: 'info' },
  { source: 'forge', summary: 'Market value adjusted +3.2% per region trend', severity: 'info' },
  { source: 'forge', summary: 'Comparable sale No. 2047 added to comp set', severity: 'success' },
  { source: 'forge', summary: 'Income approach variance exceeds 15% threshold', severity: 'warn' },

  // Atlas events
  { source: 'atlas', summary: 'Parcel boundary updated from county GIS feed', severity: 'info' },
  { source: 'atlas', summary: 'Flood zone reclassified: Zone X → Zone AE', severity: 'danger' },
  { source: 'atlas', summary: 'Aerial imagery refreshed (2025 flight)', severity: 'success' },
  { source: 'atlas', summary: 'Neighboring parcel split detected — review adjacency', severity: 'warn' },

  // Dais events
  { source: 'dais', summary: 'Appeal filed — hearing scheduled 03/15/2026', severity: 'warn' },
  { source: 'dais', summary: 'Tax levy certified for current assessment year', severity: 'success' },
  { source: 'dais', summary: 'Exemption application received — Senior/Disabled', severity: 'info' },
  { source: 'dais', summary: 'Permit #BP-2026-0842 issued — new construction', severity: 'info' },

  // Dossier events
  { source: 'dossier', summary: 'Deed transfer recorded — new owner on file', severity: 'info' },
  { source: 'dossier', summary: 'Property photo uploaded by field inspector', severity: 'success' },
  { source: 'dossier', summary: 'Evidence package sealed for appeal defense', severity: 'info' },

  // OS / system events
  { source: 'os', summary: 'Parcel data synced from Harris PACS 9.0', severity: 'info' },
  { source: 'os', summary: 'Audit trail checkpoint — all changes logged', severity: 'success' },
  { source: 'os', summary: 'Model version locked by county administrator', severity: 'warn' },
  { source: 'os', summary: 'Data quality flag: missing improvement sqft', severity: 'danger' },
] as const;

// ============================================================================
// Deterministic Mock Generator
// ============================================================================

/**
 * Simple string hash for deterministic seed.
 * Not cryptographic — just needs to be consistent across calls.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Produces deterministic sequence from a numeric seed.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMockEntries(parcelId: string): ActivityEntry[] {
  const seed = simpleHash(parcelId);
  const rng = mulberry32(seed);

  // 5–12 entries per parcel
  const count = 5 + Math.floor(rng() * 8);
  const now = Date.now();
  const entries: ActivityEntry[] = [];

  for (let i = 0; i < count; i++) {
    const templateIdx = Math.floor(rng() * TEMPLATES.length);
    const template = TEMPLATES[templateIdx];

    // Spread entries across the last 7 days
    const ageMs = Math.floor(rng() * 7 * 24 * 60 * 60 * 1000);

    entries.push({
      id: `activity-${parcelId}-${i}`,
      source: template.source,
      summary: template.summary,
      severity: template.severity,
      timestamp: new Date(now - ageMs),
      detail: template.detail,
    });
  }

  // Sort newest first
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries;
}
