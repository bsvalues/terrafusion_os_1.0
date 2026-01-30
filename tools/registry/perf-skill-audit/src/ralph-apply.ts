#!/usr/bin/env npx tsx
/**
 * Ralph Apply - Phase 4J: Controlled Auto-Apply Lane
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
 * GOVERNANCE: This tool respects the Core Governance Surface.
 * It will NEVER touch forbidden paths even if they appear in the plan.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import type { RemediationPlan, PlanItem } from './scanners/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI flags
const CLI_FLAGS = {
  dryRun: process.argv.includes('--dry-run'),
  max: parseInt(process.argv.find(a => a.startsWith('--max='))?.split('=')[1] || '1', 10),
  verbose: process.argv.includes('--verbose'),
  createPr: process.argv.includes('--create-pr'),
};

// Forbidden paths (from AGENTS.md governance)
const FORBIDDEN_PATTERNS = [
  /\/ARCHIVE\//i,
  /^ARCHIVE\//i,
  /^specialized\//i,
  /^applications\//i,
  /\/archive\//i,
];

// Required gates
const REQUIRED_GATES = [
  { name: 'type-check', command: 'pnpm run type-check' },
  { name: 'phase83-tools', command: 'node --test os-platform/core/tests/phase83-tools.test.mjs' },
];

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

/**
 * Check if a file path is in a forbidden zone
 */
function isForbiddenPath(filePath: string): { forbidden: boolean; reason?: string } {
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return {
        forbidden: true,
        reason: `Path matches forbidden pattern: ${pattern.source}`,
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
 * Run all required gates
 */
function runGates(): { allPassed: boolean; results: { name: string; passed: boolean }[] } {
  const results: { name: string; passed: boolean }[] = [];

  for (const gate of REQUIRED_GATES) {
    console.log(`\n🔍 Running gate: ${gate.name}`);
    const result = runCommand(gate.command, { silent: false });
    results.push({ name: gate.name, passed: result.success });

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
function applyPatch(
  item: PlanItem,
  patchContent: string
): { applied: boolean; reason?: string } {
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

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🤖 Ralph Apply - Phase 4J');
  console.log('   Controlled Auto-Apply Lane\n');

  if (CLI_FLAGS.dryRun) {
    console.log('🔶 DRY RUN MODE - no changes will be made\n');
  }

  // Load remediation plan
  const planPath = path.join(__dirname, '..', 'out', 'waterfalls.plan.json');

  if (!fs.existsSync(planPath)) {
    console.error('❌ No remediation plan found. Run perf-skill-audit first.');
    process.exit(1);
  }

  const plan: RemediationPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  console.log(`📋 Loaded plan: ${plan.summary.total} items, ${plan.summary.eligible} eligible`);

  // Filter eligible items
  const eligibleItems = plan.items.filter(
    item => item.eligibility.eligible && item.suggestedPatch
  );

  if (eligibleItems.length === 0) {
    console.log('✅ No eligible items to apply.');
    process.exit(0);
  }

  console.log(`\n🔍 Scanning ${eligibleItems.length} eligible items for safety...\n`);

  // Find safe items (not in forbidden paths, has boundary integrity)
  const safeItems: { item: PlanItem; skipped: boolean; reason?: string }[] = [];

  for (const item of eligibleItems) {
    // Check forbidden paths
    const forbidden = isForbiddenPath(item.file);
    if (forbidden.forbidden) {
      console.log(`⛔ SKIP: ${item.file}`);
      console.log(`   Reason: ${forbidden.reason}`);
      safeItems.push({ item, skipped: true, reason: forbidden.reason });
      continue;
    }

    // Check boundary integrity
    const boundary = hasBoundaryIntegrity(item);
    if (!boundary.valid) {
      console.log(`⚠️  SKIP: ${item.file}`);
      console.log(`   Reason: ${boundary.reason}`);
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

    const commitResult = runCommand(`git add "${item.file}" && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      silent: true,
    });

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
      runCommand(`gh pr create --title "fix(perf): ${item.kind} optimization" --body "Auto-generated by Ralph Loop 4J"`, { silent: true });
    }
  }

  console.log('\n✅ Ralph Apply complete');
}

main().catch(err => {
  console.error('❌ Ralph Apply failed:', err);
  gitResetHard();
  process.exit(1);
});
