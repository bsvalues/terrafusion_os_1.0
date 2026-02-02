/**
 * Deterministic JSON Serialization
 * =================================
 * Produces consistent JSON output across platforms and runs.
 *
 * Features:
 * - Sorted keys (alphabetical)
 * - Consistent formatting
 * - No platform-specific variations
 */

/**
 * Stringify an object with deterministic key ordering.
 * Keys are sorted alphabetically at every level.
 *
 * @param obj - Object to stringify
 * @param indent - Indentation (default: 2 spaces)
 * @returns JSON string with sorted keys
 */
export function deterministicStringify(obj: unknown, indent: number = 2): string {
  return JSON.stringify(sortKeys(obj), null, indent);
}

/**
 * Recursively sort all object keys alphabetically.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();

    for (const key of keys) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }

    return sorted;
  }

  return obj;
}

/**
 * Parse JSON and immediately re-serialize with sorted keys.
 * Useful for normalizing external JSON inputs.
 */
export function normalizeJson(json: string): string {
  const parsed = JSON.parse(json);
  return deterministicStringify(parsed);
}

/**
 * Compare two JSON strings for structural equality.
 * Ignores key ordering and whitespace differences.
 */
export function jsonStructurallyEqual(json1: string, json2: string): boolean {
  try {
    const norm1 = deterministicStringify(JSON.parse(json1));
    const norm2 = deterministicStringify(JSON.parse(json2));
    return norm1 === norm2;
  } catch {
    return false;
  }
}

/**
 * Write JSON to a string with consistent line endings (LF only) and trailing newline.
 */
export function toJsonWithLF(obj: unknown, indent: number = 2): string {
  const json = deterministicStringify(obj, indent);
  // Ensure LF line endings, no CRLF, and trailing newline
  return json.replace(/\r\n/g, '\n') + '\n';
}
