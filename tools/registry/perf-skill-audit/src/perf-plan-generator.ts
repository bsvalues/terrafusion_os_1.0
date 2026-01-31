/**
 * Perf Plan Generator (Phase 4M4/4M5)
 *
 * Generates unified perf.plan.json with strategy-aware eligibility.
 * Integrates with patch-strategies library for auto-fix routing.
 *
 * Phase 4M5 additions:
 * - baseSha: Git SHA for safety validation in --auto mode
 * - estimatedLinesChanged: Estimated patch size (smaller = safer)
 * - riskScore: 0-100 score (lower = safer)
 *
 * GOVERNANCE: This tool is INFORMATIONAL ONLY.
 * Patches are generated but NOT applied unless explicitly enabled.
 */

import { spawnSync } from 'child_process';
import { hasStrategyForKind, REQUIRED_GATES } from './patch-strategies/index.js';
import type {
    EligibilityStatus,
    PatchRisk,
    PatchStrategyId,
    PerfPlan,
    PerfPlanItem,
} from './patch-strategies/types.js';
import type { Finding } from './scanners/types.js';

// Forbidden patterns (from AGENTS.md)
const FORBIDDEN_PATTERNS = [
  /\/ARCHIVE\//i,
  /^ARCHIVE\//i,
  /^specialized\//i,
  /^applications\//i,
  /\/archive\//i,
];

// Allowed surface (Core Governance Surface from AGENTS.md)
const ALLOWED_PATTERNS = [
  /^os-platform\/core\/pilot\//,
  /^os-platform\/core\/types\//,
  /^tools\/registry\//,
];

/**
 * Get current git HEAD SHA for baseSha tracking
 */
function getCurrentHeadSha(): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  return result.stdout?.trim() || 'unknown';
}

/**
 * Estimate lines changed for a patch based on evidence
 * Lower is better (smaller patch = less risk)
 */
function estimateLinesChanged(finding: Finding): number {
  const evidence = finding.evidence || [];

  // Base estimate from evidence lines
  if (evidence.length > 0) {
    // Count unique lines in evidence
    const lines = new Set(evidence.map(e => e.line));
    return lines.size;
  }

  // Fallback: use line range if available
  if (finding.lineStart && finding.lineEnd) {
    return finding.lineEnd - finding.lineStart + 1;
  }

  // Default: assume small change
  return 3;
}

/**
 * Calculate risk score (0-100) for selection algorithm
 * Lower is better (safer)
 *
 * Factors:
 * - Tier of strategy (0=safe, 1=medium, 2+=risky)
 * - Risk level (low/medium/high)
 * - Lines changed (more lines = more risk)
 * - Has evidence (no evidence = risky)
 */
function calculateRiskScore(
  finding: Finding,
  risk: PatchRisk,
  estimatedLines: number,
  strategyId: PatchStrategyId
): number {
  let score = 0;

  // Risk level: low=0, medium=25, high=50
  const riskScores: Record<PatchRisk, number> = { low: 0, medium: 25, high: 50 };
  score += riskScores[risk] || 50;

  // Strategy tier penalty
  const tier0Strategies: PatchStrategyId[] = [
    'missing-use-client',
    'dedupe-imports',
    'debarrel-import',
    'setstate-nonfunctional', // Phase 4M6a: Tier 0 expansion
  ];
  const tier1Strategies: PatchStrategyId[] = ['waterfall-parallelize', 'rerender-stabilize'];

  if (tier1Strategies.includes(strategyId)) {
    score += 15; // Tier 1 penalty
  } else if (!tier0Strategies.includes(strategyId)) {
    score += 30; // Unknown/review-only penalty
  }

  // Lines changed: 1-5 lines = 0, 6-10 = 5, 11-20 = 10, 20+ = 15
  if (estimatedLines <= 5) {
    score += 0;
  } else if (estimatedLines <= 10) {
    score += 5;
  } else if (estimatedLines <= 20) {
    score += 10;
  } else {
    score += 15;
  }

  // No evidence penalty
  if (!finding.evidence || finding.evidence.length === 0) {
    score += 10;
  }

  // Clamp to 0-100
  return Math.min(100, Math.max(0, score));
}

/**
 * Check if a file path is in the allowed governance surface
 */
function isInAllowedSurface(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return ALLOWED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Check if a file path is in a forbidden zone
 */
function isInForbiddenZone(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return FORBIDDEN_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Scanner name from rule
 */
function getScannerFromRule(rule: string): string {
  if (rule.startsWith('waterfall.')) return 'waterfall';
  if (rule.startsWith('bundle.')) return 'bundle';
  if (rule.startsWith('rerender.')) return 'rerender';
  if (rule.startsWith('client-boundary.')) return 'client-boundary';
  return 'unknown';
}

/**
 * Generate unique plan item ID
 */
function generatePlanItemId(finding: Finding, index: number): string {
  const scanner = getScannerFromRule(finding.rule);
  const kind = finding.kind || 'unknown';
  const fileHash = finding.file.replace(/[^a-zA-Z0-9]/g, '-').slice(-20);
  const line = finding.lineStart || 0;
  return `${scanner}-${kind}-${index}-${fileHash}-L${line}`.toLowerCase();
}

/**
 * Determine eligibility status and reason
 */
function determineEligibility(
  finding: Finding,
  hasStrategy: boolean
): { status: EligibilityStatus; reason: string } {
  // GOVERNANCE: Check forbidden zone first (hard block)
  if (isInForbiddenZone(finding.file)) {
    return { status: 'blocked', reason: 'File is in forbidden zone' };
  }

  // GOVERNANCE: Must be in allowed surface
  if (!isInAllowedSurface(finding.file)) {
    return { status: 'blocked', reason: 'Not in Core Governance Surface' };
  }

  // No strategy available
  if (!hasStrategy) {
    return { status: 'review', reason: 'No auto-fix strategy available for this kind' };
  }

  // Strategy-specific checks would be done when actually applying
  // For now, check basic requirements

  // Must have line boundaries
  if (!finding.lineStart) {
    return { status: 'review', reason: 'Missing line boundaries' };
  }

  // Must have evidence
  if (!finding.evidence || finding.evidence.length < 1) {
    return { status: 'review', reason: 'No evidence for transformation' };
  }

  // Priority score threshold (70 for auto-fix)
  if ((finding.priorityScore ?? 0) < 70) {
    return { status: 'review', reason: 'Priority score below threshold (70)' };
  }

  // Must have fixability=auto if present
  if (finding.fixability && finding.fixability !== 'auto') {
    return { status: 'review', reason: 'Finding marked as review-only' };
  }

  return { status: 'eligible', reason: 'Passed all eligibility checks' };
}

/**
 * Determine risk level for finding
 */
function determineRisk(finding: Finding): PatchRisk {
  const kind = finding.kind;

  // Tier 0 strategies are low risk
  if (kind === 'missing-use-client') return 'low';
  if (kind === 'duplicate-import') return 'low';
  if (kind === 'barrel-import') return 'low';

  // Rerender kinds
  if (kind === 'setstate-nonfunctional') return 'low';
  if (kind === 'inline-fn' || kind === 'inline-object' || kind === 'inline-array') return 'low';

  // Waterfall kinds
  if (kind === 'safe-parallel') {
    return (finding.priorityScore ?? 0) >= 70 ? 'low' : 'medium';
  }

  // Default to high for anything else
  return 'high';
}

/**
 * Determine patch strategy ID for finding
 */
function determinePatchStrategyId(finding: Finding, hasStrategy: boolean): PatchStrategyId {
  if (!hasStrategy) return 'review-only';

  const kind = finding.kind;

  // Map kinds to strategy IDs
  switch (kind) {
    case 'missing-use-client':
      return 'missing-use-client';
    case 'duplicate-import':
      return 'dedupe-imports';
    case 'barrel-import':
      return 'debarrel-import';
    case 'setstate-nonfunctional': // Phase 4M6a: Tier 0 expansion
      return 'setstate-nonfunctional';
    case 'safe-parallel':
      return 'waterfall-parallelize';
    case 'inline-object':
    case 'inline-array':
    case 'inline-fn':
      return 'rerender-stabilize';
    default:
      return 'review-only';
  }
}

/**
 * Convert finding to perf plan item
 */
function findingToPerfPlanItem(finding: Finding, index: number): PerfPlanItem | null {
  const kind = finding.kind || 'unknown';
  const hasStrategy = hasStrategyForKind(kind);
  const { status, reason } = determineEligibility(finding, hasStrategy);
  const risk = determineRisk(finding);
  const patchStrategy = determinePatchStrategyId(finding, hasStrategy && status === 'eligible');

  // Phase 4M5: Calculate estimated lines changed and risk score
  const estimatedLines = estimateLinesChanged(finding);
  const riskScore = calculateRiskScore(finding, risk, estimatedLines, patchStrategy);

  const item: PerfPlanItem = {
    id: generatePlanItemId(finding, index),
    scanner: getScannerFromRule(finding.rule),
    kind,
    priorityScore: finding.priorityScore ?? 50,
    eligibility: status,
    reason,
    patchStrategy,
    file: finding.file,
    files: [finding.file],
    evidence: (finding.evidence || []).map(e => ({
      line: e.line,
      snippet: e.snippet,
      varName: e.varName,
    })),
    risk,
    gates: [...REQUIRED_GATES],
    suggestedPatch: finding.suggestedFix,
    startLine: finding.lineStart,
    endLine: finding.lineEnd,
    functionName: finding.functionName || finding.componentName || finding.moduleName,
    // Phase 4M5: Selection algorithm fields
    estimatedLinesChanged: estimatedLines,
    riskScore,
  };

  return item;
}

/**
 * Generate unified perf.plan.json from findings
 */
export function generatePerfPlan(findings: Finding[], ref: string, rulesVersion: string): PerfPlan {
  const items: PerfPlanItem[] = [];

  // Convert findings to plan items
  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    // Skip findings without kind classification
    if (!finding.kind) continue;

    const planItem = findingToPerfPlanItem(finding, i);
    if (planItem) {
      items.push(planItem);
    }
  }

  // Sort by eligibility (eligible first), then by priority score (descending), then by id (stable)
  items.sort((a, b) => {
    // Eligible > review > blocked
    const eligibilityOrder: Record<EligibilityStatus, number> = {
      eligible: 0,
      review: 1,
      blocked: 2,
    };

    if (a.eligibility !== b.eligibility) {
      return eligibilityOrder[a.eligibility] - eligibilityOrder[b.eligibility];
    }

    // Then by priority score
    if (a.priorityScore !== b.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    // Then by id for stable sort
    return a.id.localeCompare(b.id);
  });

  // Calculate summary
  const eligible = items.filter(i => i.eligibility === 'eligible').length;
  const review = items.filter(i => i.eligibility === 'review').length;
  const blocked = items.filter(i => i.eligibility === 'blocked').length;

  // Count by strategy
  const byStrategy: Record<PatchStrategyId, number> = {
    'missing-use-client': 0,
    'dedupe-imports': 0,
    'debarrel-import': 0,
    'setstate-nonfunctional': 0, // Phase 4M6a: Tier 0 expansion
    'waterfall-parallelize': 0,
    'rerender-stabilize': 0,
    'review-only': 0,
  };

  for (const item of items) {
    byStrategy[item.patchStrategy] = (byStrategy[item.patchStrategy] || 0) + 1;
  }

  // Count by risk
  const byRisk: Record<PatchRisk, number> = {
    low: items.filter(i => i.risk === 'low').length,
    medium: items.filter(i => i.risk === 'medium').length,
    high: items.filter(i => i.risk === 'high').length,
  };

  // Phase 4M5: Get current HEAD for baseSha safety validation
  const baseSha = getCurrentHeadSha();

  return {
    generated: new Date().toISOString(),
    ref,
    rulesVersion,
    baseSha, // Phase 4M5: Required for --auto mode safety validation
    summary: {
      total: items.length,
      eligible,
      review,
      blocked,
      byStrategy,
      byRisk,
    },
    items,
  };
}

/**
 * Get eligible items from plan filtered by strategy/kind
 */
export function getEligibleItems(
  plan: PerfPlan,
  options: {
    strategy?: PatchStrategyId;
    kind?: string;
    maxItems?: number;
  } = {}
): PerfPlanItem[] {
  let items = plan.items.filter(i => i.eligibility === 'eligible');

  if (options.strategy) {
    items = items.filter(i => i.patchStrategy === options.strategy);
  }

  if (options.kind) {
    items = items.filter(i => i.kind === options.kind);
  }

  if (options.maxItems) {
    items = items.slice(0, options.maxItems);
  }

  return items;
}

export default { generatePerfPlan, getEligibleItems };
