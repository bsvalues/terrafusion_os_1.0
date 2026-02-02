#!/usr/bin/env node
/**
 * tf-closeout-proof – FISMA Closeout Proof Generator
 *
 * Usage:
 *   npx tsx bin/closeout-proof.mjs --project terrafusion-os --version 1.5.1 --out ./dist
 *
 * Options:
 *   --project, -p      Project identifier (required)
 *   --org, -O          Organization name (required)
 *   --version, -V      Project version (required)
 *   --release, -r      Release ref (tag or SHA) (required)
 *   --fisma            FISMA system identifier
 *   --evidence         Path to evidence index JSON
 *   --fleet            Path to fleet index JSON  
 *   --accreditation    Path to accreditation packet
 *   --slo              Path to SLO gate results
 *   --attestation      Add attestation (format: type:status:attestedBy)
 *   --out, -o          Output directory (default: ./closeout)
 *   --verbose, -v      Verbose output
 *   --help, -h         Show help
 *
 * @module bin/closeout-proof
 */

import * as path from 'node:path';
import { parseArgs } from 'node:util';

import { generateCloseoutProof, type CloseoutAttestation } from '../src/closeout-proof.js';

const { values } = parseArgs({
  options: {
    project: { type: 'string', short: 'p' },
    org: { type: 'string', short: 'O' },
    version: { type: 'string', short: 'V' },
    release: { type: 'string', short: 'r' },
    fisma: { type: 'string' },
    evidence: { type: 'string' },
    fleet: { type: 'string' },
    accreditation: { type: 'string' },
    slo: { type: 'string' },
    attestation: { type: 'string', multiple: true },
    out: { type: 'string', short: 'o', default: './closeout' },
    verbose: { type: 'boolean', short: 'v', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
tf-closeout-proof – FISMA Closeout Proof Generator

Usage:
  npx tsx bin/closeout-proof.mjs --project terrafusion-os --org "TerraFusion" --version 1.5.1 --release v1.5.1

Options:
  --project, -p      Project identifier (required)
  --org, -O          Organization name (required)
  --version, -V      Project version (required)
  --release, -r      Release ref (tag or SHA) (required)
  --fisma            FISMA system identifier
  --evidence         Path to evidence index JSON
  --fleet            Path to fleet index JSON
  --accreditation    Path to accreditation packet
  --slo              Path to SLO gate results
  --attestation      Add attestation, can specify multiple times
                     Format: type:status:attestedBy[:details]
                     Status: passed, failed, waived
                     Example: --attestation code-review:passed:"John Doe"
  --out, -o          Output directory (default: ./closeout)
  --verbose, -v      Verbose output
  --help, -h         Show this help

Examples:
  # Basic proof
  npx tsx bin/closeout-proof.mjs \\
    --project terrafusion-os \\
    --org "TerraFusion Platform" \\
    --version 1.5.1 \\
    --release v1.5.1

  # With evidence and attestations
  npx tsx bin/closeout-proof.mjs \\
    --project terrafusion-os \\
    --org "TerraFusion Platform" \\
    --version 1.5.1 \\
    --release v1.5.1 \\
    --evidence ./dist/autonomy-evidence-index.json \\
    --attestation "security-scan:passed:Snyk CI" \\
    --attestation "code-review:passed:PR#123"

Output:
  Creates closeout-proof.json and closeout-proof.html in output directory.
`);
  process.exit(0);
}

// Validate required inputs
if (!values.project) {
  console.error('Error: --project is required');
  process.exit(1);
}

if (!values.org) {
  console.error('Error: --org is required');
  process.exit(1);
}

if (!values.version) {
  console.error('Error: --version is required');
  process.exit(1);
}

if (!values.release) {
  console.error('Error: --release is required');
  process.exit(1);
}

// Parse attestations
const attestations: CloseoutAttestation[] = [];

if (values.attestation) {
  for (const spec of values.attestation) {
    const parts = spec.split(':');
    if (parts.length < 3) {
      console.error(`Error: Invalid attestation format: ${spec}`);
      console.error('Expected: type:status:attestedBy[:details]');
      process.exit(1);
    }

    const [type, statusStr, attestedBy, details] = parts;
    const status = statusStr.toLowerCase();

    if (!['passed', 'failed', 'waived'].includes(status)) {
      console.error(`Error: Invalid attestation status: ${status}`);
      console.error('Valid statuses: passed, failed, waived');
      process.exit(1);
    }

    attestations.push({
      type,
      status: status as 'passed' | 'failed' | 'waived',
      attestedBy,
      attestedAt: new Date().toISOString(),
      details: details || undefined,
    });
  }
}

// Run generator
async function main() {
  if (values.verbose) {
    console.log('='.repeat(60));
    console.log('TerraFusion Closeout Proof Generator');
    console.log('='.repeat(60));
  }

  const result = await generateCloseoutProof({
    projectId: values.project,
    organization: values.org,
    fismaSystemId: values.fisma,
    version: values.version,
    releaseRef: values.release,
    evidenceIndexPath: values.evidence,
    fleetIndexPath: values.fleet,
    accreditationPacketPath: values.accreditation,
    sloGatePath: values.slo,
    attestations,
    outDir: path.resolve(values.out),
    verbose: values.verbose,
  });

  if (!result.success) {
    console.error(`\nError: ${result.error?.code} - ${result.error?.message}`);
    process.exit(1);
  }

  console.log('\n✅ Closeout proof generated');
  console.log(`   JSON: ${result.outputPath}`);
  console.log(`   HTML: ${result.htmlPath}`);
  console.log(`   Integrity: ${result.proof.integrity.proofSha256.slice(0, 16)}...`);

  if (result.proof.recommendations.length > 0) {
    console.log('\nRecommendations:');
    for (const rec of result.proof.recommendations) {
      console.log(`   • ${rec}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
