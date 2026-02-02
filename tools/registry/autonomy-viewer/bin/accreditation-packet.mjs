#!/usr/bin/env node
/**
 * Accreditation Packet CLI
 * ========================
 * One-command accreditation evidence bundle generator.
 *
 * Produces:
 * - County Kit execution (bootstrap → drills → ops-status → slo-gate)
 * - Manifest with SHA256 hashes
 * - Compliance summary
 * - Ready-to-file accreditation packet
 *
 * Usage:
 *   npx tsx bin/accreditation-packet.mjs --profile benton-county --out ./dist/accreditation
 *   pnpm run accreditation -- --profile county --out ./dist/accred --json
 *
 * Exit Codes:
 *   0 = All checks passed
 *   1 = Some checks failed or warned
 *   2 = Critical failure (missing inputs, write errors)
 */

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
    ACCREDITATION_PACKET_SCHEMA,
    ACCREDITATION_PACKET_VERSION,
    generateAccreditationPacket,
} from '../src/accreditation-packet.ts';
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
    profile: { type: 'string', short: 'p', default: 'county' },
    out: { type: 'string', short: 'o', default: './dist/accreditation' },
    county: { type: 'string', description: 'County name for metadata' },
    jurisdiction: { type: 'string', short: 'j', description: 'Jurisdiction (e.g., WA, OR)' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Accreditation Packet CLI
========================
One-command accreditation evidence bundle generator.

Usage: npx tsx bin/accreditation-packet.mjs [options]

Options:
  -p, --profile <name>      Profile to use (default: county)
  -o, --out <dir>           Output directory (default: ./dist/accreditation)
  --county <name>           County name for metadata
  -j, --jurisdiction <code> Jurisdiction code (e.g., WA, OR)
  --json                    Output as JSON
  -h, --help                Show this help

Output:
  accreditation-packet.json   Main evidence packet
  manifest.json               File hashes (SHA256)
  county-kit-summary.json     Kit execution summary
  steps/                      Individual step outputs

Schema: ${ACCREDITATION_PACKET_SCHEMA}
Version: ${ACCREDITATION_PACKET_VERSION}

Examples:
  npx tsx bin/accreditation-packet.mjs --profile benton-county --out ./dist/accred
  npx tsx bin/accreditation-packet.mjs --profile county --county "Benton County" --jurisdiction WA
`);
  process.exit(0);
}

const rbacResult = enforceMutationBoundary(
  'autonomy.accreditation.packet.write',
  values.profile,
  resolveAuditLoggerFromEnv()
);

if (!rbacResult.allowed) {
  console.error(`RBAC denied: ${rbacResult.decision.reasonCodes.join(', ')}`);
  process.exit(1);
}

// Build options
const outDir = resolve(values.out ?? './dist/accreditation');
const accreditationInfo =
  values.county || values.jurisdiction
    ? {
        countyName: values.county,
        jurisdiction: values.jurisdiction,
        preparedBy: 'TerraFusion Automated Pipeline',
        preparedFor: 'County CIO Review',
      }
    : undefined;

// Generate packet
const result = generateAccreditationPacket({
  profile: values.profile ?? 'county',
  outDir,
  accreditationInfo,
});

// Output
if (values.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`
🏛️ Accreditation Packet Generated
==================================
Profile:      ${result.profile}
Output:       ${result.outDir}
Generated:    ${result.generatedAt}

Evidence Bundle:
  📄 ${result.evidence.kitSummary}
  📄 ${result.evidence.manifest}
${result.evidence.steps.map(s => `  📄 ${s}`).join('\n')}

Manifest:
  Files:        ${result.manifest.fileCount}
  Total Size:   ${formatBytes(result.manifest.totalBytes)}

Compliance Summary:
  Overall:      ${result.complianceSummary?.overallStatus ?? 'unknown'}
  SLO Gate:     ${result.complianceSummary?.sloGateStatus ?? 'unknown'}
  Drills:       ${result.complianceSummary?.drillsPassed ?? 0}/${result.complianceSummary?.drillsCompleted ?? 0} passed
  Bootstrap:    ${result.complianceSummary?.bootstrapValid ? '✅ Valid' : '❌ Invalid'}

${
  result.accreditationInfo
    ? `Accreditation Info:
  County:       ${result.accreditationInfo.countyName ?? 'N/A'}
  Jurisdiction: ${result.accreditationInfo.jurisdiction ?? 'N/A'}
  Prepared By:  ${result.accreditationInfo.preparedBy ?? 'N/A'}
  Prepared For: ${result.accreditationInfo.preparedFor ?? 'N/A'}
`
    : ''
}
Result: ${result.ok ? '✅ Accreditation Packet Complete' : '❌ Accreditation Packet Failed'}
${result.errorCode ? `Error: [${result.errorCode}] ${result.errorMessage}` : ''}
`);
}

// Exit code based on result
if (!result.ok) {
  if (result.errorCode?.includes('MISSING')) {
    process.exit(2);
  }
  process.exit(1);
}

if (result.complianceSummary?.sloGateStatus === 'warn') {
  process.exit(1);
}

process.exit(0);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
