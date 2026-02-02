#!/usr/bin/env node
/**
 * Phase 4N30 – Autonomy Health CLI
 * =================================
 *
 * Calculate and report autonomy health based on evidence records.
 *
 * Usage:
 *   pnpm perf:health --in <index-path> --out <health-path>
 *   pnpm perf:health --check (exit 1 if pause_required)
 *
 * Exit codes:
 *   0 = ok or warn
 *   1 = pause_recommended or pause_required (when --check)
 *   2 = invalid arguments
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    calculateHealth,
    DEFAULT_THRESHOLDS,
    DEFAULT_WINDOW,
    generateHealthSummary,
    loadEvidenceRecords,
    saveHealth,
    type AutonomyHealth,
    type HealthLevel,
} from './autonomy-health.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// CLI Version
// ─────────────────────────────────────────────────────────────────────────────

const CLI_VERSION = '4N30.1';

// ─────────────────────────────────────────────────────────────────────────────
// Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface CliArgs {
  command: 'calculate' | 'check' | 'help';
  inputPath?: string;
  outputPath?: string;
  maxRecords?: number;
  hours?: number;
  json?: boolean;
  verbose?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { command: 'calculate' };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--in' && argv[i + 1]) {
      args.inputPath = argv[++i];
    } else if (arg === '--out' && argv[i + 1]) {
      args.outputPath = argv[++i];
    } else if (arg === '--max-records' && argv[i + 1]) {
      args.maxRecords = parseInt(argv[++i], 10);
    } else if (arg === '--hours' && argv[i + 1]) {
      args.hours = parseInt(argv[++i], 10);
    } else if (arg === '--check') {
      args.command = 'check';
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      args.command = 'help';
      return args;
    }
  }

  return args;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function getLevelIcon(level: HealthLevel): string {
  switch (level) {
    case 'ok':
      return '✅';
    case 'warn':
      return '⚠️';
    case 'pause_recommended':
      return '🛑';
    case 'pause_required':
      return '🚨';
  }
}

function formatHealth(health: AutonomyHealth, verbose: boolean = false): void {
  const icon = getLevelIcon(health.decision.level);

  console.log(`\n${icon} Autonomy Health: ${health.decision.level.toUpperCase()}`);
  console.log('═'.repeat(50));

  console.log(`   Generated: ${health.generatedAt}`);
  console.log(`   Window: ${health.window.recordCount} records, last ${health.window.hours}h`);
  console.log(
    `   Totals: ${health.totals.ok} ok, ${health.totals.warn} warn, ${health.totals.failed} failed`
  );

  // Show failure breakdown
  const failures = Object.entries(health.failuresByCategory).filter(([, count]) => count > 0);
  if (failures.length > 0) {
    console.log('\n   Failures by category:');
    for (const [cat, count] of failures.sort((a, b) => b[1] - a[1])) {
      console.log(`     ${cat}: ${count}`);
    }
  }

  console.log(`\n   Decision: ${health.decision.level}`);
  if (health.decision.reasonCodes.length > 0) {
    console.log(`   Reasons: ${health.decision.reasonCodes.join(', ')}`);
  }

  if (health.suggestedPause) {
    console.log('\n   📋 Suggested Pause:');
    console.log(`     Reason: ${health.suggestedPause.reason}`);
    console.log(`     Duration: ${health.suggestedPause.durationMinutes} minutes`);
    console.log(
      `     Command: pnpm perf:autonomy pause --reason "${health.suggestedPause.reason}" --duration ${health.suggestedPause.durationMinutes}m`
    );
  }

  if (verbose) {
    console.log('\n   Window details:');
    console.log(`     From: ${health.window.fromRecordId || 'N/A'}`);
    console.log(`     To: ${health.window.toRecordId || 'N/A'}`);
    console.log(`     Start: ${health.window.windowStart}`);
    console.log(`     End: ${health.window.windowEnd}`);
  }

  console.log();
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────────────────────

function cmdCalculate(args: CliArgs): number {
  const inputPath =
    args.inputPath ?? path.resolve(__dirname, '..', 'dist', 'autonomy-evidence-index.json');
  const outputPath =
    args.outputPath ?? path.resolve(__dirname, '..', 'dist', 'autonomy-health.json');

  if (args.verbose) {
    console.log(`Loading evidence from: ${inputPath}`);
  }

  const records = loadEvidenceRecords(inputPath);

  if (args.verbose) {
    console.log(`Loaded ${records.length} evidence records`);
  }

  const health = calculateHealth(records, {
    window: {
      maxRecords: args.maxRecords ?? DEFAULT_WINDOW.maxRecords,
      hours: args.hours ?? DEFAULT_WINDOW.hours,
    },
  });

  // Save health result
  saveHealth(health, outputPath);

  if (args.json) {
    console.log(JSON.stringify(health, null, 2));
  } else {
    formatHealth(health, args.verbose);
    console.log(`   Output: ${outputPath}`);
  }

  // Return based on level
  if (health.decision.level === 'pause_required' || health.decision.level === 'pause_recommended') {
    return 1;
  }
  return 0;
}

function cmdCheck(args: CliArgs): number {
  const inputPath =
    args.inputPath ?? path.resolve(__dirname, '..', 'dist', 'autonomy-evidence-index.json');

  const records = loadEvidenceRecords(inputPath);
  const health = calculateHealth(records, {
    window: {
      maxRecords: args.maxRecords ?? DEFAULT_WINDOW.maxRecords,
      hours: args.hours ?? DEFAULT_WINDOW.hours,
    },
  });

  const summary = generateHealthSummary(health);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          allowed: health.decision.level === 'ok' || health.decision.level === 'warn',
          level: health.decision.level,
          summary,
        },
        null,
        2
      )
    );
  } else {
    const icon = getLevelIcon(health.decision.level);
    const allowed = health.decision.level === 'ok' || health.decision.level === 'warn';
    console.log(
      `${icon} Health check: ${health.decision.level.toUpperCase()} (${allowed ? 'ALLOWED' : 'BLOCKED'})`
    );

    if (!allowed && health.suggestedPause) {
      console.log(`   ${health.suggestedPause.reason}`);
    }
  }

  // Exit 1 if pause_required or pause_recommended
  if (health.decision.level === 'pause_required' || health.decision.level === 'pause_recommended') {
    return 1;
  }
  return 0;
}

function cmdHelp(): number {
  console.log(`
Autonomy Health CLI (v${CLI_VERSION})
═══════════════════════════════════════════════════

USAGE:
  pnpm perf:health [options]
  pnpm perf:health --check [options]

COMMANDS:
  (default)           Calculate health and save to file
  --check             Check health and exit 1 if pause recommended/required

OPTIONS:
  --in <path>         Input evidence index path
                      Default: dist/autonomy-evidence-index.json

  --out <path>        Output health path
                      Default: dist/autonomy-health.json

  --max-records <n>   Maximum records to consider (default: ${DEFAULT_WINDOW.maxRecords})
  --hours <n>         Hours to look back (default: ${DEFAULT_WINDOW.hours})
  --json              Output as JSON
  --verbose           Verbose output
  --help              Show this help

THRESHOLDS:
  warn:               >= ${DEFAULT_THRESHOLDS.warnFailures} failures
  pause_recommended:  >= ${DEFAULT_THRESHOLDS.pauseRecommendedFailures} failures OR critical category x${DEFAULT_THRESHOLDS.criticalThreshold}
  pause_required:     >= ${DEFAULT_THRESHOLDS.pauseRequiredFailures} failures OR 2+ combined critical

EXAMPLES:
  pnpm perf:health
  pnpm perf:health --in out/evidence-index.json --out out/health.json
  pnpm perf:health --check --json
  pnpm perf:health --max-records 50 --hours 48

EXIT CODES:
  0  ok or warn
  1  pause_recommended or pause_required
  2  invalid arguments
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
    case 'calculate':
      exitCode = cmdCalculate(args);
      break;
    case 'check':
      exitCode = cmdCheck(args);
      break;
    case 'help':
    default:
      exitCode = cmdHelp();
      break;
  }

  process.exit(exitCode);
}

// Guard for test imports
if (process.argv[1]?.endsWith('perf-health.ts') || process.argv[1]?.endsWith('perf-health.js')) {
  main();
}

// Export for testing
export { CLI_VERSION, parseArgs };

