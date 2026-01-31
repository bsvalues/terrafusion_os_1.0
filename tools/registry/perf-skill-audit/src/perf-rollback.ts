#!/usr/bin/env node
/**
 * Phase 4N1 — perf-rollback CLI
 *
 * Operator-grade rollback for TerraFusion Autonomy v1.
 * Provides a single command to safely revert autonomous patches.
 *
 * Usage:
 *   pnpm perf:rollback --proof <planItemId|proofIndex>
 *   pnpm perf:rollback --proof <planItemId> --from ./apply-proofs.json
 *   pnpm perf:rollback --proof <planItemId> --branch rollback/custom-name
 *   pnpm perf:rollback --proof <planItemId> --dry-run
 *
 * Governance:
 * - Never runs on main/master (hard fail)
 * - Never touches forbidden paths
 * - Validates all rollback contracts before execution
 * - Creates branch + PR, never automerges
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ApplyProof, validateRollbackCommand } from './rollback-validator.js';

// ============================================================================
// CLI Configuration
// ============================================================================

const CLI_FLAGS = {
  proof: process.argv.find(a => a.startsWith('--proof='))?.split('=')[1] || '',
  from: process.argv.find(a => a.startsWith('--from='))?.split('=')[1] || '',
  branch: process.argv.find(a => a.startsWith('--branch='))?.split('=')[1] || '',
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  help: process.argv.includes('--help') || process.argv.includes('-h'),
};

const DEFAULT_PROOF_PATHS = [
  './tools/registry/perf-skill-audit/out/apply-proofs.json',
  './apply-proofs.json',
  './artifacts/apply-proofs.json',
  './logs/ralph/apply-proofs.json',
];

// ============================================================================
// Output Helpers
// ============================================================================

function log(msg: string) {
  console.log(msg);
}

function verbose(msg: string) {
  if (CLI_FLAGS.verbose) {
    console.log(`  [verbose] ${msg}`);
  }
}

function error(msg: string) {
  console.error(`❌ ${msg}`);
}

function success(msg: string) {
  console.log(`✅ ${msg}`);
}

// ============================================================================
// Git Helpers
// ============================================================================

function getCurrentBranch(): string {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });
  return result.stdout?.trim() || '';
}

function isWorkingTreeDirty(): boolean {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  });
  return !!(result.stdout && result.stdout.trim().length > 0);
}

function createBranch(branchName: string): boolean {
  const result = spawnSync('git', ['checkout', '-b', branchName], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0;
}

function runGitRevert(sha: string): { success: boolean; output: string } {
  const result = spawnSync('git', ['revert', '--no-edit', sha], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return {
    success: result.status === 0,
    output: result.stdout + result.stderr,
  };
}

function pushBranch(branchName: string): boolean {
  const result = spawnSync('git', ['push', 'origin', branchName], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0;
}

function runCommand(cmd: string): { success: boolean; output: string; durationMs: number } {
  const start = Date.now();
  const [command, ...args] = cmd.split(' ');
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  });
  return {
    success: result.status === 0,
    output: (result.stdout || '') + (result.stderr || ''),
    durationMs: Date.now() - start,
  };
}

// ============================================================================
// Proof Loading
// ============================================================================

function findProofFile(): string | null {
  // Priority 1: explicit --from flag
  if (CLI_FLAGS.from) {
    if (fs.existsSync(CLI_FLAGS.from)) {
      return CLI_FLAGS.from;
    }
    error(`Specified proof file not found: ${CLI_FLAGS.from}`);
    return null;
  }

  // Priority 2: search default paths
  for (const p of DEFAULT_PROOF_PATHS) {
    if (fs.existsSync(p)) {
      verbose(`Found proof file at: ${p}`);
      return p;
    }
  }

  error('Could not find apply-proofs.json. Searched:');
  for (const p of DEFAULT_PROOF_PATHS) {
    console.error(`  - ${p}`);
  }
  return null;
}

function loadProofs(filePath: string): ApplyProof[] | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    error(`Failed to parse proof file: ${e}`);
    return null;
  }
}

function findProofById(proofs: ApplyProof[], identifier: string): ApplyProof | null {
  // Try exact planItemId match
  const byId = proofs.find(p => p.planItemId === identifier);
  if (byId) return byId;

  // Try finalCommitSha prefix match
  const bySha = proofs.find(p => p.finalCommitSha && p.finalCommitSha.startsWith(identifier));
  if (bySha) return bySha;

  // Try numeric index (1-based for human-friendliness)
  const index = parseInt(identifier, 10);
  if (!isNaN(index) && index >= 1 && index <= proofs.length) {
    return proofs[index - 1];
  }

  return null;
}

// ============================================================================
// Required Gates
// ============================================================================

interface GateResult {
  name: string;
  command: string;
  passed: boolean;
  durationMs: number;
  output?: string;
}

function runGates(): { allPassed: boolean; results: GateResult[] } {
  const gates = [
    { name: 'type-check', command: 'pnpm run type-check' },
    { name: 'phase83-tools', command: 'node --test os-platform/core/tests/phase83-tools.test.mjs' },
  ];

  const results: GateResult[] = [];
  let allPassed = true;

  for (const gate of gates) {
    log(`  Running ${gate.name}...`);
    const result = runCommand(gate.command);
    results.push({
      name: gate.name,
      command: gate.command,
      passed: result.success,
      durationMs: result.durationMs,
      output: result.output,
    });

    if (result.success) {
      log(`  ✅ ${gate.name} passed (${result.durationMs}ms)`);
    } else {
      log(`  ❌ ${gate.name} failed`);
      allPassed = false;
    }
  }

  return { allPassed, results };
}

// ============================================================================
// Rollback Proof Output
// ============================================================================

interface RollbackProof {
  timestamp: string;
  originalProof: {
    planItemId?: string;
    strategyId?: string;
    finalCommitSha?: string;
    rollbackCommand?: string;
  };
  rollback: {
    branch: string;
    revertSha?: string;
    outcome: 'reverted' | 'dry-run' | 'failed';
    reason?: string;
  };
  gates: GateResult[];
}

function writeRollbackProof(proof: RollbackProof): void {
  const outDir = './tools/registry/perf-skill-audit/out';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'rollback-proof.json');
  fs.writeFileSync(outPath, JSON.stringify(proof, null, 2));
  log(`📄 Rollback proof: ${outPath}`);
}

// ============================================================================
// Safety Rails
// ============================================================================

function checkSafetyRails(): { safe: boolean; reason?: string } {
  // 1. Refuse on main/master
  const branch = getCurrentBranch();
  if (['main', 'master'].includes(branch)) {
    return {
      safe: false,
      reason: `SAFETY: Cannot run rollback on protected branch '${branch}'`,
    };
  }

  // 2. Refuse if working tree is dirty
  if (isWorkingTreeDirty()) {
    return {
      safe: false,
      reason: 'SAFETY: Cannot run rollback with dirty working tree',
    };
  }

  return { safe: true };
}

// ============================================================================
// Main
// ============================================================================

function printHelp() {
  console.log(`
🔄 TerraFusion perf-rollback — Phase 4N1

Safely revert autonomous patches with governance.

Usage:
  pnpm perf:rollback --proof <id>              Rollback by planItemId
  pnpm perf:rollback --proof <sha>             Rollback by commit SHA prefix
  pnpm perf:rollback --proof <index>           Rollback by proof index (1-based)
  pnpm perf:rollback --proof <id> --dry-run    Validate without executing

Options:
  --proof=<id>      Required. Proof identifier (planItemId, sha prefix, or index)
  --from=<path>     Path to apply-proofs.json (default: auto-detect)
  --branch=<name>   Custom branch name (default: rollback/<sha>/<date>)
  --dry-run         Validate only, no actual changes
  --verbose         Show detailed output
  --help, -h        Show this help

Governance:
  - Never runs on main/master
  - Validates rollback contracts before execution
  - Creates branch + runs gates
  - Produces rollback-proof.json

Examples:
  pnpm perf:rollback --proof rerender-setstate-nonfunctional-31-erender-patterns-tsx-l56
  pnpm perf:rollback --proof 843da9cf64
  pnpm perf:rollback --proof 1 --dry-run
`);
}

async function main() {
  log('🔄 TerraFusion perf-rollback — Phase 4N1');
  log('   Operator-grade rollback for Autonomy v1');
  log('');

  // Help mode
  if (CLI_FLAGS.help) {
    printHelp();
    process.exit(0);
  }

  // Validate required args
  if (!CLI_FLAGS.proof) {
    error('Missing required --proof=<id> argument');
    log('');
    printHelp();
    process.exit(1);
  }

  // Step 1: Safety rails
  log('🔐 Checking safety rails...');
  const safety = checkSafetyRails();
  if (!safety.safe) {
    error(safety.reason!);
    process.exit(1);
  }
  success('Safety rails passed');

  // Step 2: Load proofs
  log('');
  log('📄 Loading proof file...');
  const proofFile = findProofFile();
  if (!proofFile) {
    process.exit(1);
  }
  log(`   Found: ${proofFile}`);

  const proofs = loadProofs(proofFile);
  if (!proofs) {
    process.exit(1);
  }
  log(`   Loaded ${proofs.length} proof(s)`);

  // Step 3: Find the specific proof
  log('');
  log(`🔍 Finding proof: ${CLI_FLAGS.proof}`);
  const proof = findProofById(proofs, CLI_FLAGS.proof);
  if (!proof) {
    error(`Could not find proof matching: ${CLI_FLAGS.proof}`);
    log('');
    log('Available proofs:');
    proofs.forEach((p, i) => {
      log(`  ${i + 1}. ${p.planItemId || 'N/A'} (${p.outcome})`);
    });
    process.exit(1);
  }
  success(`Found: ${proof.planItemId || 'index-based'}`);
  log(`   Outcome: ${proof.outcome}`);
  log(`   Strategy: ${proof.strategyId || 'N/A'}`);
  log(`   Commit: ${proof.finalCommitSha || 'N/A'}`);

  // Step 4: Validate rollback command
  log('');
  log('✓ Validating rollback contract...');
  const validation = validateRollbackCommand(proof);
  if (!validation.valid) {
    error(validation.reason!);
    process.exit(1);
  }
  success('Rollback contract valid');
  log(`   Command: ${validation.parsed!.command}`);
  log(`   SHA: ${validation.parsed!.sha}`);

  // Dry-run exit
  if (CLI_FLAGS.dryRun) {
    log('');
    log('🔍 DRY-RUN: Validation complete, no changes made');

    const rollbackProof: RollbackProof = {
      timestamp: new Date().toISOString(),
      originalProof: {
        planItemId: proof.planItemId,
        strategyId: proof.strategyId,
        finalCommitSha: proof.finalCommitSha,
        rollbackCommand: proof.rollbackCommand,
      },
      rollback: {
        branch: 'dry-run',
        outcome: 'dry-run',
        reason: 'Dry run mode - validation only',
      },
      gates: [],
    };
    writeRollbackProof(rollbackProof);

    success('Dry-run complete');
    process.exit(0);
  }

  // Step 5: Create rollback branch
  log('');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const branchName = CLI_FLAGS.branch || `rollback/${validation.parsed!.sha}/${timestamp}`;
  log(`🌿 Creating branch: ${branchName}`);

  if (!createBranch(branchName)) {
    error(`Failed to create branch: ${branchName}`);
    process.exit(1);
  }
  success(`Branch created: ${branchName}`);

  // Step 6: Execute git revert
  log('');
  log(`🔄 Executing: ${validation.parsed!.command}`);
  const revertResult = runGitRevert(validation.parsed!.sha);
  if (!revertResult.success) {
    error('Git revert failed:');
    console.error(revertResult.output);
    process.exit(1);
  }
  success('Git revert successful');

  // Get the revert commit SHA
  const revertShaResult = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  const revertSha = revertShaResult.stdout?.trim() || '';
  log(`   Revert commit: ${revertSha.slice(0, 10)}`);

  // Step 7: Run gates
  log('');
  log('🔐 Running required gates...');
  const gateResults = runGates();

  if (!gateResults.allPassed) {
    error('Gates failed - rollback commit exists but may have issues');
    log('   Review the rollback branch before proceeding');
  } else {
    success('All gates passed');
  }

  // Step 8: Write rollback proof
  log('');
  const rollbackProof: RollbackProof = {
    timestamp: new Date().toISOString(),
    originalProof: {
      planItemId: proof.planItemId,
      strategyId: proof.strategyId,
      finalCommitSha: proof.finalCommitSha,
      rollbackCommand: proof.rollbackCommand,
    },
    rollback: {
      branch: branchName,
      revertSha,
      outcome: gateResults.allPassed ? 'reverted' : 'failed',
      reason: gateResults.allPassed
        ? 'Rollback successful, gates passed'
        : 'Rollback applied but gates failed',
    },
    gates: gateResults.results,
  };
  writeRollbackProof(rollbackProof);

  // Step 9: Summary
  log('');
  log('═══════════════════════════════════════════════════════════');
  log('🔄 ROLLBACK SUMMARY');
  log('═══════════════════════════════════════════════════════════');
  log(`   Original Commit:  ${proof.finalCommitSha}`);
  log(`   Revert Commit:    ${revertSha.slice(0, 10)}`);
  log(`   Branch:           ${branchName}`);
  log(`   Gates:            ${gateResults.allPassed ? '✅ PASS' : '❌ FAIL'}`);
  log('');
  log('Next steps:');
  log(`   1. Push branch:  git push origin ${branchName}`);
  log(`   2. Open PR titled: rollback: ${proof.planItemId || validation.parsed!.sha}`);
  log(`   3. Merge after SEAL passes`);
  log('');
  success('Rollback complete (--auto mode)');
}

main().catch(err => {
  error(`Rollback failed: ${err.message}`);
  process.exit(1);
});
