#!/usr/bin/env node
/**
 * Accreditation Packet Verify CLI
 * ================================
 * Verifies the integrity of accreditation packets.
 *
 * Usage:
 *   pnpm run accreditation:verify -- --dir ./dist/accreditation
 *   pnpm run accreditation:verify -- --dir ./dist/accreditation --json
 *   pnpm run accreditation:verify -- --dir ./dist/accreditation --verbose
 *
 * Exit Codes:
 *   0 = Verification passed
 *   1 = Verification failed
 */

import { resolve } from 'node:path';
import { runVerifyCLI } from '../src/accreditation-verify.js';

// Parse arguments
const args = process.argv.slice(2);
let packetDir = '';
let verbose = false;
let json = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dir' || arg === '-d') {
    packetDir = args[++i] || '';
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  } else if (arg === '--json' || arg === '-j') {
    json = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Accreditation Packet Verify CLI

Usage:
  pnpm run accreditation:verify -- --dir <path> [options]

Options:
  --dir, -d <path>   Path to accreditation packet directory (required)
  --verbose, -v      Show detailed hash comparison for mismatches
  --json, -j         Output result as JSON
  --help, -h         Show this help

Examples:
  pnpm run accreditation:verify -- --dir ./dist/accreditation
  pnpm run accreditation:verify -- --dir ./dist/accreditation --json
  pnpm run accreditation:verify -- --dir ./dist/accreditation --verbose
`);
    process.exit(0);
  }
}

if (!packetDir) {
  console.error('Error: --dir is required');
  console.error('Run with --help for usage information');
  process.exit(1);
}

const absolutePath = resolve(process.cwd(), packetDir);
const exitCode = runVerifyCLI({
  packetDir: absolutePath,
  verbose,
  json,
});

process.exit(exitCode);
