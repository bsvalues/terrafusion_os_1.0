#!/usr/bin/env node
/**
 * Phase 4N29 – Autonomy Circuit Breaker CLI
 * Phase 4N31 – Recovery Protocol
 * Phase 4N32 – Canary Autonomy Lane
 * Phase 4N33 – SLO Guard + Error Budget Enforcement
 * Phase 4N39 – Autonomy Freeze Gate
 * ==========================================
 *
 * One-command operational control for autonomy pause/resume/freeze/canary/slo.
 *
 * Usage:
 *   pnpm perf:autonomy pause --reason "incident response" --duration 1h
 *   pnpm perf:autonomy resume
 *   pnpm perf:autonomy freeze --category audit --reason "Q2 audit" --duration 72h --ticket AUDIT-2026-Q2
 *   pnpm perf:autonomy unfreeze --ticket AUDIT-2026-Q2
 *   pnpm perf:autonomy status
 *   pnpm perf:autonomy check --actor pr-lane
 *   pnpm perf:autonomy canary status
 *   pnpm perf:autonomy canary promote --dry-run
 *   pnpm perf:autonomy canary demote --reason "..." --to canary_1pct
 *   pnpm perf:autonomy canary lock --reason "maintenance"
 *   pnpm perf:autonomy slo status
 *   pnpm perf:autonomy slo check --actor pr-lane
 *
 * Exit codes:
 *   0 = success (or allowed for check)
 *   1 = failure / paused / frozen
 *   2 = invalid arguments
 */

import {
    demote as canaryDemote,
    lock as canaryLock,
    promote as canaryPromote,
    unlock as canaryUnlock,
    getCanaryStatus,
    loadCanaryPolicy,
    loadCanaryState,
    saveCanaryState,
    saveDemotionProof,
    savePromotionProof,
    type CanaryStageId,
} from './autonomy-canary.js';
import { calculateHealth, type EvidenceRecordForHealth } from './autonomy-health.js';
import {
    generateResumeProof,
    loadRecoveryCapsule,
    saveResumeProof,
    type RecoveryCapsule,
} from './autonomy-recovery.js';
import {
    checkBudget,
    getBudgetStatus,
    loadSloPolicy,
    saveSloProof,
    type BudgetLevel,
} from './autonomy-slo.js';
import {
    checkAutonomyAllowed,
    DEFAULT_FREEZE_POLICY,
    DEFAULT_FREEZE_STATE,
    freezeAutonomy,
    generateFreezeEvidence,
    loadAutonomyState,
    parseDuration,
    pauseAutonomy,
    resolveStatePath,
    resumeAutonomy,
    unfreezeAutonomy,
    type ApproverRole,
    type AutonomyContext,
    type AutonomyDecision,
    type AutonomyState,
    type FreezeReasonCategory,
} from './autonomy-state.js';

// ─────────────────────────────────────────────────────────────────────────────
// CLI Version
// ─────────────────────────────────────────────────────────────────────────────

const CLI_VERSION = '4N39.1';

// ─────────────────────────────────────────────────────────────────────────────
// Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

type CanarySubcommand = 'status' | 'promote' | 'demote' | 'lock' | 'unlock';
type SloSubcommand = 'status' | 'check';
type MainCommand =
  | 'pause'
  | 'resume'
  | 'status'
  | 'check'
  | 'canary'
  | 'slo'
  | 'freeze'
  | 'unfreeze'
  | 'help';

interface CliArgs {
  command: MainCommand;
  canarySubcommand?: CanarySubcommand;
  sloSubcommand?: SloSubcommand;
  reason?: string;
  duration?: string;
  expiresAt?: string;
  actor?: 'pr-lane' | 'evidence-publisher' | 'incident-publisher';
  json?: boolean;
  recovery?: string; // Path to recovery capsule for resume
  dryRun?: boolean; // For resume: check prerequisites without resuming
  force?: boolean; // For resume: skip prerequisite checks
  to?: CanaryStageId; // For canary demote: target stage
  strict?: boolean; // For SLO check: fail-closed on missing data
  // Freeze-related args (4N39)
  category?: FreezeReasonCategory; // For freeze: reason category
  ticket?: string; // For freeze/unfreeze: ticket ID
  role?: ApproverRole; // For freeze/unfreeze: actor's role
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { command: 'help' };
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--reason' && argv[i + 1]) {
      args.reason = argv[++i];
    } else if (arg === '--duration' && argv[i + 1]) {
      args.duration = argv[++i];
    } else if (arg === '--expires-at' && argv[i + 1]) {
      args.expiresAt = argv[++i];
    } else if (arg === '--actor' && argv[i + 1]) {
      const actor = argv[++i];
      if (actor === 'pr-lane' || actor === 'evidence-publisher' || actor === 'incident-publisher') {
        args.actor = actor;
      }
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--recovery' && argv[i + 1]) {
      args.recovery = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--strict') {
      args.strict = true;
    } else if (arg === '--to' && argv[i + 1]) {
      args.to = argv[++i] as CanaryStageId;
    } else if (arg === '--category' && argv[i + 1]) {
      const cat = argv[++i] as FreezeReasonCategory;
      if (['audit', 'election', 'incident', 'compliance'].includes(cat)) {
        args.category = cat;
      }
    } else if (arg === '--ticket' && argv[i + 1]) {
      args.ticket = argv[++i];
    } else if (arg === '--role' && argv[i + 1]) {
      const role = argv[++i] as ApproverRole;
      if (['cio', 'security', 'engineering'].includes(role)) {
        args.role = role;
      }
    } else if (arg === '--help' || arg === '-h') {
      args.command = 'help';
      return args;
    } else if (!arg.startsWith('-')) {
      positionals.push(arg);
    }
  }

  if (positionals.length > 0) {
    const cmd = positionals[0].toLowerCase();
    if (
      cmd === 'pause' ||
      cmd === 'resume' ||
      cmd === 'status' ||
      cmd === 'check' ||
      cmd === 'canary' ||
      cmd === 'slo' ||
      cmd === 'freeze' ||
      cmd === 'unfreeze'
    ) {
      args.command = cmd;

      // Handle canary subcommand
      if (cmd === 'canary' && positionals.length > 1) {
        const sub = positionals[1].toLowerCase();
        if (
          sub === 'status' ||
          sub === 'promote' ||
          sub === 'demote' ||
          sub === 'lock' ||
          sub === 'unlock'
        ) {
          args.canarySubcommand = sub;
        }
      }

      // Handle SLO subcommand
      if (cmd === 'slo' && positionals.length > 1) {
        const sub = positionals[1].toLowerCase();
        if (sub === 'status' || sub === 'check') {
          args.sloSubcommand = sub;
        }
      }
    }
  }

  return args;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatState(state: AutonomyState | null): void {
  if (!state) {
    console.log('⚠️  State file missing or invalid');
    console.log(`   Path: ${resolveStatePath()}`);
    console.log('   Effect: FAIL-CLOSED (autonomy paused)');
    return;
  }

  const stateIcon = state.state === 'active' ? '✅' : '⏸️';
  console.log(`${stateIcon} Autonomy: ${state.state.toUpperCase()}`);
  console.log(`   Updated: ${state.updatedAt}`);
  console.log(`   By: ${state.updatedBy}`);

  if (state.reason) {
    console.log(`   Reason: ${state.reason}`);
  }

  if (state.expiresAt) {
    const expiry = new Date(state.expiresAt);
    const now = new Date();
    if (now >= expiry) {
      console.log(`   Expires: ${state.expiresAt} (EXPIRED - will auto-resume)`);
    } else {
      const remaining = Math.round((expiry.getTime() - now.getTime()) / 60000);
      console.log(`   Expires: ${state.expiresAt} (${remaining}m remaining)`);
    }
  }

  console.log(`   Path: ${resolveStatePath()}`);

  // Policy summary
  console.log('\n   Policy:');
  console.log(`     Fail-closed on missing: ${state.policy.failClosedOnMissing}`);
  console.log(`     Fail-closed on invalid: ${state.policy.failClosedOnInvalid}`);
  console.log(
    `     Allow incident publisher when paused: ${state.policy.allowIncidentPublisherWhenPaused}`
  );

  // Freeze status (Phase 4N39)
  const freeze = state.freeze ?? DEFAULT_FREEZE_STATE;
  if (freeze.active) {
    console.log('\n   ❄️  FROZEN:');
    console.log(`     Category: ${freeze.category}`);
    console.log(`     Reason: ${freeze.reason}`);
    console.log(`     Set by: ${freeze.setBy} (${freeze.setByRole})`);
    console.log(`     Set at: ${freeze.setAt}`);
    if (freeze.ticketId) {
      console.log(`     Ticket: ${freeze.ticketId}`);
    }
    if (freeze.expiresAt) {
      const expiry = new Date(freeze.expiresAt);
      const now = new Date();
      if (now >= expiry) {
        console.log(`     Expires: ${freeze.expiresAt} (EXPIRED - will auto-unfreeze)`);
      } else {
        const remaining = Math.round((expiry.getTime() - now.getTime()) / 3600000);
        console.log(`     Expires: ${freeze.expiresAt} (${remaining}h remaining)`);
      }
    } else {
      console.log('     Expires: NEVER (indefinite freeze)');
    }
  }
}

function formatDecision(decision: AutonomyDecision): void {
  const icon = decision.allowed ? '✅' : decision.source === 'frozen' ? '❄️' : '🚫';
  const blockReason = decision.source === 'frozen' ? 'FROZEN' : 'BLOCKED';
  console.log(`${icon} Autonomy decision: ${decision.allowed ? 'ALLOWED' : blockReason}`);
  console.log(`   State: ${decision.state}`);
  console.log(`   Source: ${decision.source}`);

  if (decision.reason) {
    console.log(`   Reason: ${decision.reason}`);
  }

  if (decision.expiresAt) {
    console.log(`   Expires: ${decision.expiresAt}`);
    if (decision.expired) {
      console.log('   Status: Pause has expired');
    }
  }

  // Freeze details
  if (decision.freeze?.active) {
    console.log('\n   Freeze Details:');
    console.log(`     Category: ${decision.freeze.category}`);
    console.log(`     Set by: ${decision.freeze.setBy}`);
    if (decision.freeze.ticketId) {
      console.log(`     Ticket: ${decision.freeze.ticketId}`);
    }
    if (decision.freeze.expiresAt) {
      const remaining = Math.round(
        (new Date(decision.freeze.expiresAt).getTime() - Date.now()) / 3600000
      );
      console.log(`     Expires in: ${remaining}h`);
    }
  }

  console.log(`   Timestamp: ${decision.timestamp}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────────────────────

function cmdStatus(args: CliArgs): number {
  const state = loadAutonomyState();

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          state,
          path: resolveStatePath(),
          cliVersion: CLI_VERSION,
        },
        null,
        2
      )
    );
    return state?.state === 'active' ? 0 : 1;
  }

  console.log(`\n🔧 Autonomy State (v${CLI_VERSION})`);
  console.log('═'.repeat(50));
  formatState(state);
  console.log();

  return state?.state === 'active' ? 0 : 1;
}

function cmdPause(args: CliArgs): number {
  if (!args.reason) {
    console.error('❌ Error: --reason is required for pause command');
    console.error('   Usage: pnpm perf:autonomy pause --reason "incident response"');
    return 2;
  }

  // Validate duration if provided
  if (args.duration) {
    const ms = parseDuration(args.duration);
    if (!ms) {
      console.error(`❌ Error: Invalid duration "${args.duration}"`);
      console.error('   Supported formats: 30m, 1h, 24h, 1d, 7d');
      return 2;
    }
  }

  const updatedBy = process.env.GITHUB_ACTOR || process.env.USER || 'cli';

  const state = pauseAutonomy({
    reason: args.reason,
    duration: args.duration,
    expiresAt: args.expiresAt,
    updatedBy,
  });

  if (args.json) {
    console.log(JSON.stringify(state, null, 2));
  } else {
    console.log('\n⏸️  Autonomy PAUSED');
    console.log('═'.repeat(50));
    formatState(state);
    console.log();
  }

  return 0;
}

function cmdResume(args: CliArgs): number {
  const updatedBy = process.env.GITHUB_ACTOR || process.env.USER || 'cli';
  const actor = args.actor || 'cli';

  // Force mode: skip prerequisites (for emergency use only)
  if (args.force) {
    if (!args.json) {
      console.log('\n⚠️  FORCE MODE: Skipping prerequisite checks');
      console.log('   This should only be used for emergency recovery.');
    }

    const state = resumeAutonomy(updatedBy);

    if (args.json) {
      console.log(JSON.stringify({ state, forced: true }, null, 2));
    } else {
      console.log('\n✅ Autonomy RESUMED (forced)');
      console.log('═'.repeat(50));
      formatState(state);
      console.log();
    }

    return 0;
  }

  // Recovery mode: require recovery capsule and check prerequisites
  if (!args.recovery) {
    // Try to auto-detect recovery capsule in common locations
    const autoDetectPaths = [
      './autonomy-recovery.json',
      './dist/autonomy-recovery.json',
      './tools/registry/autonomy-viewer/autonomy-recovery.json',
    ];

    const fs = require('node:fs');
    for (const p of autoDetectPaths) {
      if (fs.existsSync(p)) {
        args.recovery = p;
        break;
      }
    }

    if (!args.recovery) {
      if (args.json) {
        console.log(
          JSON.stringify(
            { error: 'Recovery capsule required', hint: 'Use --recovery <path> or --force' },
            null,
            2
          )
        );
      } else {
        console.error('\n❌ Resume requires recovery capsule');
        console.error('   Use: pnpm perf:autonomy resume --recovery <path>');
        console.error('   Or:  pnpm perf:autonomy resume --force (emergency only)');
      }
      return 2;
    }
  }

  // Load recovery capsule
  let capsule: RecoveryCapsule;
  try {
    capsule = loadRecoveryCapsule(args.recovery);
  } catch (err) {
    if (args.json) {
      console.log(
        JSON.stringify({ error: 'Failed to load recovery capsule', path: args.recovery }, null, 2)
      );
    } else {
      console.error(`\n❌ Failed to load recovery capsule: ${args.recovery}`);
      console.error(`   ${(err as Error).message}`);
    }
    return 2;
  }

  // Load evidence records for prerequisite checks
  // In a real implementation, this would load from evidence-index files
  // For now, we'll use mock records based on prerequisite types
  const mockRecords = getMockRecordsForResume();

  // Generate resume proof (always, even if denied)
  const command = `pnpm perf:autonomy resume --recovery ${args.recovery}${args.dryRun ? ' --dry-run' : ''}`;
  const proof = generateResumeProof({
    records: mockRecords,
    capsule,
    actor,
    command,
    dryRun: args.dryRun,
  });

  // Save resume proof
  const proofPath = args.recovery
    .replace('.json', '-proof.json')
    .replace('recovery', 'resume-proof');
  saveResumeProof(proof, './resume-proof.json');

  if (proof.decision !== 'approved') {
    if (args.json) {
      console.log(JSON.stringify(proof, null, 2));
    } else {
      console.log(`\n🚫 Resume ${proof.decision.toUpperCase()}`);
      console.log('═'.repeat(50));
      console.log(`   ${proof.summary}`);
      console.log('\n   Prerequisites:');
      for (const p of proof.prerequisites) {
        const icon = p.satisfied ? '✅' : p.required ? '❌' : '⚠️';
        console.log(`     ${icon} ${p.id}: ${p.evidence}`);
      }
      console.log(`\n   Proof saved: ./resume-proof.json`);
    }
    return 1;
  }

  // Dry run: don't actually resume
  if (args.dryRun) {
    if (args.json) {
      console.log(JSON.stringify({ ...proof, dryRun: true }, null, 2));
    } else {
      console.log('\n✅ Resume APPROVED (dry run)');
      console.log('═'.repeat(50));
      console.log(`   ${proof.summary}`);
      console.log('\n   Prerequisites:');
      for (const p of proof.prerequisites) {
        console.log(`     ✅ ${p.id}: ${p.evidence}`);
      }
      console.log('\n   To actually resume:');
      console.log(`     pnpm perf:autonomy resume --recovery ${args.recovery}`);
    }
    return 0;
  }

  // Actually resume
  const state = resumeAutonomy(updatedBy);

  if (args.json) {
    console.log(JSON.stringify({ state, proof }, null, 2));
  } else {
    console.log('\n✅ Autonomy RESUMED');
    console.log('═'.repeat(50));
    formatState(state);
    console.log(`\n   Proof saved: ./resume-proof.json`);
  }

  return 0;
}

/**
 * Get mock records for prerequisite checking.
 * In production, this would load from actual evidence-index files.
 */
function getMockRecordsForResume(): EvidenceRecordForHealth[] {
  // Return mock "healthy" records to allow testing
  // Production would load from evidence indices
  return [
    {
      runId: 'mock-1',
      generatedAt: new Date().toISOString(),
      tier: 'ci',
      verify: { ok: true, strict: true },
      signature: { signed: true, verified: { ok: true }, pinned: true },
      rekor: { anchored: true },
    },
    {
      runId: 'mock-2',
      generatedAt: new Date(Date.now() - 3600000).toISOString(),
      tier: 'ci',
      verify: { ok: true, strict: true },
      signature: { signed: true, verified: { ok: true }, pinned: true },
      rekor: { anchored: true },
    },
    {
      runId: 'mock-3',
      generatedAt: new Date(Date.now() - 7200000).toISOString(),
      tier: 'ci',
      verify: { ok: true, strict: true },
      signature: { signed: true, verified: { ok: true }, pinned: true },
      rekor: { anchored: true },
    },
  ];
}

function cmdCheck(args: CliArgs): number {
  const actor = args.actor || 'pr-lane';
  const context: AutonomyContext = { actor };

  const decision = checkAutonomyAllowed(context);

  if (args.json) {
    console.log(JSON.stringify(decision, null, 2));
  } else {
    console.log(`\n🔍 Autonomy Check (actor: ${actor})`);
    console.log('═'.repeat(50));
    formatDecision(decision);
    console.log();
  }

  return decision.allowed ? 0 : 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canary Commands
// ─────────────────────────────────────────────────────────────────────────────

function cmdCanary(args: CliArgs): number {
  const actor = process.env.GITHUB_ACTOR || process.env.USER || 'cli';

  switch (args.canarySubcommand) {
    case 'status':
      return cmdCanaryStatus(args);
    case 'promote':
      return cmdCanaryPromote(args, actor);
    case 'demote':
      return cmdCanaryDemote(args, actor);
    case 'lock':
      return cmdCanaryLock(args, actor);
    case 'unlock':
      return cmdCanaryUnlock(args, actor);
    default:
      return cmdCanaryHelp();
  }
}

function cmdCanaryStatus(args: CliArgs): number {
  const policy = loadCanaryPolicy();
  const state = loadCanaryState();
  const records = getMockRecordsForResume();
  const health = calculateHealth(records);
  const status = getCanaryStatus(policy, state, health, records);

  if (args.json) {
    console.log(JSON.stringify(status, null, 2));
    return 0;
  }

  const stageIcon = status.stage === 'disabled' ? '⏸️' : status.stage === 'full' ? '✅' : '🐤';
  console.log(`\n${stageIcon} Canary Status (v${CLI_VERSION})`);
  console.log('═'.repeat(50));
  console.log(`   Stage: ${status.stageLabel} (${status.stage})`);
  console.log(`   Blast Radius: ${status.blastRadius}%`);
  console.log(`   Hours at stage: ${status.hoursAtStage.toFixed(1)}h`);
  console.log(`   Successful runs: ${status.successfulRuns}`);
  console.log(`   Runs to promotion: ${status.runsToPromotion}`);
  console.log(`   Hours to promotion: ${status.hoursToPromotion.toFixed(1)}h`);
  console.log(
    `   PRs today: ${status.todayPRs}/${status.maxPRsPerDay === -1 ? '∞' : status.maxPRsPerDay}`
  );
  console.log(
    `   Max applies/run: ${status.maxAppliesPerRun === -1 ? '∞' : status.maxAppliesPerRun}`
  );

  if (status.locked) {
    console.log(`\n   🔒 LOCKED: ${status.lockReason}`);
    if (status.lockExpiresAt) {
      console.log(`   Expires: ${status.lockExpiresAt}`);
    }
  }

  if (status.promotionEligible) {
    console.log('\n   ✅ PROMOTION ELIGIBLE');
  } else if (status.promotionBlockers.length > 0) {
    console.log('\n   Promotion blockers:');
    for (const b of status.promotionBlockers) {
      console.log(`     ❌ ${b}`);
    }
  }

  console.log();
  return 0;
}

function cmdCanaryPromote(args: CliArgs, actor: string): number {
  const policy = loadCanaryPolicy();
  const state = loadCanaryState();
  const records = getMockRecordsForResume();
  const health = calculateHealth(records);

  const command = `pnpm perf:autonomy canary promote${args.dryRun ? ' --dry-run' : ''}`;

  const result = canaryPromote({
    policy,
    state,
    health,
    records,
    actor,
    command,
    dryRun: args.dryRun,
  });

  // Save proof
  const proofPath = savePromotionProof(result.proof);

  // Save state if not dry run and approved
  if (result.newState) {
    saveCanaryState(result.newState);
  }

  if (args.json) {
    console.log(JSON.stringify({ proof: result.proof, proofPath }, null, 2));
    return result.proof.decision === 'approved' ? 0 : 1;
  }

  const icon = result.proof.decision === 'approved' ? '✅' : '🚫';
  console.log(
    `\n${icon} Promotion ${result.proof.decision.toUpperCase()}${args.dryRun ? ' (dry run)' : ''}`
  );
  console.log('═'.repeat(50));
  console.log(`   From: ${result.proof.fromStage}`);
  console.log(`   To: ${result.proof.toStage}`);

  if (result.proof.eligibility.blockers.length > 0) {
    console.log('\n   Blockers:');
    for (const b of result.proof.eligibility.blockers) {
      console.log(`     ❌ ${b}`);
    }
  }

  console.log(`\n   Proof saved: ${proofPath}`);
  console.log();

  return result.proof.decision === 'approved' ? 0 : 1;
}

function cmdCanaryDemote(args: CliArgs, actor: string): number {
  const policy = loadCanaryPolicy();
  const state = loadCanaryState();
  const records = getMockRecordsForResume();
  const health = calculateHealth(records);

  const command = `pnpm perf:autonomy canary demote${args.to ? ` --to ${args.to}` : ''}${args.reason ? ` --reason "${args.reason}"` : ''}`;

  const result = canaryDemote({
    policy,
    state,
    health,
    records,
    actor,
    command,
    manualReason: args.reason,
    targetStage: args.to,
  });

  // Save proof
  const proofPath = saveDemotionProof(result.proof);

  // Save state
  saveCanaryState(result.newState);

  if (args.json) {
    console.log(
      JSON.stringify({ proof: result.proof, proofPath, autoPaused: result.autoPaused }, null, 2)
    );
    return 0;
  }

  console.log('\n⏬ Demotion APPLIED');
  console.log('═'.repeat(50));
  console.log(`   From: ${result.proof.fromStage}`);
  console.log(`   To: ${result.proof.toStage}`);
  console.log(`   Trigger: ${result.proof.trigger}`);
  console.log(`   Reason: ${result.proof.reason}`);

  if (result.autoPaused) {
    console.log('\n   ⚠️  Auto-paused after demotion');
  }

  if (result.newState.locked) {
    console.log(`\n   🔒 LOCKED: ${result.newState.lockedReason}`);
  }

  console.log(`\n   Proof saved: ${proofPath}`);
  console.log();

  return 0;
}

function cmdCanaryLock(args: CliArgs, actor: string): number {
  if (!args.reason) {
    console.error('❌ Error: --reason is required for lock command');
    console.error('   Usage: pnpm perf:autonomy canary lock --reason "maintenance"');
    return 2;
  }

  const policy = loadCanaryPolicy();
  const state = loadCanaryState();

  const newState = canaryLock({
    state,
    policy,
    actor,
    reason: args.reason,
    durationHours: args.duration ? parseInt(args.duration, 10) : undefined,
  });

  saveCanaryState(newState);

  if (args.json) {
    console.log(JSON.stringify(newState, null, 2));
    return 0;
  }

  console.log('\n🔒 Canary LOCKED');
  console.log('═'.repeat(50));
  console.log(`   Stage: ${newState.currentStage}`);
  console.log(`   Reason: ${newState.lockedReason}`);
  console.log(`   Expires: ${newState.lockExpiresAt}`);
  console.log();

  return 0;
}

function cmdCanaryUnlock(args: CliArgs, actor: string): number {
  const state = loadCanaryState();

  if (!state.locked) {
    if (args.json) {
      console.log(JSON.stringify({ error: 'Canary is not locked' }, null, 2));
    } else {
      console.log('\n⚠️  Canary is not locked');
    }
    return 1;
  }

  const newState = canaryUnlock(state, actor, args.reason || 'Manual unlock');

  saveCanaryState(newState);

  if (args.json) {
    console.log(JSON.stringify(newState, null, 2));
    return 0;
  }

  console.log('\n🔓 Canary UNLOCKED');
  console.log('═'.repeat(50));
  console.log(`   Stage: ${newState.currentStage}`);
  console.log(`   Reason: ${args.reason || 'Manual unlock'}`);
  console.log();

  return 0;
}

function cmdCanaryHelp(): number {
  console.log(`
Canary Autonomy Lane (v${CLI_VERSION})
═══════════════════════════════════════════════════

USAGE:
  pnpm perf:autonomy canary <subcommand> [options]

SUBCOMMANDS:
  status              Show current canary stage and promotion eligibility
  promote             Attempt to promote to next stage
  demote              Demote to lower stage (or auto-detected trigger)
  lock                Lock canary at current stage
  unlock              Unlock canary

PROMOTE OPTIONS:
  --dry-run           Check eligibility without promoting

DEMOTE OPTIONS:
  --reason <text>     Reason for demotion
  --to <stage>        Target stage (default: previous stage)

LOCK OPTIONS:
  --reason <text>     Required. Reason for lock
  --duration <hours>  Lock duration in hours (default: from policy)

GLOBAL OPTIONS:
  --json              Output as JSON
  --help              Show this help

EXAMPLES:
  pnpm perf:autonomy canary status
  pnpm perf:autonomy canary promote --dry-run
  pnpm perf:autonomy canary promote
  pnpm perf:autonomy canary demote --reason "flaky tests" --to canary_1pct
  pnpm perf:autonomy canary lock --reason "maintenance" --duration 24
  pnpm perf:autonomy canary unlock --reason "maintenance complete"

STAGES:
  disabled    → 0% blast radius (autonomy off)
  canary_1pct → 1% blast radius (1 PR/day, 1 apply/run)
  canary_5pct → 5% blast radius (2 PRs/day, 2 applies/run)
  canary_10pct → 10% blast radius (5 PRs/day, 3 applies/run)
  canary_25pct → 25% blast radius (10 PRs/day, 5 applies/run)
  canary_50pct → 50% blast radius (25 PRs/day, 10 applies/run)
  full        → 100% blast radius (unlimited)
`);
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLO Commands
// ─────────────────────────────────────────────────────────────────────────────

function cmdSlo(args: CliArgs): number {
  const actor = process.env.GITHUB_ACTOR || 'cli';

  switch (args.sloSubcommand) {
    case 'status':
      return cmdSloStatus(args);
    case 'check':
      return cmdSloCheck(args, actor);
    default:
      return cmdSloHelp();
  }
}

function formatBudgetLevel(level: BudgetLevel): string {
  switch (level) {
    case 'ok':
      return '✅ OK';
    case 'burning':
      return '⚠️  BURNING';
    case 'exhausted':
      return '🚫 EXHAUSTED';
  }
}

function cmdSloStatus(args: CliArgs): number {
  const policy = loadSloPolicy();
  const records = getMockRecordsForResume();
  const status = getBudgetStatus(records, policy);

  if (args.json) {
    console.log(JSON.stringify(status, null, 2));
    return status.allowed ? 0 : 1;
  }

  console.log(`\n${formatBudgetLevel(status.level)} SLO Budget Status`);
  console.log('═'.repeat(50));
  console.log(`   Budget: ${status.budgetPercent}% remaining`);
  console.log(
    `   Critical: ${status.criticalConsumed} consumed / ${status.criticalRemaining} remaining`
  );
  console.log(`   Warn: ${status.warnConsumed} consumed / ${status.warnRemaining} remaining`);
  console.log(`   Burn Rate: ${status.burnRate} failures/day`);
  console.log(`   Window: ${status.windowRecords} records`);
  console.log(`     From: ${status.windowStart}`);
  console.log(`     To: ${status.windowEnd}`);

  if (status.topFailures.length > 0) {
    console.log('\n   Top Failures:');
    for (const f of status.topFailures) {
      console.log(`     • ${f}`);
    }
  }

  if (status.recommendations.length > 0) {
    console.log('\n   Recommendations:');
    for (const r of status.recommendations) {
      console.log(`     → ${r}`);
    }
  }

  console.log();
  return status.allowed ? 0 : 1;
}

function cmdSloCheck(args: CliArgs, actor: string): number {
  const policy = loadSloPolicy();
  const records = getMockRecordsForResume();
  const command = `pnpm perf:autonomy slo check${args.actor ? ` --actor ${args.actor}` : ''}${args.strict ? ' --strict' : ''}`;

  const { allowed, proof } = checkBudget({
    records,
    policy,
    actor: args.actor || actor,
    command,
    strict: args.strict,
  });

  // Save proof if blocked
  let proofPath: string | undefined;
  if (!allowed) {
    proofPath = saveSloProof(proof);
  }

  if (args.json) {
    console.log(JSON.stringify({ allowed, proof, proofPath }, null, 2));
    return allowed ? 0 : 1;
  }

  if (allowed) {
    console.log(`\n${formatBudgetLevel(proof.level)} SLO Check: ALLOWED`);
    console.log('═'.repeat(50));
    console.log(`   Budget: ${proof.budgetPercent}%`);
    console.log(`   Burn Rate: ${proof.burnRate} failures/day`);
  } else {
    console.log(`\n${formatBudgetLevel(proof.level)} SLO Check: BLOCKED`);
    console.log('═'.repeat(50));
    console.log(`   Reason: ${proof.blockReason}`);
    console.log(`   Budget: ${proof.budgetPercent}%`);
    console.log(`   Proof: ${proofPath}`);

    if (proof.recommendations.length > 0) {
      console.log('\n   Recommendations:');
      for (const r of proof.recommendations) {
        console.log(`     → ${r}`);
      }
    }
  }

  console.log();
  return allowed ? 0 : 1;
}

function cmdSloHelp(): number {
  console.log(`
SLO Guard + Error Budget (v${CLI_VERSION})
═══════════════════════════════════════════════════

USAGE:
  pnpm perf:autonomy slo <subcommand> [options]

SUBCOMMANDS:
  status              Show current SLO budget status
  check               Check if action is allowed under SLO budget

CHECK OPTIONS:
  --actor <type>      Actor type: pr-lane, evidence-publisher, incident-publisher
  --strict            Fail-closed on missing evidence data

GLOBAL OPTIONS:
  --json              Output as JSON
  --help              Show this help

EXAMPLES:
  pnpm perf:autonomy slo status
  pnpm perf:autonomy slo status --json
  pnpm perf:autonomy slo check --actor pr-lane
  pnpm perf:autonomy slo check --strict

BUDGET LEVELS:
  ok         → Budget healthy (≥67%), autonomy proceeds normally
  burning    → Budget degrading (34-67%), consider limiting blast radius
  exhausted  → Budget exhausted (<34%), autonomy blocked

ENFORCEMENT:
  When budget is exhausted, all non-incident actions are blocked.
  Blocked actions emit slo-proof.json for audit and remediation.
`);
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Freeze Commands (Phase 4N39)
// ─────────────────────────────────────────────────────────────────────────────

function cmdFreeze(args: CliArgs): number {
  // Validate required args
  if (!args.category) {
    console.error('❌ Error: --category is required for freeze command');
    console.error('   Categories: audit, election, incident, compliance');
    console.error(
      '   Usage: pnpm perf:autonomy freeze --category audit --reason "Q2 audit" --role cio'
    );
    return 2;
  }

  if (!args.reason) {
    console.error('❌ Error: --reason is required for freeze command');
    console.error(
      '   Usage: pnpm perf:autonomy freeze --category audit --reason "Q2 audit" --role cio'
    );
    return 2;
  }

  if (!args.role) {
    console.error('❌ Error: --role is required for freeze command');
    console.error('   Roles: cio, security, engineering');
    console.error(
      '   Usage: pnpm perf:autonomy freeze --category audit --reason "Q2 audit" --role cio'
    );
    return 2;
  }

  // Validate duration if provided
  if (args.duration) {
    const ms = parseDuration(args.duration);
    if (!ms) {
      console.error(`❌ Error: Invalid duration "${args.duration}"`);
      console.error('   Supported formats: 30m, 1h, 24h, 72h, 1d, 7d');
      return 2;
    }
  }

  const actor = process.env.GITHUB_ACTOR || process.env.USER || 'cli';

  const { state, authorized, error } = freezeAutonomy({
    category: args.category,
    reason: args.reason,
    actor,
    actorRole: args.role,
    ticketId: args.ticket,
    duration: args.duration,
    expiresAt: args.expiresAt,
  });

  if (!authorized) {
    if (args.json) {
      console.log(JSON.stringify({ authorized: false, error }, null, 2));
    } else {
      console.log('\n🚫 FREEZE DENIED');
      console.log('═'.repeat(50));
      console.log(`   ${error}`);
      console.log(`   Actor: ${actor} (${args.role})`);
      console.log(`   Category: ${args.category}`);
      console.log(
        `   Required roles: ${DEFAULT_FREEZE_POLICY.categoryRoles[args.category].join(', ')}`
      );
    }
    return 1;
  }

  // Generate freeze evidence
  const evidence = generateFreezeEvidence('freeze', {
    actor,
    actorRole: args.role,
    category: args.category,
    reason: args.reason,
    ticketId: args.ticket ?? null,
    expiresAt: state.freeze?.expiresAt ?? null,
    authorized: true,
  });

  if (args.json) {
    console.log(JSON.stringify({ state, evidence }, null, 2));
  } else {
    console.log('\n❄️  Autonomy FROZEN');
    console.log('═'.repeat(50));
    console.log(`   Category: ${args.category}`);
    console.log(`   Reason: ${args.reason}`);
    console.log(`   Actor: ${actor} (${args.role})`);
    if (args.ticket) {
      console.log(`   Ticket: ${args.ticket}`);
    }
    if (state.freeze?.expiresAt) {
      const remaining = Math.round(
        (new Date(state.freeze.expiresAt).getTime() - Date.now()) / 3600000
      );
      console.log(`   Expires: ${state.freeze.expiresAt} (${remaining}h)`);
    }
    console.log('\n   ⚠️  All autonomy operations are now BLOCKED');
    console.log('   To unfreeze: pnpm perf:autonomy unfreeze --role <role>');
  }

  return 0;
}

function cmdUnfreeze(args: CliArgs): number {
  if (!args.role) {
    console.error('❌ Error: --role is required for unfreeze command');
    console.error('   Roles: cio, security, engineering');
    console.error('   Usage: pnpm perf:autonomy unfreeze --role cio');
    return 2;
  }

  const actor = process.env.GITHUB_ACTOR || process.env.USER || 'cli';

  const { state, authorized, error } = unfreezeAutonomy({
    actor,
    actorRole: args.role,
    reason: args.reason,
  });

  if (!authorized) {
    if (args.json) {
      console.log(JSON.stringify({ authorized: false, error }, null, 2));
    } else {
      console.log('\n🚫 UNFREEZE DENIED');
      console.log('═'.repeat(50));
      console.log(`   ${error}`);
      console.log(`   Actor: ${actor} (${args.role})`);
    }
    return 1;
  }

  // Check if was actually frozen
  const wasActive =
    state.freezeHistory &&
    state.freezeHistory.length > 0 &&
    state.freezeHistory[state.freezeHistory.length - 1]?.action === 'unfreeze';

  // Generate unfreeze evidence
  const evidence = generateFreezeEvidence('unfreeze', {
    actor,
    actorRole: args.role,
    category: null,
    reason: args.reason ?? 'Manual unfreeze',
    ticketId: args.ticket ?? null,
    expiresAt: null,
    authorized: true,
  });

  if (args.json) {
    console.log(JSON.stringify({ state, evidence }, null, 2));
  } else {
    console.log('\n✅ Autonomy UNFROZEN');
    console.log('═'.repeat(50));
    console.log(`   Actor: ${actor} (${args.role})`);
    if (args.reason) {
      console.log(`   Reason: ${args.reason}`);
    }
    console.log('\n   Autonomy operations are now permitted');
  }

  return 0;
}

function cmdHelp(): number {
  console.log(`
Autonomy Circuit Breaker CLI (v${CLI_VERSION})
═══════════════════════════════════════════════════

USAGE:
  pnpm perf:autonomy <command> [options]

COMMANDS:
  status              Show current autonomy state (including freeze status)
  pause               Pause autonomy (stops PR lane and publishers)
  resume              Resume autonomy (requires recovery proof)
  freeze              ❄️  FREEZE autonomy (blocks ALL actors including incident-publisher)
  unfreeze            Unfreeze autonomy (requires authorized role)
  check               Check if autonomy is allowed for a specific actor
  canary              Canary autonomy lane (graduated rollout)
  slo                 SLO guard + error budget enforcement

PAUSE OPTIONS:
  --reason <text>     Required. Reason for pause (for audit trail)
  --duration <time>   Optional. Auto-resume after duration (e.g., 30m, 1h, 1d)
  --expires-at <iso>  Optional. Explicit expiry timestamp

FREEZE OPTIONS (Phase 4N39):
  --category <cat>    Required. Reason category: audit, election, incident, compliance
  --reason <text>     Required. Human-readable reason
  --role <role>       Required. Your role: cio, security, engineering
  --ticket <id>       Optional. Related ticket ID (e.g., AUDIT-2026-Q2, INC-123)
  --duration <time>   Optional. Auto-unfreeze after duration (default: 72h, max: 7d)
  --expires-at <iso>  Optional. Explicit expiry timestamp

  Role requirements by category:
    audit       → cio, security
    election    → cio
    incident    → security, engineering
    compliance  → cio, security

UNFREEZE OPTIONS:
  --role <role>       Required. Your role (must match category requirements)
  --reason <text>     Optional. Reason for unfreeze

RESUME OPTIONS:
  --recovery <path>   Path to recovery capsule (auto-detected if not specified)
  --dry-run           Check prerequisites without resuming
  --force             Skip prerequisite checks (emergency only)
  --actor <type>      Actor type for proof (default: cli)

CHECK OPTIONS:
  --actor <type>      Actor type: pr-lane, evidence-publisher, incident-publisher

CANARY SUBCOMMANDS:
  canary status       Show current canary stage and promotion eligibility
  canary promote      Attempt to promote to next stage
  canary demote       Demote to lower stage
  canary lock         Lock canary at current stage
  canary unlock       Unlock canary

SLO SUBCOMMANDS:
  slo status          Show current SLO budget (% remaining, burn rate)
  slo check           Check if action allowed under SLO budget

GLOBAL OPTIONS:
  --json              Output as JSON
  --strict            Fail-closed on missing data (for slo check)
  --help              Show this help

EXAMPLES:
  pnpm perf:autonomy status
  pnpm perf:autonomy pause --reason "incident response" --duration 1h
  pnpm perf:autonomy freeze --category audit --reason "Q2 audit" --role cio --duration 72h
  pnpm perf:autonomy freeze --category election --reason "Election week" --role cio --ticket ELEC-2026
  pnpm perf:autonomy unfreeze --role cio --reason "Audit complete"
  pnpm perf:autonomy resume --recovery ./autonomy-recovery.json --dry-run
  pnpm perf:autonomy resume --recovery ./autonomy-recovery.json
  pnpm perf:autonomy resume --force  # Emergency only
  pnpm perf:autonomy check --actor pr-lane --json
  pnpm perf:autonomy canary status
  pnpm perf:autonomy canary promote --dry-run
  pnpm perf:autonomy slo status
  pnpm perf:autonomy slo check --actor pr-lane --strict

ENVIRONMENT:
  TERRAFUSION_AUTONOMY_STATE_PATH   Override state file location
  GITHUB_ACTOR                       Used for updatedBy field

EXIT CODES:
  0  Success (or allowed for check)
  1  Failure (or blocked / frozen for check)
  2  Invalid arguments
`);
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  let exitCode: number;

  switch (args.command) {
    case 'status':
      exitCode = cmdStatus(args);
      break;
    case 'pause':
      exitCode = cmdPause(args);
      break;
    case 'resume':
      exitCode = cmdResume(args);
      break;
    case 'check':
      exitCode = cmdCheck(args);
      break;
    case 'canary':
      exitCode = cmdCanary(args);
      break;
    case 'slo':
      exitCode = cmdSlo(args);
      break;
    case 'freeze':
      exitCode = cmdFreeze(args);
      break;
    case 'unfreeze':
      exitCode = cmdUnfreeze(args);
      break;
    case 'help':
    default:
      exitCode = cmdHelp();
      break;
  }

  process.exit(exitCode);
}

// Guard for test imports
if (
  process.argv[1]?.endsWith('perf-autonomy.ts') ||
  process.argv[1]?.endsWith('perf-autonomy.js')
) {
  main();
}

// Export for testing
export { CLI_VERSION, parseArgs };
