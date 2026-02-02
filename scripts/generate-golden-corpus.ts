#!/usr/bin/env npx tsx
/**
 * Golden Corpus Generator
 * ========================
 *
 * Generates reference audit artifacts for RC releases.
 * These become the compatibility anchor for future versions.
 *
 * Usage: npx tsx scripts/generate-golden-corpus.ts --out dist/golden
 *
 * @version 1.0.0
 */

import { createHash, randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const RC_TAG = 'v1.5.0-rc.1';
const PROFILE = 'county';
const GENERATED_AT = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Generators
// ─────────────────────────────────────────────────────────────────────────────

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function generateLedgerHead(): object {
  return {
    $schema: 'terrafusion.autonomy.ledger-head.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    sequenceNumber: 0,
    headSha256: sha256(`ledger-genesis-${RC_TAG}`),
    previousSha256: null,
    entries: [
      {
        id: randomUUID(),
        timestamp: GENERATED_AT,
        action: 'GENESIS',
        payload: { rcTag: RC_TAG, profile: PROFILE },
        payloadSha256: sha256(`genesis-payload-${RC_TAG}`),
      },
    ],
    integrity: {
      chainValid: true,
      entriesCount: 1,
    },
  };
}

function generateRollupHead(): object {
  const month = GENERATED_AT.substring(0, 7); // YYYY-MM
  return {
    $schema: 'terrafusion.autonomy.rollup-head.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    month,
    rollupSha256: sha256(`rollup-${month}-${RC_TAG}`),
    previousRollupSha256: null,
    entriesCompacted: 0,
    bytesCompacted: 0,
    retentionTier: 'permanent',
  };
}

function generateKeyEpochSummary(): object {
  return {
    $schema: 'terrafusion.autonomy.key-epoch-summary.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    currentEpoch: 1,
    validFrom: GENERATED_AT,
    keyFingerprint: sha256(`signer-key-${RC_TAG}`).substring(0, 40),
    rotationHistory: [],
    signerIdentity: 'github-actions[bot]@github.com',
  };
}

function generateRevocationSummary(): object {
  return {
    $schema: 'terrafusion.autonomy.revocation-summary.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    revokedCount: 0,
    activeCount: 1,
    revocations: [],
  };
}

function generatePolicyProfile(): object {
  return {
    $schema: 'terrafusion.autonomy.policy-profile.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    profileType: PROFILE,
    name: 'Benton County Reference Profile',
    acl: {
      viewInternal: ['assessor', 'security'],
      viewPublic: ['*'],
      delete: { requiresApproval: true, minimumApprovers: 2 },
    },
    retention: {
      permanent: -1,
      standard: 2555,
      temporary: 365,
    },
    telemetrySinks: ['local'],
    sizeLimits: {
      maxCasefileMB: 100,
      maxArtifactMB: 50,
    },
  };
}

function generateVerificationReport(): object {
  return {
    $schema: 'terrafusion.autonomy.verification-report.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    reportId: randomUUID(),
    outcome: 'PASS',
    profile: PROFILE,
    checks: [
      { name: 'schema-compat', ok: true },
      { name: 'hash-integrity', ok: true },
      { name: 'triplet-parity', ok: true },
      { name: 'policy-compliance', ok: true },
    ],
    errors: [],
    summary: {
      totalChecks: 4,
      passed: 4,
      failed: 0,
    },
  };
}

function generateDRReconstitutionReport(): object {
  return {
    $schema: 'terrafusion.autonomy.dr-reconstitution-report.v1',
    version: '1.0.0',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    reportId: randomUUID(),
    outcome: 'SUCCESS',
    profile: PROFILE,
    drType: 'full',
    assets: {
      ledgerRestored: true,
      rollupRestored: true,
      casefilesRestored: 0,
      signaturesVerified: true,
    },
    timing: {
      startedAt: GENERATED_AT,
      completedAt: GENERATED_AT,
      durationMs: 0,
    },
    errors: [],
  };
}

function generateAuditPacketManifest(
  artifacts: Map<string, { sha256: string; bytes: number }>
): object {
  const artifactList = Array.from(artifacts.entries()).map(([name, info]) => ({
    name,
    sha256: info.sha256,
    bytes: info.bytes,
    signed: name.endsWith('.json'),
  }));

  return {
    $schema: 'terrafusion.autonomy.audit-packet.v1',
    version: '4N46.1',
    generatedAt: GENERATED_AT,
    rcTag: RC_TAG,
    profile: PROFILE,
    artifacts: artifactList,
    contracts: {
      determinism: 'structural',
      policyField: 'policySnapshot.signaturePolicy',
      tripletStatus: 'triplets.ok',
      missingFileError: 'HASH_MISMATCH',
    },
    repoIdentity: {
      ownerRepo: 'bsvalues/terrafusion_os_1.0',
      defaultBranch: 'main',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let outDir = 'dist/golden';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outDir = args[++i];
    }
  }

  // Create output directory
  fs.mkdirSync(outDir, { recursive: true });

  const artifacts = new Map<string, { sha256: string; bytes: number }>();

  // Generate each artifact
  const generators: Array<{ name: string; fn: () => object }> = [
    { name: 'ledger-head.json', fn: generateLedgerHead },
    { name: 'rollup-head.json', fn: generateRollupHead },
    { name: 'key-epoch-summary.json', fn: generateKeyEpochSummary },
    { name: 'revocation-summary.json', fn: generateRevocationSummary },
    { name: 'policy-profile.json', fn: generatePolicyProfile },
    { name: 'verification-report.json', fn: generateVerificationReport },
    { name: 'dr-reconstitution-report.json', fn: generateDRReconstitutionReport },
  ];

  console.log(`🏛️ TerraFusion OS Golden Corpus Generator`);
  console.log(`   RC Tag: ${RC_TAG}`);
  console.log(`   Profile: ${PROFILE}`);
  console.log(`   Output: ${outDir}`);
  console.log('');

  for (const { name, fn } of generators) {
    const data = fn();
    const content = JSON.stringify(data, null, 2);
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, content);

    const hash = sha256(content);
    const bytes = Buffer.byteLength(content);
    artifacts.set(name, { sha256: hash, bytes });

    console.log(`   ✅ ${name} (${bytes} bytes)`);
  }

  // Generate manifest
  const manifest = generateAuditPacketManifest(artifacts);
  const manifestContent = JSON.stringify(manifest, null, 2);
  const manifestPath = path.join(outDir, 'audit-packet-manifest.json');
  fs.writeFileSync(manifestPath, manifestContent);
  artifacts.set('audit-packet-manifest.json', {
    sha256: sha256(manifestContent),
    bytes: Buffer.byteLength(manifestContent),
  });
  console.log(`   ✅ audit-packet-manifest.json`);

  // Generate SHA256SUMS.txt
  const sha256Lines: string[] = [];
  for (const [name, info] of artifacts) {
    sha256Lines.push(`${info.sha256}  ${name}`);
  }
  const sha256Content = sha256Lines.join('\n') + '\n';
  fs.writeFileSync(path.join(outDir, 'SHA256SUMS.txt'), sha256Content);
  console.log(`   ✅ SHA256SUMS.txt`);

  console.log('');
  console.log(`🎯 Golden corpus generated successfully!`);
  console.log(`   Total artifacts: ${artifacts.size + 1}`);
  console.log('');
  console.log(`📤 To upload to release:`);
  console.log(`   gh release upload ${RC_TAG} ${outDir}/* --clobber`);
}

main().catch(err => {
  console.error('❌ Failed to generate golden corpus:', err);
  process.exit(1);
});
