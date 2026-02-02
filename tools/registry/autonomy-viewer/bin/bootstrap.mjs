#!/usr/bin/env node
/**
 * TerraFusion Bootstrap CLI
 * ==========================
 *
 * One-command county bootstrap with strict profile validation.
 *
 * Usage:
 *   npx tsx bin/bootstrap.mjs --profile county
 *   pnpm run bootstrap -- --profile county
 */

import { parseArgs } from 'node:util';
import { bootstrap } from '../src/bootstrap.js';

// Strip leading '--' token that pnpm injects when using 'pnpm run script -- args'
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values } = parseArgs({
  args,
  options: {
    profile: { type: 'string', short: 'p', default: 'county' },
    'create-dirs': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
    json: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
TerraFusion Bootstrap CLI
=========================

Usage: npx tsx bin/bootstrap.mjs [options]

Options:
  -p, --profile <name>  Profile to bootstrap (default: county)
  --create-dirs         Create output directories
  --json                Output as JSON
  -h, --help            Show this help

Examples:
  npx tsx bin/bootstrap.mjs --profile county
  npx tsx bin/bootstrap.mjs --profile state --create-dirs
`);
  process.exit(0);
}

const result = bootstrap(values.profile, {
  createDirs: values['create-dirs'],
});

if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`
🏛️ TerraFusion Bootstrap
========================
Profile:     ${result.profile}
Path:        ${result.profilePath}
Validation:  ${result.validationPassed ? '✅ Passed' : '❌ Failed'}
Output Dir:  ${result.outputDir ?? 'N/A'}
Timestamp:   ${result.timestamp}

Prerequisites Checked:
${result.prerequisitesChecked.map(c => `  • ${c}`).join('\n')}
`);

  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  ❌ [${err.code}] ${err.message}`);
      if (err.field) console.log(`     Field: ${err.field}`);
      if (err.expected) console.log(`     Expected: ${err.expected}`);
      if (err.actual) console.log(`     Actual: ${err.actual}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warn of result.warnings) {
      console.log(`  ⚠️ ${warn}`);
    }
  }

  console.log(`\nResult: ${result.ok ? '✅ Bootstrap ready' : '❌ Bootstrap failed'}`);
}

process.exit(result.ok ? 0 : 1);
