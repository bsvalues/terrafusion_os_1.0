/**
 * Phase 4N10 — Autonomy Evidence Ledger Viewer (Static Generator)
 *
 * Generates a deterministic, offline-first HTML page that shows all evidence
 * records across runs. This is the "front door" for County CIO / auditors.
 *
 * Features:
 *   - Zero dependencies (embedded CSS, no JS required for core functionality)
 *   - Deterministic output (same input → identical HTML)
 *   - Filterable by tier (ci/merged/incident) and verification status
 *   - Shows verify command, manifest SHA256, release tag for each record
 *   - Offline-capable single HTML file
 *
 * Usage:
 *   pnpm perf:evidence-ledger [options]
 *   npx tsx tools/registry/autonomy-viewer/src/evidence-ledger-viewer.ts [options]
 *
 * Options:
 *   --in <dir|file>       Input: directory of index files or single index JSON
 *   --out <path>          Output HTML path (default: ./autonomy-ledger.html)
 *   --title <string>      Page title override
 *   --release-base <url>  Base URL for release downloads
 *   --verbose             Verbose output
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EvidenceIndex, EvidenceRecord } from './evidence-index.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  /** From source.runId */
  runId: string;
  /** From generatedAt */
  date: string;
  /** Tier: ci | merged | incident */
  tier: 'ci' | 'merged' | 'incident';
  /** Bundle name */
  bundleName: string;
  /** Manifest SHA256 (full) */
  manifestSha256: string;
  /** Release tag (e.g., autonomy-evidence/2026-01) */
  releaseTag: string;
  /** Verify command */
  verifyCommand: string;
  /** Verification status */
  verifyOk: boolean;
  verifyStrict: boolean;
  /** Record counts */
  appliedCount: number;
  noopCount: number;
  skippedCount: number;
  blockedCount: number;
  /** Incident info (if applicable) */
  incident?: boolean;
  incidentPr?: number;
  /** Source metadata */
  workflow: string;
  repo: string;
  ref: string;
  /** Phase 4N14: Immutable URLs (derived from evidence index) */
  releaseUrl?: string;
  bundleUrl?: string;
  /** Phase 4N15: Local availability status */
  localBundleMissing?: boolean;
  /** Phase 4N16: Signature status */
  signature?: {
    signed: boolean;
    bundleUrl?: string;
    identity?: string;
    issuer?: string;
    verified?: { ok: boolean; checkedAt: string; error?: string };
    /** Phase 4N20: Whether signature pins were verified */
    pinned?: boolean;
    /** Phase 4N20: If not pinned, why (for audit visibility) */
    pinMismatchReason?: string;
  };
  /** Phase 4N21: Rekor transparency log anchoring */
  rekor?: {
    anchored: boolean;
    logIndex?: number;
    integratedTime?: number;
    entryUrl?: string;
  };
  /** Phase 4N22: Two-Person Integrity (TPI) verification status */
  tpi?: {
    ok: boolean;
    minApprovals: number;
    approverLogins: string[];
    policyVersion: string;
    evaluatedAt?: string;
  };
  /** Phase 4N23: Break-Glass Protocol status */
  breakGlass?: {
    activated: boolean;
    reason: string;
    action: string;
    approvers: string[];
    approvalsRequired: number;
    policySha: string;
    policyVersion: string;
  };
  /** Phase 4N25: Role Binding status */
  roleBinding?: {
    ok: boolean;
    skipped?: boolean;
    requiredRoles: string[];
    satisfiedRoles: string[];
    missingRoles: string[];
    securityApprovers: string[];
    cioApprovers: string[];
  };
}

export interface LedgerViewModel {
  /** Schema version */
  schema: string;
  /** Generation timestamp (deterministic) */
  generatedAt: string;
  /** Source description */
  source: string;
  /** Page title */
  title: string;
  /** Release base URL (for download links) */
  releaseBaseUrl: string;
  /** All entries sorted by tier → date desc → bundleName lex */
  entries: LedgerEntry[];
  /** Summary counts */
  summary: {
    total: number;
    byTier: { ci: number; merged: number; incident: number };
    verifiedCount: number;
    failedCount: number;
    /** Phase 4N16: Signature counts */
    signedCount: number;
    unsignedCount: number;
    /** Phase 4N20: Pinned count */
    pinnedCount: number;
    /** Phase 4N20: Count of signed but not pinned (red flag) */
    unpinnedCount: number;
    /** Phase 4N21: Rekor anchored count */
    rekorAnchoredCount: number;
    /** Phase 4N22: TPI verified count */
    tpiVerifiedCount: number;
    /** Phase 4N23: Break-Glass activated count */
    breakGlassCount: number;
    /** Phase 4N25: Role binding verified count */
    roleBindingCount: number;
    /** Phase 4N25: Role binding failures */
    roleBindingFailedCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface ViewerOptions {
  inputPath: string;
  outputPath: string;
  title: string;
  releaseBaseUrl: string;
  verbose: boolean;
}

function parseArgs(): ViewerOptions {
  const args = process.argv.slice(2);
  const opts: ViewerOptions = {
    inputPath: './dist',
    outputPath: './autonomy-ledger.html',
    title: 'TerraFusion Autonomy Evidence Ledger',
    releaseBaseUrl: '',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--in' && args[i + 1]) {
      opts.inputPath = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      opts.outputPath = args[++i];
    } else if (arg === '--title' && args[i + 1]) {
      opts.title = args[++i];
    } else if (arg === '--release-base' && args[i + 1]) {
      opts.releaseBaseUrl = args[++i];
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
TerraFusion Evidence Ledger Viewer

Usage:
  pnpm perf:evidence-ledger [options]

Options:
  --in <dir|file>       Input: directory of index files or single index JSON
  --out <path>          Output HTML path (default: ./autonomy-ledger.html)
  --title <string>      Page title override
  --release-base <url>  Base URL for release downloads
  --verbose             Verbose output
  --help, -h            Show this help
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Index Loading
// ─────────────────────────────────────────────────────────────────────────────

const EVIDENCE_INDEX_SCHEMA = 'terrafusion.autonomy.evidence.index.v1';

export function loadIndices(inputPath: string, verbose = false): EvidenceIndex[] {
  const indices: EvidenceIndex[] = [];

  if (!existsSync(inputPath)) {
    if (verbose) console.log(`  Input path not found: ${inputPath}`);
    return indices;
  }

  // Check if it's a file or directory
  const stat = require('node:fs').statSync(inputPath);

  if (stat.isFile()) {
    // Single file
    const index = loadSingleIndex(inputPath, verbose);
    if (index) indices.push(index);
  } else if (stat.isDirectory()) {
    // Directory - find all index files
    const files = readdirSync(inputPath).filter(
      f => f.endsWith('.json') && (f.includes('evidence-index') || f.includes('incident-index'))
    );

    for (const file of files) {
      const index = loadSingleIndex(join(inputPath, file), verbose);
      if (index) indices.push(index);
    }
  }

  return indices;
}

function loadSingleIndex(filePath: string, verbose = false): EvidenceIndex | null {
  try {
    const content = readFileSync(filePath, 'utf8');
    const data = JSON.parse(content) as EvidenceIndex;

    if (data.schema !== EVIDENCE_INDEX_SCHEMA) {
      if (verbose) console.log(`  Skipping ${basename(filePath)}: wrong schema`);
      return null;
    }

    if (verbose) console.log(`  Loaded: ${basename(filePath)} (${data.records.length} records)`);
    return data;
  } catch (e) {
    if (verbose) console.log(`  Failed to load ${basename(filePath)}: ${e}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger Entry Builder
// ─────────────────────────────────────────────────────────────────────────────

function getTierFromRecord(
  record: EvidenceRecord,
  index: EvidenceIndex
): 'ci' | 'merged' | 'incident' {
  // Check if index has incident flag
  if (index.incident) return 'incident';
  // Check retention tier from record
  const tier = (record.retention as { tier?: string })?.tier;
  if (tier === 'incident') return 'incident';
  if (tier === 'merged') return 'merged';
  return 'ci';
}

function getReleaseTag(index: EvidenceIndex, tier: 'ci' | 'merged' | 'incident'): string {
  // If index has explicit releaseTag, use it
  if (index.releaseTag) return index.releaseTag;

  // Otherwise, derive from tier and date
  const date = new Date(index.generatedAt);
  if (tier === 'incident') {
    return `autonomy-incident/${date.getFullYear()}`;
  } else if (tier === 'merged') {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `autonomy-evidence/${date.getFullYear()}-${month}`;
  }
  return 'ci-artifacts';
}

/**
 * Build ledger entries from evidence indices.
 * @param indices - Evidence index files
 * @param localBundles - Optional set of locally available bundle names (for 4N15b local-missing badge)
 */
export function buildLedgerEntries(
  indices: EvidenceIndex[],
  localBundles?: Set<string>
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  for (const index of indices) {
    for (const record of index.records) {
      const tier = getTierFromRecord(record, index);
      const releaseTag = getReleaseTag(index, tier);

      // Phase 4N14: Extract immutable URLs from index (zero-manual URL wiring)
      const releaseUrl = index.releaseUrl;
      const bundleUrl = index.assets?.bundleZip?.url;

      // Phase 4N15: Check if local bundle is missing when release URL exists
      const localBundleMissing =
        bundleUrl !== undefined &&
        localBundles !== undefined &&
        !localBundles.has(record.bundle.name);

      // Phase 4N16: Extract signature info from assets
      // Phase 4N20: Include pinned status from expectedSignaturePolicy
      const bundleAsset = index.assets?.bundleZip;
      const policy = index.expectedSignaturePolicy;
      const hasPins = !!(policy?.issuer && policy?.identity);

      // Phase 4N20: Determine why signature is not pinned (for auditor visibility)
      let pinMismatchReason: string | undefined;
      if (bundleAsset?.signature && !hasPins) {
        if (!policy) {
          pinMismatchReason = 'No signature policy in index';
        } else if (!policy.issuer) {
          pinMismatchReason = 'Missing issuer in policy';
        } else if (!policy.identity) {
          pinMismatchReason = 'Missing identity in policy';
        }
      }

      const signature = bundleAsset?.signature
        ? {
            signed: true,
            bundleUrl: bundleAsset.signature.bundleUrl,
            identity: bundleAsset.signature.identity,
            issuer: bundleAsset.signature.issuer,
            verified: bundleAsset.signature.verified,
            pinned: hasPins,
            pinMismatchReason,
          }
        : { signed: false, pinned: false };

      // Phase 4N21: Extract Rekor anchoring info from signature
      const rekor = bundleAsset?.signature?.rekor
        ? {
            anchored: bundleAsset.signature.rekor.bundleValid,
            logIndex: bundleAsset.signature.rekor.logIndex,
            integratedTime: bundleAsset.signature.rekor.integratedTime,
            entryUrl: bundleAsset.signature.rekor.entryUrl,
          }
        : undefined;

      // Phase 4N22: Extract TPI verification from index
      const tpi = index.tpi
        ? {
            ok: index.tpi.ok,
            minApprovals: index.tpi.minApprovals,
            approverLogins: index.tpi.approverLogins,
            policyVersion: index.tpi.policyVersion,
            evaluatedAt: index.tpi.evaluatedAt,
          }
        : undefined;

      // Phase 4N23: Extract Break-Glass status from index
      const breakGlass = index.breakGlass
        ? {
            activated: index.breakGlass.activated,
            reason: index.breakGlass.reason,
            action: index.breakGlass.action,
            approvers: index.breakGlass.approvers,
            approvalsRequired: index.breakGlass.approvalsRequired,
            policySha: index.breakGlass.policySha,
            policyVersion: index.breakGlass.policyVersion,
          }
        : undefined;

      // Phase 4N25: Extract Role Binding status from index
      const roleBinding = index.roleBinding
        ? {
            ok: index.roleBinding.ok,
            skipped: index.roleBinding.skipped,
            requiredRoles: index.roleBinding.requiredRoles,
            satisfiedRoles: index.roleBinding.satisfiedRoles,
            missingRoles: index.roleBinding.missingRoles,
            securityApprovers: index.roleBinding.approverRoles?.security || [],
            cioApprovers: index.roleBinding.approverRoles?.cio || [],
          }
        : undefined;

      const entry: LedgerEntry = {
        runId: index.source.runId,
        date: index.generatedAt,
        tier,
        bundleName: record.bundle.name,
        manifestSha256: record.bundle.manifestSha256,
        releaseTag,
        verifyCommand: `pnpm perf:verify-bundle --zip "${record.bundle.name}" --strict`,
        verifyOk: record.bundle.verify.ok,
        verifyStrict: record.bundle.verify.strict,
        appliedCount: record.status === 'applied' ? 1 : 0,
        noopCount: record.status === 'noop' ? 1 : 0,
        skippedCount: record.status === 'skipped' ? 1 : 0,
        blockedCount: record.status === 'blocked' ? 1 : 0,
        incident: index.incident,
        incidentPr: index.incidentSource?.pr,
        workflow: index.source.workflow,
        repo: index.source.repo,
        ref: index.source.ref,
        releaseUrl,
        bundleUrl,
        localBundleMissing,
        signature,
        rekor,
        tpi,
        breakGlass,
        roleBinding,
      };

      entries.push(entry);
    }
  }

  // Sort: tier priority (incident > merged > ci) → date desc → bundleName lex
  const tierPriority: Record<string, number> = { incident: 0, merged: 1, ci: 2 };
  entries.sort((a, b) => {
    // Tier priority
    const tierDiff = tierPriority[a.tier] - tierPriority[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Date descending
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA;

    // Bundle name lexicographic
    return a.bundleName.localeCompare(b.bundleName);
  });

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// View Model Builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildLedgerViewModel(entries: LedgerEntry[], opts: ViewerOptions): LedgerViewModel {
  const summary = {
    total: entries.length,
    byTier: {
      ci: entries.filter(e => e.tier === 'ci').length,
      merged: entries.filter(e => e.tier === 'merged').length,
      incident: entries.filter(e => e.tier === 'incident').length,
    },
    verifiedCount: entries.filter(e => e.verifyOk).length,
    failedCount: entries.filter(e => !e.verifyOk).length,
    // Phase 4N16: Signature counts
    signedCount: entries.filter(e => e.signature?.signed).length,
    unsignedCount: entries.filter(e => !e.signature?.signed).length,
    // Phase 4N20: Pinned count
    pinnedCount: entries.filter(e => e.signature?.signed && e.signature?.pinned).length,
    // Phase 4N20: Unpinned count (red flag for auditors)
    unpinnedCount: entries.filter(e => e.signature?.signed && !e.signature?.pinned).length,
    // Phase 4N21: Rekor anchored count
    rekorAnchoredCount: entries.filter(e => e.rekor?.anchored).length,
    // Phase 4N22: TPI verified count
    tpiVerifiedCount: entries.filter(e => e.tpi?.ok).length,
    // Phase 4N23: Break-Glass activated count
    breakGlassCount: entries.filter(e => e.breakGlass?.activated).length,
    // Phase 4N25: Role binding counts
    roleBindingCount: entries.filter(e => e.roleBinding?.ok && !e.roleBinding?.skipped).length,
    roleBindingFailedCount: entries.filter(
      e => e.roleBinding && !e.roleBinding.ok && !e.roleBinding.skipped
    ).length,
  };

  return {
    schema: EVIDENCE_INDEX_SCHEMA,
    generatedAt: new Date().toISOString(),
    source: `Evidence Ledger from ${opts.inputPath}`,
    title: opts.title,
    releaseBaseUrl: opts.releaseBaseUrl,
    entries,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Generation
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toISOString().split('T')[0];
  } catch {
    return isoDate;
  }
}

function getTierBadgeClass(tier: 'ci' | 'merged' | 'incident'): string {
  switch (tier) {
    case 'incident':
      return 'badge-error';
    case 'merged':
      return 'badge-warning';
    default:
      return 'badge-muted';
  }
}

function getTierLabel(tier: 'ci' | 'merged' | 'incident'): string {
  switch (tier) {
    case 'incident':
      return 'Incident (7y)';
    case 'merged':
      return 'Merged (1y)';
    default:
      return 'CI (90d)';
  }
}

export function generateLedgerHtml(vm: LedgerViewModel): string {
  const css = `
    :root {
      --color-bg: #ffffff;
      --color-text: #1a1a1a;
      --color-muted: #6b7280;
      --color-border: #e5e7eb;
      --color-success: #059669;
      --color-warning: #d97706;
      --color-error: #dc2626;
      --color-info: #2563eb;
      --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg: #111827;
        --color-text: #f3f4f6;
        --color-muted: #9ca3af;
        --color-border: #374151;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    h1, h2, h3 { margin-bottom: 1rem; }
    h1 { font-size: 1.75rem; border-bottom: 2px solid var(--color-border); padding-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; color: var(--color-muted); margin-top: 2rem; }

    .header { margin-bottom: 2rem; }
    .header-meta { display: flex; gap: 2rem; flex-wrap: wrap; color: var(--color-muted); font-size: 0.875rem; margin-top: 0.5rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .summary-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }
    .summary-card .value { font-size: 2rem; font-weight: 700; }
    .summary-card .label { font-size: 0.75rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-bg);
      color: var(--color-text);
      cursor: pointer;
      font-size: 0.875rem;
      text-decoration: none;
    }
    .filter-btn:hover, .filter-btn.active { background: var(--color-border); }

    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid var(--color-border); }
    th { background: var(--color-border); font-weight: 600; position: sticky; top: 0; }
    tr:hover { background: rgba(0,0,0,0.02); }
    @media (prefers-color-scheme: dark) { tr:hover { background: rgba(255,255,255,0.02); } }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-danger { background: #fecaca; color: #7f1d1d; border: 1px solid #f87171; }
    .badge-muted { background: #f3f4f6; color: #4b5563; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    @media (prefers-color-scheme: dark) {
      .badge-error { background: #7f1d1d; color: #fecaca; }
      .badge-warning { background: #78350f; color: #fde68a; }
      .badge-success { background: #064e3b; color: #a7f3d0; }
      .badge-danger { background: #991b1b; color: #fecaca; border: 1px solid #f87171; }
      .badge-muted { background: #374151; color: #d1d5db; }
      .badge-info { background: #1e3a5f; color: #93c5fd; }
    }

    /* Phase 4N20: Red flag for unpinned signatures */
    .row-unpinned { background: #fef2f2 !important; }
    @media (prefers-color-scheme: dark) {
      .row-unpinned { background: #450a0a !important; }
    }

    /* Phase 4N23: Break-Glass row highlight */
    .row-break-glass { background: #fef3c7 !important; border-left: 4px solid var(--color-error); }
    @media (prefers-color-scheme: dark) {
      .row-break-glass { background: #78350f !important; }
    }

    .verify-status { font-weight: 600; }
    .verify-ok { color: var(--color-success); }
    .verify-fail { color: var(--color-error); }

    /* Phase 4N16: Signature status */
    .sig-status { font-weight: 600; font-size: 0.8rem; }
    .sig-signed { color: var(--color-info); }
    .sig-unsigned { color: var(--color-muted); }

    .sha { font-family: var(--font-mono); font-size: 0.7rem; word-break: break-all; }
    .cmd { font-family: var(--font-mono); font-size: 0.75rem; background: var(--color-border); padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-block; max-width: 100%; overflow-x: auto; }

    /* Phase 4N15: Local-missing badge */
    .local-missing { font-size: 0.7rem; color: var(--color-warning); margin-left: 0.25rem; }

    .instructions { background: var(--color-border); padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
    .instructions h3 { margin-bottom: 0.5rem; }
    .instructions code { font-family: var(--font-mono); background: var(--color-bg); padding: 0.25rem 0.5rem; border-radius: 4px; }
    .instructions pre { background: var(--color-bg); padding: 1rem; border-radius: 4px; overflow-x: auto; margin-top: 0.5rem; }

    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--color-border); text-align: center; color: var(--color-muted); font-size: 0.75rem; }

    @media (max-width: 768px) {
      body { padding: 1rem; }
      table { display: block; overflow-x: auto; }
    }
  `;

  const rowsHtml = vm.entries
    .map((entry, idx) => {
      const tierBadge = `<span class="badge ${getTierBadgeClass(entry.tier)}">${escapeHtml(getTierLabel(entry.tier))}</span>`;
      const verifyClass = entry.verifyOk ? 'verify-ok' : 'verify-fail';
      const verifyText = entry.verifyOk ? '✓' : '✗';
      const incidentInfo = entry.incident && entry.incidentPr ? ` (PR #${entry.incidentPr})` : '';

      // Phase 4N16: Signature status cell
      // Phase 4N20: Add pinned badge with mismatch reason
      const sigClass = entry.signature?.signed ? 'sig-signed' : 'sig-unsigned';
      const sigText = entry.signature?.signed ? '🔏 Signed' : '—';
      const mismatchReason = entry.signature?.pinMismatchReason
        ? ` (${entry.signature.pinMismatchReason})`
        : '';
      const pinnedBadge =
        entry.signature?.signed && entry.signature?.pinned
          ? ' <span class="badge badge-success" title="Signature identity pins verified">📌 Pinned</span>'
          : entry.signature?.signed
            ? ` <span class="badge badge-danger" title="Signature not pinned${mismatchReason} - VERIFY MANUALLY">🚨 Not pinned</span>`
            : '';
      const sigTitle =
        entry.signature?.signed && entry.signature.identity
          ? `Signed by: ${entry.signature.identity}${entry.signature.pinned ? ' (pinned)' : mismatchReason}`
          : 'Not signed';

      // Phase 4N20: Row class for red flag visibility
      const rowClass = entry.signature?.signed && !entry.signature?.pinned ? 'row-unpinned' : '';

      // Phase 4N14: Render bundle as link when URL is available
      // Phase 4N15: Show local-missing badge when bundle URL exists but local file is absent
      let bundleCell = entry.bundleUrl
        ? `<a href="${escapeHtml(entry.bundleUrl)}" title="Download bundle">${escapeHtml(entry.bundleName)}</a>`
        : escapeHtml(entry.bundleName);

      if (entry.localBundleMissing) {
        bundleCell += `<span class="local-missing" title="Bundle available on release but not in local packet">⚠️ local-missing</span>`;
      }

      // Phase 4N14: Render release tag as link when URL is available
      const releaseTagCell = entry.releaseUrl
        ? `<a href="${escapeHtml(entry.releaseUrl)}" title="View release">${escapeHtml(entry.releaseTag)}</a>`
        : escapeHtml(entry.releaseTag);

      // Phase 4N21: Rekor anchoring badge
      const rekorClass = entry.rekor?.anchored ? 'rekor-anchored' : 'rekor-missing';
      const rekorBadge = entry.rekor?.anchored
        ? `<span class="badge badge-success" title="Rekor log index: ${entry.rekor.logIndex}">🧾 Anchored</span>`
        : entry.signature?.signed
          ? '<span class="badge badge-danger" title="No Rekor anchor found">🚨 Missing</span>'
          : '<span class="badge badge-muted">—</span>';

      // Phase 4N22: TPI badge with approver list
      const tpiOk = entry.tpi?.ok ?? false;
      const tpiApprovers = entry.tpi?.approverLogins?.join(', ') || '';
      const tpiBadge = tpiOk
        ? `<span class="badge badge-success" title="Two-person integrity verified: ${escapeHtml(tpiApprovers)}">👥 TPI</span>`
        : entry.tier !== 'ci'
          ? '<span class="badge badge-danger" title="TPI not verified">🚨 Missing</span>'
          : '<span class="badge badge-muted">—</span>';

      // Phase 4N23: Break-Glass badge
      const breakGlassActivated = entry.breakGlass?.activated ?? false;
      const breakGlassApprovers = entry.breakGlass?.approvers?.join(', ') || '';
      const breakGlassReason = entry.breakGlass?.reason || '';
      const breakGlassBadge = breakGlassActivated
        ? `<span class="badge badge-error" title="Break-Glass: ${escapeHtml(breakGlassReason)} | Approvers: ${escapeHtml(breakGlassApprovers)}">🚨 Break-Glass</span>`
        : '';

      // Phase 4N25: Role Binding badge
      const roleBindingOk = entry.roleBinding?.ok ?? false;
      const roleBindingSkipped = entry.roleBinding?.skipped ?? false;
      const roleBindingSecurityApprovers = entry.roleBinding?.securityApprovers?.join(', ') || '';
      const roleBindingCioApprovers = entry.roleBinding?.cioApprovers?.join(', ') || '';
      const roleBindingMissing = entry.roleBinding?.missingRoles?.join(', ') || '';
      let roleBindingBadge = '';
      if (breakGlassActivated && !roleBindingSkipped) {
        if (roleBindingOk) {
          roleBindingBadge = `<span class="badge badge-success" title="Security: ${escapeHtml(roleBindingSecurityApprovers)} | CIO: ${escapeHtml(roleBindingCioApprovers)}">🔐 Roles</span>`;
        } else {
          roleBindingBadge = `<span class="badge badge-danger" title="Missing roles: ${escapeHtml(roleBindingMissing)}">❌ Roles</span>`;
        }
      }

      return `
        <tr class="${rowClass}${breakGlassActivated ? ' row-break-glass' : ''}" data-tier="${entry.tier}" data-verify="${entry.verifyOk}" data-signed="${entry.signature?.signed ?? false}" data-pinned="${entry.signature?.pinned ?? false}" data-rekor="${entry.rekor?.anchored ?? false}" data-tpi="${tpiOk}" data-breakglass="${breakGlassActivated}" data-rolebinding="${roleBindingOk}">
          <td>${formatDate(entry.date)}</td>
          <td>${escapeHtml(entry.runId)}</td>
          <td>${tierBadge}${incidentInfo}${breakGlassBadge}${roleBindingBadge}</td>
          <td>${bundleCell}</td>
          <td class="sha">${escapeHtml(entry.manifestSha256.substring(0, 16))}...</td>
          <td>${releaseTagCell}</td>
          <td class="verify-status ${verifyClass}">${verifyText}</td>
          <td class="sig-status ${sigClass}" title="${escapeHtml(sigTitle)}">${sigText}${pinnedBadge}</td>
          <td class="${rekorClass}">${rekorBadge}</td>
          <td>${tpiBadge}</td>
        </tr>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vm.title)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="header">
    <h1>📋 ${escapeHtml(vm.title)}</h1>
    <div class="header-meta">
      <span>Schema: ${escapeHtml(vm.schema)}</span>
      <span>Generated: ${formatDate(vm.generatedAt)}</span>
      <span>Source: ${escapeHtml(vm.source)}</span>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="value">${vm.summary.total}</div>
      <div class="label">Total</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-error)">${vm.summary.byTier.incident}</div>
      <div class="label">Incident</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-warning)">${vm.summary.byTier.merged}</div>
      <div class="label">Merged</div>
    </div>
    <div class="summary-card">
      <div class="value">${vm.summary.byTier.ci}</div>
      <div class="label">CI</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-success)">${vm.summary.verifiedCount}</div>
      <div class="label">Verified</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-info)">${vm.summary.signedCount}</div>
      <div class="label">Signed</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-success)">${vm.summary.pinnedCount}</div>
      <div class="label">📌 Pinned</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${vm.summary.unpinnedCount > 0 ? 'var(--color-error)' : 'var(--color-muted)'}">${vm.summary.unpinnedCount}</div>
      <div class="label">${vm.summary.unpinnedCount > 0 ? '🚨' : ''} Unpinned</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--color-success)">${vm.summary.rekorAnchoredCount}</div>
      <div class="label">🧾 Anchored</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${vm.summary.tpiVerifiedCount > 0 ? 'var(--color-success)' : 'var(--color-muted)'}">${vm.summary.tpiVerifiedCount}</div>
      <div class="label">👥 TPI</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${vm.summary.breakGlassCount > 0 ? 'var(--color-error)' : 'var(--color-muted)'}">${vm.summary.breakGlassCount}</div>
      <div class="label">${vm.summary.breakGlassCount > 0 ? '🚨' : ''} Break-Glass</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${vm.summary.roleBindingCount > 0 ? 'var(--color-success)' : vm.summary.roleBindingFailedCount > 0 ? 'var(--color-error)' : 'var(--color-muted)'}">${vm.summary.roleBindingCount}${vm.summary.roleBindingFailedCount > 0 ? '/' + vm.summary.roleBindingFailedCount + '❌' : ''}</div>
      <div class="label">🔐 Roles</div>
    </div>
  </div>

  <h2>Evidence Records</h2>

  <div class="filters">
    <a href="#" class="filter-btn" onclick="filterTable('all'); return false;">All</a>
    <a href="#" class="filter-btn" onclick="filterTable('incident'); return false;">Incident</a>
    <a href="#" class="filter-btn" onclick="filterTable('merged'); return false;">Merged</a>
    <a href="#" class="filter-btn" onclick="filterTable('ci'); return false;">CI</a>
    <a href="#" class="filter-btn" onclick="filterTable('verified'); return false;">Verified</a>
    <a href="#" class="filter-btn" onclick="filterTable('signed'); return false;">Signed</a>
    <a href="#" class="filter-btn" onclick="filterTable('tpi'); return false;">TPI</a>
    <a href="#" class="filter-btn" onclick="filterTable('breakglass'); return false;">Break-Glass</a>
    <a href="#" class="filter-btn" onclick="filterTable('rolebinding'); return false;">🔐 Roles</a>
  </div>

  <table id="evidence-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Run ID</th>
        <th>Tier</th>
        <th>Bundle</th>
        <th>Manifest SHA</th>
        <th>Release Tag</th>
        <th>Verify</th>
        <th>Signature</th>
        <th>Rekor</th>
        <th>TPI</th>
      </tr>
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>

  <div class="instructions">
    <h3>🔐 Verification Instructions</h3>
    <p>To verify any evidence bundle offline:</p>
    <pre><code># Hash verification
pnpm perf:verify-bundle --zip "&lt;bundle-name&gt;.zip" --strict

# Signature verification (Phase 4N16)
pnpm perf:verify-signature --artifact "&lt;bundle-name&gt;.zip" --bundle "&lt;bundle-name&gt;.zip.bundle"</code></pre>
    <p style="margin-top: 1rem;">Exit code 0 = verified. Non-zero = integrity failure.</p>
  </div>

  <div class="footer">
    <p>TerraFusion Autonomy v1 — Government. Transcended.</p>
    <p>This ledger is offline-capable. No network requests required to view.</p>
  </div>

  <script>
    function filterTable(filter) {
      const rows = document.querySelectorAll('#evidence-table tbody tr');
      rows.forEach(row => {
        const tier = row.dataset.tier;
        const verify = row.dataset.verify === 'true';
        const signed = row.dataset.signed === 'true';
        const tpi = row.dataset.tpi === 'true';
        const breakglass = row.dataset.breakglass === 'true';
        const rolebinding = row.dataset.rolebinding === 'true';
        let show = true;
        if (filter === 'incident') show = tier === 'incident';
        else if (filter === 'merged') show = tier === 'merged';
        else if (filter === 'ci') show = tier === 'ci';
        else if (filter === 'verified') show = verify;
        else if (filter === 'failed') show = !verify;
        else if (filter === 'signed') show = signed;
        else if (filter === 'tpi') show = tpi;
        else if (filter === 'breakglass') show = breakglass;
        else if (filter === 'rolebinding') show = rolebinding;
        row.style.display = show ? '' : 'none';
      });
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function generateLedger(opts: ViewerOptions): { html: string; viewModel: LedgerViewModel } {
  const indices = loadIndices(opts.inputPath, opts.verbose);
  const entries = buildLedgerEntries(indices);
  const viewModel = buildLedgerViewModel(entries, opts);
  const html = generateLedgerHtml(viewModel);
  return { html, viewModel };
}

function main(): void {
  const opts = parseArgs();

  if (opts.verbose) {
    console.log('📋 Phase 4N10: Generating Evidence Ledger...');
    console.log(`  Input: ${opts.inputPath}`);
    console.log(`  Output: ${opts.outputPath}`);
  }

  const { html, viewModel } = generateLedger(opts);

  // Ensure output directory exists
  const outDir = dirname(opts.outputPath);
  if (outDir && !existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(opts.outputPath, html);

  if (opts.verbose) {
    console.log(`✅ Evidence ledger written: ${opts.outputPath}`);
    console.log(`   Total entries: ${viewModel.summary.total}`);
    console.log(`   Incident: ${viewModel.summary.byTier.incident}`);
    console.log(`   Merged: ${viewModel.summary.byTier.merged}`);
    console.log(`   CI: ${viewModel.summary.byTier.ci}`);
  }
}

// Run if main module
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('evidence-ledger-viewer.ts') ||
    process.argv[1].endsWith('evidence-ledger-viewer.js'));

if (isMain) {
  main();
}
