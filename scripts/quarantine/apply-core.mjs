/**
 * Quarantine Apply Core — Pure logic for computing moves to execute
 *
 * Zero side effects. Takes a plan + options, returns either
 * { ok: true, moves: [...] } or { ok: false, error: string }.
 *
 * Safety invariants:
 *   1. Refuses when working tree is dirty (statusOutput non-empty)
 *   2. Applies only the first `batch` moves from plan order
 *   3. Does not re-sort — trusts planner's deterministic ordering
 */

/**
 * @param {{
 *   plan: Array<{from: string, to: string}> | null | undefined,
 *   batch: number,
 *   statusOutput: string
 * }} opts
 * @returns {{ ok: true, moves: Array<{from: string, to: string}> } | { ok: false, error: string }}
 */
export function computeMovesToApply({ plan, batch, statusOutput }) {
  // Validate plan
  if (!Array.isArray(plan)) {
    return { ok: false, error: 'No plan provided. Pipe planner output or use --plan <file>.' };
  }

  // Safety: refuse on dirty working tree
  if (statusOutput && statusOutput.trim().length > 0) {
    return {
      ok: false,
      error: 'Working tree is dirty. Commit or stash changes before applying quarantine moves.',
    };
  }

  // Apply batch limit (first N moves in plan order)
  const limit = Math.max(0, Math.min(batch, plan.length));
  const moves = plan.slice(0, limit).map(m => ({ from: m.from, to: m.to }));

  return { ok: true, moves };
}
