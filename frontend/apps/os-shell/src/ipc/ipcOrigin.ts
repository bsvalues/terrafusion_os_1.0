/**
 * TerraFusion OS IPC Origin Validation
 * 
 * Security-critical module that validates message origins against
 * the allowed app registry. Only accepts messages from known app origins.
 * 
 * @module ipc/ipcOrigin
 */

import { GENERATED_MODULES } from '../config/generatedModules';

// ============================================================================
// Origin Extraction
// ============================================================================

/**
 * Extract origin from a URL entry
 */
function extractOriginFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

// ============================================================================
// Module Origin Map
// ============================================================================

/**
 * Build a map of origin -> moduleId from the module registry.
 * Only includes modules with URL-type entries.
 */
export function buildModuleOriginMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const module of GENERATED_MODULES) {
    if (module.entry.type === 'url') {
      const origin = extractOriginFromUrl(module.entry.url);
      if (origin) {
        map[origin] = module.id;
      }
    }
  }

  return map;
}

/**
 * Cached module origin map (built once at module load)
 */
let cachedOriginMap: Record<string, string> | null = null;

/**
 * Get the cached module origin map
 */
export function getModuleOriginMap(): Record<string, string> {
  if (!cachedOriginMap) {
    cachedOriginMap = buildModuleOriginMap();
  }
  return cachedOriginMap;
}

/**
 * Reset the cached origin map (for testing)
 */
export function resetOriginMapCache(): void {
  cachedOriginMap = null;
}

// ============================================================================
// Origin Validation
// ============================================================================

/**
 * Check if an origin is in the allowlist
 */
export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (!origin || origin === 'null') return false;
  return allowedOrigins.includes(origin);
}

/**
 * Get the module ID for a given origin, or null if not found
 */
export function getModuleIdByOrigin(
  origin: string,
  originMap: Record<string, string>
): string | null {
  return originMap[origin] ?? null;
}

/**
 * Validate an origin and return the corresponding module ID.
 * Returns null if origin is not from a registered app.
 * 
 * @param origin - The origin from MessageEvent.origin
 * @returns Module ID or null
 */
export function validateOriginAndGetModuleId(origin: string): string | null {
  const map = getModuleOriginMap();
  return getModuleIdByOrigin(origin, map);
}

/**
 * Get list of all allowed origins from the module registry
 */
export function getAllowedOrigins(): string[] {
  const map = getModuleOriginMap();
  return Object.keys(map);
}
