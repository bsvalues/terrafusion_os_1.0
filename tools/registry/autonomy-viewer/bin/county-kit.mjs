#!/usr/bin/env node
/**
 * County Kit CLI
 * ==============
 * One-command county deployment package.
 *
 * Runs: bootstrap → drills → ops-status → slo-gate
 *
 * Usage:
 *   npx tsx bin/county-kit.mjs --profile benton-county --out ./dist/kit
 *   pnpm run county-kit -- --profile county --out ./dist/kit --json
 *
 * Exit Codes:
 *   0 = All steps passed
 *   1 = One or more steps failed or warned
 *   2 = Critical failure (missing inputs, write errors)
 */

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { COUNTY_KIT_SCHEMA, COUNTY_KIT_VERSION, runCountyKit } from '../src/county-kit.ts';

// Strip leading '--' token that pnpm injects
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values } = parseArgs({
  args,
  options: {
    profile: { type: 'string', short: 'p', default: 'county' },
    out: { type: 'string', short: 'o', default: './dist/county-kit' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
County Kit CLI
==============
One-command county deployment package.

Usage: npx tsx bin/county-kit.mjs [options]

Options:
  -p, --profile <name>  Profile to bootstrap (default: county)
  -o, --out <dir>       Output directory (default: ./dist/county-kit)
  --json                Output as JSON
  -h, --help            Show this help

Runs:
  1. bootstrap   → validate profile and prerequisites
  2. drills      → run exercise sequence
  3. hints       → generate next-step guidance
  4. ops-status  → compute operational snapshot
  5. slo-gate    → enforce SLO budgets

Schema: ${COUNTY_KIT_SCHEMA}
Version: ${COUNTY_KIT_VERSION}

Examples:
  npx tsx bin/county-kit.mjs --profile benton-county --out ./dist/kit
  npx tsx bin/county-kit.mjs --profile county --json
`);
  process.exit(0);
}

// Run the kit
const outDir = resolve(values.out ?? './dist/county-kit');
const result = runCountyKit({
  profile: values.profile ?? 'county',
  outDir,
});

// Output
if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`
🏛️ County Kit Results
======================
Profile:    ${result.profile}
Output:     ${result.outDir}
Timestamp:  ${result.timestamp}

Steps:
${result.steps.map(s => `  ${s.ok ? '✅' : '❌'} ${s.name.padEnd(12)} ${s.durationMs}ms`).join('\n')}

Summary:
  Steps Run:    ${result.summary.stepsRun}
  Passed:       ${result.summary.stepsPassed}
  Failed:       ${result.summary.stepsFailed}
  Duration:     ${result.summary.totalDurationMs}ms
  SLO Gate:     ${result.summary.sloGateStatus ?? 'N/A'}

Result: ${result.ok ? '✅ Kit Complete' : '❌ Kit Failed'}
${result.errorCode ? `Error: [${result.errorCode}] ${result.errorMessage}` : ''}

Artifacts:
  ${result.outDir}/county-kit-summary.json
  ${result.outDir}/steps/bootstrap.json
  ${result.outDir}/steps/drills.json
  ${result.outDir}/steps/hints.json
  ${result.outDir}/steps/ops-status.json
  ${result.outDir}/steps/slo-gate.json
`);
}

// Exit code based on result
if (!result.ok) {
  if (result.errorCode?.includes('MISSING') || result.errorCode?.includes('WRITE')) {
    process.exit(2);
  }
  process.exit(1);
}

if (result.summary.sloGateStatus === 'warn') {
  process.exit(1);
}

process.exit(0);
