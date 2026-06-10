/**
 * Narrow, exact write-lane exception for forward-staged reserved-office tools (FU-2C / ADR-0014).
 *
 * The write-lanes gate flags Clerk/Treasury/Audit tools (reserved suites). After FU-2A (UI gate) and
 * FU-2B (runtime gate), those tools are NOT exposed in OS 1.0 — yet they remain in the static manifest
 * by design (code preserved). This lets the static gate reflect that post-gate truth WITHOUT lying:
 * it exempts ONLY the exact tool IDs recorded in docs/brain/canon/reserved-staging.json, and ONLY while
 * the register proves BOTH exposure gates are in place and the suites are still forward-staged.
 *
 * Deliberately strict so it cannot become a backdoor:
 *  - exact toolId allowlist (no suite-wide / pattern exemption)
 *  - requires status to start with "forward-staged"
 *  - requires BOTH gate.frontend AND gate.runtime to be recorded
 * Remove any of those → exception goes inactive → the gate fails again.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Pure: derive the exception state from a parsed reserved-staging register object. */
export function computeStagedException(register) {
  const status = String(register?.status ?? '');
  const gate = register?.gate ?? {};
  const active =
    status.startsWith('forward-staged') && Boolean(gate.frontend) && Boolean(gate.runtime);
  const idsBySuite = register?.footprint?.manifest_tools?.ids ?? {};
  const toolIds = new Set(Object.values(idsBySuite).flat());
  return { active, toolIds };
}

/** Load the exception from disk (best-effort; missing/invalid register → inactive, no exemption). */
export function loadStagedException(repoRoot) {
  try {
    const p = join(repoRoot, 'docs', 'brain', 'canon', 'reserved-staging.json');
    return computeStagedException(JSON.parse(readFileSync(p, 'utf8')));
  } catch {
    return { active: false, toolIds: new Set() };
  }
}

/** Pure: is this tool an exact, active staged exception? */
export function isStagedException(tool, staged) {
  return Boolean(staged?.active) && Boolean(tool) && staged.toolIds.has(tool.toolId);
}
