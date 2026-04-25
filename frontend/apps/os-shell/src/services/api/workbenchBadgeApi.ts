/**
 * TerraFusion OS — Workbench Badge API Client
 * ═══════════════════════════════════════════════════════════════
 *
 * Shared fetch layer for badge providers. Fetches parcel data from the
 * PACS endpoint and returns a structured response that badge providers
 * use to derive real-time badges.
 *
 * Includes a simple TTL cache so all 4 providers (forge, atlas, dais,
 * dossier) that fire concurrently share a single HTTP request per parcel.
 *
 * Falls back gracefully when the API is unavailable (returns null).
 *
 * @see services/badges/ — Individual badge providers consume this
 * @see hooks/usePropertyLookup.ts — Uses the same /ops/pacs/property endpoint
 */

// ============================================================================
// Types
// ============================================================================

export interface PropertyBadgeData {
  geoId: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  propertyType: string;
  appraisalYear: number | null;
  lastModified: string | null;
  source: string;
}

// ============================================================================
// Cache — TTL-based per parcelId (prevents duplicate fetches)
// ============================================================================

const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  data: PropertyBadgeData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/** In-flight request dedup — concurrent calls for the same parcelId share one fetch. */
const inflight = new Map<string, Promise<PropertyBadgeData | null>>();

function getCached(parcelId: string): PropertyBadgeData | null {
  const entry = cache.get(parcelId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(parcelId);
    return null;
  }
  return entry.data;
}

function setCache(parcelId: string, data: PropertyBadgeData): void {
  cache.set(parcelId, { data, timestamp: Date.now() });
}

// ============================================================================
// Fetch
// ============================================================================

async function doFetch(parcelId: string): Promise<PropertyBadgeData | null> {
  try {
    const res = await fetch(`/ops/pacs/property/${encodeURIComponent(parcelId)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.pacs === 'offline') return null; // PACS unavailable — suppress badges
    const data: PropertyBadgeData = {
      geoId: json.geoId ?? json.geo_id ?? parcelId,
      address: json.address ?? '',
      ownerName: json.ownerName ?? json.owner_name ?? '',
      assessedValue: json.assessedValue ?? json.assessed_value ?? 0,
      marketValue: json.marketValue ?? json.market_value ?? 0,
      landValue: json.landValue ?? json.land_value ?? 0,
      improvementValue: json.improvementValue ?? json.improvement_value ?? 0,
      propertyType: json.propertyType ?? json.property_type ?? '',
      appraisalYear: json.appraisalYear ?? json.appraisal_year ?? null,
      lastModified: json.lastModified ?? json.last_modified ?? null,
      source: json.source ?? '',
    };
    setCache(parcelId, data);
    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch badge-relevant property data for a parcel.
 *
 * - Returns cached data if available (TTL = 30s)
 * - Deduplicates concurrent requests for the same parcelId
 * - Returns null when the API is unavailable (badge providers should fall back to empty badges)
 */
export async function fetchPropertyBadgeData(
  parcelId: string,
): Promise<PropertyBadgeData | null> {
  // 1. Cache hit
  const cached = getCached(parcelId);
  if (cached) return cached;

  // 2. In-flight dedup
  const existing = inflight.get(parcelId);
  if (existing) return existing;

  // 3. New fetch
  const promise = doFetch(parcelId).finally(() => {
    inflight.delete(parcelId);
  });
  inflight.set(parcelId, promise);
  return promise;
}

/** Clear all cached badge data (useful for tests). */
export function clearBadgeCache(): void {
  cache.clear();
  inflight.clear();
}
