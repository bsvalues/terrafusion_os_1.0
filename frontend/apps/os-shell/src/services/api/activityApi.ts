/**
 * TerraFusion OS — Activity Feed API Client
 * ═══════════════════════════════════════════════════════════════
 *
 * REST client for fetching parcel-scoped activity/audit events
 * from the backend. Includes TTL cache and graceful fallback.
 *
 * Endpoint: GET /api/properties/parcel/{geoId}/activity
 *   - Returns recent audit events for the parcel
 *   - Falls back to null when backend is unavailable
 *
 * @see services/activityFeed.ts — Hook that consumes this client
 * @see backend PropertiesController — /api/properties endpoints
 */

import type { ActivitySeverity } from '../../components/workbench/ActivityFeed';
import type { BadgeOwner } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

/** Raw activity event from the backend API. */
export interface RawActivityEvent {
  id: string;
  source: string;
  summary: string;
  timestamp: string; // ISO 8601
  severity: string;
  detail?: string;
}

/** Parsed activity entry ready for the feed component. */
export interface ParsedActivityEntry {
  id: string;
  source: BadgeOwner;
  summary: string;
  timestamp: Date;
  severity: ActivitySeverity;
  detail?: string;
}

// ============================================================================
// Cache
// ============================================================================

const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  data: ParsedActivityEntry[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<ParsedActivityEntry[] | null>>();

function getCached(parcelId: string): ParsedActivityEntry[] | null {
  const entry = cache.get(parcelId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(parcelId);
    return null;
  }
  return entry.data;
}

// ============================================================================
// Parsing
// ============================================================================

const VALID_SOURCES = new Set<string>(['forge', 'atlas', 'dais', 'dossier', 'os']);
const VALID_SEVERITIES = new Set<string>(['info', 'success', 'warn', 'danger']);

function parseSource(source: string): BadgeOwner {
  const lower = source.toLowerCase();
  return VALID_SOURCES.has(lower) ? (lower as BadgeOwner) : 'os';
}

function parseSeverity(severity: string): ActivitySeverity {
  const lower = severity.toLowerCase();
  return VALID_SEVERITIES.has(lower) ? (lower as ActivitySeverity) : 'info';
}

function parseEvents(raw: RawActivityEvent[]): ParsedActivityEntry[] {
  return raw.map((event) => ({
    id: event.id,
    source: parseSource(event.source),
    summary: event.summary,
    timestamp: new Date(event.timestamp),
    severity: parseSeverity(event.severity),
    detail: event.detail,
  }));
}

// ============================================================================
// Fetch
// ============================================================================

async function doFetch(parcelId: string): Promise<ParsedActivityEntry[] | null> {
  try {
    const res = await fetch(
      `/api/properties/parcel/${encodeURIComponent(parcelId)}/activity`
    );
    if (!res.ok) return null;
    const json = await res.json();

    // Handle both array response and { items: [...] } wrapper
    const events: RawActivityEvent[] = Array.isArray(json) ? json : json.items ?? [];
    const parsed = parseEvents(events);

    // Sort newest first
    parsed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    cache.set(parcelId, { data: parsed, timestamp: Date.now() });
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch activity events for a parcel from the backend.
 *
 * Returns cached data (30s TTL), deduplicates in-flight requests,
 * and returns null when the API is unavailable (caller should fall back to mock).
 */
export async function fetchParcelActivity(
  parcelId: string,
): Promise<ParsedActivityEntry[] | null> {
  const cached = getCached(parcelId);
  if (cached) return cached;

  const existing = inflight.get(parcelId);
  if (existing) return existing;

  const promise = doFetch(parcelId).finally(() => {
    inflight.delete(parcelId);
  });
  inflight.set(parcelId, promise);
  return promise;
}

/** Clear all cached activity data (useful for tests). */
export function clearActivityCache(): void {
  cache.clear();
  inflight.clear();
}
