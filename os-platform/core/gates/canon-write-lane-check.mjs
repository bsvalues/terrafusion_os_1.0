/**
 * Advisory Canon gate: engineering write-lane check.
 *
 * For each changed path, resolves the owning write-lane, required gates, and
 * risk via the read-only Canon query layer, and surfaces advisories:
 *   - unowned paths (no write-lane) — governance blind spot;
 *   - high/critical-risk areas — ensure required gates + review happen.
 *
 * ADVISORY by default — reports and exits 0. Pass --strict to exit non-zero
 * when any advisory is raised. Read-only: paths passed as args, no git, no
 * command execution.
 *
 * CLI:  node os-platform/core/gates/canon-write-lane-check.mjs [--strict] [--json] <paths...>
 *
 * @module gates/canon-write-lane-check
 */

import { getOwnerForPath, getRequiredGatesForPath } from '../canon/canon-query.mjs';
import { scorePathRisk } from '../canon/canon-risk.mjs';
import { printReport, runMain } from './gate-runtime.mjs';

/**
 * @typedef {Readonly<{
 *   path: string,
 *   owner: string,
 *   confidence: 'exact' | 'pattern' | 'fallback',
 *   risk: 'low' | 'medium' | 'high' | 'critical',
 *   requiredGates: ReadonlyArray<string>,
 *   manualReviewRequired: boolean
 * }>} LaneResult
 *
 * @typedef {Readonly<{ path: string, detail: string }>} Advisory
 */

const HIGH_RISK = new Set(['high', 'critical']);

/**
 * Resolve write-lane info + advisories for a set of changed paths. Never throws.
 * @param {ReadonlyArray<string>} paths
 * @returns {Readonly<{ results: ReadonlyArray<LaneResult>, advisories: ReadonlyArray<Advisory> }>}
 */
export function checkWriteLanes(paths) {
  /** @type {LaneResult[]} */
  const results = [];
  /** @type {Advisory[]} */
  const advisories = [];

  for (const path of paths || []) {
    if (typeof path !== 'string' || path.length === 0) continue;
    const owner = getOwnerForPath(path);
    const risk = scorePathRisk(path);
    const requiredGates = getRequiredGatesForPath(path);

    results.push(
      Object.freeze({
        path,
        owner: owner.owner,
        confidence: owner.confidence,
        risk: risk.level,
        requiredGates,
        manualReviewRequired: risk.manualReviewRequired,
      }),
    );

    if (owner.confidence === 'fallback') {
      advisories.push(Object.freeze({ path, detail: 'unowned path — no write-lane owns this area' }));
    }
    if (HIGH_RISK.has(risk.level)) {
      const gates = requiredGates.length ? requiredGates.join(', ') : '(none declared)';
      advisories.push(
        Object.freeze({
          path,
          detail: `${risk.level}-risk (owner ${owner.owner}); required gates: ${gates}; manual review: ${risk.manualReviewRequired}`,
        }),
      );
    }
  }

  return Object.freeze({ results: Object.freeze(results), advisories: Object.freeze(advisories) });
}

runMain(import.meta.url, (opts) => {
  const { advisories } = checkWriteLanes(opts.paths);
  return printReport({
    gate: 'write-lane-check',
    json: opts.json,
    strict: opts.strict,
    findings: advisories.map((a) => ({ path: a.path, detail: a.detail })),
    okMessage: `scanned ${opts.paths.length} path(s); all owned, no high-risk advisories.`,
  });
});
