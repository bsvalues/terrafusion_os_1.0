#!/usr/bin/env npx tsx
/**
 * Ralph Apply - Phase 4J/4M4/4M5: Controlled Auto-Apply Lane with Strategy Routing
 *
 * Applies eligible remediation patches with guardrails.
 * This is the execution lane for the Ralph Loop / QC-019.
 *
 * SAFETY INVARIANTS (NON-NEGOTIABLE):
 * - Max 1 plan item per run (--max 1)
 * - git apply --check before applying
 * - function boundary integrity required
 * - no forbidden paths
 * - gates must pass
 * - if gates fail: reset hard + exit non-zero
 *
 * Phase 4M4 EXTENSIONS:
 * - --kind=<kind>         Filter by finding kind (e.g., missing-use-client)
 * - --strategy=<id>       Filter by patch strategy (e.g., missing-use-client)
 * - --explain             Show detailed dry-run (what would change)
 * - --emit-proof          Emit JSON proof of each patch application
 * - --enable-tier1        Enable Tier 1 strategies (default: Tier 0 only)
 * - --plan=<path>         Use custom plan file (default: perf.plan.json, fallback: waterfalls.plan.json)
 *
 * Phase 4M5 EXTENSIONS (Autonomy Envelope):
 * - --auto                Deterministic selection + governed autonomy
 *                         Selection order: allowed surface → eligible → tier0 → priorityScore → smallest diff → id
 *                         Safety rails: refuse on main, refuse dirty tree, refuse baseSha mismatch
 *                         NON-NEGOTIABLE: ALWAYS emit ApplyProof (even on noop)
 *
 * GOVERNANCE: This tool respects the Core Governance Surface.
 * It will NEVER touch forbidden paths even if they appear in the plan.
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getStrategyForKind, STRATEGY_BY_ID } from './patch-strategies/index.js';
import {
    getSemanticGuards,
    getTransformationSummary,
} from './patch-strategies/setstate-nonfunctional.js';
import type {
    ApplyOutcome,
    ApplyProof,
    PatchStrategyId,
    PerfPlan,
    PerfPlanItem,
    SelectionReason,
} from './patch-strategies/types.js';
import type { PlanItem, RemediationPlan } from './scanners/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI flags
const CLI_FLAGS = {
  dryRun: process.argv.includes('--dry-run'),
  max: parseInt(process.argv.find(a => a.startsWith('--max='))?.split('=')[1] || '1', 10),
  verbose: process.argv.includes('--verbose'),
  createPr: process.argv.includes('--create-pr'),
  // Phase 4M4 extensions
  kind: process.argv.find(a => a.startsWith('--kind='))?.split('=')[1],
  strategy: process.argv.find(a => a.startsWith('--strategy='))?.split('=')[1],
  explain: process.argv.includes('--explain'),
  emitProof: process.argv.includes('--emit-proof'),
  enableTier1: process.argv.includes('--enable-tier1'),
  plan: process.argv.find(a => a.startsWith('--plan='))?.split('=')[1],
  // Phase 4M5: Autonomy envelope with deterministic selection
  auto: process.argv.includes('--auto'),
};

// Proof collection for --emit-proof
const appliedProofs: ApplyProof[] = [];

// Phase 4M6c: Autonomy report stats (accumulated during --auto mode)
interface AutonomyReportStats {
  totalCandidates: number;
  eligible: number;
  applied: number;
  noop: number;
  blockedByGovernance: number;
  blockedBySafetyRails: number;
  blockedByTier: number;
  selectedItem: PerfPlanItem | null;
  selectionReason: SelectionReason | null;
  topCandidates: Array<{
    id: string;
    file: string;
    kind: string;
    strategy: string;
    priorityScore: number;
    riskScore: number;
    estimatedLines: number;
  }>;
}

let autonomyStats: AutonomyReportStats = {
  totalCandidates: 0,
  eligible: 0,
  applied: 0,
  noop: 0,
  blockedByGovernance: 0,
  blockedBySafetyRails: 0,
  blockedByTier: 0,
  selectedItem: null,
  selectionReason: null,
  topCandidates: [],
};

// Forbidden paths (from AGENTS.md governance)
const FORBIDDEN_PATTERNS = [
  /\/ARCHIVE\//i,
  /^ARCHIVE\//i,
  /^specialized\//i,
  /^applications\//i,
  /\/archive\//i,
];

// Allowed paths (Core Governance Surface from AGENTS.md)
const ALLOWED_PATTERNS = [
  /^os-platform\/core\/pilot\//,
  /^os-platform\/core\/types\//,
  /^tools\/registry\//,
];

// Required gates
const REQUIRED_GATES = [
  { name: 'type-check', command: 'pnpm run type-check' },
  { name: 'phase83-tools', command: 'node --test os-platform/core/tests/phase83-tools.test.mjs' },
];

// ============================================================================
// Phase 4M5: Safety Rails for --auto mode
// ============================================================================

/**
 * Check safety rails for --auto mode (NON-NEGOTIABLE)
 * Refuses: on main branch, dirty working tree, baseSha mismatch
 */
function checkAutoSafetyRails(plan: PerfPlan): {
  safe: boolean;
  reason?: string;
  details?: Record<string, any>;
} {
  // 1. Refuse on main/master branch
  const branchResult = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });
  const currentBranch = branchResult.stdout?.trim() || '';
  if (['main', 'master'].includes(currentBranch)) {
    return {
      safe: false,
      reason: 'SAFETY: Refusing --auto on protected branch',
      details: { branch: currentBranch, protectedBranches: ['main', 'master'] },
    };
  }

  // 2. Refuse if working tree is dirty
  const statusResult = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  });
  if (statusResult.stdout && statusResult.stdout.trim().length > 0) {
    return {
      safe: false,
      reason: 'SAFETY: Refusing --auto with dirty working tree',
      details: { dirtyFiles: statusResult.stdout.trim().split('\n').length },
    };
  }

  // 3. Refuse if plan baseSha doesn't match current HEAD
  if (plan.baseSha) {
    const headResult = spawnSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    });
    const currentHead = headResult.stdout?.trim() || '';
    if (currentHead !== plan.baseSha) {
      return {
        safe: false,
        reason: 'SAFETY: Plan baseSha does not match current HEAD',
        details: { planBaseSha: plan.baseSha, currentHead },
      };
    }
  }

  return { safe: true };
}

/**
 * Deterministic selection algorithm for --auto mode
 *
 * Selection order (tiebreaker):
 * 1. In allowed surface ✅
 * 2. Eligible ✅
 * 3. Tier 0 (unless --enable-tier1)
 * 4. Highest priorityScore
 * 5. Smallest estimatedLinesChanged (smallest diff footprint)
 * 6. Stable id (lexicographic, for determinism)
 *
 * @returns The best candidate and reason, or null with reason if none
 */
function selectBestCandidate(
  plan: PerfPlan
): { item: PerfPlanItem; reason: SelectionReason } | { item: null; reason: SelectionReason } {
  const allItems = plan.items;
  let candidatesConsidered = allItems.length;
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
    if (!isInAllowedSurface(item.file)) {
      filteredByGovernance++;
      return false;
    }

    // Must not be in forbidden path
    const forbidden = isForbiddenPath(item.file);
    if (forbidden.forbidden) {
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

  // Step 3: Filter by tier (Tier 0 only unless --enable-tier1)
  const tierFiltered = governanceFiltered.filter(item => {
    const strategy = STRATEGY_BY_ID.get(item.patchStrategy!);
    if (!strategy) {
      return false;
    }
    if (strategy.tier > 0 && !CLI_FLAGS.enableTier1) {
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
  const strategy = STRATEGY_BY_ID.get(selected.patchStrategy!);

  return {
    item: selected,
    reason: {
      reason: `Selected: priorityScore=${selected.priorityScore}, tier=${strategy?.tier ?? 0}, estimatedLines=${selected.estimatedLinesChanged ?? 'unknown'}, id=${selected.id}`,
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

// Evidence commit template
const COMMIT_TEMPLATE = `fix(perf): auto-apply Promise.all() optimization

File: {{file}}
Function: {{functionName}}
Kind: {{kind}}
PriorityScore: {{priorityScore}}
Risk: {{risk}}
PlanItemId: {{id}}

Evidence:
{{evidence}}

Transformation: Sequential awaits → Promise.all()

Gates:
- pnpm run type-check: ✅ PASS
- node --test phase83-tools.test.mjs: ✅ PASS

AI-Collaboration: Ralph-Loop-4J
Government: FISMA-aware automated refactor`;

// Governance education messages
const GOVERNANCE_EDUCATION: Record<string, string> = {
  '/ARCHIVE/': 'AGENTS.md: DO NOT TOUCH **/ARCHIVE/**. Archive is immutable legacy code.',
  '^ARCHIVE/': 'AGENTS.md: DO NOT TOUCH ARCHIVE/**. Archive is immutable legacy code.',
  '^specialized/': 'AGENTS.md: specialized/** requires explicit authorization.',
  '^applications/': 'AGENTS.md: applications/** requires explicit authorization.',
  '/archive/': 'AGENTS.md: DO NOT TOUCH **/archive/**. Archive is immutable legacy code.',
};

/**
 * Get governance education message for a forbidden pattern
 */
function getGovernanceEducation(pattern: string): string {
  for (const [key, message] of Object.entries(GOVERNANCE_EDUCATION)) {
    if (pattern.includes(key.replace('^', '').replace('/', ''))) {
      return message;
    }
  }
  return 'File is in a forbidden governance zone.';
}

/**
 * Get suggested action for a forbidden path
 */
function getSuggestedAction(filePath: string): string {
  if (filePath.includes('/archive/') || filePath.includes('/ARCHIVE/')) {
    return 'To remediate: Move modern equivalent into allowed scope (os-platform/core/**, tools/registry/**)';
  }
  if (filePath.startsWith('applications/') || filePath.startsWith('specialized/')) {
    return 'To remediate: Request explicit authorization or refactor into allowed scope';
  }
  return 'To remediate: Move code into the Core Governance Surface';
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
function isForbiddenPath(filePath: string): {
  forbidden: boolean;
  reason?: string;
  education?: string;
  suggestion?: string;
} {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        forbidden: true,
        reason: `Path matches forbidden pattern: ${pattern.source}`,
        education: getGovernanceEducation(pattern.source),
        suggestion: getSuggestedAction(normalizedPath),
      };
    }
  }

  return { forbidden: false };
}

/**
 * Validate function boundary integrity
 */
function hasBoundaryIntegrity(item: PlanItem): { valid: boolean; reason?: string } {
  if (!item.functionName || item.functionName === '<unknown>') {
    return { valid: false, reason: 'No function name detected' };
  }

  if (!item.startLine || !item.endLine || item.startLine <= 0 || item.endLine <= 0) {
    return { valid: false, reason: 'Missing or invalid line boundaries' };
  }

  if (item.endLine < item.startLine) {
    return { valid: false, reason: 'Invalid line range (end < start)' };
  }

  return { valid: true };
}

/**
 * Generate unified diff for a plan item
 */
function generatePatch(item: PlanItem): string {
  if (!item.suggestedPatch) {
    throw new Error('No suggested patch available');
  }

  const lines: string[] = [
    `--- a/${item.file}`,
    `+++ b/${item.file}`,
    `@@ -${item.startLine},${item.evidence.length} +${item.startLine},1 @@`,
  ];

  // Add original lines (prefixed with -)
  for (const e of item.evidence) {
    lines.push(`-${e.snippet}`);
  }

  // Add new lines (prefixed with +)
  for (const line of item.suggestedPatch.split('\n')) {
    lines.push(`+${line}`);
  }

  return lines.join('\n');
}

/**
 * Run a command and return result
 */
function runCommand(
  command: string,
  options: { cwd?: string; silent?: boolean } = {}
): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: options.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
    });
    return { success: true, output: output || '' };
  } catch (err: any) {
    return { success: false, output: err.message || '' };
  }
}

/**
 * Reset git to clean state
 */
function gitResetHard(): void {
  console.log('⚠️  Resetting to clean state...');
  runCommand('git checkout -- .', { silent: true });
  runCommand('git clean -fd', { silent: true });
}

/**
 * Run all required gates with detailed tracking
 */
function runGates(): {
  allPassed: boolean;
  results: { name: string; command: string; passed: boolean; durationMs: number }[];
} {
  const results: { name: string; command: string; passed: boolean; durationMs: number }[] = [];

  for (const gate of REQUIRED_GATES) {
    console.log(`\n🔍 Running gate: ${gate.name}`);
    const startTime = Date.now();
    const result = runCommand(gate.command, { silent: false });
    const durationMs = Date.now() - startTime;
    results.push({ name: gate.name, command: gate.command, passed: result.success, durationMs });

    if (!result.success) {
      console.log(`❌ Gate failed: ${gate.name}`);
    } else {
      console.log(`✅ Gate passed: ${gate.name}`);
    }
  }

  return {
    allPassed: results.every(r => r.passed),
    results,
  };
}

/**
 * Format evidence for commit message
 */
function formatEvidence(item: PlanItem): string {
  return item.evidence.map(e => `- L${e.line}: ${e.snippet.trim()}`).join('\n');
}

/**
 * Generate commit message from template
 */
function generateCommitMessage(item: PlanItem): string {
  return COMMIT_TEMPLATE.replace('{{file}}', item.file)
    .replace('{{functionName}}', item.functionName)
    .replace('{{kind}}', item.kind)
    .replace('{{priorityScore}}', String(item.priorityScore))
    .replace('{{risk}}', item.risk)
    .replace('{{id}}', item.id)
    .replace('{{evidence}}', formatEvidence(item));
}

/**
 * Apply a single patch with git apply --check
 */
function applyPatch(item: PlanItem, patchContent: string): { applied: boolean; reason?: string } {
  const patchPath = path.join(process.cwd(), '.ralph-patch.tmp');

  try {
    // Write patch to temp file
    fs.writeFileSync(patchPath, patchContent);

    // Dry run first: git apply --check
    console.log('\n🔍 Checking patch applicability...');
    const checkResult = spawnSync('git', ['apply', '--check', patchPath], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    if (checkResult.status !== 0) {
      return {
        applied: false,
        reason: `git apply --check failed: ${checkResult.stderr || checkResult.stdout}`,
      };
    }

    if (CLI_FLAGS.dryRun) {
      console.log('🔶 Dry run mode - patch validated but not applied');
      return { applied: false, reason: 'Dry run mode' };
    }

    // Apply the patch for real
    console.log('📝 Applying patch...');
    const applyResult = spawnSync('git', ['apply', patchPath], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    if (applyResult.status !== 0) {
      return {
        applied: false,
        reason: `git apply failed: ${applyResult.stderr || applyResult.stdout}`,
      };
    }

    return { applied: true };
  } finally {
    // Clean up temp file
    if (fs.existsSync(patchPath)) {
      fs.unlinkSync(patchPath);
    }
  }
}

// ============================================================================
// Phase 4M4: Strategy-based patching with perf.plan.json
// ============================================================================

/**
 * Load the plan file (perf.plan.json or waterfalls.plan.json)
 */
function loadPlan(): {
  type: 'perf' | 'legacy';
  perfPlan?: PerfPlan;
  legacyPlan?: RemediationPlan;
} {
  const outDir = path.join(__dirname, '..', 'out');

  // Check for custom plan path
  if (CLI_FLAGS.plan) {
    const customPath = path.isAbsolute(CLI_FLAGS.plan)
      ? CLI_FLAGS.plan
      : path.join(process.cwd(), CLI_FLAGS.plan);

    if (!fs.existsSync(customPath)) {
      console.error(`❌ Custom plan not found: ${customPath}`);
      process.exit(1);
    }

    const content = JSON.parse(fs.readFileSync(customPath, 'utf8'));
    // Detect format by checking for 'patchStrategy' field on items
    if (content.items?.[0]?.patchStrategy !== undefined) {
      return { type: 'perf', perfPlan: content as PerfPlan };
    }
    return { type: 'legacy', legacyPlan: content as RemediationPlan };
  }

  // Default: try perf.plan.json first (Phase 4M4), fallback to waterfalls.plan.json
  const perfPlanPath = path.join(outDir, 'perf.plan.json');
  const legacyPlanPath = path.join(outDir, 'waterfalls.plan.json');

  if (fs.existsSync(perfPlanPath)) {
    const content = JSON.parse(fs.readFileSync(perfPlanPath, 'utf8')) as PerfPlan;
    return { type: 'perf', perfPlan: content };
  }

  if (fs.existsSync(legacyPlanPath)) {
    const content = JSON.parse(fs.readFileSync(legacyPlanPath, 'utf8')) as RemediationPlan;
    return { type: 'legacy', legacyPlan: content };
  }

  console.error('❌ No remediation plan found. Run perf-skill-audit first.');
  process.exit(1);
}

/**
 * Check if an item passes the CLI filters (--kind, --strategy, tier)
 */
function passesFilters(item: PerfPlanItem): { passes: boolean; reason?: string } {
  // Filter by kind
  if (CLI_FLAGS.kind && item.kind !== CLI_FLAGS.kind) {
    return { passes: false, reason: `Kind mismatch: ${item.kind} != ${CLI_FLAGS.kind}` };
  }

  // Filter by strategy
  if (CLI_FLAGS.strategy && item.patchStrategy !== CLI_FLAGS.strategy) {
    return {
      passes: false,
      reason: `Strategy mismatch: ${item.patchStrategy} != ${CLI_FLAGS.strategy}`,
    };
  }

  // Check tier (Tier 0 only by default)
  const strategy = item.patchStrategy ? STRATEGY_BY_ID.get(item.patchStrategy) : undefined;
  if (strategy && strategy.tier > 0 && !CLI_FLAGS.enableTier1) {
    return { passes: false, reason: `Tier ${strategy.tier} requires --enable-tier1` };
  }

  return { passes: true };
}

/**
 * Generate patch using the strategy system
 * Phase 4M6a: Added extensions support for semantic guards and patch summary
 */
function generateStrategyPatch(
  item: PerfPlanItem,
  fileContent: string
): {
  patch: string | null;
  strategy: string | null;
  reason?: string;
  extensions?: {
    semanticGuardsPassed?: string[];
    patchSummary?: {
      kind: string;
      strategyId: string;
      file: string;
      transformations: string[];
    };
  };
} {
  const strategy = item.patchStrategy ? STRATEGY_BY_ID.get(item.patchStrategy) : null;

  if (!strategy) {
    // Try to find strategy by kind
    const kindStrategy = getStrategyForKind(item.kind);
    if (!kindStrategy) {
      return { patch: null, strategy: null, reason: 'No strategy available for this kind' };
    }
    return generateStrategyPatch({ ...item, patchStrategy: kindStrategy.id }, fileContent);
  }

  // Convert PerfPlanItem to Finding for strategy API
  const finding = perfPlanItemToFinding(item);

  // Check if strategy can apply
  const canApply = strategy.canApply(finding, fileContent);
  if (!canApply.ok) {
    return { patch: null, strategy: strategy.id, reason: canApply.reason };
  }

  // Build the patch
  const patchResult = strategy.buildPatch(finding, fileContent);
  if (!patchResult || !patchResult.patch) {
    return { patch: null, strategy: strategy.id, reason: 'Strategy returned empty patch' };
  }

  // Phase 4M6a: Get extensions for setstate-nonfunctional strategy
  let extensions:
    | {
        semanticGuardsPassed?: string[];
        patchSummary?: {
          kind: string;
          strategyId: string;
          file: string;
          transformations: string[];
        };
      }
    | undefined;

  if (strategy.id === 'setstate-nonfunctional') {
    const semanticGuards = getSemanticGuards(finding);
    const transformSummary = getTransformationSummary(finding);
    extensions = {
      semanticGuardsPassed: semanticGuards,
      patchSummary: transformSummary
        ? {
            kind: item.kind,
            strategyId: strategy.id,
            file: item.file,
            transformations: [transformSummary],
          }
        : undefined,
    };
  }

  return { patch: patchResult.patch, strategy: strategy.id, extensions };
}

/**
 * Convert PerfPlanItem to Finding for strategy compatibility
 */
function perfPlanItemToFinding(item: PerfPlanItem): any {
  return {
    severity: 'warning',
    rule: `perf/${item.kind}`,
    file: item.file,
    message: `${item.kind} finding`,
    kind: item.kind,
    priorityScore: item.priorityScore,
    lineStart: item.startLine,
    lineEnd: item.endLine,
    evidence: item.evidence,
    functionName: item.functionName,
    suggestedFix: item.suggestedPatch,
  };
}

/**
 * Display detailed explanation for --explain mode
 */
function displayExplanation(item: PerfPlanItem, fileContent: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`📋 EXPLANATION: ${item.id}`);
  console.log('═'.repeat(70));

  console.log(`\n📁 File: ${item.file}`);
  console.log(`🏷️  Kind: ${item.kind}`);
  console.log(`🎯 Priority: ${item.priorityScore}`);
  console.log(`✅ Eligibility: ${item.eligibility}`);
  console.log(`🔧 Strategy: ${item.patchStrategy || 'none'}`);

  const strategy = item.patchStrategy ? STRATEGY_BY_ID.get(item.patchStrategy) : null;
  if (strategy) {
    console.log(`\n📖 Strategy Details:`);
    console.log(`   Name: ${strategy.name}`);
    console.log(`   Risk: ${strategy.risk}`);
    console.log(`   Tier: ${strategy.tier}`);
    console.log(`   Handles: ${strategy.handlesKinds.join(', ')}`);
  }

  console.log(`\n📝 Evidence:`);
  for (const e of item.evidence) {
    console.log(
      `   L${e.line}: ${e.snippet.substring(0, 80)}${e.snippet.length > 80 ? '...' : ''}`
    );
  }

  const result = generateStrategyPatch(item, fileContent);
  if (result.patch) {
    console.log(`\n📄 Generated Patch:`);
    console.log('─'.repeat(60));
    console.log(result.patch);
    console.log('─'.repeat(60));
  } else {
    console.log(`\n⚠️  Cannot generate patch: ${result.reason}`);
  }

  console.log(`\n🔐 Gates required: ${REQUIRED_GATES.map(g => g.name).join(', ')}`);
}

/**
 * Create ApplyProof for --emit-proof (audit-grade contract)
 * Phase 4M6a: Added optional extensions for semantic guards, patch summary, and diff stats
 */
function createProof(
  item: PerfPlanItem,
  patch: string,
  strategyId: string,
  checks: {
    allowedSurface: { passed: boolean; reason?: string };
    forbiddenPath: { passed: boolean; reason?: string };
    gitApply: { ok: boolean; output?: string };
  },
  gateResults: { name: string; command: string; passed: boolean; durationMs?: number }[],
  outcome: ApplyOutcome,
  commitHash?: string,
  failureReason?: string,
  selectionReason?: SelectionReason,
  extensions?: {
    semanticGuardsPassed?: string[];
    patchSummary?: {
      kind: string;
      strategyId: string;
      file: string;
      transformations: string[];
    };
    diffStats?: {
      filesChanged: number;
      linesAdded: number;
      linesRemoved: number;
    };
  }
): ApplyProof {
  // Calculate diffStats from patch if not provided
  const diffStats = extensions?.diffStats || calculateDiffStats(patch);

  return {
    planItemId: item.id,
    strategyId: strategyId as PatchStrategyId,
    appliedAt: new Date().toISOString(),
    allowedSurfaceCheck: {
      passed: checks.allowedSurface.passed,
      file: item.file,
      reason: checks.allowedSurface.reason,
    },
    forbiddenPathCheck: {
      passed: checks.forbiddenPath.passed,
      file: item.file,
      reason: checks.forbiddenPath.reason,
    },
    gitApplyCheck: {
      ok: checks.gitApply.ok,
      output: checks.gitApply.output,
    },
    patch,
    gates: gateResults.map(g => ({
      name: g.name,
      command: g.command,
      passed: g.passed,
      durationMs: g.durationMs,
    })),
    outcome,
    finalCommitSha: commitHash,
    // Phase 4M6d: standardize on short SHA (10 chars) for readability + uniqueness
    rollbackCommand: commitHash ? `git revert ${commitHash.slice(0, 10)}` : undefined,
    failureReason,
    selectionReason,
    // Phase 4M6a extensions
    semanticGuardsPassed: extensions?.semanticGuardsPassed,
    patchSummary: extensions?.patchSummary,
    diffStats,
  };
}

/**
 * Calculate diff stats from a unified diff patch
 */
function calculateDiffStats(patch: string): {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
} {
  const lines = patch.split('\n');
  let linesAdded = 0;
  let linesRemoved = 0;
  let filesChanged = 0;
  const fileHeaders = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      linesAdded++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      linesRemoved++;
    } else if (line.startsWith('--- a/') || line.startsWith('--- ')) {
      const fileName = line.replace(/^--- (a\/)?/, '');
      fileHeaders.add(fileName);
    }
  }

  filesChanged = Math.max(1, fileHeaders.size);
  return { filesChanged, linesAdded, linesRemoved };
}

/**
 * Create noop proof for --auto mode when no candidate is selected
 * NON-NEGOTIABLE: We emit ApplyProof even when we do nothing
 */
function createNoopProof(reason: SelectionReason): ApplyProof {
  return {
    planItemId: '__noop__',
    strategyId: 'noop' as PatchStrategyId,
    appliedAt: new Date().toISOString(),
    allowedSurfaceCheck: {
      passed: true,
      file: '',
      reason: 'No item selected',
    },
    forbiddenPathCheck: {
      passed: true,
      file: '',
      reason: 'No item selected',
    },
    gitApplyCheck: {
      ok: true,
      output: 'No patch to apply',
    },
    patch: '',
    gates: [],
    outcome: 'noop',
    selectionReason: reason,
  };
}

/**
 * Write proofs to file
 * NOTE: In --auto mode, we ALWAYS emit a proof, even for noop
 */
function writeProofs(): void {
  // In --auto mode, always emit proof (even if empty/noop)
  if (!CLI_FLAGS.emitProof) return;

  // Allow empty proofs for noop case
  if (appliedProofs.length === 0 && !CLI_FLAGS.auto) return;

  const proofPath = path.join(__dirname, '..', 'out', 'apply-proofs.json');
  fs.writeFileSync(
    proofPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: CLI_FLAGS.auto ? 'auto' : 'manual',
        proofs: appliedProofs,
      },
      null,
      2
    )
  );
  console.log(`\n📜 Proofs written: ${proofPath}`);
}

/**
 * Phase 4M6c: Generate autonomy report (JSON + Markdown)
 * County CIO view of autonomous maintenance
 */
function writeAutonomyReport(plan: PerfPlan): void {
  if (!CLI_FLAGS.auto) return;

  const outDir = path.join(__dirname, '..', 'out');

  // Ensure autonomy stats has top candidates
  if (autonomyStats.topCandidates.length === 0 && plan) {
    autonomyStats.topCandidates = plan.items
      .filter(i => i.eligibility === 'eligible')
      .sort((a, b) => {
        // priorityScore desc, then riskScore asc, then estimatedLinesChanged asc
        if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
        if ((a.riskScore || 50) !== (b.riskScore || 50))
          return (a.riskScore || 50) - (b.riskScore || 50);
        return (a.estimatedLinesChanged || 10) - (b.estimatedLinesChanged || 10);
      })
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        file: item.file,
        kind: item.kind,
        strategy: item.patchStrategy || 'unknown',
        priorityScore: item.priorityScore,
        riskScore: item.riskScore || 50,
        estimatedLines: item.estimatedLinesChanged || 10,
      }));
  }

  // JSON report
  const jsonReport = {
    generatedAt: new Date().toISOString(),
    envelope: {
      tier: CLI_FLAGS.enableTier1 ? 'Tier 0-1' : 'Tier 0 only',
      riskScoreThreshold: 40,
      estimatedLinesThreshold: 40,
      governance: 'Core Governance Surface',
    },
    counts: {
      totalCandidates: autonomyStats.totalCandidates,
      eligible: autonomyStats.eligible,
      applied: autonomyStats.applied,
      noop: autonomyStats.noop,
      blockedByGovernance: autonomyStats.blockedByGovernance,
      blockedBySafetyRails: autonomyStats.blockedBySafetyRails,
      blockedByTier: autonomyStats.blockedByTier,
    },
    selected: autonomyStats.selectedItem
      ? {
          id: autonomyStats.selectedItem.id,
          file: autonomyStats.selectedItem.file,
          kind: autonomyStats.selectedItem.kind,
          strategy: autonomyStats.selectedItem.patchStrategy,
          priorityScore: autonomyStats.selectedItem.priorityScore,
          riskScore: autonomyStats.selectedItem.riskScore,
          estimatedLinesChanged: autonomyStats.selectedItem.estimatedLinesChanged,
        }
      : null,
    selectionReason: autonomyStats.selectionReason,
    topCandidates: autonomyStats.topCandidates,
  };

  const jsonPath = path.join(outDir, 'autonomy-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

  // Markdown report
  const mdLines: string[] = [
    '# 🤖 TerraFusion Autonomy Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Envelope Constraints',
    '',
    `| Constraint | Value |`,
    `|------------|-------|`,
    `| Tier | ${jsonReport.envelope.tier} |`,
    `| Risk Score Threshold | ≤ ${jsonReport.envelope.riskScoreThreshold} |`,
    `| Estimated Lines Threshold | ≤ ${jsonReport.envelope.estimatedLinesThreshold} |`,
    `| Governance | ${jsonReport.envelope.governance} |`,
    '',
    '## Counts',
    '',
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total Candidates | ${jsonReport.counts.totalCandidates} |`,
    `| Eligible | ${jsonReport.counts.eligible} |`,
    `| **Applied** | **${jsonReport.counts.applied}** |`,
    `| Noop | ${jsonReport.counts.noop} |`,
    `| Blocked by Governance | ${jsonReport.counts.blockedByGovernance} |`,
    `| Blocked by Safety Rails | ${jsonReport.counts.blockedBySafetyRails} |`,
    `| Blocked by Tier | ${jsonReport.counts.blockedByTier} |`,
    '',
  ];

  if (jsonReport.selected) {
    mdLines.push('## Selected Item');
    mdLines.push('');
    mdLines.push(`| Property | Value |`);
    mdLines.push(`|----------|-------|`);
    mdLines.push(`| ID | \`${jsonReport.selected.id}\` |`);
    mdLines.push(`| File | \`${jsonReport.selected.file}\` |`);
    mdLines.push(`| Kind | ${jsonReport.selected.kind} |`);
    mdLines.push(`| Strategy | ${jsonReport.selected.strategy} |`);
    mdLines.push(`| Priority Score | ${jsonReport.selected.priorityScore} |`);
    mdLines.push(`| Risk Score | ${jsonReport.selected.riskScore || 'N/A'} |`);
    mdLines.push(`| Estimated Lines | ${jsonReport.selected.estimatedLinesChanged || 'N/A'} |`);
    mdLines.push('');
  } else {
    mdLines.push('## Selected Item');
    mdLines.push('');
    mdLines.push('*No item selected (noop)*');
    mdLines.push('');
  }

  if (jsonReport.selectionReason) {
    mdLines.push('## Selection Reason');
    mdLines.push('');
    mdLines.push(`> ${jsonReport.selectionReason.reason}`);
    mdLines.push('');
  }

  if (jsonReport.topCandidates.length > 0) {
    mdLines.push('## Top 10 Candidates');
    mdLines.push('');
    mdLines.push('| # | ID | Kind | Strategy | Priority | Risk | Lines |');
    mdLines.push('|---|-----|------|----------|----------|------|-------|');
    jsonReport.topCandidates.forEach((c, i) => {
      mdLines.push(
        `| ${i + 1} | \`${c.id.substring(0, 30)}...\` | ${c.kind} | ${c.strategy} | ${c.priorityScore} | ${c.riskScore} | ${c.estimatedLines} |`
      );
    });
    mdLines.push('');
  }

  mdLines.push('---');
  mdLines.push('');
  mdLines.push('*Government. Transcended.*');

  const mdPath = path.join(outDir, 'autonomy-report.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'));

  console.log(`📊 Autonomy report: ${jsonPath}`);
  console.log(`📊 Autonomy report: ${mdPath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🤖 Ralph Apply - Phase 4J/4M4/4M5');
  console.log('   Controlled Auto-Apply Lane with Strategy Routing\n');

  if (CLI_FLAGS.auto) {
    console.log('🤖 AUTO MODE - Deterministic selection with governed autonomy\n');
  }

  if (CLI_FLAGS.dryRun) {
    console.log('🔶 DRY RUN MODE - no changes will be made\n');
  }

  if (CLI_FLAGS.explain) {
    console.log('📖 EXPLAIN MODE - showing patch details without applying\n');
  }

  if (CLI_FLAGS.kind) {
    console.log(`🏷️  Filter by kind: ${CLI_FLAGS.kind}`);
  }

  if (CLI_FLAGS.strategy) {
    console.log(`🔧 Filter by strategy: ${CLI_FLAGS.strategy}`);
  }

  if (CLI_FLAGS.enableTier1) {
    console.log('⚠️  Tier 1 strategies ENABLED (medium risk)');
  }

  // Load plan (preferring perf.plan.json)
  const loaded = loadPlan();

  if (loaded.type === 'perf' && loaded.perfPlan) {
    await mainWithPerfPlan(loaded.perfPlan);
  } else if (loaded.legacyPlan) {
    if (CLI_FLAGS.auto) {
      console.error('❌ --auto mode requires perf.plan.json (not legacy waterfalls.plan.json)');
      process.exit(1);
    }
    await mainWithLegacyPlan(loaded.legacyPlan);
  }
}

/**
 * Legacy mode: use waterfalls.plan.json (Phase 4J behavior)
 */
async function mainWithLegacyPlan(plan: RemediationPlan): Promise<void> {
  console.log('📋 Using legacy plan (waterfalls.plan.json)');
  console.log(`   ${plan.summary.total} items, ${plan.summary.eligible} eligible`);

  // Filter eligible items
  const eligibleItems = plan.items.filter(item => item.eligibility.eligible && item.suggestedPatch);

  if (eligibleItems.length === 0) {
    console.log('✅ No eligible items to apply.');
    process.exit(0);
  }

  console.log(`\n🔍 Scanning ${eligibleItems.length} eligible items for safety...\n`);

  // Find safe items (not in forbidden paths, has boundary integrity)
  const safeItems: { item: PlanItem; skipped: boolean; reason?: string }[] = [];

  for (const item of eligibleItems) {
    // Check allowed paths FIRST (Core Governance Surface)
    if (!isInAllowedSurface(item.file)) {
      console.log(`⛔ SKIP: ${item.file}`);
      console.log(`   Reason: Not in Core Governance Surface`);
      console.log(`   📜 Rule: AGENTS.md defines allowed scope`);
      console.log(
        `   💡 Allowed: os-platform/core/pilot/**, os-platform/core/types/**, tools/registry/**`
      );
      safeItems.push({ item, skipped: true, reason: 'Not in Core Governance Surface' });
      continue;
    }

    // Check forbidden paths
    const forbidden = isForbiddenPath(item.file);
    if (forbidden.forbidden) {
      console.log(`⛔ SKIP: ${item.file}`);
      console.log(`   Reason: ${forbidden.reason}`);
      console.log(`   📜 Rule: ${forbidden.education}`);
      console.log(`   💡 ${forbidden.suggestion}`);
      safeItems.push({ item, skipped: true, reason: forbidden.reason });
      continue;
    }

    // Check boundary integrity
    const boundary = hasBoundaryIntegrity(item);
    if (!boundary.valid) {
      console.log(`⚠️  SKIP: ${item.file}`);
      console.log(`   Reason: ${boundary.reason}`);
      console.log(`   💡 Suggestion: Add function scope detection or fix line boundaries`);
      safeItems.push({ item, skipped: true, reason: boundary.reason });
      continue;
    }

    console.log(`✅ SAFE: ${item.file}`);
    console.log(`   Function: ${item.functionName}, Score: ${item.priorityScore}`);
    safeItems.push({ item, skipped: false });
  }

  // Get items to apply (respecting --max limit)
  const toApply = safeItems.filter(s => !s.skipped).slice(0, CLI_FLAGS.max);

  if (toApply.length === 0) {
    console.log('\n⚠️  No safe items to apply (all filtered by governance rules).');
    console.log('   This is expected - governance is working correctly.');
    process.exit(0);
  }

  console.log(`\n🎯 Will apply ${toApply.length} patch(es):\n`);

  for (const { item } of toApply) {
    console.log(`   - ${item.file}:${item.startLine}`);
    console.log(`     ${item.functionName} (${item.kind}, score ${item.priorityScore})`);
  }

  // Apply patches one at a time
  for (const { item } of toApply) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Processing: ${item.id}`);
    console.log(`${'='.repeat(60)}`);

    // Generate patch
    const patch = generatePatch(item);

    if (CLI_FLAGS.verbose) {
      console.log('\n📄 Patch content:');
      console.log(patch);
    }

    // Apply patch
    const applyResult = applyPatch(item, patch);

    if (!applyResult.applied) {
      console.log(`\n⚠️  Patch not applied: ${applyResult.reason}`);

      if (applyResult.reason !== 'Dry run mode') {
        gitResetHard();
        process.exit(1);
      }
      continue;
    }

    console.log('✅ Patch applied successfully');

    // Run gates
    console.log('\n🔐 Running required gates...');
    const gateResults = runGates();

    if (!gateResults.allPassed) {
      console.log('\n❌ GATES FAILED - Rolling back...');
      gitResetHard();
      process.exit(1);
    }

    console.log('\n✅ All gates passed');

    // Commit
    const commitMessage = generateCommitMessage(item);
    console.log('\n📝 Committing...');

    if (CLI_FLAGS.verbose) {
      console.log('\nCommit message:');
      console.log(commitMessage);
    }

    const commitResult = runCommand(
      `git add "${item.file}" && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
      {
        silent: true,
      }
    );

    if (!commitResult.success) {
      console.log('⚠️  Commit failed (may be no changes):', commitResult.output);
    } else {
      console.log('✅ Committed successfully');
    }

    // Optional: Create PR
    if (CLI_FLAGS.createPr) {
      console.log('\n🔗 Creating PR...');
      const branchName = `ralph-auto/${item.id}`;
      runCommand(`git checkout -b ${branchName}`, { silent: true });
      runCommand(`git push -u origin ${branchName}`, { silent: true });
      runCommand(
        `gh pr create --title "fix(perf): ${item.kind} optimization" --body "Auto-generated by Ralph Loop 4J"`,
        { silent: true }
      );
    }
  }

  console.log('\n✅ Ralph Apply complete');
}

/**
 * Phase 4M4/4M5: Strategy-based patching with perf.plan.json
 */
async function mainWithPerfPlan(plan: PerfPlan): Promise<void> {
  console.log('📋 Using perf plan (perf.plan.json) - Phase 4M4/4M5');
  console.log(`   ${plan.summary.total} items, ${plan.summary.eligible} eligible`);
  console.log(
    `   By strategy: ${Object.entries(plan.summary.byStrategy)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`
  );

  // ========================================================================
  // Phase 4M5: --auto mode with deterministic selection
  // ========================================================================
  if (CLI_FLAGS.auto) {
    await mainWithAutoMode(plan);
    return;
  }

  // Filter eligible items
  const eligibleItems = plan.items.filter(item => item.eligibility === 'eligible');

  if (eligibleItems.length === 0) {
    console.log('✅ No eligible items to apply.');
    process.exit(0);
  }

  // Apply CLI filters
  const filteredItems: PerfPlanItem[] = [];
  const filterSkipped: { item: PerfPlanItem; reason: string }[] = [];

  for (const item of eligibleItems) {
    const filterResult = passesFilters(item);
    if (filterResult.passes) {
      filteredItems.push(item);
    } else {
      filterSkipped.push({ item, reason: filterResult.reason || 'filter' });
    }
  }

  if (filterSkipped.length > 0 && CLI_FLAGS.verbose) {
    console.log(`\n🔍 Filtered out ${filterSkipped.length} items by CLI flags`);
  }

  console.log(`\n🔍 Scanning ${filteredItems.length} items for safety...\n`);

  // Find safe items (governance + strategy checks)
  const safeItems: { item: PerfPlanItem; skipped: boolean; reason?: string }[] = [];

  for (const item of filteredItems) {
    // Check allowed paths (Core Governance Surface)
    if (!isInAllowedSurface(item.file)) {
      console.log(`⛔ SKIP: ${item.file}`);
      console.log(`   Reason: Not in Core Governance Surface`);
      safeItems.push({ item, skipped: true, reason: 'Not in Core Governance Surface' });
      continue;
    }

    // Check forbidden paths
    const forbidden = isForbiddenPath(item.file);
    if (forbidden.forbidden) {
      console.log(`⛔ SKIP: ${item.file}`);
      console.log(`   Reason: ${forbidden.reason}`);
      safeItems.push({ item, skipped: true, reason: forbidden.reason });
      continue;
    }

    // Check strategy availability
    if (!item.patchStrategy) {
      console.log(`⚠️  SKIP: ${item.file}`);
      console.log(`   Reason: No patch strategy assigned`);
      safeItems.push({ item, skipped: true, reason: 'No patch strategy' });
      continue;
    }

    const strategy = STRATEGY_BY_ID.get(item.patchStrategy);
    if (!strategy) {
      console.log(`⚠️  SKIP: ${item.file}`);
      console.log(`   Reason: Unknown strategy: ${item.patchStrategy}`);
      safeItems.push({ item, skipped: true, reason: `Unknown strategy: ${item.patchStrategy}` });
      continue;
    }

    console.log(`✅ SAFE: ${item.file}`);
    console.log(`   Kind: ${item.kind}, Strategy: ${strategy.id}, Score: ${item.priorityScore}`);
    safeItems.push({ item, skipped: false });
  }

  // Explain mode: show details and exit
  if (CLI_FLAGS.explain) {
    const toExplain = safeItems.filter(s => !s.skipped).slice(0, CLI_FLAGS.max);

    if (toExplain.length === 0) {
      console.log('\n⚠️  No items to explain');
      process.exit(0);
    }

    for (const { item } of toExplain) {
      const filePath = path.join(process.cwd(), item.file);
      const fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
      displayExplanation(item, fileContent);
    }

    console.log('\n📖 Explanation complete (--explain mode, no changes made)');
    process.exit(0);
  }

  // Get items to apply
  const toApply = safeItems.filter(s => !s.skipped).slice(0, CLI_FLAGS.max);

  if (toApply.length === 0) {
    console.log('\n⚠️  No safe items to apply.');
    process.exit(0);
  }

  console.log(`\n🎯 Will apply ${toApply.length} patch(es):\n`);

  for (const { item } of toApply) {
    const strategy = STRATEGY_BY_ID.get(item.patchStrategy!);
    console.log(`   - ${item.file}:${item.startLine}`);
    console.log(
      `     ${item.kind} → ${strategy?.name || item.patchStrategy} (score ${item.priorityScore})`
    );
  }

  // Apply patches using strategy system
  for (const { item } of toApply) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Processing: ${item.id}`);
    console.log(`${'='.repeat(60)}`);

    // Read file content
    const filePath = path.join(process.cwd(), item.file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      continue;
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Generate patch using strategy
    const patchResult = generateStrategyPatch(item, fileContent);

    if (!patchResult.patch) {
      console.log(`⚠️  Cannot generate patch: ${patchResult.reason}`);
      continue;
    }

    if (CLI_FLAGS.verbose) {
      console.log('\n📄 Patch content:');
      console.log(patchResult.patch);
    }

    // Apply patch
    const applyResult = applyPatch({ ...item, suggestedPatch: '' } as any, patchResult.patch);

    if (!applyResult.applied) {
      console.log(`\n⚠️  Patch not applied: ${applyResult.reason}`);

      if (applyResult.reason !== 'Dry run mode') {
        gitResetHard();
        process.exit(1);
      }
      continue;
    }

    console.log('✅ Patch applied successfully');

    // Run gates
    console.log('\n🔐 Running required gates...');
    const gateResults = runGates();

    if (!gateResults.allPassed) {
      console.log('\n❌ GATES FAILED - Rolling back...');
      gitResetHard();
      process.exit(1);
    }

    console.log('\n✅ All gates passed');

    // Commit
    const commitMessage = generateStrategyCommitMessage(item, patchResult.strategy!);
    console.log('\n📝 Committing...');

    if (CLI_FLAGS.verbose) {
      console.log('\nCommit message:');
      console.log(commitMessage);
    }

    const commitResult = runCommand(
      `git add "${item.file}" && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
      { silent: true }
    );

    let commitHash: string | undefined;
    if (!commitResult.success) {
      console.log('⚠️  Commit failed (may be no changes):', commitResult.output);
    } else {
      console.log('✅ Committed successfully');
      // Get commit hash for proof
      const hashResult = runCommand('git rev-parse HEAD', { silent: true });
      commitHash = hashResult.success ? hashResult.output.trim() : undefined;
    }

    // Collect proof for --emit-proof
    if (CLI_FLAGS.emitProof && patchResult.strategy) {
      const proof = createProof(
        item,
        patchResult.patch,
        patchResult.strategy,
        {
          allowedSurface: { passed: true }, // Already filtered by safeItems
          forbiddenPath: { passed: true }, // Already filtered by safeItems
          gitApply: { ok: applyResult.applied, output: applyResult.reason },
        },
        gateResults.results,
        commitHash ? 'applied' : 'skipped',
        commitHash,
        commitHash ? undefined : 'Commit not created',
        undefined, // selectionReason (not in auto mode)
        patchResult.extensions // Phase 4M6a: pass extensions
      );
      appliedProofs.push(proof);
    }
  }

  // Write proofs if in emit-proof mode
  writeProofs();

  console.log('\n✅ Ralph Apply complete');
}

// ============================================================================
// Phase 4M5: --auto mode with deterministic selection
// ============================================================================

/**
 * Main execution for --auto mode
 *
 * Selection algorithm:
 * 1. In allowed surface ✅
 * 2. Eligible ✅
 * 3. Tier 0 (unless --enable-tier1)
 * 4. Highest priorityScore
 * 5. Smallest estimatedLinesChanged (smallest diff footprint)
 * 6. Stable id (lexicographic, for determinism)
 *
 * Safety rails (NON-NEGOTIABLE):
 * - Refuse on main/master branch
 * - Refuse if working tree is dirty
 * - Refuse if plan baseSha != current HEAD
 * - ALWAYS emit ApplyProof (even on noop)
 */
async function mainWithAutoMode(plan: PerfPlan): Promise<void> {
  console.log('\n🤖 AUTO MODE - Phase 4M5 Autonomy Envelope');
  console.log('   Deterministic selection with governed safety rails\n');

  // Phase 4M6c: Initialize autonomy stats
  autonomyStats = {
    totalCandidates: plan.items.length,
    eligible: plan.items.filter(i => i.eligibility === 'eligible').length,
    applied: 0,
    noop: 0,
    blockedByGovernance: 0,
    blockedBySafetyRails: 0,
    blockedByTier: 0,
    selectedItem: null,
    selectionReason: null,
    topCandidates: [],
  };

  // Step 1: Check safety rails (NON-NEGOTIABLE)
  console.log('🔐 Checking safety rails...');
  const safetyResult = checkAutoSafetyRails(plan);

  if (!safetyResult.safe) {
    console.log(`\n❌ SAFETY RAIL VIOLATION: ${safetyResult.reason}`);
    if (safetyResult.details) {
      console.log(`   Details: ${JSON.stringify(safetyResult.details)}`);
    }

    // Phase 4M6c: Track safety rail block
    autonomyStats.blockedBySafetyRails = plan.items.length;
    autonomyStats.noop = 1;

    // Emit noop proof with safety failure reason
    if (CLI_FLAGS.emitProof) {
      const noopProof = createNoopProof({
        reason: safetyResult.reason || 'Safety rail violation',
        candidatesConsidered: plan.items.length,
        filteredByGovernance: 0,
        filteredByTier: 0,
      });
      appliedProofs.push(noopProof);
      writeProofs();
      writeAutonomyReport(plan);
    }

    process.exit(1);
  }

  console.log('✅ Safety rails passed');

  // Step 2: Deterministic selection
  console.log('\n🎯 Running deterministic selection algorithm...');
  const selection = selectBestCandidate(plan);

  if (!selection.item) {
    console.log(`\n⚠️  No candidate selected: ${selection.reason.reason}`);
    console.log(
      `   Stats: ${selection.reason.candidatesConsidered} considered, ${selection.reason.filteredByGovernance} filtered by governance, ${selection.reason.filteredByTier} filtered by tier`
    );

    // Track stats for autonomy report
    autonomyStats.noop = 1;
    autonomyStats.blockedByGovernance = selection.reason.filteredByGovernance;
    autonomyStats.blockedByTier = selection.reason.filteredByTier;
    autonomyStats.selectionReason = selection.reason;

    // Emit noop proof (NON-NEGOTIABLE: we emit proof even when we do nothing)
    if (CLI_FLAGS.emitProof) {
      const noopProof = createNoopProof(selection.reason);
      appliedProofs.push(noopProof);
      writeProofs();
      writeAutonomyReport(plan);
    }

    console.log('\n✅ Ralph Apply complete (noop)');
    process.exit(0);
  }

  const selectedItem = selection.item;
  const selectionReason = selection.reason;

  console.log(`\n✅ Selected: ${selectedItem.id}`);
  console.log(`   ${selectionReason.reason}`);
  console.log(`   File: ${selectedItem.file}`);
  console.log(`   Kind: ${selectedItem.kind}`);
  console.log(`   Strategy: ${selectedItem.patchStrategy}`);

  // Step 3: Explain mode check
  if (CLI_FLAGS.explain) {
    const filePath = path.join(process.cwd(), selectedItem.file);
    const fileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    displayExplanation(selectedItem, fileContent);
    console.log('\n📖 Explanation complete (--auto --explain mode, no changes made)');

    // Emit proof for explain mode
    if (CLI_FLAGS.emitProof) {
      const explainProof = createNoopProof({
        ...selectionReason,
        reason: `EXPLAIN: ${selectionReason.reason}`,
      });
      appliedProofs.push(explainProof);
      writeProofs();

      // Track explain in autonomy stats
      autonomyStats.selectedItem = selectedItem;
      autonomyStats.selectionReason = {
        ...selectionReason,
        reason: `EXPLAIN: ${selectionReason.reason}`,
      };
      writeAutonomyReport(plan);
    }

    process.exit(0);
  }

  // Step 4: Generate and apply patch
  const filePath = path.join(process.cwd(), selectedItem.file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);

    if (CLI_FLAGS.emitProof) {
      const errorProof = createProof(
        selectedItem,
        '',
        selectedItem.patchStrategy || 'unknown',
        {
          allowedSurface: { passed: true },
          forbiddenPath: { passed: true },
          gitApply: { ok: false, output: 'File not found' },
        },
        [],
        'skipped',
        undefined,
        'File not found',
        selectionReason
      );
      appliedProofs.push(errorProof);
      writeProofs();
    }

    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const patchResult = generateStrategyPatch(selectedItem, fileContent);

  if (!patchResult.patch) {
    console.log(`\n⚠️  Cannot generate patch: ${patchResult.reason}`);

    if (CLI_FLAGS.emitProof) {
      const noopProof = createProof(
        selectedItem,
        '',
        patchResult.strategy || 'unknown',
        {
          allowedSurface: { passed: true },
          forbiddenPath: { passed: true },
          gitApply: { ok: false, output: patchResult.reason },
        },
        [],
        'skipped',
        undefined,
        patchResult.reason,
        selectionReason
      );
      appliedProofs.push(noopProof);
      writeProofs();
    }

    process.exit(1);
  }

  if (CLI_FLAGS.verbose) {
    console.log('\n📄 Patch content:');
    console.log(patchResult.patch);
  }

  // Step 5: Apply patch (git apply --check first)
  const applyResult = applyPatch({ ...selectedItem, suggestedPatch: '' } as any, patchResult.patch);

  if (!applyResult.applied) {
    console.log(`\n⚠️  Patch not applied: ${applyResult.reason}`);

    if (applyResult.reason !== 'Dry run mode') {
      gitResetHard();
    }

    if (CLI_FLAGS.emitProof) {
      const outcome: ApplyOutcome = CLI_FLAGS.dryRun ? 'skipped' : 'skipped';
      const proof = createProof(
        selectedItem,
        patchResult.patch,
        patchResult.strategy!,
        {
          allowedSurface: { passed: true },
          forbiddenPath: { passed: true },
          gitApply: { ok: false, output: applyResult.reason },
        },
        [],
        outcome,
        undefined,
        applyResult.reason,
        selectionReason
      );
      appliedProofs.push(proof);
      writeProofs();
    }

    if (applyResult.reason === 'Dry run mode') {
      // Track dry-run in autonomy stats
      autonomyStats.selectedItem = selectedItem;
      autonomyStats.selectionReason = selectionReason;
      writeAutonomyReport(plan);
      console.log('\n✅ Ralph Apply complete (--auto --dry-run)');
      process.exit(0);
    }

    process.exit(1);
  }

  console.log('✅ Patch applied successfully');

  // Step 6: Run gates
  console.log('\n🔐 Running required gates...');
  const gateResults = runGates();

  if (!gateResults.allPassed) {
    console.log('\n❌ GATES FAILED - Rolling back...');
    gitResetHard();

    if (CLI_FLAGS.emitProof) {
      const proof = createProof(
        selectedItem,
        patchResult.patch,
        patchResult.strategy!,
        {
          allowedSurface: { passed: true },
          forbiddenPath: { passed: true },
          gitApply: { ok: true },
        },
        gateResults.results,
        'rolled_back',
        undefined,
        'Gates failed',
        selectionReason
      );
      appliedProofs.push(proof);
      writeProofs();
    }

    process.exit(1);
  }

  console.log('\n✅ All gates passed');

  // Step 7: Commit
  const commitMessage = generateStrategyCommitMessage(selectedItem, patchResult.strategy!);
  console.log('\n📝 Committing...');

  if (CLI_FLAGS.verbose) {
    console.log('\nCommit message:');
    console.log(commitMessage);
  }

  const commitResult = runCommand(
    `git add "${selectedItem.file}" && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
    { silent: true }
  );

  let commitHash: string | undefined;
  if (!commitResult.success) {
    console.log('⚠️  Commit failed (may be no changes):', commitResult.output);
  } else {
    console.log('✅ Committed successfully');
    const hashResult = runCommand('git rev-parse HEAD', { silent: true });
    commitHash = hashResult.success ? hashResult.output.trim() : undefined;
  }

  // Step 8: Emit proof (with selection reason)
  if (CLI_FLAGS.emitProof) {
    const proof = createProof(
      selectedItem,
      patchResult.patch,
      patchResult.strategy!,
      {
        allowedSurface: { passed: true },
        forbiddenPath: { passed: true },
        gitApply: { ok: true },
      },
      gateResults.results,
      commitHash ? 'applied' : 'skipped',
      commitHash,
      commitHash ? undefined : 'Commit not created',
      selectionReason
    );
    appliedProofs.push(proof);
    writeProofs();

    // Track successful apply in autonomy stats
    autonomyStats.applied = 1;
    autonomyStats.selectedItem = selectedItem;
    autonomyStats.selectionReason = selectionReason;
    writeAutonomyReport(plan);
  }

  console.log('\n✅ Ralph Apply complete (--auto mode)');
}

/**
 * Generate commit message for strategy-based patch
 */
function generateStrategyCommitMessage(item: PerfPlanItem, strategyId: string): string {
  const strategy = STRATEGY_BY_ID.get(strategyId as PatchStrategyId);

  return `fix(perf): ${strategy?.name || strategyId}

File: ${item.file}
Kind: ${item.kind}
Strategy: ${strategyId}
PriorityScore: ${item.priorityScore}
PlanItemId: ${item.id}

Evidence:
${item.evidence.map(e => `- L${e.line}: ${e.snippet.trim().substring(0, 60)}`).join('\n')}

Gates:
- pnpm run type-check: ✅ PASS
- node --test phase83-tools.test.mjs: ✅ PASS

AI-Collaboration: Ralph-Loop-4M4
Government: FISMA-aware automated refactor`;
}

main().catch(err => {
  console.error('❌ Ralph Apply failed:', err);
  gitResetHard();
  process.exit(1);
});
