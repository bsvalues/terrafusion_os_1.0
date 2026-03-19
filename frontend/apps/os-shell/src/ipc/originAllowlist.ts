/**
 * TerraFusion IPC Origin Allowlist
 *
 * Security-critical module for validating message origins.
 * Only apps registered in the module registry can communicate with the shell.
 *
 * @module ipc/originAllowlist
 * @see SUCCESS CRITERIA SC-6.2: Security Validation
 */

import { ALL_MODULES } from '../config/modules';

// ============================================================================
// Origin Lookup Cache
// ============================================================================

/** Cached Map of origin → module ID for O(1) lookups */
let originToModuleCache: Map<string, string> | null = null;

/**
 * Builds or returns the cached origin-to-module lookup map.
 * Extracts origin from each module's entry URL.
 */
function getOriginMap(): Map<string, string> {
  if (originToModuleCache) {
    return originToModuleCache;
  }

  originToModuleCache = new Map();

  for (const module of ALL_MODULES) {
    const entry = module.entry;
    if (!entry) continue;

    // Only URL-type entries have origins
    if (entry.type === 'url' && typeof entry.url === 'string') {
      try {
        const origin = new URL(entry.url).origin;
        originToModuleCache.set(origin, module.id);
      } catch {
        // Invalid URL - skip
      }
    }
  }

  return originToModuleCache;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get module info by message origin.
 *
 * SECURITY: This is the allowlist gate. Only origins that match
 * a registered module's devUrl origin are trusted.
 *
 * @param origin - The origin from MessageEvent.origin
 * @returns Module ID if trusted, null if untrusted
 */
export function getModuleIdByOrigin(origin: string): string | null {
  const map = getOriginMap();
  return map.get(origin) ?? null;
}

/**
 * Check if an origin is in the allowlist.
 *
 * @param origin - The origin to check
 * @returns true if origin is trusted
 */
export function isOriginAllowed(origin: string): boolean {
  return getModuleIdByOrigin(origin) !== null;
}

/**
 * Get all allowed origins (for debugging).
 *
 * @returns Array of trusted origins
 */
export function getAllowedOrigins(): string[] {
  const map = getOriginMap();
  return Array.from(map.keys());
}

/**
 * Invalidate the origin cache.
 * Call this if modules are dynamically registered.
 */
export function invalidateOriginCache(): void {
  originToModuleCache = null;
}
