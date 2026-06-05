/**
 * Advisory Canon gate: protected paths.
 *
 * Flags changes under protected, frozen areas (ARCHIVE/**, specialized/**) that
 * must not be edited without explicit governance approval. ADVISORY by default
 * — reports findings and exits 0. Pass --strict to exit non-zero.
 *
 * Read-only: matches path strings only. Paths are passed as arguments — no git,
 * no command execution.
 *
 * CLI:  node os-platform/core/gates/check-protected-paths.mjs [--strict] [--json] <paths...>
 *
 * @module gates/check-protected-paths
 */

import { pathMatchesPattern } from '../canon/canon-query.mjs';
import { printReport, runMain } from './gate-runtime.mjs';

/**
 * Protected glob patterns. Mirrors the protected-path policy from the Canon/IDE
 * package (docs/TerraCanon). Kept here as an explicit, expandable constant.
 * @type {ReadonlyArray<string>}
 */
export const PROTECTED_PATTERNS = Object.freeze(['ARCHIVE/**', 'specialized/**']);

/**
 * True when a path falls under a protected pattern. Never throws.
 * @param {unknown} path
 * @returns {boolean}
 */
export function isProtectedPath(path) {
  if (typeof path !== 'string' || path.length === 0) return false;
  return PROTECTED_PATTERNS.some((pat) => pathMatchesPattern(path, pat));
}

/**
 * Return one finding per protected path. Never throws.
 * @param {ReadonlyArray<string>} paths
 * @returns {ReadonlyArray<Readonly<{ path: string, pattern: string }>>}
 */
export function checkProtectedPaths(paths) {
  /** @type {Array<Readonly<{ path: string, pattern: string }>>} */
  const findings = [];
  for (const path of paths || []) {
    if (typeof path !== 'string') continue;
    const pattern = PROTECTED_PATTERNS.find((pat) => pathMatchesPattern(path, pat));
    if (pattern) findings.push(Object.freeze({ path, pattern }));
  }
  return Object.freeze(findings);
}

runMain(import.meta.url, (opts) => {
  const findings = checkProtectedPaths(opts.paths);
  return printReport({
    gate: 'protected-paths',
    json: opts.json,
    strict: opts.strict,
    findings: findings.map((f) => ({ path: f.path, detail: `protected by ${f.pattern}` })),
    okMessage: `scanned ${opts.paths.length} path(s); none touch protected areas.`,
  });
});
