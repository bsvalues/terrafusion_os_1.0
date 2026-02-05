/**
 * legacyUiTelemetry.ts
 *
 * Phase 6.3: Legacy UI telemetry emitter.
 *
 * Features:
 * - Emits `legacy.ui_hit` events for legacy route visits
 * - Rate-limited: one emission per legacyAppId per 5 minutes
 * - Aggregates metrics: firstSeen, lastSeen, count, routes
 * - Non-PII compliant: opaque sessionId, no user identifiers
 * - Session-scoped storage persistence
 */

const STORAGE_KEY = 'legacy_ui_metrics';
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

export interface LegacyUiHitPayload {
  eventType: 'legacy.ui_hit';
  legacyAppId: string;
  route: string;
  environment: string;
  appVersion: string;
  sessionId: string;
  timestamp: string;
  referrerRoute?: string;
  emitted: boolean;
  rateLimited?: boolean;
}

export interface MetricsEntry {
  firstSeen: string;
  lastSeen: string;
  count: number;
  routes: string[];
  lastEmittedAt?: number;
}

// In-memory state
let metrics: Record<string, MetricsEntry> = {};
let sessionId: string | null = null;

// Initialize from storage
function loadFromStorage(): void {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      metrics = JSON.parse(stored);
    }
  } catch {
    metrics = {};
  }
}

// Persist to storage
function saveToStorage(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // Ignore storage errors
  }
}

// Generate opaque session ID (non-PII)
function getSessionId(): string {
  if (sessionId) {
    return sessionId;
  }
  // Generate random 8-char hex string
  const randomPart = Math.random().toString(36).substring(2, 10);
  sessionId = `session-${randomPart}`;
  return sessionId;
}

// Get environment from build-time config or fallback
function getEnvironment(): string {
  // Use globalThis to avoid Jest import.meta issues
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (globalThis as any).import_meta_env;
    if (meta?.MODE) {
      return meta.MODE;
    }
    // Vite injects import.meta.env at build time
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
  } catch {
    // Ignore
  }
  return 'development';
}

// Get app version from build-time config or fallback
function getAppVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (globalThis as any).import_meta_env;
    if (meta?.VITE_APP_VERSION) {
      return meta.VITE_APP_VERSION;
    }
  } catch {
    // Ignore
  }
  return '0.0.0';
}

/**
 * Emit a legacy.ui_hit telemetry event.
 *
 * Rate-limited: returns event with `emitted: false` and `rateLimited: true`
 * if within the rate limit window for this legacyAppId.
 */
export function emitLegacyUiHit(params: {
  legacyAppId: string;
  route: string;
  referrerRoute?: string;
}): LegacyUiHitPayload {
  const { legacyAppId, route, referrerRoute } = params;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // Ensure state is loaded
  if (Object.keys(metrics).length === 0) {
    loadFromStorage();
  }

  // Get or create entry for this legacyAppId
  let entry = metrics[legacyAppId];
  if (!entry) {
    entry = {
      firstSeen: nowIso,
      lastSeen: nowIso,
      count: 0,
      routes: [],
    };
    metrics[legacyAppId] = entry;
  }

  // Update aggregation
  entry.lastSeen = nowIso;
  entry.count += 1;
  if (!entry.routes.includes(route)) {
    entry.routes.push(route);
  }

  // Check rate limiting
  const isRateLimited =
    entry.lastEmittedAt !== undefined && now - entry.lastEmittedAt < RATE_LIMIT_MS;
  const shouldEmit = !isRateLimited;

  if (shouldEmit) {
    entry.lastEmittedAt = now;
  }

  // Persist
  saveToStorage();

  // Build payload
  const payload: LegacyUiHitPayload = {
    eventType: 'legacy.ui_hit',
    legacyAppId,
    route,
    environment: getEnvironment(),
    appVersion: getAppVersion(),
    sessionId: getSessionId(),
    timestamp: nowIso,
    emitted: shouldEmit,
  };

  if (referrerRoute) {
    payload.referrerRoute = referrerRoute;
  }

  if (isRateLimited) {
    payload.rateLimited = true;
  }

  return payload;
}

/**
 * Get aggregated metrics for a specific legacyAppId.
 */
export function getLegacyUiMetrics(legacyAppId: string): MetricsEntry | undefined {
  // Ensure state is loaded
  if (Object.keys(metrics).length === 0) {
    loadFromStorage();
  }
  return metrics[legacyAppId];
}

/**
 * Reset all metrics (primarily for testing).
 * Reloads from storage to pick up any pre-populated test data.
 */
export function resetLegacyUiMetrics(): void {
  metrics = {};
  sessionId = null;
  loadFromStorage();
}

/**
 * Read all aggregated legacy metrics.
 * Returns the full metrics record keyed by legacyAppId.
 */
export function readAllLegacyMetrics(): Record<string, MetricsEntry> {
  // Ensure state is loaded
  if (Object.keys(metrics).length === 0) {
    loadFromStorage();
  }
  return { ...metrics };
}

/**
 * Clear all legacy metrics and dismissed flags from storage.
 * Used for dev reset functionality.
 */
export function clearAllLegacyMetrics(): void {
  metrics = {};
  sessionId = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    // Also clear any dismissed banner flags
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('legacy.') && key.endsWith('.dismissed')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage errors
  }
}
