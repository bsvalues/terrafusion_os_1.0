/**
 * Path Normalization Utilities
 * ============================
 * Cross-OS path normalization for deterministic outputs.
 *
 * Ensures consistent path representation across Windows and Linux:
 * - Forward slashes only
 * - No drive letters in relative paths
 * - Consistent handling of . and ..
 */

/**
 * Normalize a path to use forward slashes (POSIX style).
 * This ensures consistent path representation in JSON outputs.
 */
export function normalizePath(path: string): string {
  if (!path) return path;

  // Replace all backslashes with forward slashes
  let normalized = path.replace(/\\/g, '/');

  // Remove duplicate slashes (except for protocol://)
  normalized = normalized.replace(/([^:])\/{2,}/g, '$1/');

  // Remove trailing slashes (except for root /)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Normalize all path-like string values in an object recursively.
 * Useful for ensuring JSON outputs are cross-platform consistent.
 */
export function normalizePathsInObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Heuristic: if it looks like a path, normalize it
    if (isPathLike(obj)) {
      return normalizePath(obj) as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizePathsInObject) as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = normalizePathsInObject(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Check if a string looks like a file path.
 */
function isPathLike(str: string): boolean {
  // Contains path separators
  if (str.includes('/') || str.includes('\\')) {
    return true;
  }

  // Common file extensions
  if (/\.(json|ts|js|mjs|md|yml|yaml|txt|log)$/i.test(str)) {
    return true;
  }

  // Starts with ./ or ../
  if (/^\.\.?\//.test(str)) {
    return true;
  }

  // Windows drive letter
  if (/^[A-Za-z]:/.test(str)) {
    return true;
  }

  return false;
}

/**
 * Convert an absolute path to a relative path from a base directory.
 * Returns the original path if it's not under the base directory.
 */
export function toRelativePath(absolutePath: string, baseDir: string): string {
  const normalizedPath = normalizePath(absolutePath);
  const normalizedBase = normalizePath(baseDir);

  if (normalizedPath.startsWith(normalizedBase)) {
    let relative = normalizedPath.slice(normalizedBase.length);
    // Remove leading slash
    if (relative.startsWith('/')) {
      relative = relative.slice(1);
    }
    return relative || '.';
  }

  return normalizedPath;
}
