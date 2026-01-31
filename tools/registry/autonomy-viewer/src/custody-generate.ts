/**
 * Phase 4N11 — Chain of Custody Generator
 *
 * Generates courtroom-grade "single page of truth" showing complete lineage:
 * Selection → Patch → Proof → Gates → Rollback → Evidence Bundle → Verification
 *
 * INVARIANTS:
 * - Deterministic output (stable ordering, no timestamps, no randomness)
 * - Zero deps (no external libraries)
 * - Offline-first (no remote fetches)
 * - No secrets in output
 * - Explicit refusal semantics (missing data = NOT AUDIT READY)
 *
 * @module custody-generate
 */

import * as fs from 'node:fs';
import type {
    ApplyProof,
    CustodyChecklist,
    CustodyInputPaths,
    CustodyModel,
    EvidenceIndex,
    EvidenceRecord,
    PerfPlanItem,
    VerifyBundleResult,
} from './custody-types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CUSTODY_SCHEMA = 'terrafusion.autonomy.custody.v1' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function readJson<T>(p?: string): T | undefined {
  if (!p) return undefined;
  if (!fs.existsSync(p)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

function stableSort<T>(arr: T[], key: (x: T) => string): T[] {
  return [...arr].sort((a, b) => key(a).localeCompare(key(b)));
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates rollback command safety.
 * Must be exactly: git revert <sha>
 * No chaining, no shell metacharacters.
 */
export function rollbackLooksSafe(cmd?: string): boolean {
  if (!cmd) return false;
  const trimmed = cmd.trim();
  // Must match: git revert <sha> (7-40 hex chars)
  if (!/^git revert [0-9a-f]{7,40}$/i.test(trimmed)) return false;
  // No shell metacharacters
  if (/[;&|`$(){}]/.test(cmd)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proof Selection (deterministic)
// ─────────────────────────────────────────────────────────────────────────────

type ProofsInput = ApplyProof[] | { proofs: ApplyProof[] };

function selectProof(proofs: ApplyProof[]): ApplyProof {
  // Deterministic: pick first by planItemId lexicographic
  const sorted = stableSort(proofs, p => p.planItemId ?? '');
  if (!sorted[0]) throw new Error('No apply proofs found in input.');
  return sorted[0];
}

function parseProofs(raw: ProofsInput): ApplyProof[] {
  if (Array.isArray(raw)) return raw;
  if (raw && 'proofs' in raw && Array.isArray(raw.proofs)) return raw.proofs;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Ready Computation
// ─────────────────────────────────────────────────────────────────────────────

interface AuditReadyResult {
  auditReady: boolean;
  reasons: string[];
  checklist: CustodyChecklist;
}

export function computeAuditReady(
  proof: ApplyProof,
  verify?: VerifyBundleResult,
  evidenceRecord?: EvidenceRecord
): AuditReadyResult {
  const reasons: string[] = [];

  // Governance checks
  const allowedOk = proof.allowedSurfaceCheck?.passed === true;
  const forbidOk = proof.forbiddenPathCheck?.passed === true;
  if (!allowedOk) reasons.push('allowedSurfaceCheck failed or missing');
  if (!forbidOk) reasons.push('forbiddenPathCheck failed or missing');

  // Applied-specific checks
  const isApplied = proof.outcome === 'applied';
  let rollbackValid = true;
  let gatesPassed = true;

  if (isApplied) {
    if (!proof.finalCommitSha) {
      reasons.push('finalCommitSha missing for applied proof');
    }
    if (!rollbackLooksSafe(proof.rollbackCommand)) {
      reasons.push('rollbackCommand missing or invalid');
      rollbackValid = false;
    }
    const gates = proof.gates ?? [];
    if (gates.length === 0) {
      reasons.push('gates missing for applied proof');
      gatesPassed = false;
    }
    for (const g of gates) {
      if (!g.passed) {
        reasons.push(`gate failed: ${g.name}`);
        gatesPassed = false;
      }
    }
  } else {
    // Non-applied: rollback not required
    rollbackValid = true;
  }

  // Bundle verification
  const bundleVerified = verify?.ok === true;
  if (!verify) {
    reasons.push('verify result missing');
  } else if (!verify.ok) {
    reasons.push('verify.ok=false (bundle integrity not verified)');
  }

  // Evidence retention tier
  const retentionTierApplied = evidenceRecord?.retentionTier !== undefined;
  if (!retentionTierApplied) {
    reasons.push('retention tier unknown (no evidence index record)');
  }

  const checklist: CustodyChecklist = {
    bundleVerified,
    proofPresent: true,
    rollbackCommandValid: isApplied ? rollbackValid : true,
    gatesPassed: isApplied ? gatesPassed : true,
    retentionTierApplied,
  };

  return {
    auditReady: reasons.length === 0,
    reasons,
    checklist,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Custody Model
// ─────────────────────────────────────────────────────────────────────────────

export function generateCustody(params: CustodyInputPaths): CustodyModel {
  // Read proof file (required)
  const proofsRaw = readJson<ProofsInput>(params.proofPath);
  if (!proofsRaw) {
    throw new Error(`Cannot read proof file: ${params.proofPath}`);
  }
  const proofs = parseProofs(proofsRaw);
  if (proofs.length === 0) {
    throw new Error('No apply proofs found in proof file.');
  }
  const proof = selectProof(proofs);

  // Read optional files
  const plan = readJson<{ items: PerfPlanItem[] }>(params.planPath);
  const planItem = plan?.items?.find(i => i.id === proof.planItemId);

  const verify = readJson<VerifyBundleResult>(params.verifyPath);
  const index = readJson<EvidenceIndex>(params.evidenceIndexPath);

  // Determine bundle name
  const bundleName =
    verify?.bundleName ??
    index?.bundle?.name ??
    index?.records?.[0]?.bundleName ??
    'UNKNOWN_BUNDLE.zip';

  // Find matching evidence record (deterministic)
  const evidenceRecord = index?.records
    ? stableSort(index.records, r => `${r.retentionTier}:${r.bundleName}`).find(
        r =>
          r.bundleName === bundleName ||
          r.manifestSha256 === verify?.manifestSha256 ||
          r.manifestSha256 === index?.bundle?.manifestSha256
      )
    : undefined;

  // Compute audit ready status
  const { auditReady, reasons, checklist } = computeAuditReady(proof, verify, evidenceRecord);

  // Build verify command
  const verifyCommand = `pnpm perf:verify-bundle --zip "${bundleName}" --strict`;

  return {
    schema: CUSTODY_SCHEMA,
    auditReady,
    auditReadyReasons: reasons,
    proof,
    planItem,
    verify,
    evidenceRecord,
    verifyCommand,
    checklist,
    source: index?.source,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Custody HTML
// ─────────────────────────────────────────────────────────────────────────────

export function renderCustodyHtml(model: CustodyModel): string {
  const banner = model.auditReady
    ? '<div class="banner good">AUDIT READY</div>'
    : `<div class="banner bad">NOT AUDIT READY — ${escapeHtml(model.auditReadyReasons.join('; '))}</div>`;

  const gatesRows =
    model.proof.gates && model.proof.gates.length > 0
      ? model.proof.gates
          .map(
            g =>
              `<tr><td>${escapeHtml(g.name)}</td><td class="${g.passed ? 'pass' : 'fail'}">${g.passed ? '✅' : '❌'}</td><td>${escapeHtml(String(g.durationMs ?? '-'))}</td><td><code>${escapeHtml(g.command ?? '-')}</code></td></tr>`
          )
          .join('\n')
      : '<tr><td colspan="4" class="muted">No gates recorded</td></tr>';

  const checklistRows = [
    ['Bundle verified', model.checklist.bundleVerified],
    ['Proof present', model.checklist.proofPresent],
    ['Rollback command valid', model.checklist.rollbackCommandValid],
    ['Gates passed', model.checklist.gatesPassed],
    ['Retention tier applied', model.checklist.retentionTierApplied],
  ]
    .map(
      ([name, passed]) =>
        `<li class="${passed ? 'pass' : 'fail'}">${passed ? '✅' : '❌'} ${name}</li>`
    )
    .join('\n');

  const semanticGuards =
    model.proof.semanticGuardsPassed && model.proof.semanticGuardsPassed.length > 0
      ? model.proof.semanticGuardsPassed.map(s => escapeHtml(s)).join(', ')
      : '-';

  const diffStatsStr = model.proof.diffStats
    ? `${model.proof.diffStats.filesChanged} file(s), +${model.proof.diffStats.linesAdded}/-${model.proof.diffStats.linesRemoved}`
    : '-';

  const selectionReasonStr = model.proof.selectionReason
    ? `${escapeHtml(model.proof.selectionReason.category)}: ${escapeHtml(model.proof.selectionReason.detail ?? model.proof.selectionReason.message ?? '-')}`
    : '-';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>TerraFusion Chain of Custody</title>
<style>
:root {
  --bg: #0b0f1a;
  --fg: #dbe7ff;
  --muted: #8b9cc0;
  --border: #2a3654;
  --pass: #4ade80;
  --fail: #ff6b6b;
  --warn: #fbbf24;
}
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background: var(--bg);
  color: var(--fg);
  margin: 0;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.banner {
  padding: 14px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 1.1rem;
}
.banner.good {
  background: #0b2b14;
  color: #d7ffe4;
  border: 2px solid var(--pass);
}
.banner.bad {
  background: #3b0b0b;
  color: #ffd7d7;
  border: 2px solid var(--fail);
}
h1 { margin: 0 0 8px 0; font-size: 1.8rem; }
h2 { margin: 28px 0 12px 0; font-size: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.muted { color: var(--muted); }
table { border-collapse: collapse; width: 100%; margin-top: 8px; }
td, th { border: 1px solid var(--border); padding: 10px 12px; text-align: left; vertical-align: top; }
th { background: #141a2d; font-weight: 600; width: 200px; }
tr:nth-child(even) td { background: #0d1221; }
pre, code {
  background: #141a2d;
  padding: 8px 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
}
pre { margin: 0; }
ul.checklist { list-style: none; padding: 0; margin: 0; }
ul.checklist li { padding: 6px 0; font-size: 1rem; }
.pass { color: var(--pass); }
.fail { color: var(--fail); }
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-error { background: #3b0b0b; color: #ff6b6b; }
.badge-warning { background: #3b2b0b; color: #fbbf24; }
.badge-muted { background: #1a1f2e; color: #8b9cc0; }
.badge-success { background: #0b2b14; color: #4ade80; }
footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --fg: #1a202c;
    --muted: #6b7280;
    --border: #e5e7eb;
  }
  body { background: var(--bg); color: var(--fg); }
  pre, code { background: #f3f4f6; }
  th { background: #f9fafb; }
  tr:nth-child(even) td { background: #fafafa; }
}
</style>
</head>
<body>

${banner}

<h1>🔗 Autonomy Chain of Custody</h1>
<div class="muted">Schema: ${escapeHtml(model.schema)}</div>

<h2>1) Identity</h2>
<table>
<tr><th>planItemId</th><td><code>${escapeHtml(model.proof.planItemId)}</code></td></tr>
<tr><th>strategyId</th><td>${escapeHtml(model.proof.strategyId ?? '-')}</td></tr>
<tr><th>kind</th><td>${escapeHtml(model.proof.kind ?? model.planItem?.kind ?? '-')}</td></tr>
<tr><th>tier</th><td>${escapeHtml(String(model.proof.tier ?? model.planItem?.tier ?? '-'))}</td></tr>
<tr><th>outcome</th><td><span class="badge ${model.proof.outcome === 'applied' ? 'badge-success' : 'badge-muted'}">${escapeHtml(model.proof.outcome)}</span></td></tr>
<tr><th>baseSha</th><td><code>${escapeHtml(model.proof.baseSha ?? '-')}</code></td></tr>
<tr><th>finalCommitSha</th><td><code>${escapeHtml(model.proof.finalCommitSha ?? '-')}</code></td></tr>
<tr><th>targetFile</th><td>${escapeHtml(model.proof.targetFile ?? model.planItem?.file ?? '-')}</td></tr>
<tr><th>retentionTier</th><td><span class="badge ${model.evidenceRecord?.retentionTier === 'incident' ? 'badge-error' : model.evidenceRecord?.retentionTier === 'merged' ? 'badge-warning' : 'badge-muted'}">${escapeHtml(model.evidenceRecord?.retentionTier ?? 'unknown')}</span></td></tr>
<tr><th>releaseTag</th><td>${escapeHtml(model.evidenceRecord?.releaseTag ?? '-')}</td></tr>
<tr><th>PR number</th><td>${model.source?.prNumber ? `#${model.source.prNumber}` : '-'}</td></tr>
<tr><th>Workflow</th><td>${escapeHtml(model.source?.workflow ?? '-')}</td></tr>
<tr><th>Run ID</th><td>${escapeHtml(model.source?.runId ?? '-')}</td></tr>
</table>

<h2>2) Governance Surface & Eligibility</h2>
<table>
<tr><th>allowedSurfaceCheck</th><td class="${model.proof.allowedSurfaceCheck?.passed ? 'pass' : 'fail'}">${model.proof.allowedSurfaceCheck?.passed ? '✅ Passed' : '❌ Failed'}</td></tr>
<tr><th>allowedSurfaceCheck detail</th><td>${escapeHtml(model.proof.allowedSurfaceCheck?.detail ?? model.proof.allowedSurfaceCheck?.matchedPattern ?? '-')}</td></tr>
<tr><th>forbiddenPathCheck</th><td class="${model.proof.forbiddenPathCheck?.passed ? 'pass' : 'fail'}">${model.proof.forbiddenPathCheck?.passed ? '✅ Passed' : '❌ Failed'}</td></tr>
<tr><th>forbiddenPathCheck detail</th><td>${escapeHtml(model.proof.forbiddenPathCheck?.detail ?? model.proof.forbiddenPathCheck?.matchedPattern ?? '-')}</td></tr>
<tr><th>tier gating</th><td>${model.proof.tier === 0 ? 'tier0 (auto-eligible)' : model.proof.tier === 1 ? 'tier1 (disabled by default)' : '-'}</td></tr>
<tr><th>selectionReason</th><td>${selectionReasonStr}</td></tr>
</table>

<h2>3) Patch Summary</h2>
<table>
<tr><th>patchSummary</th><td>${escapeHtml(model.proof.patchSummary ?? '-')}</td></tr>
<tr><th>diffStats</th><td>${diffStatsStr}</td></tr>
<tr><th>estimatedLinesChanged</th><td>${escapeHtml(String(model.proof.estimatedLinesChanged ?? model.planItem?.estimatedLinesChanged ?? '-'))}</td></tr>
<tr><th>riskScore</th><td>${escapeHtml(String(model.proof.riskScore ?? model.planItem?.riskScore ?? '-'))}</td></tr>
<tr><th>semanticGuardsPassed</th><td>${semanticGuards}</td></tr>
</table>

<h2>4) Apply Integrity</h2>
<table>
<tr><th>gitApplyCheck</th><td class="${model.proof.gitApplyCheck?.ok !== false ? 'pass' : 'fail'}">${model.proof.gitApplyCheck?.ok !== false ? '✅ OK' : '❌ Failed'}</td></tr>
<tr><th>gitApplyCheck detail</th><td>${escapeHtml(model.proof.gitApplyCheck?.detail ?? '-')}</td></tr>
<tr><th>outcome</th><td>${escapeHtml(model.proof.outcome)}</td></tr>
<tr><th>emitted proof id</th><td><code>${escapeHtml(model.proof.planItemId)}</code></td></tr>
<tr><th>rollbackCommand</th><td>${model.proof.rollbackCommand ? `<pre>${escapeHtml(model.proof.rollbackCommand)}</pre>` : '<span class="muted">-</span>'}</td></tr>
</table>

<h2>5) Gates Evidence</h2>
<table>
<tr><th>Gate</th><th>Passed</th><th>Duration (ms)</th><th>Command</th></tr>
${gatesRows}
</table>

<h2>6) Evidence Bundle</h2>
<table>
<tr><th>bundleName</th><td>${escapeHtml(model.verify?.bundleName ?? model.evidenceRecord?.bundleName ?? 'UNKNOWN')}</td></tr>
<tr><th>manifestSha256</th><td><code>${escapeHtml(model.verify?.manifestSha256 ?? model.evidenceRecord?.manifestSha256 ?? 'UNKNOWN')}</code></td></tr>
<tr><th>verify</th><td class="${model.verify?.ok ? 'pass' : 'fail'}">${model.verify?.ok ? '✅ OK' : '❌ Failed'}</td></tr>
<tr><th>filesVerified</th><td>${escapeHtml(String(model.verify?.filesVerified ?? '-'))}</td></tr>
<tr><th>missing</th><td>${model.verify?.missing?.length ? escapeHtml(model.verify.missing.join(', ')) : '-'}</td></tr>
<tr><th>extra</th><td>${model.verify?.extra?.length ? escapeHtml(model.verify.extra.join(', ')) : '-'}</td></tr>
<tr><th>verifyCommand</th><td><pre>${escapeHtml(model.verifyCommand)}</pre></td></tr>
</table>

<h2>7) Chain-of-Custody Attestation</h2>
<ul class="checklist">
${checklistRows}
</ul>
<p style="margin-top: 16px;"><strong>Final Status:</strong> <span class="${model.auditReady ? 'pass' : 'fail'}">${model.auditReady ? '✅ AUDIT READY' : '❌ NOT AUDIT READY'}</span></p>

${
  model.auditReadyReasons.length > 0
    ? `<h3>Reasons for NOT AUDIT READY:</h3><ul>${model.auditReadyReasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
    : ''
}

<h2>Verification Command</h2>
<pre>${escapeHtml(model.verifyCommand)}</pre>

<footer>
  <p>TerraFusion Autonomy v1 — Government. Transcended.</p>
  <p class="muted">This document is a courtroom-grade chain of custody record. Offline-capable, zero dependencies.</p>
</footer>

</body>
</html>`;
}
