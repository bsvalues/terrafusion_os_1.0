/**
 * Phase 4N6 — Autonomy Evidence Index Generator
 *
 * Creates a deterministic index of all evidence records for a CI run.
 * This is the "system-of-record" that makes Autonomy operationally governable.
 *
 * Usage:
 *   pnpm perf:evidence-index --out <dir> [options]
 *   npx tsx tools/registry/autonomy-viewer/src/evidence-index.ts [options]
 *
 * Options:
 *   --out <dir>           Output directory for index (default: ./dist)
 *   --artifacts <dir>     Directory containing artifacts (apply-proofs, plan, etc.)
 *   --bundle <path>       Path to evidence bundle ZIP
 *   --bundle-name <name>  Override bundle filename in index
 *   --manifest-sha <sha>  Manifest SHA256 (from verify-bundle)
 *   --verify-ok           Bundle verification passed
 *   --verify-strict       Strict mode was used
 *   --run-id <id>         CI run ID
 *   --workflow <name>     Workflow name (default: autonomy-pr-lane)
 *   --repo <owner/repo>   Repository identifier
 *   --ref <ref>           Git ref (branch/tag)
 *   --verbose             Verbose output
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidenceIndexSource {
  workflow: string;
  runId: string;
  repo: string;
  ref: string;
}

export interface EvidenceBundle {
  name: string;
  manifestSha256: string;
  verify: {
    ok: boolean;
    strict: boolean;
  };
}

export interface EvidenceArtifacts {
  dashboardHtml?: string;
  dashboardJson?: string;
  applyProofsJson?: string;
  perfPlanJson?: string;
  actionableJson?: string;
}

export interface EvidenceRollback {
  command: string;
  preview: string;
}

export interface EvidenceRetention {
  days: number;
  policy: string;
  tier: 'ci' | 'merged' | 'incident';
}

// Phase 4N14 — Release Asset Types
export interface ReleaseAsset {
  /** Asset filename (e.g., "autonomy-evidence-bundle-123.zip") */
  name: string;
  /** Immutable download URL (releases/download/<tag>/<name>) */
  url: string;
}

/**
 * Canonical release assets for evidence package.
 * All URLs must be immutable (tagged releases only).
 */
export interface ReleaseAssets {
  bundleZip?: ReleaseAsset;
  manifestJson?: ReleaseAsset;
  evidenceIndexJson?: ReleaseAsset;
  ledgerHtml?: ReleaseAsset;
  dashboardHtml?: ReleaseAsset;
  custodyHtml?: ReleaseAsset;
  custodyAttestationJson?: ReleaseAsset;
}

export interface EvidenceRecord {
  recordId: string;
  status: 'applied' | 'noop' | 'skipped' | 'blocked' | 'dry-run';
  planItemId: string;
  strategyId: string;
  finalCommitSha: string;
  bundle: EvidenceBundle;
  artifacts: EvidenceArtifacts;
  rollback: EvidenceRollback;
  retention: EvidenceRetention;
}

export interface IncidentSource {
  pr: number;
  labelAppliedAt?: string;
  mergedAt?: string;
}

export interface EvidenceIndex {
  schema: 'terrafusion.autonomy.evidence.index.v1';
  generatedAt: string;
  source: EvidenceIndexSource;
  records: EvidenceRecord[];
  incident?: boolean;
  incidentSource?: IncidentSource;
  /** Release tag (e.g., "autonomy-evidence/2026-01") */
  releaseTag?: string;
  /** Immutable release page URL (releases/tag/<tag>) */
  releaseUrl?: string;
  /** Canonical release assets with immutable URLs */
  assets?: ReleaseAssets;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface IndexOptions {
  outDir: string;
  artifactsDir: string;
  bundlePath: string;
  bundleName: string;
  manifestSha: string;
  verifyOk: boolean;
  verifyStrict: boolean;
  runId: string;
  workflow: string;
  repo: string;
  ref: string;
  verbose: boolean;
  incident: boolean;
  incidentPr: number;
  retentionTier: 'ci' | 'merged' | 'incident';
  /** Release tag for immutable URLs (e.g., "autonomy-evidence/2026-01") */
  releaseTag: string;
  /** GitHub server URL (default: https://github.com) */
  serverUrl: string;
}

function parseArgs(): IndexOptions {
  const args = process.argv.slice(2);
  const opts: IndexOptions = {
    outDir: './dist',
    artifactsDir: '',
    bundlePath: '',
    bundleName: '',
    manifestSha: '',
    verifyOk: false,
    verifyStrict: false,
    runId: process.env.GITHUB_RUN_ID || '',
    workflow: process.env.GITHUB_WORKFLOW || 'autonomy-pr-lane',
    repo: process.env.GITHUB_REPOSITORY || '',
    ref: process.env.GITHUB_REF || '',
    verbose: false,
    incident: false,
    incidentPr: 0,
    retentionTier: 'ci',
    releaseTag: '',
    serverUrl: process.env.GITHUB_SERVER_URL || 'https://github.com',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out' && args[i + 1]) {
      opts.outDir = args[++i];
    } else if (arg === '--artifacts' && args[i + 1]) {
      opts.artifactsDir = args[++i];
    } else if (arg === '--bundle' && args[i + 1]) {
      opts.bundlePath = args[++i];
    } else if (arg === '--bundle-name' && args[i + 1]) {
      opts.bundleName = args[++i];
    } else if (arg === '--manifest-sha' && args[i + 1]) {
      opts.manifestSha = args[++i];
    } else if (arg === '--verify-ok') {
      opts.verifyOk = true;
    } else if (arg === '--verify-strict') {
      opts.verifyStrict = true;
    } else if (arg === '--run-id' && args[i + 1]) {
      opts.runId = args[++i];
    } else if (arg === '--workflow' && args[i + 1]) {
      opts.workflow = args[++i];
    } else if (arg === '--repo' && args[i + 1]) {
      opts.repo = args[++i];
    } else if (arg === '--ref' && args[i + 1]) {
      opts.ref = args[++i];
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--incident') {
      opts.incident = true;
    } else if (arg === '--incident-pr' && args[i + 1]) {
      opts.incidentPr = parseInt(args[++i], 10);
    } else if (arg === '--retention-tier' && args[i + 1]) {
      opts.retentionTier = args[++i] as 'ci' | 'merged' | 'incident';
    } else if (arg === '--release-tag' && args[i + 1]) {
      opts.releaseTag = args[++i];
    } else if (arg === '--server-url' && args[i + 1]) {
      opts.serverUrl = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
TerraFusion Evidence Index Generator

Usage:
  pnpm perf:evidence-index --out <dir> [options]

Options:
  --out <dir>           Output directory for index (default: ./dist)
  --artifacts <dir>     Directory containing artifacts
  --bundle <path>       Path to evidence bundle ZIP
  --bundle-name <name>  Override bundle filename
  --manifest-sha <sha>  Manifest SHA256 from verify-bundle
  --verify-ok           Bundle verification passed
  --verify-strict       Strict mode was used
  --run-id <id>         CI run ID
  --workflow <name>     Workflow name
  --repo <owner/repo>   Repository identifier
  --ref <ref>           Git ref
  --incident            Mark as incident (7-year retention)
  --incident-pr <num>   PR number for incident
  --retention-tier <t>  Tier: ci, merged, incident (default: ci)
  --release-tag <tag>   Release tag for immutable URLs (required for publishing)
  --server-url <url>    GitHub server URL (default: GITHUB_SERVER_URL or https://github.com)
  --verbose             Verbose output
  --help, -h            Show this help
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Retention Policy
// ─────────────────────────────────────────────────────────────────────────────

export const EVIDENCE_INDEX_SCHEMA = 'terrafusion.autonomy.evidence.index.v1';
export const DEFAULT_RETENTION_DAYS = 90;
export const MERGED_RETENTION_DAYS = 365;
export const INCIDENT_RETENTION_DAYS = 2555; // 7 years
export const RETENTION_POLICY_VERSION = 'autonomy-evidence-retention.v1';

function getRetentionDays(tier: 'ci' | 'merged' | 'incident'): number {
  switch (tier) {
    case 'incident':
      return INCIDENT_RETENTION_DAYS;
    case 'merged':
      return MERGED_RETENTION_DAYS;
    case 'ci':
    default:
      return DEFAULT_RETENTION_DAYS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N14 — Immutable URL Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutable URL patterns that MUST be rejected.
 * Evidence URLs must be immutable (tagged releases only).
 */
const MUTABLE_URL_PATTERNS = [
  /\/latest\/?$/i,
  /\/download\/latest/i,
  /refs\/heads\//i,
  /\/tree\//i,
  /\/blob\//i,
  /git\.io\//i,
  /bit\.ly\//i,
  /tinyurl\./i,
  /t\.co\//i,
  /@latest$/i,
  /branch=/i,
] as const;

/**
 * Validate a URL is immutable (no latest, no branch refs, no shorteners).
 * Returns error message if invalid, null if valid.
 */
export function validateImmutableUrl(url: string): string | null {
  // Must be a GitHub releases URL
  if (!url.includes('/releases/')) {
    return `URL is not a GitHub releases URL: ${url}`;
  }

  for (const pattern of MUTABLE_URL_PATTERNS) {
    if (pattern.test(url)) {
      return `URL contains mutable reference: ${url} (matched ${pattern})`;
    }
  }

  return null; // Valid
}

/**
 * Build the release page URL (releases/tag/<tag>).
 */
export function buildReleaseUrl(serverUrl: string, repo: string, releaseTag: string): string {
  const base = serverUrl.replace(/\/$/, '');
  return `${base}/${repo}/releases/tag/${encodeURIComponent(releaseTag)}`;
}

/**
 * Build an asset download URL (releases/download/<tag>/<assetName>).
 */
export function buildAssetUrl(
  serverUrl: string,
  repo: string,
  releaseTag: string,
  assetName: string
): string {
  const base = serverUrl.replace(/\/$/, '');
  return `${base}/${repo}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(assetName)}`;
}

/**
 * Canonical asset names for evidence packages.
 */
export const CANONICAL_ASSET_NAMES = {
  bundleZip: (runId: string) => `autonomy-evidence-bundle-${runId}.zip`,
  manifestJson: (runId: string) => `autonomy-evidence-manifest-${runId}.json`,
  evidenceIndexJson: 'autonomy-evidence-index.json',
  ledgerHtml: 'autonomy-ledger.html',
  dashboardHtml: 'autonomy-dashboard.html',
  custodyHtml: 'autonomy-custody.html',
  custodyAttestationJson: 'custody-attestation.json',
} as const;

/**
 * Build all release assets with immutable URLs.
 */
export function buildReleaseAssets(
  serverUrl: string,
  repo: string,
  releaseTag: string,
  runId: string
): ReleaseAssets {
  const makeAsset = (name: string): ReleaseAsset => ({
    name,
    url: buildAssetUrl(serverUrl, repo, releaseTag, name),
  });

  return {
    bundleZip: makeAsset(CANONICAL_ASSET_NAMES.bundleZip(runId)),
    manifestJson: makeAsset(CANONICAL_ASSET_NAMES.manifestJson(runId)),
    evidenceIndexJson: makeAsset(CANONICAL_ASSET_NAMES.evidenceIndexJson),
    ledgerHtml: makeAsset(CANONICAL_ASSET_NAMES.ledgerHtml),
    dashboardHtml: makeAsset(CANONICAL_ASSET_NAMES.dashboardHtml),
    custodyHtml: makeAsset(CANONICAL_ASSET_NAMES.custodyHtml),
    custodyAttestationJson: makeAsset(CANONICAL_ASSET_NAMES.custodyAttestationJson),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Index Generation
// ─────────────────────────────────────────────────────────────────────────────

interface ApplyProof {
  proofId?: string;
  planItemId?: string;
  strategyId?: string;
  outcome?: 'applied' | 'noop' | 'skipped' | 'blocked' | 'dry-run';
  finalCommitSha?: string;
  rollbackCommand?: string;
}

export function loadApplyProofs(artifactsDir: string, verbose = false): ApplyProof[] {
  const proofPath = join(artifactsDir, 'apply-proofs.json');
  if (!existsSync(proofPath)) {
    if (verbose) console.log(`  No apply-proofs.json found at ${proofPath}`);
    return [];
  }

  try {
    const content = readFileSync(proofPath, 'utf8');
    const data = JSON.parse(content);

    // Handle both array and { proofs: [] } formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.proofs && Array.isArray(data.proofs)) {
      return data.proofs;
    }
    return [];
  } catch {
    if (verbose) console.log(`  Failed to parse apply-proofs.json`);
    return [];
  }
}

function buildRecords(opts: IndexOptions, proofs: ApplyProof[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];

  // If no proofs, create a single "noop" record
  if (proofs.length === 0) {
    records.push({
      recordId: `run-${opts.runId}-noop`,
      status: 'noop',
      planItemId: 'none',
      strategyId: 'none',
      finalCommitSha: '',
      bundle: {
        name: opts.bundleName || `autonomy-evidence-bundle-${opts.runId}.zip`,
        manifestSha256: opts.manifestSha,
        verify: {
          ok: opts.verifyOk,
          strict: opts.verifyStrict,
        },
      },
      artifacts: detectArtifacts(opts),
      rollback: {
        command: '',
        preview: '',
      },
      retention: {
        days: getRetentionDays(opts.retentionTier),
        policy: RETENTION_POLICY_VERSION,
        tier: opts.retentionTier,
      },
    });
  }

  // Create a record for each proof
  for (const proof of proofs) {
    const planItemId = proof.planItemId || proof.proofId || 'unknown';
    const recordId = `run-${opts.runId}-planItem-${planItemId}`;

    records.push({
      recordId,
      status: proof.outcome || 'noop',
      planItemId,
      strategyId: proof.strategyId || 'unknown',
      finalCommitSha: proof.finalCommitSha || '',
      bundle: {
        name: opts.bundleName || `autonomy-evidence-bundle-${opts.runId}.zip`,
        manifestSha256: opts.manifestSha,
        verify: {
          ok: opts.verifyOk,
          strict: opts.verifyStrict,
        },
      },
      artifacts: detectArtifacts(opts),
      rollback: {
        command: planItemId !== 'unknown' ? `pnpm perf:rollback --proof ${planItemId}` : '',
        preview:
          planItemId !== 'unknown' ? `pnpm perf:rollback --proof ${planItemId} --dry-run` : '',
      },
      retention: {
        days: getRetentionDays(opts.retentionTier),
        policy: RETENTION_POLICY_VERSION,
        tier: opts.retentionTier,
      },
    });
  }

  // Sort by recordId for determinism
  records.sort((a, b) => a.recordId.localeCompare(b.recordId));

  return records;
}

function detectArtifacts(opts: IndexOptions): EvidenceArtifacts {
  const artifacts: EvidenceArtifacts = {};

  if (opts.artifactsDir) {
    const checkFile = (name: string) => existsSync(join(opts.artifactsDir, name));

    if (checkFile('autonomy-dashboard.html')) {
      artifacts.dashboardHtml = 'autonomy-dashboard.html';
    }
    if (checkFile('autonomy-dashboard.json')) {
      artifacts.dashboardJson = 'autonomy-dashboard.json';
    }
    if (checkFile('apply-proofs.json')) {
      artifacts.applyProofsJson = 'apply-proofs.json';
    }
    if (checkFile('perf.plan.json')) {
      artifacts.perfPlanJson = 'perf.plan.json';
    }
    if (checkFile('perf-audit-report.actionable.json')) {
      artifacts.actionableJson = 'perf-audit-report.actionable.json';
    }
  }

  return artifacts;
}

export function buildEvidenceIndex(opts: IndexOptions): EvidenceIndex {
  const proofs = opts.artifactsDir ? loadApplyProofs(opts.artifactsDir, opts.verbose) : [];
  const records = buildRecords(opts, proofs);

  const index: EvidenceIndex = {
    schema: 'terrafusion.autonomy.evidence.index.v1',
    generatedAt: new Date().toISOString(),
    source: {
      workflow: opts.workflow,
      runId: opts.runId,
      repo: opts.repo,
      ref: opts.ref,
    },
    records,
  };

  // Add incident fields if applicable
  if (opts.incident && opts.incidentPr > 0) {
    index.incident = true;
    index.incidentSource = {
      pr: opts.incidentPr,
      mergedAt: new Date().toISOString(),
    };
    // Release tag follows annual format for incident tier (if not already set)
    if (!opts.releaseTag) {
      const year = new Date().getFullYear();
      index.releaseTag = `autonomy-incident/${year}`;
    }
  }

  // Phase 4N14: Add immutable release URLs when releaseTag is provided
  if (opts.releaseTag) {
    index.releaseTag = opts.releaseTag;
    index.releaseUrl = buildReleaseUrl(opts.serverUrl, opts.repo, opts.releaseTag);
    index.assets = buildReleaseAssets(opts.serverUrl, opts.repo, opts.releaseTag, opts.runId);

    // Validate all URLs are immutable (fail-fast if mutable refs detected)
    const releaseUrlError = validateImmutableUrl(index.releaseUrl);
    if (releaseUrlError) {
      throw new Error(`Immutable URL validation failed: ${releaseUrlError}`);
    }
  }

  return index;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs();

  if (opts.verbose) {
    console.log('📋 Phase 4N6: Generating Evidence Index...');
    console.log(`  Run ID: ${opts.runId}`);
    console.log(`  Workflow: ${opts.workflow}`);
    console.log(`  Output: ${opts.outDir}`);
  }

  // Build index
  const index = buildEvidenceIndex(opts);

  // Ensure output directory exists
  if (!existsSync(opts.outDir)) {
    mkdirSync(opts.outDir, { recursive: true });
  }

  // Write index
  const indexPath = join(opts.outDir, 'autonomy-evidence-index.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2));

  if (opts.verbose) {
    console.log(`✅ Evidence index written: ${indexPath}`);
    console.log(`   Records: ${index.records.length}`);
    console.log(`   Retention: ${DEFAULT_RETENTION_DAYS} days`);
  }
}

// Run if main module
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('evidence-index.ts') || process.argv[1].endsWith('evidence-index.js'));

if (isMain) {
  main();
}
