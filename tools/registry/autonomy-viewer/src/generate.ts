/**
 * Phase 4M9 / 4N7 — Autonomy Dashboard Generator
 *
 * Generates a standalone, offline HTML dashboard from autonomy artifacts.
 * Zero external dependencies - pure static HTML with embedded CSS/JS.
 *
 * Phase 4N7: Adds Evidence Ledger section from autonomy-evidence-index.json
 *
 * Usage:
 *   npx tsx tools/registry/autonomy-viewer/src/generate.ts [options]
 *
 * Options:
 *   --artifacts=<dir>       Directory containing artifacts (default: ../perf-skill-audit/out)
 *   --output=<dir>          Output directory (default: ./dist)
 *   --evidence-index=<path> Path to evidence index JSON (optional, auto-detected)
 *   --emit-json             Also emit view-model as JSON
 *   --verbose              Verbose output
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ActionableReport,
  ApplyProof,
  AutonomyReport,
  DashboardViewModel,
  EvidenceIndex,
  PerfPlan,
  SafetyRailsStatus,
} from './types.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VIEWER_VERSION = '1.0.0';

const DEFAULT_ARTIFACTS_DIR = join(__dirname, '..', '..', 'perf-skill-audit', 'out');
const DEFAULT_OUTPUT_DIR = join(__dirname, '..', 'dist');

const ARTIFACT_FILES = {
  autonomyReport: 'autonomy-report.json',
  applyProofs: 'apply-proofs.json',
  perfPlan: 'perf.plan.json',
  actionableReport: 'perf-audit-report.actionable.json',
};

const POST_ROLLBACK_GATES = [
  'pnpm run type-check',
  'node --test os-platform/core/tests/phase83-tools.test.mjs',
];

const ARTIFACTS_PURPOSE = [
  { name: 'apply-proofs.json', purpose: 'Full audit trail with rollback commands' },
  { name: 'autonomy-report.json', purpose: 'Machine-readable status for dashboards' },
  { name: 'autonomy-report.md', purpose: 'Human-readable summary' },
  { name: 'perf.plan.json', purpose: 'Original plan with all candidates' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface CliOptions {
  artifactsDir: string;
  outputDir: string;
  evidenceIndexPath: string;
  emitJson: boolean;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    artifactsDir: DEFAULT_ARTIFACTS_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    evidenceIndexPath: '',
    emitJson: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--artifacts=')) {
      opts.artifactsDir = resolve(arg.slice('--artifacts='.length));
    } else if (arg.startsWith('--output=')) {
      opts.outputDir = resolve(arg.slice('--output='.length));
    } else if (arg.startsWith('--evidence-index=')) {
      opts.evidenceIndexPath = resolve(arg.slice('--evidence-index='.length));
    } else if (arg === '--emit-json') {
      opts.emitJson = true;
    } else if (arg === '--verbose') {
      opts.verbose = true;
    }
  }

  return opts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Loading
// ─────────────────────────────────────────────────────────────────────────────

function loadJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function loadArtifacts(dir: string): {
  autonomyReport: AutonomyReport | null;
  applyProofs: ApplyProof[];
  perfPlan: PerfPlan | null;
  actionableReport: ActionableReport | null;
} {
  // Load apply-proofs.json - may be array or object with proofs array
  let applyProofs: ApplyProof[] = [];
  const proofsRaw = loadJsonSafe<unknown>(join(dir, ARTIFACT_FILES.applyProofs), null);
  if (Array.isArray(proofsRaw)) {
    applyProofs = proofsRaw as ApplyProof[];
  } else if (proofsRaw && typeof proofsRaw === 'object' && 'proofs' in proofsRaw) {
    applyProofs = (proofsRaw as { proofs: ApplyProof[] }).proofs || [];
  }

  return {
    autonomyReport: loadJsonSafe<AutonomyReport | null>(
      join(dir, ARTIFACT_FILES.autonomyReport),
      null
    ),
    applyProofs,
    perfPlan: loadJsonSafe<PerfPlan | null>(join(dir, ARTIFACT_FILES.perfPlan), null),
    actionableReport: loadJsonSafe<ActionableReport | null>(
      join(dir, ARTIFACT_FILES.actionableReport),
      null
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Index Loading (Phase 4N7)
// ─────────────────────────────────────────────────────────────────────────────

const EVIDENCE_INDEX_FILENAME = 'autonomy-evidence-index.json';

/**
 * Auto-detect evidence index in common locations (deterministic order):
 * 1. Explicit path (if provided)
 * 2. <artifactsDir>/autonomy-evidence-index.json
 * 3. <artifactsDir>/out/autonomy-evidence-index.json
 * 4. Lexicographically first autonomy-evidence-index*.json in artifactsDir
 */
function findEvidenceIndex(artifactsDir: string, explicitPath: string): string | null {
  // 1. Explicit path
  if (explicitPath && existsSync(explicitPath)) {
    return explicitPath;
  }

  // 2. Direct in artifacts dir
  const directPath = join(artifactsDir, EVIDENCE_INDEX_FILENAME);
  if (existsSync(directPath)) {
    return directPath;
  }

  // 3. In out/ subdirectory
  const outPath = join(artifactsDir, 'out', EVIDENCE_INDEX_FILENAME);
  if (existsSync(outPath)) {
    return outPath;
  }

  // 4. Lexicographically first match
  try {
    const files = readdirSync(artifactsDir)
      .filter(f => f.startsWith('autonomy-evidence-index') && f.endsWith('.json'))
      .sort();
    if (files.length > 0) {
      return join(artifactsDir, files[0]);
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return null;
}

function loadEvidenceIndex(
  artifactsDir: string,
  explicitPath: string,
  verbose: boolean
): EvidenceIndex | null {
  const indexPath = findEvidenceIndex(artifactsDir, explicitPath);

  if (!indexPath) {
    if (verbose) {
      console.log('  📋 Evidence index: not found (ledger section will be omitted)');
    }
    return null;
  }

  if (verbose) {
    console.log(`  📋 Evidence index: ${indexPath}`);
  }

  const index = loadJsonSafe<EvidenceIndex | null>(indexPath, null);

  // Validate schema
  if (index && index.schema !== 'terrafusion.autonomy.evidence.index.v1') {
    if (verbose) {
      console.log(`  ⚠️ Evidence index has unexpected schema: ${index.schema}`);
    }
    return null;
  }

  return index;
}

/**
 * Determine retention tier from days
 */
function getRetentionTier(days: number): { tier: 'ci' | 'merged' | 'incident'; label: string } {
  if (days >= 2555) {
    return { tier: 'incident', label: '7 years (Incident)' };
  } else if (days >= 365) {
    return { tier: 'merged', label: '1 year (Merged PR)' };
  } else {
    return { tier: 'ci', label: '90 days (CI Default)' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// View Model Builder
// ─────────────────────────────────────────────────────────────────────────────

function getOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    applied: '✅ Applied',
    skipped: '⏭️ Skipped',
    blocked: '🚫 Blocked',
    noop: '💤 No-op',
    'dry-run': '🔍 Dry Run',
  };
  return labels[outcome] || outcome;
}

function buildSafetyRailsView(
  rails: SafetyRailsStatus | undefined
): DashboardViewModel['safetyRails'] {
  if (!rails) {
    return [{ name: 'Safety Rails', passed: false, description: 'No safety rails data available' }];
  }

  return [
    {
      name: 'Allowed Surface',
      passed: rails.allowedSurface,
      description: 'Only modifies allowed paths',
    },
    {
      name: 'Forbidden Paths',
      passed: rails.forbiddenPaths,
      description: 'No forbidden paths touched',
    },
    {
      name: 'Base SHA Match',
      passed: rails.baseShaMatch,
      description: 'Applied on expected base commit',
    },
    {
      name: 'Clean Working Tree',
      passed: rails.cleanWorkingTree,
      description: 'No uncommitted changes',
    },
    {
      name: 'Protected Branch Guard',
      passed: rails.protectedBranchGuard,
      description: 'Not on main/master',
    },
    { name: 'Git Apply Check', passed: rails.gitApplyCheck, description: 'Patch applies cleanly' },
    {
      name: 'Gates Passed',
      passed: rails.gatesPassed,
      description: 'type-check + phase83-tools passed',
    },
  ];
}

function buildViewModel(
  artifacts: ReturnType<typeof loadArtifacts>,
  evidenceIndex: EvidenceIndex | null
): DashboardViewModel {
  const { autonomyReport, applyProofs, perfPlan } = artifacts;

  // Find applied proof (if any)
  const appliedProof = applyProofs.find(p => p.outcome === 'applied');

  // Build summary
  const summary: DashboardViewModel['summary'] = {
    runId: autonomyReport?.runId || 'unknown',
    timestamp: autonomyReport?.timestamp || new Date().toISOString(),
    outcome: appliedProof?.outcome || autonomyReport?.outcome || 'noop',
    outcomeLabel: getOutcomeLabel(appliedProof?.outcome || autonomyReport?.outcome || 'noop'),
    appliedCount:
      autonomyReport?.applied || applyProofs.filter(p => p.outcome === 'applied').length,
    skippedCount:
      autonomyReport?.skipped || applyProofs.filter(p => p.outcome === 'skipped').length,
    blockedCount:
      autonomyReport?.blocked || applyProofs.filter(p => p.outcome === 'blocked').length,
    noopCount: autonomyReport?.noop || 0,
    selectionReason: appliedProof?.selectionReason?.message,
    appliedFile: appliedProof?.targetFile,
    appliedStrategy: appliedProof?.strategyId,
    appliedDiffStats: appliedProof?.diffStats
      ? {
          insertions: appliedProof.diffStats.insertions,
          deletions: appliedProof.diffStats.deletions,
        }
      : undefined,
  };

  // Build rollback panel
  const rollback: DashboardViewModel['rollback'] = {
    applicable: !!appliedProof,
    proofId: appliedProof?.planItemId,
    commitSha: appliedProof?.finalCommitSha,
    previewCommand: appliedProof?.planItemId
      ? `pnpm perf:rollback --proof ${appliedProof.planItemId} --dry-run`
      : undefined,
    executeCommand: appliedProof?.planItemId
      ? `pnpm perf:rollback --proof ${appliedProof.planItemId}`
      : undefined,
    manualCommand: appliedProof?.rollbackCommand,
    postRollbackGates: POST_ROLLBACK_GATES,
    reason: appliedProof ? undefined : 'No patches were applied - rollback not applicable',
  };

  // Build findings
  const planItems = perfPlan?.items || [];
  const eligible = planItems.filter(i => i.eligible);
  const filtered = planItems.filter(i => !i.eligible);

  const findings: DashboardViewModel['findings'] = {
    total: planItems.length,
    eligible: eligible.length,
    filtered: filtered.length,
    topFindings: planItems.slice(0, 10).map(i => ({
      kind: i.kind,
      file: i.file,
      priority: i.priority,
      riskScore: i.riskScore,
      estimatedLines: i.estimatedLinesChanged,
      filterReason: i.filterReason,
    })),
  };

  // Build evidence ledger (Phase 4N7)
  let evidenceLedger: DashboardViewModel['evidenceLedger'] = undefined;
  let verificationFailed = false;

  if (evidenceIndex && evidenceIndex.records.length > 0) {
    const firstRecord = evidenceIndex.records[0];
    const retentionInfo = getRetentionTier(firstRecord.retention.days);

    evidenceLedger = {
      present: true,
      schema: evidenceIndex.schema,
      generatedAt: evidenceIndex.generatedAt,
      source: {
        workflow: evidenceIndex.source.workflow,
        runId: evidenceIndex.source.runId,
        repo: evidenceIndex.source.repo,
        ref: evidenceIndex.source.ref,
      },
      bundle: {
        name: firstRecord.bundle.name,
        manifestSha256: firstRecord.bundle.manifestSha256,
        verifyOk: firstRecord.bundle.verify.ok,
        verifyStrict: firstRecord.bundle.verify.strict,
      },
      retention: {
        days: firstRecord.retention.days,
        policy: firstRecord.retention.policy,
        tier: retentionInfo.tier,
        tierLabel: retentionInfo.label,
      },
      verifyCommand: `pnpm perf:verify-bundle --zip "${firstRecord.bundle.name}"`,
      records: evidenceIndex.records.map(r => ({
        recordId: r.recordId,
        status: r.status,
        planItemId: r.planItemId,
        strategyId: r.strategyId,
      })),
    };

    // Check if verification failed
    verificationFailed = firstRecord.bundle.verify.ok === false;
  }

  return {
    generatedAt: new Date().toISOString(),
    viewerVersion: VIEWER_VERSION,
    summary,
    safetyRails: buildSafetyRailsView(autonomyReport?.safetyRails),
    rollback,
    findings,
    artifacts: ARTIFACTS_PURPOSE,
    evidenceLedger,
    verificationFailed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Template
// ─────────────────────────────────────────────────────────────────────────────

function generateHtml(vm: DashboardViewModel): string {
  const safetyRailsHtml = vm.safetyRails
    .map(
      r => `
        <tr>
          <td>${r.passed ? '✅' : '❌'}</td>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.description)}</td>
        </tr>`
    )
    .join('');

  const findingsHtml = vm.findings.topFindings
    .map(
      f => `
        <tr>
          <td>${escapeHtml(f.kind)}</td>
          <td title="${escapeHtml(f.file)}">${escapeHtml(truncatePath(f.file))}</td>
          <td>${f.priority}</td>
          <td>${f.riskScore}</td>
          <td>${f.estimatedLines}</td>
          <td>${f.filterReason ? escapeHtml(f.filterReason) : '—'}</td>
        </tr>`
    )
    .join('');

  const artifactsHtml = vm.artifacts
    .map(
      a => `
        <tr>
          <td><code>${escapeHtml(a.name)}</code></td>
          <td>${escapeHtml(a.purpose)}</td>
        </tr>`
    )
    .join('');

  // Evidence Ledger HTML (Phase 4N7)
  const evidenceLedgerHtml = vm.evidenceLedger
    ? `
    <!-- Evidence Ledger (Phase 4N7) -->
    <section id="evidence-ledger">
      <h2>📋 Evidence Ledger</h2>
      <table>
        <tr><th>Schema</th><td><code>${escapeHtml(vm.evidenceLedger.schema)}</code></td></tr>
        <tr><th>Generated At</th><td>${escapeHtml(vm.evidenceLedger.generatedAt)}</td></tr>
        <tr><th>Workflow</th><td><code>${escapeHtml(vm.evidenceLedger.source.workflow)}</code></td></tr>
        <tr><th>Run ID</th><td><code>${escapeHtml(vm.evidenceLedger.source.runId)}</code></td></tr>
        <tr><th>Repository</th><td><code>${escapeHtml(vm.evidenceLedger.source.repo)}</code></td></tr>
        <tr><th>Ref</th><td><code>${escapeHtml(vm.evidenceLedger.source.ref)}</code></td></tr>
      </table>

      <h3 style="margin-top: 1.5rem; font-size: 1rem;">📦 Evidence Bundle</h3>
      <table>
        <tr><th>Bundle Name</th><td><code>${escapeHtml(vm.evidenceLedger.bundle.name)}</code></td></tr>
        <tr><th>Manifest SHA256</th><td><code title="${escapeHtml(vm.evidenceLedger.bundle.manifestSha256)}">${escapeHtml(vm.evidenceLedger.bundle.manifestSha256)}</code></td></tr>
        <tr><th>Verification</th><td>${vm.evidenceLedger.bundle.verifyOk ? '✅ Passed' : '❌ Failed'}${vm.evidenceLedger.bundle.verifyStrict ? ' (strict)' : ''}</td></tr>
      </table>

      <h3 style="margin-top: 1.5rem; font-size: 1rem;">📅 Retention</h3>
      <table>
        <tr><th>Tier</th><td><span class="badge ${vm.evidenceLedger.retention.tier === 'incident' ? 'badge-error' : vm.evidenceLedger.retention.tier === 'merged' ? 'badge-warning' : 'badge-muted'}">${escapeHtml(vm.evidenceLedger.retention.tierLabel)}</span></td></tr>
        <tr><th>Days</th><td>${vm.evidenceLedger.retention.days}</td></tr>
        <tr><th>Policy</th><td><code>${escapeHtml(vm.evidenceLedger.retention.policy)}</code></td></tr>
      </table>

      <h3 style="margin-top: 1.5rem; font-size: 1rem;">🔐 Verify Offline</h3>
      <pre>${escapeHtml(vm.evidenceLedger.verifyCommand)}</pre>

      ${
        vm.evidenceLedger.records.length > 0
          ? `
      <h3 style="margin-top: 1.5rem; font-size: 1rem;">📝 Records (${vm.evidenceLedger.records.length})</h3>
      <table>
        <thead>
          <tr><th>Record ID</th><th>Status</th><th>Plan Item</th><th>Strategy</th></tr>
        </thead>
        <tbody>
          ${vm.evidenceLedger.records
            .map(
              r => `
          <tr>
            <td><code>${escapeHtml(r.recordId)}</code></td>
            <td>${escapeHtml(r.status)}</td>
            <td><code>${escapeHtml(r.planItemId)}</code></td>
            <td>${escapeHtml(r.strategyId)}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>`
          : ''
      }
    </section>`
    : '';

  // Verification Banner (red if failed)
  const verificationBannerHtml = vm.verificationFailed
    ? `
    <div class="verification-banner">
      ❌ <strong>Evidence bundle verification FAILED</strong> — do not approve/merge.
    </div>`
    : '';

  return `<!DOCTYPE html>>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusion Autonomy Dashboard</title>
  <style>
    :root {
      --bg: #1a1a2e;
      --surface: #16213e;
      --primary: #0f3460;
      --accent: #e94560;
      --success: #4ade80;
      --warning: #fbbf24;
      --error: #ef4444;
      --text: #e2e8f0;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 2rem;
    }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    header .subtitle { color: var(--muted); font-size: 0.9rem; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .badge-success { background: var(--success); color: #000; }
    .badge-warning { background: var(--warning); color: #000; }
    .badge-error { background: var(--error); color: #fff; }
    .badge-muted { background: var(--muted); color: #000; }
    section {
      background: var(--surface);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--primary);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--primary);
    }
    th { color: var(--muted); font-weight: 500; }
    code {
      background: var(--bg);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.8rem;
    }
    pre {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.8rem;
      margin: 0.5rem 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .summary-card {
      background: var(--bg);
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }
    .summary-card .value { font-size: 2rem; font-weight: 700; }
    .summary-card .label { color: var(--muted); font-size: 0.875rem; }
    .not-applicable {
      background: var(--primary);
      padding: 1rem;
      border-radius: 0.5rem;
      color: var(--muted);
      font-style: italic;
    }
    .verification-banner {
      background: var(--error);
      color: #fff;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      text-align: center;
      font-size: 1.1rem;
    }
    footer {
      text-align: center;
      padding: 2rem 0;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .governance-list { list-style: none; }
    .governance-list li { padding: 0.25rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏛️ TerraFusion Autonomy Dashboard</h1>
      <p class="subtitle">County CIO Mode — Governance Telemetry Viewer</p>
      <p class="subtitle">Generated: ${escapeHtml(vm.generatedAt)} | Viewer v${vm.viewerVersion}</p>
    </header>

    ${verificationBannerHtml}

    <!-- Executive Summary -->
    <section id="summary">
      <h2>📋 Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${escapeHtml(vm.summary.outcomeLabel)}</div>
          <div class="label">Outcome</div>
        </div>
        <div class="summary-card">
          <div class="value">${vm.summary.appliedCount}</div>
          <div class="label">Applied</div>
        </div>
        <div class="summary-card">
          <div class="value">${vm.summary.skippedCount}</div>
          <div class="label">Skipped</div>
        </div>
        <div class="summary-card">
          <div class="value">${vm.summary.blockedCount}</div>
          <div class="label">Blocked</div>
        </div>
      </div>
      <table style="margin-top: 1rem;">
        <tr><th>Run ID</th><td><code>${escapeHtml(vm.summary.runId)}</code></td></tr>
        <tr><th>Timestamp</th><td>${escapeHtml(vm.summary.timestamp)}</td></tr>
        ${vm.summary.selectionReason ? `<tr><th>Selection Reason</th><td>${escapeHtml(vm.summary.selectionReason)}</td></tr>` : ''}
        ${vm.summary.appliedFile ? `<tr><th>Applied File</th><td><code>${escapeHtml(vm.summary.appliedFile)}</code></td></tr>` : ''}
        ${vm.summary.appliedStrategy ? `<tr><th>Strategy</th><td>${escapeHtml(vm.summary.appliedStrategy)}</td></tr>` : ''}
        ${vm.summary.appliedDiffStats ? `<tr><th>Diff Stats</th><td>+${vm.summary.appliedDiffStats.insertions} / -${vm.summary.appliedDiffStats.deletions}</td></tr>` : ''}
      </table>
    </section>

    <!-- Safety Rails Status -->
    <section id="safety-rails">
      <h2>🛡️ Safety Rails Status</h2>
      <table>
        <thead>
          <tr><th>Status</th><th>Check</th><th>Description</th></tr>
        </thead>
        <tbody>
          ${safetyRailsHtml}
        </tbody>
      </table>
    </section>

    <!-- Rollback Panel -->
    <section id="rollback">
      <h2>🔄 Rollback Panel</h2>
      ${
        vm.rollback.applicable
          ? `
        <table>
          <tr><th>Proof ID</th><td><code>${escapeHtml(vm.rollback.proofId || '')}</code></td></tr>
          <tr><th>Commit SHA</th><td><code>${escapeHtml(vm.rollback.commitSha || '')}</code></td></tr>
        </table>
        <h3 style="margin-top: 1rem; font-size: 1rem;">Step 1: Preview (dry-run)</h3>
        <pre>${escapeHtml(vm.rollback.previewCommand || '')}</pre>
        <h3 style="margin-top: 1rem; font-size: 1rem;">Step 2: Execute Rollback</h3>
        <pre>${escapeHtml(vm.rollback.executeCommand || '')}</pre>
        <h3 style="margin-top: 1rem; font-size: 1rem;">Alternative: Manual git revert</h3>
        <pre>${escapeHtml(vm.rollback.manualCommand || '')}</pre>
        <h3 style="margin-top: 1rem; font-size: 1rem;">Post-Rollback Gates</h3>
        <pre>${vm.rollback.postRollbackGates.map(escapeHtml).join('\n')}</pre>
      `
          : `<div class="not-applicable">${escapeHtml(vm.rollback.reason || 'Rollback not applicable')}</div>`
      }
    </section>

    <!-- Findings & Plan -->
    <section id="findings">
      <h2>📊 Findings & Plan Breakdown</h2>
      <div class="summary-grid" style="margin-bottom: 1rem;">
        <div class="summary-card">
          <div class="value">${vm.findings.total}</div>
          <div class="label">Total Findings</div>
        </div>
        <div class="summary-card">
          <div class="value">${vm.findings.eligible}</div>
          <div class="label">Eligible</div>
        </div>
        <div class="summary-card">
          <div class="value">${vm.findings.filtered}</div>
          <div class="label">Filtered Out</div>
        </div>
      </div>
      <table>
        <thead>
          <tr><th>Kind</th><th>File</th><th>Priority</th><th>Risk</th><th>Lines</th><th>Filter Reason</th></tr>
        </thead>
        <tbody>
          ${findingsHtml || '<tr><td colspan="6" style="text-align:center;color:var(--muted);">No findings available</td></tr>'}
        </tbody>
      </table>
    </section>

    <!-- Proof Artifacts -->
    <section id="artifacts">
      <h2>📦 Proof Artifacts</h2>
      <table>
        <thead>
          <tr><th>Artifact</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          ${artifactsHtml}
        </tbody>
      </table>
    </section>

    ${evidenceLedgerHtml}

    <!-- What Autonomy Will NOT Do -->
    <section id="governance">
      <h2>🚫 What Autonomy Will NOT Do</h2>
      <p style="margin-bottom: 1rem; color: var(--muted);">Per the Autonomy v1 Governance Contract:</p>
      <ul class="governance-list">
        <li>❌ Modify more than 1 file per patch</li>
        <li>❌ Apply Tier 1+ strategies without explicit opt-in</li>
        <li>❌ Auto-merge (human approval always required)</li>
        <li>❌ Push directly to main/master</li>
        <li>❌ Apply patches with risk score &gt; 40</li>
        <li>❌ Apply patches with estimated lines changed &gt; 40</li>
        <li>❌ Modify forbidden paths (ARCHIVE, specialized, applications)</li>
      </ul>
    </section>

    <footer>
      <p>TerraFusion Autonomy v1 — Government. Transcended.</p>
      <p>This is an offline dashboard. No network requests are made.</p>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncatePath(path: string, maxLen = 50): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(-(maxLen - 3));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function generate(opts: CliOptions): { html: string; viewModel: DashboardViewModel } {
  const artifacts = loadArtifacts(opts.artifactsDir);
  const evidenceIndex = loadEvidenceIndex(
    opts.artifactsDir,
    opts.evidenceIndexPath,
    opts.verbose
  );
  const viewModel = buildViewModel(artifacts, evidenceIndex);
  const html = generateHtml(viewModel);
  return { html, viewModel };
}

export function main(): void {
  const opts = parseArgs();

  if (opts.verbose) {
    console.log('📊 Autonomy Dashboard Generator (Phase 4N7)');
    console.log(`   Artifacts: ${opts.artifactsDir}`);
    console.log(`   Output: ${opts.outputDir}`);
    if (opts.evidenceIndexPath) {
      console.log(`   Evidence Index: ${opts.evidenceIndexPath}`);
    }
  }

  // Ensure output directory exists
  if (!existsSync(opts.outputDir)) {
    mkdirSync(opts.outputDir, { recursive: true });
  }

  const { html, viewModel } = generate(opts);

  // Write HTML
  const htmlPath = join(opts.outputDir, 'autonomy-dashboard.html');
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`✅ Generated: ${htmlPath}`);

  // Optionally write JSON
  if (opts.emitJson) {
    const jsonPath = join(opts.outputDir, 'autonomy-dashboard.json');
    writeFileSync(jsonPath, JSON.stringify(viewModel, null, 2), 'utf8');
    console.log(`✅ Generated: ${jsonPath}`);
  }
}

// Run if executed directly
const isMainModule = (() => {
  try {
    // Handle both Windows and Unix paths
    const scriptPath = fileURLToPath(import.meta.url);
    const argPath = process.argv[1];
    // Normalize paths for comparison
    return (
      scriptPath.replace(/\\/g, '/').toLowerCase() === argPath?.replace(/\\/g, '/').toLowerCase()
    );
  } catch {
    return false;
  }
})();

if (isMainModule) {
  main();
}
