/**
 * Parcel Label Resolver
 *
 * Provides human-friendly label hydration for parcel IDs.
 * Design: Optional resolver pattern with cache and failure-safe fallbacks.
 *
 * @module parcelLabelResolver
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Resolved label data for a parcel.
 */
export interface ParcelLabelData {
  /** Parcel ID (always present) */
  parcelId: string;
  /** Display label for the parcel (e.g., address or description) */
  displayLabel?: string;
  /** Optional address snippet */
  address?: string;
  /** Optional owner name snippet */
  ownerName?: string;
  /** Optional short label (e.g., "123 Main St") */
  shortLabel?: string;
  /** Optional full label (e.g., "123 Main St - Smith, John") */
  fullLabel?: string;
}

/**
 * Resolver function signature.
 * Returns null if unable to resolve (failure-safe).
 */
export type ParcelLabelResolver = (parcelId: string) => Promise<ParcelLabelData | null>;

// ============================================================================
// Cache
// ============================================================================

/**
 * Cache entry with TTL tracking.
 */
interface CacheEntry {
  data: ParcelLabelData | null;
  timestamp: number;
}

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Maximum cache size */
const MAX_CACHE_SIZE = 100;

/** In-memory label cache */
const labelCache = new Map<string, CacheEntry>();

/**
 * Get cached label data.
 */
export function getCachedLabel(parcelId: string): ParcelLabelData | null | undefined {
  const entry = labelCache.get(parcelId);
  if (!entry) return undefined;

  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    labelCache.delete(parcelId);
    return undefined;
  }

  return entry.data;
}

/**
 * Set cached label data.
 */
export function setCachedLabel(parcelId: string, data: ParcelLabelData | null): void {
  // Evict oldest entries if cache is full
  if (labelCache.size >= MAX_CACHE_SIZE) {
    const oldest = labelCache.keys().next().value;
    if (oldest) labelCache.delete(oldest);
  }

  labelCache.set(parcelId, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear label cache.
 */
export function clearLabelCache(): void {
  labelCache.clear();
}

/**
 * Get cache size (for testing).
 */
export function getLabelCacheSize(): number {
  return labelCache.size;
}

// ============================================================================
// Resolver Registry
// ============================================================================

/** Current label resolver (null = no resolver configured) */
let currentResolver: ParcelLabelResolver | null = null;

/**
 * Set the label resolver.
 */
export function setParcelLabelResolver(resolver: ParcelLabelResolver | null): void {
  currentResolver = resolver;
}

/**
 * Get the current label resolver.
 */
export function getParcelLabelResolver(): ParcelLabelResolver | null {
  return currentResolver;
}

/**
 * Check if a resolver is configured.
 */
export function hasParcelLabelResolver(): boolean {
  return currentResolver !== null;
}

// ============================================================================
// Resolution API
// ============================================================================

/**
 * Resolve parcel label data.
 *
 * Uses cache first, then resolver, with failure-safe fallback.
 * Returns null if no resolver or resolution fails.
 */
export async function resolveParcelLabel(parcelId: string): Promise<ParcelLabelData | null> {
  // Check cache first
  const cached = getCachedLabel(parcelId);
  if (cached !== undefined) {
    return cached;
  }

  // No resolver = return null
  if (!currentResolver) {
    return null;
  }

  try {
    // Resolve and cache
    const data = await currentResolver(parcelId);
    setCachedLabel(parcelId, data);
    return data;
  } catch {
    // Failure-safe: cache null to prevent repeated failures
    setCachedLabel(parcelId, null);
    return null;
  }
}

/**
 * Resolve parcel label synchronously (cache-only).
 * Returns null if not cached or no data.
 */
export function resolveParcelLabelSync(parcelId: string): ParcelLabelData | null {
  const cached = getCachedLabel(parcelId);
  return cached ?? null;
}

// ============================================================================
// Label Formatting
// ============================================================================

/**
 * Format a friendly display label from parcel data.
 *
 * Priority:
 * 1. displayLabel if available
 * 2. shortLabel if available
 * 3. address if available
 * 4. parcelId as fallback
 */
export function formatParcelLabel(data: ParcelLabelData | null, fallbackId: string): string {
  if (!data) return fallbackId;

  if (data.displayLabel) return data.displayLabel;
  if (data.shortLabel) return data.shortLabel;
  if (data.address) return data.address;

  return data.parcelId || fallbackId;
}

/**
 * Format a full display label with owner.
 *
 * Priority:
 * 1. fullLabel if available
 * 2. displayLabel + ownerName if both available
 * 3. shortLabel + ownerName if both available
 * 4. address + ownerName if both available
 * 5. Fallback to formatParcelLabel
 */
export function formatParcelLabelFull(data: ParcelLabelData | null, fallbackId: string): string {
  if (!data) return fallbackId;

  if (data.fullLabel) return data.fullLabel;

  const base = data.displayLabel || data.shortLabel || data.address;
  if (base && data.ownerName) {
    return `${base} - ${data.ownerName}`;
  }

  return formatParcelLabel(data, fallbackId);
}

// ============================================================================
// Aliases (for test compatibility)
// ============================================================================

/**
 * Alias for setParcelLabelResolver.
 */
export const setLabelResolver = setParcelLabelResolver;

/**
 * Alias for getCachedLabel with null for uncached.
 * Tests expect null (not undefined) for uncached items.
 */
export function getLabelFromCache(parcelId: string): ParcelLabelData | null {
  const result = getCachedLabel(parcelId);
  // Convert undefined (uncached) to null for test compatibility
  return result === undefined ? null : result;
}
