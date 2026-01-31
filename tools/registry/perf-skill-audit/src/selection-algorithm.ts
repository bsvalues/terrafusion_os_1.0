/**
 * Selection Algorithm for --auto mode (Phase 4M5)
 *
 * Deterministic selection of best candidate for patching.
 * This module is extracted for testability and contract verification.
 *
 * SELECTION ORDER (tiebreaker):
 * 1. In allowed surface ✅
 * 2. Eligible ✅
 * 3. Tier 0 (unless tier1Enabled)
 * 4. Highest priorityScore
 * 5. Smallest estimatedLinesChanged (smallest diff footprint)
 * 6. Stable id (lexicographic, for determinism)
 */

import type { PerfPlan, PerfPlanItem, SelectionReason } from './patch-strategies/types.js';

// Strategy tier lookup (matching patch-strategies/index.ts)
const TIER_0_STRATEGIES = new Set([
  'missing-use-client',
  'dedupe-imports',
  'debarrel-import',
  'setstate-nonfunctional', // Phase 4M6a: Tier 0 expansion
]);

const TIER_1_STRATEGIES = new Set(['waterfall-parallelize', 'rerender-stabilize']);

/**
 * Get strategy tier (0/1/-1 for unknown/review-only)
 */
export function getStrategyTier(strategyId: string | undefined): number {
  if (!strategyId || strategyId === 'review-only') return -1;
  if (TIER_0_STRATEGIES.has(strategyId)) return 0;
  if (TIER_1_STRATEGIES.has(strategyId)) return 1;
  return -1;
}

/**
 * Governance filters configuration
 */
export interface GovernanceConfig {
  /** Allowed path patterns (Core Governance Surface) */
  allowedPatterns: RegExp[];
  /** Forbidden path patterns */
  forbiddenPatterns: RegExp[];
}

/**
 * Selection options
 */
export interface SelectionOptions {
  /** Enable Tier 1 strategies */
  tier1Enabled: boolean;
  /** Governance configuration */
  governance: GovernanceConfig;
}

/**
 * Default governance from AGENTS.md
 */
export const DEFAULT_GOVERNANCE: GovernanceConfig = {
  allowedPatterns: [
    /^os-platform\/core\/pilot\//,
    /^os-platform\/core\/types\//,
    /^tools\/registry\//,
  ],
  forbiddenPatterns: [
    /\/ARCHIVE\//i,
    /^ARCHIVE\//i,
    /^specialized\//i,
    /^applications\//i,
    /\/archive\//i,
  ],
};

/**
 * Check if file is in allowed surface
 */
export function isInAllowedSurface(
  filePath: string,
  patterns: RegExp[] = DEFAULT_GOVERNANCE.allowedPatterns
): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return patterns.some(p => p.test(normalized));
}

/**
 * Check if file is in forbidden zone
 */
export function isInForbiddenZone(
  filePath: string,
  patterns: RegExp[] = DEFAULT_GOVERNANCE.forbiddenPatterns
): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return patterns.some(p => p.test(normalized));
}

/**
 * Selection result
 */
export type SelectionResult =
  | { item: PerfPlanItem; reason: SelectionReason }
  | { item: null; reason: SelectionReason };

/**
 * Deterministic selection algorithm for --auto mode
 *
 * NON-NEGOTIABLE: Same input + same options → same selected item id
 *
 * @param plan The perf plan to select from
 * @param options Selection options (tier1Enabled, governance)
 * @returns The best candidate with selection reason, or null with reason
 */
export function selectBestCandidate(plan: PerfPlan, options: SelectionOptions): SelectionResult {
  const allItems = plan.items;
  const candidatesConsidered = allItems.length;
  let filteredByGovernance = 0;
  let filteredByTier = 0;

  // Step 1 & 2: Filter to allowed surface + eligible
  const governanceFiltered = allItems.filter(item => {
    // Must be eligible
    if (item.eligibility !== 'eligible') {
      return false;
    }

    // Must have a patch strategy
    if (!item.patchStrategy) {
      return false;
    }

    // Must be in allowed surface
    if (!isInAllowedSurface(item.file, options.governance.allowedPatterns)) {
      filteredByGovernance++;
      return false;
    }

    // Must not be in forbidden path
    if (isInForbiddenZone(item.file, options.governance.forbiddenPatterns)) {
      filteredByGovernance++;
      return false;
    }

    return true;
  });

  if (governanceFiltered.length === 0) {
    return {
      item: null,
      reason: {
        reason: 'No candidates pass governance filters (allowed surface + eligible)',
        candidatesConsidered,
        filteredByGovernance,
        filteredByTier: 0,
      },
    };
  }

  // Step 3: Filter by tier (Tier 0 only unless tier1Enabled)
  const tierFiltered = governanceFiltered.filter(item => {
    const tier = getStrategyTier(item.patchStrategy);
    if (tier < 0) {
      return false; // No valid strategy
    }
    if (tier > 0 && !options.tier1Enabled) {
      filteredByTier++;
      return false;
    }
    return true;
  });

  if (tierFiltered.length === 0) {
    return {
      item: null,
      reason: {
        reason: 'No Tier 0 candidates available (use --enable-tier1 for Tier 1)',
        candidatesConsidered,
        filteredByGovernance,
        filteredByTier,
      },
    };
  }

  // Steps 4-6: Sort deterministically
  // Priority: priorityScore DESC → estimatedLinesChanged ASC → id ASC
  const sorted = [...tierFiltered].sort((a, b) => {
    // 4. Highest priorityScore first
    if (a.priorityScore !== b.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    // 5. Smallest estimatedLinesChanged first (prefer smaller patches)
    const aLines = a.estimatedLinesChanged ?? Infinity;
    const bLines = b.estimatedLinesChanged ?? Infinity;
    if (aLines !== bLines) {
      return aLines - bLines;
    }

    // 6. Stable id (lexicographic for determinism)
    return a.id.localeCompare(b.id);
  });

  const selected = sorted[0];
  const tier = getStrategyTier(selected.patchStrategy);

  return {
    item: selected,
    reason: {
      reason: `Selected: priorityScore=${selected.priorityScore}, tier=${tier}, estimatedLines=${selected.estimatedLinesChanged ?? 'unknown'}, id=${selected.id}`,
      candidatesConsidered,
      filteredByGovernance,
      filteredByTier,
      rankingFactors: {
        priorityScore: selected.priorityScore,
        estimatedLinesChanged: selected.estimatedLinesChanged ?? 0,
        riskScore: selected.riskScore ?? 0,
        id: selected.id,
      },
    },
  };
}

/**
 * Noop reason categories for --auto mode proofs
 */
export type NoopReasonCategory =
  | 'no-eligible'
  | 'all-filtered-by-governance'
  | 'blocked-by-safety-rails'
  | 'tier-disabled';

/**
 * Classify a noop selection reason
 */
export function classifyNoopReason(reason: SelectionReason): NoopReasonCategory {
  const reasonStr = reason.reason.toLowerCase();

  if (reasonStr.includes('governance')) {
    return 'all-filtered-by-governance';
  }
  if (reasonStr.includes('tier')) {
    return 'tier-disabled';
  }
  if (reasonStr.includes('safety')) {
    return 'blocked-by-safety-rails';
  }
  return 'no-eligible';
}
