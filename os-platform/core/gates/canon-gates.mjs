/**
 * Canon gates aggregator — the enforcement rail.
 *
 * Runs every advisory Canon gate over a changed-file set and classifies
 * findings:
 *   - BLOCKING: protected-path edits, hardcoded ports, unowned paths
 *     (governance blind spots / hard violations);
 *   - ADVISORY: high/critical-risk OWNED areas (informational — ensure the
 *     required gates + review happen, but never block on them).
 *
 * ADVISORY by default (exit 0, report only). Pass --strict to fail (exit 1)
 * when any BLOCKING finding exists. Read-only: file paths are passed as args
 * (CI/lint-staged convention); no git, no command execution.
 *
 * CLI:  node os-platform/core/gates/canon-gates.mjs [--strict] [--json] <paths...>
 *
 * @module gates/canon-gates
 */

import { checkProtectedPaths } from './check-protected-paths.mjs';
import { checkHardcodedPorts } from './check-hardcoded-ports.mjs';
import { checkWriteLanes } from './canon-write-lane-check.mjs';
import { pathMatchesPattern } from '../canon/canon-query.mjs';
import { printReport, runMain } from './gate-runtime.mjs';

/**
 * @typedef {Readonly<{ gate: string, path: string, detail: string }>} GateFinding
 * @typedef {Readonly<{ blocking: ReadonlyArray<GateFinding>, advisory: ReadonlyArray<GateFinding>, ok: boolean, exitCode: number }>} CanonGatesResult
 */

const CODE_LIKE = /\.(ts|tsx|js|jsx|mjs|cjs|cs|json|ya?ml)$/i;

/**
 * Canon-owned / runtime-governance path globs. Strict (blocking) enforcement is
 * scoped to these; everything else stays advisory. Deliberately NOT global.
 * @type {ReadonlyArray<string>}
 */
export const CANON_OWNED_PATTERNS = Object.freeze([
  'os-platform/core/canon/**',
  'os-platform/core/gates/**',
]);

/** @param {unknown} path @returns {boolean} */
export function isCanonOwnedPath(path) {
  if (typeof path !== 'string' || path.length === 0) return false;
  return CANON_OWNED_PATTERNS.some((p) => pathMatchesPattern(path, p));
}

/**
 * Split paths into canon-owned vs the rest. Never throws.
 * @param {ReadonlyArray<string>} paths
 * @returns {Readonly<{ owned: ReadonlyArray<string>, rest: ReadonlyArray<string> }>}
 */
export function partitionByCanonOwnership(paths) {
  const owned = [];
  const rest = [];
  for (const p of Array.isArray(paths) ? paths : []) {
    if (typeof p !== 'string' || p.length === 0) continue;
    (isCanonOwnedPath(p) ? owned : rest).push(p);
  }
  return Object.freeze({ owned: Object.freeze(owned), rest: Object.freeze(rest) });
}

/**
 * Run all Canon gates over the given paths and classify findings. Never throws.
 * When `canonOwnedOnly` is set, only canon-owned paths are scanned — this is how
 * strict enforcement stays scoped to the Canon runtime instead of going global.
 * @param {ReadonlyArray<string>} paths
 * @param {{ strict?: boolean, canonOwnedOnly?: boolean }} [opts]
 * @returns {CanonGatesResult}
 */
export function runCanonGates(paths, opts) {
  const all = Array.isArray(paths) ? paths.filter((p) => typeof p === 'string' && p.length > 0) : [];
  const list = opts && opts.canonOwnedOnly ? all.filter(isCanonOwnedPath) : all;
  const strict = !!(opts && opts.strict);

  /** @type {GateFinding[]} */
  const blocking = [];
  /** @type {GateFinding[]} */
  const advisory = [];

  // Protected paths -> blocking.
  for (const f of checkProtectedPaths(list)) {
    blocking.push(Object.freeze({ gate: 'protected-paths', path: f.path, detail: `protected by ${f.pattern}` }));
  }

  // Hardcoded ports -> blocking (only scans code-like files that exist).
  for (const f of checkHardcodedPorts(list.filter((p) => CODE_LIKE.test(p)))) {
    blocking.push(
      Object.freeze({ gate: 'hardcoded-ports', path: f.path, detail: `hardcoded port ${f.port} at line ${f.line}` }),
    );
  }

  // Write-lane: unowned -> blocking; high/critical-risk owned -> advisory.
  const wl = checkWriteLanes(list);
  for (const a of wl.advisories) {
    if (/unowned|no write-lane/i.test(a.detail)) {
      blocking.push(Object.freeze({ gate: 'write-lane', path: a.path, detail: a.detail }));
    } else {
      advisory.push(Object.freeze({ gate: 'write-lane', path: a.path, detail: a.detail }));
    }
  }

  const ok = blocking.length === 0;
  const exitCode = ok || !strict ? 0 : 1;
  return Object.freeze({
    blocking: Object.freeze(blocking),
    advisory: Object.freeze(advisory),
    ok,
    exitCode,
  });
}

runMain(import.meta.url, (o) => {
  const res = runCanonGates(o.paths, { strict: o.strict, canonOwnedOnly: o.flags.has('canon-owned-only') });
  // Surface blocking findings as the report's "findings" (so --strict fails on them);
  // advisory findings are appended to the message but never affect exit code.
  const result = printReport({
    gate: 'gates',
    json: o.json,
    strict: o.strict,
    findings: res.blocking.map((f) => ({ path: f.path, detail: `[${f.gate}] ${f.detail}` })),
    okMessage: `scanned ${o.paths.length} path(s); no blocking violations.`,
  });
  if (!o.json && res.advisory.length) {
    process.stdout.write(`   advisory (${res.advisory.length}, non-blocking):\n`);
    for (const a of res.advisory) process.stdout.write(`   · ${a.path}: [${a.gate}] ${a.detail}\n`);
  }
  return result;
});
