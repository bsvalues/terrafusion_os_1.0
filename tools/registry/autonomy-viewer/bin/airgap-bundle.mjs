#!/usr/bin/env node
/**
 * Air-Gap Bundle CLI
 * ==================
 * Generates a self-contained verification bundle for restricted environments.
 *
 * Usage:
 *   npx tsx bin/airgap-bundle.mjs --source ./dist/accreditation --out ./dist/airgap
 *   pnpm run airgap:bundle -- --source ./dist/county --out ./dist --name my-bundle
 *
 * Exit Codes:
 *   0 = Bundle generated successfully
 *   1 = Bundle generation failed
 *   2 = Critical failure (missing inputs)
 */

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  generateAirgapBundle,
  AIRGAP_BUNDLE_SCHEMA,
  AIRGAP_BUNDLE_VERSION,
} from '../src/airgap-bundle.ts';

// Strip leading '--' token that pnpm injects
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

const { values } = parseArgs({
  args,
  options: {
    source: { type: 'string', short: 's', description: 'Source accreditation packet directory' },
    out: { type: 'string', short: 'o', default: './dist' },
    name: { type: 'string', short: 'n', default: 'airgap-bundle' },
    'include-lock': { type: 'boolean', default: true },
    'no-lock': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Air-Gap Bundle CLI
==================
Generates a self-contained verification bundle for restricted environments.

Usage: npx tsx bin/airgap-bundle.mjs [options]

Options:
  -s, --source <dir>     Source accreditation packet directory (required)
  -o, --out <dir>        Output directory (default: ./dist)
  -n, --name <name>      Bundle name (default: airgap-bundle)
  --include-lock         Include reference lock file (default)
  --no-lock              Exclude reference lock file
  --json                 Output as JSON
  -h, --help             Show this help

Bundle Contents:
  artifacts/             Accreditation packet files
  checksums.sha256       SHA256 hashes for all files
  verify.sh              Verification script (Linux/macOS)
  verify.ps1             Verification script (Windows)
  README.txt             Usage instructions
  bundle-manifest.json   Bundle metadata

Schema: ${AIRGAP_BUNDLE_SCHEMA}
Version: ${AIRGAP_BUNDLE_VERSION}

Examples:
  npx tsx bin/airgap-bundle.mjs --source ./dist/accreditation --out ./dist/airgap
  npx tsx bin/airgap-bundle.mjs -s ./dist/benton-wa -o ./bundles -n benton-2026-01
`);
  process.exit(0);
}

// Validate input
if (!values.source) {
  console.error('Error: --source <dir> is required');
  console.error('Run with --help for usage information');
  process.exit(2);
}

// Determine options
const includeLock = values['no-lock'] ? false : values['include-lock'] ?? true;

// Generate bundle
const result = generateAirgapBundle({
  sourceDir: resolve(values.source),
  outDir: resolve(values.out ?? './dist'),
  bundleName: values.name ?? 'airgap-bundle',
  includeLock,
});

// Output
if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`
📦 Air-Gap Bundle Generated
============================
Generated At: ${result.generatedAt}
Bundle Name:  ${result.bundleName}

Source:       ${result.sourceDir}
Output:       ${result.outDir}

Files:        ${result.files.length}
Total Size:   ${formatBytes(result.totalBytes)}

Bundle Contents:
  📁 artifacts/           Packet files
  📄 checksums.sha256     Hash verification
  🐧 verify.sh            Linux/macOS script
  🪟 verify.ps1           Windows script
  📄 README.txt           Instructions
  📄 bundle-manifest.json Metadata

Verification:
  Linux/macOS: cd ${result.bundleName} && ./verify.sh
  Windows:     cd ${result.bundleName}; .\\verify.ps1

Result: ${result.ok ? '✅ Bundle Created Successfully' : '❌ Bundle Creation Failed'}
${result.errorCode ? `Error: [${result.errorCode}] ${result.errorMessage}` : ''}
`);
}

// Exit code based on result
if (!result.ok) {
  process.exit(1);
}

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
