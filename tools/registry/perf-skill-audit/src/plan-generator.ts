/**
 * Plan Generator - Phase 4I
 *
 * Converts v2 scanner findings into a machine-consumable remediation plan.
 * This is the handoff contract to Ralph Loop / QC-019.
 *
 * GOVERNANCE: This tool is INFORMATIONAL ONLY.
 * Patches are generated but NOT applied unless explicitly enabled.
 */

import type {
    ClientBoundaryKind,
    EligibilityCheck,
    Finding,
    PatchRisk,
    PatchStrategy,
    PlanItem,
    RemediationPlan,
    RerenderKind,
    WaterfallKind,
} from './scanners/types.js';

// Auto-fixable rerender kinds
const AUTO_FIXABLE_RERENDER_KINDS: RerenderKind[] = [
  'inline-object',
  'inline-array',
  'inline-fn',
  'setstate-nonfunctional',
];

// Auto-fixable client-boundary kinds (Phase 4M3)
const AUTO_FIXABLE_CLIENTBOUNDARY_KINDS: ClientBoundaryKind[] = [
  'missing-use-client',
  'dynamic-candidate', // Only in client files
];

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

// Verification commands (required gates)
const VERIFICATION_COMMANDS = [
  'pnpm run type-check',
  'node --test os-platform/core/tests/phase83-tools.test.mjs',
];

/**
 * Generate a unique finding ID
 */
function generateFindingId(finding: Finding, index: number): string {
  const fileHash = finding.file.replace(/[^a-zA-Z0-9]/g, '-').slice(-30);
  const funcName = finding.functionName || 'unknown';
  return `wf-${index}-${fileHash}-${funcName}`.toLowerCase();
}

/**
 * Determine patch strategy based on classification
 */
function determinePatchStrategy(kind: WaterfallKind): PatchStrategy {
  switch (kind) {
    case 'safe-parallel':
      return 'promise-all';
    case 'batch-candidate':
      return 'batch-stub';
    case 'dependent':
    case 'loop-seq':
    case 'retry-seq':
    default:
      return 'review-only';
  }
}

/**
 * Assess risk level for patching
 */
function assessRisk(finding: Finding, kind: WaterfallKind): PatchRisk {
  // Low risk: safe-parallel with high confidence
  if (kind === 'safe-parallel' && (finding.priorityScore ?? 0) >= 60) {
    return 'low';
  }

  // Medium risk: batch candidates or lower-confidence safe-parallel
  if (kind === 'batch-candidate' || kind === 'safe-parallel') {
    return 'medium';
  }

  // High risk: dependent or loop patterns
  return 'high';
}

/**
 * Check eligibility for auto-fix
 * Key guardrail: function boundary integrity
 */
function checkEligibility(finding: Finding): EligibilityCheck {
  // Must have function name (scope-aware)
  if (!finding.functionName) {
    return { eligible: false, reason: 'No function scope detected' };
  }

  // Must have line boundaries
  if (!finding.lineStart || !finding.lineEnd) {
    return { eligible: false, reason: 'Missing line boundaries' };
  }

  // Must have at least 2 evidence items
  if (!finding.evidence || finding.evidence.length < 2) {
    return { eligible: false, reason: 'Insufficient evidence for safe transformation' };
  }

  // Kind must be auto-fixable
  if (finding.kind !== 'safe-parallel') {
    return { eligible: false, reason: `Kind '${finding.kind}' requires manual review` };
  }

  // Priority score threshold
  if ((finding.priorityScore ?? 0) < 50) {
    return { eligible: false, reason: 'Priority score below threshold (50)' };
  }

  return { eligible: true };
}

/**
 * Generate Promise.all() patch for safe-parallel findings
 */
function generatePromiseAllPatch(finding: Finding): string | undefined {
  if (!finding.evidence || finding.evidence.length < 2) {
    return undefined;
  }

  const evidence = finding.evidence;

  // Extract variable names and call expressions
  const transformations: { varName: string; call: string }[] = [];

  for (const e of evidence) {
    const varMatch = e.snippet.match(/(?:const|let|var)\s+(\w+)\s*=\s*await\s+(.+?)(?:;?\s*$)/);
    if (varMatch) {
      transformations.push({
        varName: varMatch[1],
        call: varMatch[2],
      });
    } else {
      // Await without assignment
      const awaitMatch = e.snippet.match(/await\s+(.+?)(?:;?\s*$)/);
      if (awaitMatch) {
        transformations.push({
          varName: `result${transformations.length + 1}`,
          call: awaitMatch[1],
        });
      }
    }
  }

  if (transformations.length < 2) {
    return undefined;
  }

  // Generate the Promise.all() transformation
  const varNames = transformations.map(t => t.varName).join(', ');
  const calls = transformations.map(t => `  ${t.call}`).join(',\n');

  return `const [${varNames}] = await Promise.all([
${calls}
]);`;
}

/**
 * Convert a finding into a plan item
 */
function findingToPlanItem(finding: Finding, index: number): PlanItem | null {
  // Handle waterfall findings
  if (finding.rule === 'waterfall.parallelize') {
    return waterfallToPlanItem(finding, index);
  }

  // Handle rerender findings (Phase 4M2)
  if (finding.rule?.startsWith('rerender.')) {
    return rerenderToPlanItem(finding, index);
  }

  // Handle client-boundary findings (Phase 4M3)
  if (finding.rule?.startsWith('client-boundary.')) {
    return clientBoundaryToPlanItem(finding, index);
  }

  // Other findings not yet supported for plan generation
  return null;
}

/**
 * Convert waterfall finding to plan item
 */
function waterfallToPlanItem(finding: Finding, index: number): PlanItem | null {
  const kind = (finding.kind || 'dependent') as WaterfallKind;
  const patchStrategy = determinePatchStrategy(kind);
  const risk = assessRisk(finding, kind);
  const eligibility = checkEligibility(finding);

  const planItem: PlanItem = {
    id: generateFindingId(finding, index),
    file: finding.file,
    functionName: finding.functionName || '<unknown>',
    startLine: finding.lineStart || 0,
    endLine: finding.lineEnd || 0,
    kind,
    priorityScore: finding.priorityScore ?? 50,
    patchStrategy,
    risk,
    eligibility,
    verification: VERIFICATION_COMMANDS,
    evidence: finding.evidence || [],
  };

  // Generate patch for eligible safe-parallel findings
  if (patchStrategy === 'promise-all' && eligibility.eligible) {
    planItem.suggestedPatch = generatePromiseAllPatch(finding);
  }

  return planItem;
}

/**
 * Convert rerender finding to plan item (Phase 4M2)
 */
function rerenderToPlanItem(finding: Finding, index: number): PlanItem | null {
  const kind = finding.kind as RerenderKind;

  // Determine if auto-fixable
  const isAutoFixable = AUTO_FIXABLE_RERENDER_KINDS.includes(kind);

  // Patch strategy based on kind
  let patchStrategy: PatchStrategy = 'review-only';
  if (isAutoFixable && finding.fixability === 'auto') {
    patchStrategy = 'promise-all'; // Reusing for now, could add 'useMemo' etc.
  }

  // Risk assessment for rerenders
  let risk: PatchRisk = 'medium';
  if (kind === 'setstate-nonfunctional') {
    risk = 'low'; // Very safe transformation
  } else if (kind === 'inline-fn' || kind === 'inline-object' || kind === 'inline-array') {
    risk = 'low'; // Mechanical transformation
  } else {
    risk = 'high'; // Review-only patterns
  }

  // Eligibility check for rerenders
  const eligibility = checkRerenderEligibility(finding, isAutoFixable);

  const planItem: PlanItem = {
    id: `rr-${index}-${finding.file.replace(/[^a-zA-Z0-9]/g, '-').slice(-30)}-${finding.componentName || 'unknown'}`.toLowerCase(),
    file: finding.file,
    functionName: finding.componentName || '<unknown>',
    startLine: finding.lineStart || 0,
    endLine: finding.lineEnd || 0,
    kind,
    priorityScore: finding.priorityScore ?? 50,
    patchStrategy,
    risk,
    eligibility,
    verification: VERIFICATION_COMMANDS,
    evidence: finding.evidence || [],
  };

  // Generate patch for eligible findings
  if (eligibility.eligible && finding.suggestedFix) {
    planItem.suggestedPatch = finding.suggestedFix;
  }

  return planItem;
}

/**
 * Check eligibility for rerender auto-fix
 */
function checkRerenderEligibility(finding: Finding, isAutoFixable: boolean): EligibilityCheck {
  // GOVERNANCE: Must be in allowed surface
  if (!isInAllowedSurface(finding.file)) {
    return { eligible: false, reason: 'Not in Core Governance Surface' };
  }

  // GOVERNANCE: Must not be in forbidden zone
  if (isInForbiddenZone(finding.file)) {
    return { eligible: false, reason: 'File is in forbidden zone' };
  }

  // Must be auto-fixable kind
  if (!isAutoFixable) {
    return { eligible: false, reason: `Kind '${finding.kind}' is review-only` };
  }

  // Must have fixability=auto
  if (finding.fixability !== 'auto') {
    return { eligible: false, reason: 'Finding marked as review-only' };
  }

  // Must have line boundaries
  if (!finding.lineStart) {
    return { eligible: false, reason: 'Missing line boundaries' };
  }

  // Must have evidence
  if (!finding.evidence || finding.evidence.length < 1) {
    return { eligible: false, reason: 'No evidence for transformation' };
  }

  // Priority score threshold (60 for rerenders)
  if ((finding.priorityScore ?? 0) < 60) {
    return { eligible: false, reason: 'Priority score below threshold (60)' };
  }

  return { eligible: true };
}

/**
 * Convert client-boundary finding to plan item (Phase 4M3)
 */
function clientBoundaryToPlanItem(finding: Finding, index: number): PlanItem | null {
  const kind = finding.kind as ClientBoundaryKind;

  // Determine if auto-fixable
  const isAutoFixable = AUTO_FIXABLE_CLIENTBOUNDARY_KINDS.includes(kind);

  // Patch strategy based on kind
  let patchStrategy: PatchStrategy = 'review-only';
  if (isAutoFixable && finding.fixability === 'auto') {
    patchStrategy = 'promise-all'; // Reusing for now
  }

  // Risk assessment for client-boundary
  let risk: PatchRisk = 'medium';
  if (kind === 'missing-use-client') {
    risk = 'low'; // Adding directive is very safe
  } else if (kind === 'dynamic-candidate') {
    risk = 'low'; // Mechanical transformation
  } else {
    risk = 'high'; // Review-only patterns
  }

  // Eligibility check for client-boundary
  const eligibility = checkClientBoundaryEligibility(finding, isAutoFixable);

  const planItem: PlanItem = {
    id: `cb-${index}-${finding.file.replace(/[^a-zA-Z0-9]/g, '-').slice(-30)}-${finding.symbol || 'unknown'}`.toLowerCase(),
    file: finding.file,
    functionName: finding.moduleName || finding.symbol || '<unknown>',
    startLine: finding.lineStart || 0,
    endLine: finding.lineEnd || 0,
    kind,
    priorityScore: finding.priorityScore ?? 50,
    patchStrategy,
    risk,
    eligibility,
    verification: VERIFICATION_COMMANDS,
    evidence: finding.evidence || [],
  };

  // Generate patch for eligible findings
  if (eligibility.eligible && finding.suggestedFix) {
    planItem.suggestedPatch = finding.suggestedFix;
  }

  return planItem;
}

/**
 * Check eligibility for client-boundary auto-fix
 */
function checkClientBoundaryEligibility(
  finding: Finding,
  isAutoFixable: boolean
): EligibilityCheck {
  // GOVERNANCE: Must be in allowed surface
  if (!isInAllowedSurface(finding.file)) {
    return { eligible: false, reason: 'Not in Core Governance Surface' };
  }

  // GOVERNANCE: Must not be in forbidden zone
  if (isInForbiddenZone(finding.file)) {
    return { eligible: false, reason: 'File is in forbidden zone' };
  }

  // Must be auto-fixable kind
  if (!isAutoFixable) {
    return { eligible: false, reason: `Kind '${finding.kind}' is review-only` };
  }

  // Must have fixability=auto
  if (finding.fixability !== 'auto') {
    return { eligible: false, reason: 'Finding marked as review-only' };
  }

  // Must have line boundaries
  if (!finding.lineStart) {
    return { eligible: false, reason: 'Missing line boundaries' };
  }

  // Must have evidence
  if (!finding.evidence || finding.evidence.length < 1) {
    return { eligible: false, reason: 'No evidence for transformation' };
  }

  // Priority score threshold (70 for client-boundary - higher confidence required)
  if ((finding.priorityScore ?? 0) < 70) {
    return { eligible: false, reason: 'Priority score below threshold (70)' };
  }

  return { eligible: true };
}

/**
 * Generate remediation plan from findings
 */
export function generateRemediationPlan(
  findings: Finding[],
  ref: string,
  rulesVersion: string
): RemediationPlan {
  const items: PlanItem[] = [];

  // Convert findings to plan items
  for (let i = 0; i < findings.length; i++) {
    const planItem = findingToPlanItem(findings[i], i);
    if (planItem) {
      items.push(planItem);
    }
  }

  // Sort by priority score (descending) then by eligibility
  items.sort((a, b) => {
    // Eligible first
    if (a.eligibility.eligible !== b.eligibility.eligible) {
      return a.eligibility.eligible ? -1 : 1;
    }
    // Then by priority score
    return b.priorityScore - a.priorityScore;
  });

  // Calculate summary
  const eligible = items.filter(i => i.eligibility.eligible).length;
  const promiseAll = items.filter(i => i.patchStrategy === 'promise-all').length;
  const batchStub = items.filter(i => i.patchStrategy === 'batch-stub').length;
  const reviewOnly = items.filter(i => i.patchStrategy === 'review-only').length;

  return {
    generated: new Date().toISOString(),
    ref,
    rulesVersion,
    summary: {
      total: items.length,
      eligible,
      promiseAll,
      batchStub,
      reviewOnly,
    },
    items,
  };
}

/**
 * Generate unified diff for a plan item
 */
export function generateUnifiedDiff(planItem: PlanItem, originalLines: string[]): string | null {
  if (!planItem.eligibility.eligible || !planItem.suggestedPatch) {
    return null;
  }

  const { startLine, endLine, file, suggestedPatch, evidence } = planItem;

  // Build the original block from evidence
  const originalBlock = evidence.map(e => e.snippet).join('\n');

  // Build unified diff header
  const lines: string[] = [
    `--- a/${file}`,
    `+++ b/${file}`,
    `@@ -${startLine},${endLine - startLine + 1} +${startLine},1 @@`,
  ];

  // Add original lines (prefixed with -)
  for (const e of evidence) {
    lines.push(`-${e.snippet}`);
  }

  // Add new lines (prefixed with +)
  for (const line of suggestedPatch.split('\n')) {
    lines.push(`+${line}`);
  }

  return lines.join('\n');
}

export default { generateRemediationPlan, generateUnifiedDiff };
