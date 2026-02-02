#!/usr/bin/env node
/**
 * TerraFusion Drills CLI
 * =======================
 *
 * Automated drill execution with structured results.
 *
 * Usage:
 *   npx tsx bin/drills.mjs --profile county
 *   pnpm run drills -- --profile county --fail-fast
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runDrills, toLastRunSummary } from '../src/drill-runner.js';
import {
    enforceMutationBoundary,
    resolveAuditLoggerFromEnv,
} from '../src/security/rbac/cli-guard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = resolve(__dirname, '..');

// Strip leading '--' token that pnpm injects when using 'pnpm run script -- args'
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values, positionals } = parseArgs({
  args,
  options: {
    profile: { type: 'string', short: 'p', default: 'county' },
    exercise: { type: 'string', short: 'e', multiple: true },
    'fail-fast': { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    json: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
TerraFusion Drills CLI
======================

Usage: npx tsx bin/drills.mjs [options]

Options:
  -p, --profile <name>    Profile to run drills for (default: county)
  -e, --exercise <name>   Specific exercise(s) to run (can be repeated)
  --fail-fast             Stop on first failure
  --write                 Write artifact files (logs, telemetry)
  --json                  Output as JSON
  -h, --help              Show this help

Examples:
  npx tsx bin/drills.mjs --profile county
  npx tsx bin/drills.mjs --profile county --fail-fast
  npx tsx bin/drills.mjs -e COUNTY_PILOT -e INCIDENT_DRILL
`);
  process.exit(0);
}

const rbacResult = enforceMutationBoundary(
  'autonomy.drills.write',
  values.profile,
  resolveAuditLoggerFromEnv()
);

if (!rbacResult.allowed) {
  console.error(`RBAC denied: ${rbacResult.decision.reasonCodes.join(', ')}`);
  process.exit(1);
}

const result = runDrills({
  profile: values.profile,
  exercises: values.exercise,
  failFast: values['fail-fast'],
  writeArtifacts: values.write,
  baseDir,
});

// Save last run summary for hints
const stateDir = join(baseDir, '.state');
if (!existsSync(stateDir)) {
  mkdirSync(stateDir, { recursive: true });
}
const lastRunPath = join(stateDir, 'last-run.json');
writeFileSync(lastRunPath, JSON.stringify(toLastRunSummary(result), null, 2));

if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const statusIcon = {
    passed: '✅',
    failed: '❌',
    partial: '⚠️',
  };

  console.log(`
🎯 TerraFusion Drill Runner
===========================
Drill ID:    ${result.drillId}
Profile:     ${result.profile}
Overall:     ${statusIcon[result.overall]} ${result.overall.toUpperCase()}
Duration:    ${result.duration_ms}ms
Fail Fast:   ${result.failFast ? 'Yes' : 'No'}
Timestamp:   ${result.timestamp}

Exercises:
${result.exercisesRun
  .map(e => {
    const icon = e.status === 'passed' ? '✅' : e.status === 'failed' ? '❌' : '⏭️';
    let line = `  ${icon} ${e.name} (${e.duration_ms}ms)`;
    if (e.error) line += `\n     Error: ${e.error}`;
    return line;
  })
  .join('\n')}

Artifacts:
${result.artifacts.map(a => `  • [${a.type}] ${a.path}`).join('\n')}

Last run saved to: ${lastRunPath}
`);
}

process.exit(result.overall === 'passed' ? 0 : 1);
