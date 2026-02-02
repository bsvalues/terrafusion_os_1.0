/**
 * Phase 4N34 – Case File Export "One Artifact for the Auditor"
 * =============================================================
 *
 * Produces a courtroom-ready packet for any autonomy record/run.
 * Single sealed ZIP containing everything needed to audit and
 * reproduce verification offline.
 *
 * Usage:
 *   pnpm perf:casefile --record <recordId> --out ./dist
 *
 * Invariants:
 *   - Deterministic entry ordering (alphabetical by path)
 *   - Fixed mtimes (2024-01-01T00:00:00Z)
 *   - Fail-closed on missing required artifacts for tier
 *   - Path traversal rejected
 *   - Same inputs → identical ZIP hash
 */

import archiver from 'archiver';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransparencyAnchors } from './evidence-index.js';

/**
 * Simplified evidence index for casefile export.
 * Does not use the full EvidenceIndex type since we need a lightweight version.
 */
interface CasefileEvidenceIndex {
  records: Array<{
    runId: string;
    generatedAt: string;
    tier: 'ci' | 'merged' | 'incident';
    verify?: { ok: boolean };
    custody?: { ok?: boolean };
    signature?: { signed: boolean; verified?: { ok: boolean } };
    rekor?: { anchored: boolean };
    tpi?: { ok: boolean };
    breakGlass?: { activated: boolean };
    roleBinding?: { ok: boolean };
    outcome?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const CASEFILE_SCHEMA = 'terrafusion.autonomy.casefile.v1';
export const CASEFILE_MANIFEST_SCHEMA = 'terrafusion.autonomy.casefile.manifest.v1';
export const CASEFILE_TOOL_VERSION = '4N34.1';
/** Phase 4N37: Sealed casefile schema version */
export const SEALED_CASEFILE_SCHEMA = 'terrafusion.autonomy.casefile.sealed.v1';
export const SEALED_CASEFILE_TOOL_VERSION = '4N37.1';

// Fixed mtime for deterministic ZIP
const FIXED_MTIME = new Date('2024-01-01T00:00:00Z');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CasefileTier = 'ci' | 'merged' | 'incident';

export type CasefileReasonCode =
  | 'RECORD_NOT_FOUND'
  | 'BUNDLE_MISSING'
  | 'CUSTODY_MISSING'
  | 'VERIFY_FAILED'
  | 'PATH_TRAVERSAL'
  | 'INDEX_INVALID';

export interface CasefileManifestFile {
  path: string;
  sha256: string;
  size: number;
  required: boolean;
}

export interface CasefilePolicySnapshot {
  sloPolicy?: object;
  canaryPolicy?: object;
  autonomyState?: object;
  /** Phase 4N40: Embedded signature policy from evidence index */
  signaturePolicy?: {
    issuer: string;
    identity: string;
    repo: string;
    ref: string;
    workflowPath: string;
    requireShaBinding: boolean;
    sha?: string;
  };
  /** Phase 4N40: SHA256 of the policy file (for audit trail) */
  policyHash?: string;
}

export interface CasefileManifest {
  $schema: typeof CASEFILE_MANIFEST_SCHEMA;
  toolVersion: typeof CASEFILE_TOOL_VERSION;
  generatedAt: string;
  recordId: string;
  runId: string;
  tier: CasefileTier;
  files: CasefileManifestFile[];
  missingOptional: string[];
  policySnapshot: CasefilePolicySnapshot;
  /** Phase 4N40: Deterministic verify command */
  verifyCommand: string;
  /**
   * Phase 4N41: Release tag where this casefile will be published.
   */
  releaseTag?: string;
  /**
   * Phase 4N41: Previous release tag for chain continuity.
   * Null for genesis (first published casefile).
   */
  previousReleaseTag?: string | null;
  /**
   * Phase 4N41: Previous casefile SHA256 for chain verification.
   * Null for genesis (first published casefile).
   */
  previousCasefileSha256?: string | null;
  /**
   * Phase 4N41: Ledger head SHA256 at publish time.
   * Binds this casefile to the ledger chain state.
   */
  ledgerHeadSha256?: string;
}

/**
 * Phase 4N37: Sealed casefile seal entry (signature triplet).
 */
export interface SealEntry {
  artifact: string;
  sig: string;
  crt: string;
  bundle: string;
  sha256: {
    sig: string;
    crt: string;
    bundle: string;
  };
}

/**
 * Phase 4N37: Expected signing policy for offline verification.
 */
export interface SealedCasefilePolicy {
  issuer: string;
  repo: string;
  ref: string;
  workflowPath: string;
  identity: string;
  requireShaBinding: boolean;
  sha?: string;
}

/**
 * Phase 4N37: Sealed casefile manifest with seals.
 */
export interface SealedCasefileManifest {
  $schema: typeof SEALED_CASEFILE_SCHEMA;
  toolVersion: typeof SEALED_CASEFILE_TOOL_VERSION;
  generatedAt: string;
  recordId: string;
  runId: string;
  tier: CasefileTier;
  /** Inner casefile.zip filename */
  casefile: {
    name: string;
    sha256: string;
    size: number;
  };
  /** Inner casefile-manifest.json */
  manifest: {
    name: string;
    sha256: string;
    size: number;
  };
  /** Seals directory contents */
  seals: SealEntry[];
  /** Expected signing policy (for offline verification) */
  policy: SealedCasefilePolicy;
  /** Verification command */
  verifyCommand: string;
  /**
   * Phase 4N38: Two-Channel Anchoring.
   * Defense-in-depth via multiple independent anchors.
   */
  anchors?: TransparencyAnchors;
  /**
   * Phase 4N41: Release tag where this sealed casefile was published.
   */
  releaseTag?: string;
  /**
   * Phase 4N41: Previous release tag for chain continuity.
   * Null for genesis (first published casefile).
   */
  previousReleaseTag?: string | null;
  /**
   * Phase 4N41: Previous casefile SHA256 for chain verification.
   * Null for genesis (first published casefile).
   */
  previousCasefileSha256?: string | null;
  /**
   * Phase 4N41: Ledger head SHA256 at publish time.
   * Binds this casefile to the ledger chain state.
   */
  ledgerHeadSha256?: string;
}

export interface CasefileResult {
  success: boolean;
  zipPath?: string;
  manifest?: CasefileManifest;
  zipSha256?: string;
  /** Phase 4N37: Sealed casefile result (if --include-seals used) */
  sealed?: {
    zipPath: string;
    manifest: SealedCasefileManifest;
    zipSha256: string;
  };
  error?: {
    code: CasefileReasonCode;
    message: string;
  };
}

export interface CasefileOptions {
  recordId: string;
  outDir: string;
  indexPath?: string;
  artifactsDir?: string;
  verbose?: boolean;
  /** Phase 4N37: Include signature seals in outer ZIP */
  includeSeals?: boolean;
  /** Phase 4N37: Directory containing seal files (.sig, .crt, .bundle) */
  sealsDir?: string;
  /** Phase 4N37: Signing policy for verification */
  signingPolicy?: SealedCasefilePolicy;
  /** Phase 4N40: Policy from evidence index path */
  policyFromIndex?: string;
  /** Phase 4N40: Fail-closed mode (reject partial output) */
  failClosed?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const PATH_TRAVERSAL_PATTERN = /[<>:"|?*]|\.\.|\.\//;

export function validateRecordId(recordId: string): { valid: boolean; reason?: string } {
  if (!recordId || typeof recordId !== 'string') {
    return { valid: false, reason: 'Record ID is required' };
  }
  if (recordId.length > 256) {
    return { valid: false, reason: 'Record ID too long (max 256 chars)' };
  }
  if (PATH_TRAVERSAL_PATTERN.test(recordId)) {
    return { valid: false, reason: 'Record ID contains invalid path characters' };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// File Discovery
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoveredFiles {
  evidenceIndex?: string;
  evidenceBundle?: string;
  custodyAttestation?: string;
  verifyBundleOutput?: string;
  rekorProof?: string;
  sloProof?: string;
  resumeProof?: string;
  breakGlassProof?: string;
  promotionProof?: string;
  demotionProof?: string;
  ledgerSnapshot?: string;
  sloPolicy?: string;
  canaryPolicy?: string;
  autonomyState?: string;
}

function discoverFiles(artifactsDir: string, runId: string): DiscoveredFiles {
  const files: DiscoveredFiles = {};

  // Look for evidence index
  const indexPath = path.join(artifactsDir, 'autonomy-evidence-index.json');
  if (fs.existsSync(indexPath)) {
    files.evidenceIndex = indexPath;
  }

  // Look for evidence bundle (pattern match)
  const distFiles = fs.existsSync(artifactsDir) ? fs.readdirSync(artifactsDir) : [];
  const bundleFile = distFiles.find(f => f.startsWith('autonomy-evidence-') && f.endsWith('.zip'));
  if (bundleFile) {
    files.evidenceBundle = path.join(artifactsDir, bundleFile);
  }

  // Look for custody attestation
  const custodyPath = path.join(artifactsDir, 'autonomy-custody.json');
  if (fs.existsSync(custodyPath)) {
    files.custodyAttestation = custodyPath;
  }

  // Look for verify bundle output
  const verifyPath = path.join(artifactsDir, 'verify-bundle-output.json');
  if (fs.existsSync(verifyPath)) {
    files.verifyBundleOutput = verifyPath;
  }

  // Look for rekor proof
  const rekorPath = path.join(artifactsDir, 'rekor-anchor-proof.json');
  if (fs.existsSync(rekorPath)) {
    files.rekorProof = rekorPath;
  }

  // Look in .out directory for proofs
  const outDir = path.join(path.dirname(artifactsDir), '.out');
  if (fs.existsSync(outDir)) {
    const outFiles = fs.readdirSync(outDir);

    // SLO proof
    const sloProofFile = outFiles.find(f => f.startsWith('slo-proof-'));
    if (sloProofFile) {
      files.sloProof = path.join(outDir, sloProofFile);
    }

    // Resume proof
    const resumeProofFile = outFiles.find(f => f.startsWith('resume-proof-'));
    if (resumeProofFile) {
      files.resumeProof = path.join(outDir, resumeProofFile);
    }

    // Promotion proof
    const promotionProofFile = outFiles.find(f => f.startsWith('promotion-proof-'));
    if (promotionProofFile) {
      files.promotionProof = path.join(outDir, promotionProofFile);
    }

    // Demotion proof
    const demotionProofFile = outFiles.find(f => f.startsWith('demotion-proof-'));
    if (demotionProofFile) {
      files.demotionProof = path.join(outDir, demotionProofFile);
    }
  }

  // Look for break-glass proof
  const breakGlassPath = path.join(artifactsDir, 'break-glass-proof.json');
  if (fs.existsSync(breakGlassPath)) {
    files.breakGlassProof = breakGlassPath;
  }

  // Look for ledger snapshot
  const ledgerPath = path.join(artifactsDir, 'autonomy-ledger.html');
  if (fs.existsSync(ledgerPath)) {
    files.ledgerSnapshot = ledgerPath;
  }

  // Look for policy files (in parent directory)
  const parentDir = path.dirname(artifactsDir);
  const sloPolicyPath = path.join(parentDir, 'AUTONOMY_SLO_POLICY.json');
  if (fs.existsSync(sloPolicyPath)) {
    files.sloPolicy = sloPolicyPath;
  }

  const canaryPolicyPath = path.join(parentDir, 'AUTONOMY_CANARY_POLICY.json');
  if (fs.existsSync(canaryPolicyPath)) {
    files.canaryPolicy = canaryPolicyPath;
  }

  const autonomyStatePath = path.join(parentDir, 'autonomy-state.json');
  if (fs.existsSync(autonomyStatePath)) {
    files.autonomyState = autonomyStatePath;
  }

  return files;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHA256 Helper
// ─────────────────────────────────────────────────────────────────────────────

function sha256File(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY.md Generator
// ─────────────────────────────────────────────────────────────────────────────

interface CasefileRecord {
  runId: string;
  generatedAt: string;
  tier: 'ci' | 'merged' | 'incident';
}

function generateVerifyMd(record: CasefileRecord, manifest: CasefileManifest): string {
  const files = manifest.files
    .map(f => `- \`${f.path}\` (SHA256: \`${f.sha256.slice(0, 16)}...\`)`)
    .join('\n');

  return `# Case File Verification Instructions

## Overview

This case file contains evidence for autonomy record **${record.runId}**.

| Field | Value |
|-------|-------|
| **Record ID** | \`${manifest.recordId}\` |
| **Run ID** | \`${manifest.runId}\` |
| **Tier** | \`${manifest.tier}\` |
| **Generated** | ${manifest.generatedAt} |
| **Tool Version** | ${manifest.toolVersion} |

## Contents

${files}

${manifest.missingOptional.length > 0 ? `### Optional Files Not Present\n${manifest.missingOptional.map(f => `- ${f}`).join('\n')}` : ''}

## Verification Steps

### Step 1: Verify Case File Integrity

Check the manifest SHA256 hashes against file contents:

\`\`\`bash
# Verify each file's SHA256 matches the manifest
cat casefile-manifest.json | jq -r '.files[] | "\\(.sha256)  \\(.path)"' | sha256sum -c
\`\`\`

### Step 2: Verify Evidence Bundle (if present)

\`\`\`bash
# Verify bundle integrity
pnpm perf:verify-bundle --zip autonomy-evidence-*.zip --strict

# Expected exit code: 0 = verified, non-zero = integrity failure
\`\`\`

### Step 3: Verify Chain of Custody

\`\`\`bash
# Review custody attestation
cat custody-attestation.json | jq '.custody'
\`\`\`

### Step 4: Check Signature and Rekor Anchor (if present)

\`\`\`bash
# Verify signature
pnpm perf:verify-signature --artifact autonomy-evidence-*.zip --bundle *.sig.bundle

# Verify Rekor anchor
cat rekor-anchor-proof.json | jq '.rekor'
\`\`\`

## Offline Verification

This case file is designed for **offline verification**. No network requests are required.

1. Extract the ZIP to a folder
2. Open \`casefile-ledger.html\` in a browser (if present)
3. Review the custody chain and proofs
4. Verify SHA256 hashes using any sha256sum tool

## Governance Compliance

${record.tier === 'incident' ? '⚠️ **INCIDENT TIER**: This record was created during an incident response.' : ''}
${record.tier === 'merged' ? '✅ **MERGED TIER**: This record represents a merged change with full verification.' : ''}
${record.tier === 'ci' ? '📋 **CI TIER**: This record represents a CI run with standard verification.' : ''}

## Contact

For questions about this evidence packet, contact the TerraFusion Autonomy team.

---

*Generated by TerraFusion Autonomy v1 — Government. Transcended.*
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Export Function
// ─────────────────────────────────────────────────────────────────────────────

export async function exportCasefile(options: CasefileOptions): Promise<CasefileResult> {
  const { recordId, outDir, verbose } = options;
  const indexPath =
    options.indexPath || path.join(__dirname, '..', 'dist', 'autonomy-evidence-index.json');
  const artifactsDir = options.artifactsDir || path.join(__dirname, '..', 'dist');

  // Validate record ID
  const validation = validateRecordId(recordId);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        code: 'PATH_TRAVERSAL',
        message: validation.reason || 'Invalid record ID',
      },
    };
  }

  // Load evidence index
  if (!fs.existsSync(indexPath)) {
    return {
      success: false,
      error: {
        code: 'INDEX_INVALID',
        message: `Evidence index not found: ${indexPath}`,
      },
    };
  }

  let index: CasefileEvidenceIndex;
  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    index = JSON.parse(content) as CasefileEvidenceIndex;
  } catch (e) {
    return {
      success: false,
      error: {
        code: 'INDEX_INVALID',
        message: `Failed to parse evidence index: ${e}`,
      },
    };
  }

  // Find requested record
  const record = index.records.find(
    r => r.runId === recordId || r.runId.includes(recordId) || r.generatedAt.includes(recordId)
  );

  if (!record) {
    return {
      success: false,
      error: {
        code: 'RECORD_NOT_FOUND',
        message: `Record not found: ${recordId}`,
      },
    };
  }

  const tier = record.tier as CasefileTier;
  const runId = record.runId;

  if (verbose) {
    console.log(`📁 Found record: ${runId} (tier: ${tier})`);
  }

  // Discover available files
  const discovered = discoverFiles(artifactsDir, runId);

  // Check required files for tier
  const requiresMergedArtifacts = tier === 'merged' || tier === 'incident';

  if (requiresMergedArtifacts) {
    if (!discovered.evidenceBundle) {
      return {
        success: false,
        error: {
          code: 'BUNDLE_MISSING',
          message: `Required evidence bundle not found for ${tier} tier`,
        },
      };
    }
    if (!discovered.custodyAttestation) {
      // Custody is recommended but not strictly required
      if (verbose) {
        console.log('⚠️  Custody attestation not found (recommended for merged/incident)');
      }
    }
  }

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Build file list for manifest
  const files: CasefileManifestFile[] = [];
  const missingOptional: string[] = [];
  const zipEntries: { name: string; content: Buffer | string; isPath?: boolean }[] = [];

  // Add evidence index (filtered to just this record)
  const filteredIndex: CasefileEvidenceIndex = {
    ...index,
    records: [record],
  };
  const indexContent = JSON.stringify(filteredIndex, null, 2);
  zipEntries.push({ name: 'autonomy-evidence-index.json', content: indexContent });
  files.push({
    path: 'autonomy-evidence-index.json',
    sha256: sha256Buffer(Buffer.from(indexContent)),
    size: Buffer.byteLength(indexContent),
    required: true,
  });

  // Add discovered files
  const addFile = (name: string, filePath: string | undefined, required: boolean) => {
    if (filePath && fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      zipEntries.push({ name: fileName, content, isPath: true });
      files.push({
        path: fileName,
        sha256: sha256Buffer(content),
        size: content.length,
        required,
      });
    } else if (required) {
      throw new Error(`Required file missing: ${name}`);
    } else {
      missingOptional.push(name);
    }
  };

  try {
    addFile('evidence-bundle', discovered.evidenceBundle, requiresMergedArtifacts);
    addFile('custody-attestation', discovered.custodyAttestation, false);
    addFile('verify-bundle-output', discovered.verifyBundleOutput, false);
    addFile('rekor-proof', discovered.rekorProof, false);
    addFile('slo-proof', discovered.sloProof, false);
    addFile('resume-proof', discovered.resumeProof, false);
    addFile('break-glass-proof', discovered.breakGlassProof, false);
    addFile('promotion-proof', discovered.promotionProof, false);
    addFile('demotion-proof', discovered.demotionProof, false);
    addFile('ledger-snapshot', discovered.ledgerSnapshot, false);
  } catch (e) {
    return {
      success: false,
      error: {
        code: 'BUNDLE_MISSING',
        message: String(e),
      },
    };
  }

  // Build policy snapshot
  const policySnapshot: CasefilePolicySnapshot = {};
  if (discovered.sloPolicy && fs.existsSync(discovered.sloPolicy)) {
    try {
      policySnapshot.sloPolicy = JSON.parse(fs.readFileSync(discovered.sloPolicy, 'utf-8'));
    } catch {
      /* ignore */
    }
  }
  if (discovered.canaryPolicy && fs.existsSync(discovered.canaryPolicy)) {
    try {
      policySnapshot.canaryPolicy = JSON.parse(fs.readFileSync(discovered.canaryPolicy, 'utf-8'));
    } catch {
      /* ignore */
    }
  }
  if (discovered.autonomyState && fs.existsSync(discovered.autonomyState)) {
    try {
      policySnapshot.autonomyState = JSON.parse(fs.readFileSync(discovered.autonomyState, 'utf-8'));
    } catch {
      /* ignore */
    }
  }

  // Phase 4N40: Load signature policy from evidence index if policyFromIndex provided
  if (options.policyFromIndex && fs.existsSync(options.policyFromIndex)) {
    try {
      const policyIndexContent = fs.readFileSync(options.policyFromIndex, 'utf-8');
      const policyIndex = JSON.parse(policyIndexContent);
      const expectedPolicy = policyIndex.expectedSignaturePolicy;
      if (expectedPolicy) {
        policySnapshot.signaturePolicy = {
          issuer: expectedPolicy.issuer,
          identity: expectedPolicy.identity,
          repo: expectedPolicy.repo,
          ref: expectedPolicy.ref,
          workflowPath: expectedPolicy.workflowPath,
          requireShaBinding: expectedPolicy.requireShaBinding ?? false,
          sha: expectedPolicy.sha,
        };
        // Compute policy hash for audit trail
        policySnapshot.policyHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(expectedPolicy))
          .digest('hex');
        if (verbose) {
          console.log(
            `  📜 Embedded signature policy (hash: ${policySnapshot.policyHash.substring(0, 16)}...)`
          );
        }
      }
    } catch (e) {
      if (verbose) {
        console.log(`  ⚠️  Failed to load policy from index: ${e}`);
      }
    }
  }

  // Build manifest
  const manifest: CasefileManifest = {
    $schema: CASEFILE_MANIFEST_SCHEMA,
    toolVersion: CASEFILE_TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    recordId,
    runId,
    tier,
    files: [], // Will be filled after VERIFY.md
    missingOptional,
    policySnapshot,
    verifyCommand: `pnpm perf:verify-casefile --zip casefile-${runId.replace(/[^a-zA-Z0-9-]/g, '_')}.zip --strict`,
  };

  // Generate VERIFY.md
  const verifyMd = generateVerifyMd(record, { ...manifest, files });
  zipEntries.push({ name: 'VERIFY.md', content: verifyMd });
  files.push({
    path: 'VERIFY.md',
    sha256: sha256Buffer(Buffer.from(verifyMd)),
    size: Buffer.byteLength(verifyMd),
    required: true,
  });

  // Finalize manifest with all files
  manifest.files = files.sort((a, b) => a.path.localeCompare(b.path));

  // Add manifest to ZIP
  const manifestContent = JSON.stringify(manifest, null, 2);
  zipEntries.push({ name: 'casefile-manifest.json', content: manifestContent });

  // Sort entries alphabetically for determinism
  zipEntries.sort((a, b) => a.name.localeCompare(b.name));

  // Create ZIP
  const zipFileName = `casefile-${runId.replace(/[^a-zA-Z0-9-]/g, '_')}.zip`;
  const zipPath = path.join(outDir, zipFileName);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);

    for (const entry of zipEntries) {
      const buffer = typeof entry.content === 'string' ? Buffer.from(entry.content) : entry.content;
      archive.append(buffer, {
        name: entry.name,
        date: FIXED_MTIME,
      });
    }

    archive.finalize();
  });

  // Calculate ZIP hash
  const zipSha256 = sha256File(zipPath);

  if (verbose) {
    console.log(`✅ Case file created: ${zipPath}`);
    console.log(`   SHA256: ${zipSha256}`);
    console.log(`   Files: ${files.length}`);
    console.log(`   Missing optional: ${missingOptional.length}`);
  }

  return {
    success: true,
    zipPath,
    manifest,
    zipSha256,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N37: Sealed Casefile (Air-Gapped)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phase 4N37: Generate VERIFY.md for sealed casefile (air-gapped verification).
 */
function generateSealedVerifyMd(sealedManifest: SealedCasefileManifest): string {
  const lines: string[] = [
    '# Sealed Casefile Verification (Phase 4N37)',
    '',
    '> **Air-Gapped Verification** — No network required.',
    '',
    '## Casefile Details',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Record ID** | \`${sealedManifest.recordId}\` |`,
    `| **Run ID** | \`${sealedManifest.runId}\` |`,
    `| **Tier** | ${sealedManifest.tier} |`,
    `| **Generated** | ${sealedManifest.generatedAt} |`,
    `| **Tool Version** | ${sealedManifest.toolVersion} |`,
    '',
    '## Step 1: Verify ZIP Contents Integrity',
    '',
    '```bash',
    '# Extract the sealed casefile',
    'unzip autonomy-casefile-*-sealed.zip',
    '',
    '# Verify inner casefile hash',
    `echo "${sealedManifest.casefile.sha256}  casefile.zip" | sha256sum -c`,
    '',
    '# Verify manifest hash',
    `echo "${sealedManifest.manifest.sha256}  casefile-manifest.json" | sha256sum -c`,
    '```',
    '',
    '## Step 2: Verify Signature (Requires Cosign)',
    '',
    '```bash',
    '# Verify casefile.zip signature offline using bundle',
    'cosign verify-blob casefile.zip \\',
    '  --bundle seals/casefile.zip.bundle \\',
    '  --certificate seals/casefile.zip.crt \\',
    '  --signature seals/casefile.zip.sig \\',
    `  --certificate-oidc-issuer "${sealedManifest.policy.issuer}" \\`,
    `  --certificate-identity "${sealedManifest.policy.identity}"`,
    '',
    '# Verify casefile-manifest.json signature',
    'cosign verify-blob casefile-manifest.json \\',
    '  --bundle seals/casefile-manifest.json.bundle \\',
    '  --certificate seals/casefile-manifest.json.crt \\',
    '  --signature seals/casefile-manifest.json.sig \\',
    `  --certificate-oidc-issuer "${sealedManifest.policy.issuer}" \\`,
    `  --certificate-identity "${sealedManifest.policy.identity}"`,
    '```',
    '',
    '## Step 3: Verify Signing Policy (SHA Binding)',
    '',
  ];

  if (sealedManifest.policy.requireShaBinding && sealedManifest.policy.sha) {
    lines.push(
      'This casefile requires SHA binding verification:',
      '',
      '```bash',
      '# Extract certificate and verify SHA in extension',
      `# Expected SHA: ${sealedManifest.policy.sha}`,
      `# Expected Ref: ${sealedManifest.policy.ref}`,
      '```',
      ''
    );
  } else {
    lines.push('SHA binding not required for this tier.', '');
  }

  lines.push(
    '## Expected Signing Policy',
    '',
    '| Field | Expected Value |',
    '|-------|----------------|',
    `| **Issuer** | \`${sealedManifest.policy.issuer}\` |`,
    `| **Identity** | \`${sealedManifest.policy.identity}\` |`,
    `| **Repository** | \`${sealedManifest.policy.repo}\` |`,
    `| **Ref** | \`${sealedManifest.policy.ref}\` |`,
    `| **Workflow** | \`${sealedManifest.policy.workflowPath}\` |`,
    `| **SHA Binding** | ${sealedManifest.policy.requireShaBinding ? 'Required' : 'Not Required'} |`,
    sealedManifest.policy.sha ? `| **SHA** | \`${sealedManifest.policy.sha}\` |` : '',
    '',
    '## Seals Directory Contents',
    '',
    '| Artifact | Signature | Certificate | Bundle |',
    '|----------|-----------|-------------|--------|'
  );

  for (const seal of sealedManifest.seals) {
    lines.push(`| \`${seal.artifact}\` | \`${seal.sig}\` | \`${seal.crt}\` | \`${seal.bundle}\` |`);
  }

  lines.push('', '---', '', '*TerraFusion Autonomy v1 — Government. Transcended.*', '');

  return lines.filter(l => l !== undefined).join('\n');
}

/**
 * Phase 4N37: Discover seal files (signature triplets) for casefile.
 */
function discoverSealFiles(
  sealsDir: string,
  casefileName: string,
  manifestName: string,
  verbose?: boolean
): { seals: SealEntry[]; errors: string[] } {
  const seals: SealEntry[] = [];
  const errors: string[] = [];

  const artifacts = [casefileName, manifestName];

  for (const artifact of artifacts) {
    const sigPath = path.join(sealsDir, `${artifact}.sig`);
    const crtPath = path.join(sealsDir, `${artifact}.crt`);
    const bundlePath = path.join(sealsDir, `${artifact}.bundle`);

    const sigExists = fs.existsSync(sigPath);
    const crtExists = fs.existsSync(crtPath);
    const bundleExists = fs.existsSync(bundlePath);

    if (sigExists && crtExists && bundleExists) {
      const sigContent = fs.readFileSync(sigPath);
      const crtContent = fs.readFileSync(crtPath);
      const bundleContent = fs.readFileSync(bundlePath);

      seals.push({
        artifact,
        sig: `${artifact}.sig`,
        crt: `${artifact}.crt`,
        bundle: `${artifact}.bundle`,
        sha256: {
          sig: sha256Buffer(sigContent),
          crt: sha256Buffer(crtContent),
          bundle: sha256Buffer(bundleContent),
        },
      });

      if (verbose) {
        console.log(`  ✅ Found triplet for: ${artifact}`);
      }
    } else {
      const missing: string[] = [];
      if (!sigExists) missing.push('.sig');
      if (!crtExists) missing.push('.crt');
      if (!bundleExists) missing.push('.bundle');
      errors.push(`Missing seal files for ${artifact}: ${missing.join(', ')}`);
    }
  }

  return { seals, errors };
}

/**
 * Phase 4N37: Export sealed casefile with signature seals.
 *
 * Creates a self-verifying sealed ZIP containing:
 * - casefile.zip (the actual casefile)
 * - casefile-manifest.json (hashes)
 * - seals/ directory with .sig, .crt, .bundle triplets
 * - VERIFY.md (air-gapped verification instructions)
 * - sealed-manifest.json (sealed casefile manifest with policy)
 */
export async function exportSealedCasefile(
  options: CasefileOptions & {
    includeSeals: true;
    sealsDir: string;
    signingPolicy: SealedCasefilePolicy;
  }
): Promise<CasefileResult> {
  const { recordId, outDir, sealsDir, signingPolicy, verbose } = options;

  // First, export the inner casefile
  const innerResult = await exportCasefile({
    recordId,
    outDir,
    indexPath: options.indexPath,
    artifactsDir: options.artifactsDir,
    verbose,
  });

  if (!innerResult.success || !innerResult.zipPath || !innerResult.manifest) {
    return innerResult;
  }

  const casefileZipPath = innerResult.zipPath;
  const casefileManifestContent = JSON.stringify(innerResult.manifest, null, 2);
  const casefileManifestPath = path.join(outDir, 'casefile-manifest.json');

  // Write manifest separately for signing
  fs.writeFileSync(casefileManifestPath, casefileManifestContent);

  if (verbose) {
    console.log('\n🔐 Phase 4N37: Building sealed casefile...');
  }

  // Discover seal files
  const casefileName = path.basename(casefileZipPath);
  const manifestName = 'casefile-manifest.json';
  const { seals, errors } = discoverSealFiles(sealsDir, casefileName, manifestName, verbose);

  if (errors.length > 0) {
    // Merged/incident tiers require complete triplets
    const tier = innerResult.manifest.tier;
    if (tier === 'merged' || tier === 'incident') {
      return {
        success: false,
        error: {
          code: 'CUSTODY_MISSING',
          message: `Triplet parity violated for ${tier} tier: ${errors.join('; ')}`,
        },
      };
    } else if (verbose) {
      console.log(`  ⚠️  Seal files incomplete (CI tier, continuing): ${errors.join('; ')}`);
    }
  }

  // Build sealed manifest
  const casefileContent = fs.readFileSync(casefileZipPath);
  const manifestContent = Buffer.from(casefileManifestContent);

  const sealedManifest: SealedCasefileManifest = {
    $schema: SEALED_CASEFILE_SCHEMA,
    toolVersion: SEALED_CASEFILE_TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    recordId,
    runId: innerResult.manifest.runId,
    tier: innerResult.manifest.tier,
    casefile: {
      name: 'casefile.zip',
      sha256: sha256Buffer(casefileContent),
      size: casefileContent.length,
    },
    manifest: {
      name: 'casefile-manifest.json',
      sha256: sha256Buffer(manifestContent),
      size: manifestContent.length,
    },
    seals,
    policy: signingPolicy,
    verifyCommand: 'pnpm perf:verify-casefile --zip <sealed.zip> --strict --verify-signatures',
  };

  // Generate VERIFY.md for sealed casefile
  const verifyMd = generateSealedVerifyMd(sealedManifest);

  // Build sealed ZIP entries
  const sealedEntries: { name: string; content: Buffer }[] = [];

  // Add casefile.zip (renamed from inner casefile)
  sealedEntries.push({ name: 'casefile.zip', content: casefileContent });

  // Add casefile-manifest.json
  sealedEntries.push({ name: 'casefile-manifest.json', content: manifestContent });

  // Add seals directory
  for (const seal of seals) {
    const sigContent = fs.readFileSync(path.join(sealsDir, seal.sig));
    const crtContent = fs.readFileSync(path.join(sealsDir, seal.crt));
    const bundleContent = fs.readFileSync(path.join(sealsDir, seal.bundle));

    // Map to standard names inside sealed ZIP
    const artifactBase = seal.artifact === casefileName ? 'casefile.zip' : 'casefile-manifest.json';
    sealedEntries.push({ name: `seals/${artifactBase}.sig`, content: sigContent });
    sealedEntries.push({ name: `seals/${artifactBase}.crt`, content: crtContent });
    sealedEntries.push({ name: `seals/${artifactBase}.bundle`, content: bundleContent });
  }

  // Add VERIFY.md
  sealedEntries.push({ name: 'VERIFY.md', content: Buffer.from(verifyMd) });

  // Add sealed-manifest.json
  const sealedManifestContent = JSON.stringify(sealedManifest, null, 2);
  sealedEntries.push({ name: 'sealed-manifest.json', content: Buffer.from(sealedManifestContent) });

  // Sort entries alphabetically for determinism
  sealedEntries.sort((a, b) => a.name.localeCompare(b.name));

  // Create sealed ZIP
  const runId = innerResult.manifest.runId.replace(/[^a-zA-Z0-9-]/g, '_');
  const sealedZipName = `autonomy-casefile-${runId}-sealed.zip`;
  const sealedZipPath = path.join(outDir, sealedZipName);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(sealedZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);

    for (const entry of sealedEntries) {
      archive.append(entry.content, {
        name: entry.name,
        date: FIXED_MTIME,
      });
    }

    archive.finalize();
  });

  // Calculate sealed ZIP hash
  const sealedZipSha256 = sha256File(sealedZipPath);

  if (verbose) {
    console.log(`✅ Sealed casefile created: ${sealedZipPath}`);
    console.log(`   SHA256: ${sealedZipSha256}`);
    console.log(`   Seals: ${seals.length} triplets`);
    console.log(`   Policy: ${signingPolicy.identity}`);
  }

  return {
    success: true,
    zipPath: casefileZipPath,
    manifest: innerResult.manifest,
    zipSha256: innerResult.zipSha256,
    sealed: {
      zipPath: sealedZipPath,
      manifest: sealedManifest,
      zipSha256: sealedZipSha256,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

interface CliArgs {
  recordId?: string;
  outDir: string;
  indexPath?: string;
  artifactsDir?: string;
  verbose: boolean;
  json: boolean;
  help: boolean;
  /** Phase 4N37: Include seals in outer ZIP */
  includeSeals: boolean;
  /** Phase 4N37: Directory containing seal files */
  sealsDir?: string;
  /** Phase 4N37: Expected issuer for signature verification */
  issuer?: string;
  /** Phase 4N37: Expected identity for signature verification */
  identity?: string;
  /** Phase 4N37: Expected repository */
  repo?: string;
  /** Phase 4N37: Expected ref */
  ref?: string;
  /** Phase 4N37: Expected SHA */
  sha?: string;
  /** Phase 4N37: Workflow path */
  workflow?: string;
  /** Phase 4N40: Policy from evidence index for embedded hash */
  policyFromIndex?: string;
  /** Phase 4N40: Fail-closed mode (reject partial output) */
  failClosed: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    outDir: './dist',
    verbose: false,
    json: false,
    help: false,
    includeSeals: false,
    failClosed: true, // Phase 4N40: default to fail-closed
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--record' && argv[i + 1]) {
      args.recordId = argv[++i];
    } else if (arg === '--out' && argv[i + 1]) {
      args.outDir = argv[++i];
    } else if (arg === '--index' && argv[i + 1]) {
      args.indexPath = argv[++i];
    } else if (arg === '--artifacts' && argv[i + 1]) {
      args.artifactsDir = argv[++i];
    } else if (arg === '--verbose') {
      args.verbose = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
      // Phase 4N37: Sealed casefile options
    } else if (arg === '--include-seals') {
      args.includeSeals = true;
    } else if (arg === '--seals-dir' && argv[i + 1]) {
      args.sealsDir = argv[++i];
    } else if (arg === '--issuer' && argv[i + 1]) {
      args.issuer = argv[++i];
    } else if (arg === '--identity' && argv[i + 1]) {
      args.identity = argv[++i];
    } else if (arg === '--repo' && argv[i + 1]) {
      args.repo = argv[++i];
    } else if (arg === '--ref' && argv[i + 1]) {
      args.ref = argv[++i];
    } else if (arg === '--sha' && argv[i + 1]) {
      args.sha = argv[++i];
    } else if (arg === '--workflow' && argv[i + 1]) {
      args.workflow = argv[++i];
    } else if (arg === '--policy-from-index' && argv[i + 1]) {
      args.policyFromIndex = argv[++i];
    } else if (arg === '--no-fail-closed') {
      args.failClosed = false;
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
Case File Export (Phase 4N34/4N37/4N40)
═════════════════════════════════════════════════

Produces a courtroom-ready packet for any autonomy record/run.

USAGE:
  pnpm perf:casefile --record <recordId> [options]

OPTIONS:
  --record <id>       Record ID or run ID to export (required)
  --out <dir>         Output directory (default: ./dist)
  --index <path>      Path to evidence index JSON
  --artifacts <dir>   Path to artifacts directory
  --verbose           Verbose output
  --json              Output result as JSON
  --help              Show this help

POLICY OPTIONS (Phase 4N40):
  --policy-from-index <path>  Load signature policy from evidence index (embeds hash)
  --no-fail-closed            Disable fail-closed mode (allow partial output)

SEALED CASEFILE OPTIONS (Phase 4N37):
  --include-seals     Include signature seals in outer ZIP (air-gapped)
  --seals-dir <dir>   Directory containing .sig/.crt/.bundle files
  --issuer <url>      Expected OIDC issuer (default: GitHub Actions)
  --identity <uri>    Expected signing identity
  --repo <owner/repo> Expected repository
  --ref <ref>         Expected git ref (e.g., refs/heads/main)
  --sha <sha>         Expected commit SHA (for SHA binding)
  --workflow <path>   Workflow file path

EXAMPLES:
  pnpm perf:casefile --record run-12345 --out ./casefile
  pnpm perf:casefile --record run-12345 --verbose
  pnpm perf:casefile --record run-12345 --json
  pnpm perf:casefile --record run-12345 --include-seals --seals-dir ./dist

OUTPUT:
  casefile-<runId>.zip containing:
  - casefile-manifest.json (SHA256 hashes for all files)
  - autonomy-evidence-index.json (filtered to requested record)
  - VERIFY.md (verification instructions)
  - Evidence bundle, proofs, and ledger snapshot (if available)

SEALED OUTPUT (--include-seals):
  autonomy-casefile-<runId>-sealed.zip containing:
  - casefile.zip (the actual casefile artifact)
  - casefile-manifest.json (hashes)
  - seals/ (signature triplets: .sig, .crt, .bundle)
  - VERIFY.md (air-gapped verification instructions)
  - sealed-manifest.json (policy + seal inventory)

EXIT CODES:
  0  Success
  1  Failure (with reason code in JSON output)
  2  Invalid arguments
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.recordId) {
    console.error('❌ Error: --record is required');
    console.error('   Usage: pnpm perf:casefile --record <recordId>');
    process.exit(2);
  }

  let result: CasefileResult;

  // Phase 4N37: Sealed casefile with seals
  if (args.includeSeals) {
    const sealsDir = args.sealsDir || args.outDir || './dist';

    // Build signing policy from args or defaults
    const signingPolicy: SealedCasefilePolicy = {
      issuer: args.issuer || 'https://token.actions.githubusercontent.com',
      repo: args.repo || 'unknown/unknown',
      ref: args.ref || 'refs/heads/main',
      workflowPath: args.workflow || '.github/workflows/autonomy-casefile-publisher.yml',
      identity:
        args.identity ||
        `https://github.com/${args.repo || 'unknown/unknown'}/.github/workflows/autonomy-casefile-publisher.yml@${args.ref || 'refs/heads/main'}`,
      requireShaBinding: args.sha ? true : false,
      sha: args.sha,
    };

    result = await exportSealedCasefile({
      recordId: args.recordId,
      outDir: args.outDir,
      indexPath: args.indexPath,
      artifactsDir: args.artifactsDir,
      verbose: args.verbose,
      includeSeals: true,
      sealsDir,
      signingPolicy,
    });
  } else {
    result = await exportCasefile({
      recordId: args.recordId,
      outDir: args.outDir,
      indexPath: args.indexPath,
      artifactsDir: args.artifactsDir,
      verbose: args.verbose,
    });
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  if (result.success) {
    console.log(`\n✅ Case File Export Complete`);
    console.log('═'.repeat(50));
    console.log(`   Record: ${result.manifest?.recordId}`);
    console.log(`   Run ID: ${result.manifest?.runId}`);
    console.log(`   Tier: ${result.manifest?.tier}`);
    console.log(`   ZIP: ${result.zipPath}`);
    console.log(`   SHA256: ${result.zipSha256}`);
    console.log(`   Files: ${result.manifest?.files.length}`);
    if (result.manifest?.missingOptional.length) {
      console.log(`   Missing optional: ${result.manifest.missingOptional.join(', ')}`);
    }
    // Phase 4N37: Show sealed casefile info
    if (result.sealed) {
      console.log();
      console.log(`🔐 Sealed Casefile (Phase 4N37)`);
      console.log('─'.repeat(50));
      console.log(`   Sealed ZIP: ${result.sealed.zipPath}`);
      console.log(`   Sealed SHA256: ${result.sealed.zipSha256}`);
      console.log(`   Seals: ${result.sealed.manifest.seals.length} triplets`);
      console.log(`   Policy: ${result.sealed.manifest.policy.identity}`);
    }
    console.log();
    process.exit(0);
  } else {
    console.error(`\n❌ Case File Export Failed`);
    console.error('═'.repeat(50));
    console.error(`   Code: ${result.error?.code}`);
    console.error(`   Message: ${result.error?.message}`);
    console.error();
    process.exit(1);
  }
}

// Guard for test imports
if (process.argv[1]?.endsWith('casefile.ts') || process.argv[1]?.endsWith('casefile.js')) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
