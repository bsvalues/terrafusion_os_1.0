/**
 * Patch Strategies Index (Phase 4M4)
 *
 * Central registry for all auto-fix patch strategies.
 * Strategies are organized by tier (0=ship first, 1=ship next, 2=hold).
 */

import { debarrelImportStrategy } from './debarrel-import.js';
import { dedupeImportsStrategy } from './dedupe-imports.js';
import { missingUseClientStrategy } from './missing-use-client.js';
import { setstateNonfunctionalStrategy } from './setstate-nonfunctional.js';
import type { PatchStrategy, PatchStrategyId } from './types.js';
import { waterfallParallelizeStrategy } from './waterfall-parallelize.js';

// Re-export types
export * from './types.js';

// Re-export strategies
export { debarrelImportStrategy } from './debarrel-import.js';
export { dedupeImportsStrategy } from './dedupe-imports.js';
export { missingUseClientStrategy } from './missing-use-client.js';
export { setstateNonfunctionalStrategy } from './setstate-nonfunctional.js';
export { waterfallParallelizeStrategy } from './waterfall-parallelize.js';

/**
 * All registered patch strategies
 */
export const PATCH_STRATEGIES: PatchStrategy[] = [
  // Tier 0: Deterministic, minimal semantics risk
  missingUseClientStrategy,
  dedupeImportsStrategy,
  debarrelImportStrategy,
  setstateNonfunctionalStrategy, // Phase 4M6a: Tier 0 expansion
  // Tier 1: Higher impact, constrained safety (Phase 4M4c)
  waterfallParallelizeStrategy,
  // rerenderStabilizeStrategy, (TODO: Phase 4M4d)
];

/**
 * Strategy lookup by ID
 */
export const STRATEGY_BY_ID = new Map<PatchStrategyId, PatchStrategy>(
  PATCH_STRATEGIES.map(s => [s.id, s])
);

/**
 * Strategy lookup by handled kind
 */
export const STRATEGY_BY_KIND = new Map<string, PatchStrategy>();
for (const strategy of PATCH_STRATEGIES) {
  for (const kind of strategy.handlesKinds) {
    STRATEGY_BY_KIND.set(kind, strategy);
  }
}

/**
 * Get strategies for a specific tier
 */
export function getStrategiesByTier(tier: 0 | 1 | 2): PatchStrategy[] {
  return PATCH_STRATEGIES.filter(s => s.tier === tier);
}

/**
 * Get all Tier 0 strategies (safe to ship by default)
 */
export function getTier0Strategies(): PatchStrategy[] {
  return getStrategiesByTier(0);
}

/**
 * Get all Tier 1 strategies (require --enable-tier1 flag)
 */
export function getTier1Strategies(): PatchStrategy[] {
  return getStrategiesByTier(1);
}

/**
 * Get strategy for a finding kind
 */
export function getStrategyForKind(kind: string): PatchStrategy | undefined {
  return STRATEGY_BY_KIND.get(kind);
}

/**
 * Get strategy by ID
 */
export function getStrategyById(id: PatchStrategyId): PatchStrategy | undefined {
  return STRATEGY_BY_ID.get(id);
}

/**
 * Check if a kind has an available strategy
 */
export function hasStrategyForKind(kind: string): boolean {
  return STRATEGY_BY_KIND.has(kind);
}

/**
 * Verification commands (required gates)
 */
export const REQUIRED_GATES = [
  'pnpm run type-check',
  'node --test os-platform/core/tests/phase83-tools.test.mjs',
];

/**
 * Optional additional gates for phase83+
 */
export const OPTIONAL_GATES = [
  'node --test tools/registry/perf-skill-audit/tests/scanner-self-test.mjs',
];
