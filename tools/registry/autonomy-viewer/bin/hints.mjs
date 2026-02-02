#!/usr/bin/env node
/**
 * TerraFusion Hints CLI
 * ======================
 *
 * Telemetry-backed next-step hints.
 *
 * Usage:
 *   npx tsx bin/hints.mjs
 *   pnpm run hints
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { formatHints, generateHints } from '../src/next-step-hints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = resolve(__dirname, '..');

// Strip leading '--' token that pnpm injects when using 'pnpm run script -- args'
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values } = parseArgs({
  args,
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    json: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
TerraFusion Hints CLI
=====================

Usage: npx tsx bin/hints.mjs [options]

Options:
  --json       Output as JSON
  -h, --help   Show this help

Examples:
  npx tsx bin/hints.mjs
  npx tsx bin/hints.mjs --json

Prerequisites:
  Run 'pnpm run drills' first to generate a last-run context.
`);
  process.exit(0);
}

// Load last run summary
const lastRunPath = join(baseDir, '.state', 'last-run.json');
let lastRun = null;

if (existsSync(lastRunPath)) {
  try {
    lastRun = JSON.parse(readFileSync(lastRunPath, 'utf-8'));
  } catch (e) {
    console.error(`⚠️ Failed to read last run summary: ${e.message}`);
  }
}

const result = generateHints(lastRun);

if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatHints(result));

  if (!result.ok) {
    console.log('Status: ❌ Blockers present - resolve before continuing\n');
  } else {
    console.log('Status: ✅ Ready to proceed\n');
  }
}

process.exit(result.ok ? 0 : 1);
