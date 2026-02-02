#!/usr/bin/env node
/**
 * Fleet Enrollment CLI
 * ====================
 * Batch county enrollment for operator-scale rollout.
 *
 * Usage:
 *   npx tsx bin/fleet-enroll.mjs --input counties.json --out ./dist/fleet
 *   pnpm run fleet:enroll -- --input counties.json --out ./dist/fleet --verify
 *
 * Exit Codes:
 *   0 = All counties enrolled and verified successfully
 *   1 = Some counties failed enrollment or verification
 *   2 = Critical failure (missing inputs, write errors)
 */

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
    enrollFleet,
    FLEET_INDEX_SCHEMA,
    FLEET_INDEX_VERSION,
    loadCountiesFromFile,
} from '../src/fleet-enrollment.ts';
import {
    enforceMutationBoundary,
    resolveAuditLoggerFromEnv,
} from '../src/security/rbac/cli-guard.js';

// Strip leading '--' token that pnpm injects
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values } = parseArgs({
  args,
  options: {
    input: { type: 'string', short: 'i', description: 'Path to counties JSON file' },
    out: { type: 'string', short: 'o', default: './dist/fleet' },
    verify: { type: 'boolean', default: true },
    'no-verify': { type: 'boolean', default: false },
    'continue-on-error': { type: 'boolean', default: true },
    'fail-fast': { type: 'boolean', default: false },
    profile: { type: 'string', short: 'p', default: 'county' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Fleet Enrollment CLI
====================
Batch county enrollment for operator-scale rollout.

Usage: npx tsx bin/fleet-enroll.mjs [options]

Options:
  -i, --input <file>       Path to counties JSON file (required)
  -o, --out <dir>          Output directory (default: ./dist/fleet)
  --verify                 Verify each packet after generation (default: true)
  --no-verify              Skip verification
  --continue-on-error      Continue processing on county failures (default)
  --fail-fast              Stop on first county failure
  -p, --profile <name>     Default profile for all counties (default: county)
  --json                   Output as JSON
  -h, --help               Show this help

Counties JSON Format:
  {
    "counties": [
      {
        "id": "benton-wa",
        "name": "Benton County",
        "jurisdiction": "WA",
        "profile": "county",
        "notes": "Optional notes"
      }
    ]
  }

Output:
  fleet-index.json         Fleet summary with all county statuses
  <county-id>/             Per-county accreditation packet directory

Schema: ${FLEET_INDEX_SCHEMA}
Version: ${FLEET_INDEX_VERSION}

Examples:
  npx tsx bin/fleet-enroll.mjs --input counties.json --out ./dist/fleet
  npx tsx bin/fleet-enroll.mjs -i wa-counties.json -o ./dist/wa-fleet --verify
  npx tsx bin/fleet-enroll.mjs -i counties.json --fail-fast --json
`);
  process.exit(0);
}

// Validate input
if (!values.input) {
  console.error('Error: --input <file> is required');
  console.error('Run with --help for usage information');
  process.exit(2);
}

// Load counties
let counties;
try {
  counties = loadCountiesFromFile(resolve(values.input));
} catch (err) {
  console.error(`Error loading counties file: ${(err as Error).message}`);
  process.exit(2);
}

const rbacResult = enforceMutationBoundary(
  'autonomy.fleet_enroll.write',
  values.profile,
  resolveAuditLoggerFromEnv()
);

if (!rbacResult.allowed) {
  console.error(`RBAC denied: ${rbacResult.decision.reasonCodes.join(', ')}`);
  process.exit(1);
}

// Determine options
const verify = values['no-verify'] ? false : values.verify ?? true;
const continueOnError = values['fail-fast'] ? false : values['continue-on-error'] ?? true;

// Run enrollment
const result = enrollFleet({
  counties,
  outDir: resolve(values.out ?? './dist/fleet'),
  verify,
  continueOnError,
  defaultProfile: values.profile ?? 'county',
});

// Output
if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`
🏛️ Fleet Enrollment Complete
=============================
Generated At: ${result.generatedAt}
Duration:     ${result.durationMs}ms

Summary:
  Total Counties:  ${result.totalCounties}
  Succeeded:       ${result.succeeded}
  Failed:          ${result.failed}
  Verified:        ${result.verified}
  Verify Failed:   ${result.verifyFailed}

Counties:
${result.counties
  .map(
    c =>
      `  ${c.ok ? '✅' : '❌'} ${c.id.padEnd(20)} ${c.jurisdiction.padEnd(4)} ${
        c.verifyResult === 'passed' ? '✓ verified' : c.verifyResult === 'failed' ? '✗ verify failed' : 'skipped'
      }${c.errorMessage ? ` [${c.errorCode}]` : ''}`
  )
  .join('\n')}

Fleet Index:    ${values.out ?? './dist/fleet'}/fleet-index.json

Result: ${result.ok ? '✅ Fleet Enrollment Successful' : '❌ Fleet Enrollment Has Failures'}
`);
}

// Exit code based on result
if (result.totalCounties === 0) {
  process.exit(2);
}

if (!result.ok) {
  process.exit(1);
}

process.exit(0);
