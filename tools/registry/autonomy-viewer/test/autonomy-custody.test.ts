/**
 * Phase 4N11 — Chain of Custody Contract Tests
 *
 * Tests for the custody viewer that produces courtroom-grade audit packets.
 *
 * INVARIANTS TESTED:
 * - Deterministic rendering (same input → same output)
 * - Applied proof requires rollback + gates pass
 * - Verify failure triggers red banner
 * - Non-applied must not require rollback
 * - Evidence record presence affects tier display
 * - Retention tier and releaseTag presence
 */

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import {
    computeAuditReady,
    generateCustody,
    renderCustodyHtml,
    rollbackLooksSafe,
} from '../src/custody-generate.js';
import type {
    ApplyProof,
    CustodyModel,
    EvidenceRecord,
    VerifyBundleResult,
} from '../src/custody-types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function baseProof(): ApplyProof {
  return {
    planItemId: 'perf-001',
    strategyId: 'debarrel-import',
    outcome: 'noop',
    allowedSurfaceCheck: { passed: true, detail: 'Matched os-platform/core/**' },
    forbiddenPathCheck: { passed: true, detail: 'No forbidden paths matched' },
    gates: [],
    kind: 'debarrel-import',
    tier: 0,
  };
}

function appliedProof(): ApplyProof {
  return {
    ...baseProof(),
    outcome: 'applied',
    finalCommitSha: 'abc123def456789',
    rollbackCommand: 'git revert abc123def456789',
    baseSha: '000111222333',
    patchSummary: 'Removed barrel import in utils/index.ts',
    diffStats: { filesChanged: 1, linesAdded: 3, linesRemoved: 5 },
    semanticGuardsPassed: ['no-circular-deps', 'type-safe'],
    gitApplyCheck: { ok: true, detail: 'Patch applies cleanly' },
    gates: [
      { name: 'type-check', passed: true, durationMs: 1234, command: 'pnpm run type-check' },
      {
        name: 'phase83',
        passed: true,
        durationMs: 567,
        command: 'node --test phase83-tools.test.mjs',
      },
    ],
    selectionReason: { category: 'priority', detail: 'Highest priority by riskScore' },
    riskScore: 15,
    estimatedLinesChanged: 8,
    targetFile: 'os-platform/core/utils/index.ts',
  };
}

function baseVerify(): VerifyBundleResult {
  return {
    ok: true,
    bundleName: 'autonomy-evidence-123.zip',
    manifestSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    filesVerified: 5,
    missing: [],
    extra: [],
    errors: [],
    strict: true,
  };
}

function baseEvidenceRecord(): EvidenceRecord {
  return {
    bundleName: 'autonomy-evidence-123.zip',
    manifestSha256: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    retentionTier: 'merged',
    releaseTag: 'autonomy-evidence/2026-01',
    verifyOk: true,
    verifyStrict: true,
  };
}

function baseModel(): CustodyModel {
  return {
    schema: 'terrafusion.autonomy.custody.v1',
    auditReady: true,
    auditReadyReasons: [],
    proof: appliedProof(),
    verify: baseVerify(),
    evidenceRecord: baseEvidenceRecord(),
    verifyCommand: 'pnpm perf:verify-bundle --zip "autonomy-evidence-123.zip" --strict',
    checklist: {
      bundleVerified: true,
      proofPresent: true,
      rollbackCommandValid: true,
      gatesPassed: true,
      retentionTierApplied: true,
    },
    source: {
      workflow: 'autonomy-pr-lane',
      runId: '9876543210',
      repo: 'bsvalues/terrafusion_os_1.0',
      ref: 'refs/heads/autonomy/bot/20260131',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback Validation Tests
// ─────────────────────────────────────────────────────────────────────────────

test('rollbackLooksSafe: valid git revert command', () => {
  assert.equal(rollbackLooksSafe('git revert abc123def456789'), true);
  assert.equal(rollbackLooksSafe('git revert 1234567'), true);
  assert.equal(rollbackLooksSafe('git revert abc123456789012345678901234567890123'), true);
});

test('rollbackLooksSafe: rejects empty/undefined', () => {
  assert.equal(rollbackLooksSafe(undefined), false);
  assert.equal(rollbackLooksSafe(''), false);
});

test('rollbackLooksSafe: rejects shell metacharacters', () => {
  assert.equal(rollbackLooksSafe('git revert abc123; rm -rf /'), false);
  assert.equal(rollbackLooksSafe('git revert abc123 && echo pwned'), false);
  assert.equal(rollbackLooksSafe('git revert abc123 | cat'), false);
  assert.equal(rollbackLooksSafe('git revert $(whoami)'), false);
  assert.equal(rollbackLooksSafe('git revert `whoami`'), false);
});

test('rollbackLooksSafe: rejects invalid formats', () => {
  assert.equal(rollbackLooksSafe('git revert'), false);
  assert.equal(rollbackLooksSafe('git revert '), false);
  assert.equal(rollbackLooksSafe('git revert HEAD'), false);
  assert.equal(rollbackLooksSafe('git reset abc123'), false);
  assert.equal(rollbackLooksSafe('rm -rf /'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit Ready Computation Tests
// ─────────────────────────────────────────────────────────────────────────────

test('computeAuditReady: returns ready for complete applied proof', () => {
  const proof = appliedProof();
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.checklist.bundleVerified, true);
  assert.equal(result.checklist.rollbackCommandValid, true);
  assert.equal(result.checklist.gatesPassed, true);
});

test('computeAuditReady: fails without verify', () => {
  const proof = appliedProof();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, undefined, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.includes('verify result missing'));
  assert.equal(result.checklist.bundleVerified, false);
});

test('computeAuditReady: fails with verify.ok=false', () => {
  const proof = appliedProof();
  const verify = { ...baseVerify(), ok: false };
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.some(r => r.includes('verify.ok=false')));
});

test('computeAuditReady: fails without retention tier', () => {
  const proof = appliedProof();
  const verify = baseVerify();

  const result = computeAuditReady(proof, verify, undefined);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.includes('retention tier unknown (no evidence index record)'));
  assert.equal(result.checklist.retentionTierApplied, false);
});

test('computeAuditReady: applied proof requires rollback', () => {
  const proof = { ...appliedProof(), rollbackCommand: undefined };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.includes('rollbackCommand missing or invalid'));
  assert.equal(result.checklist.rollbackCommandValid, false);
});

test('computeAuditReady: applied proof requires gates', () => {
  const proof = { ...appliedProof(), gates: [] };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.includes('gates missing for applied proof'));
});

test('computeAuditReady: noop proof does not require rollback', () => {
  const proof = { ...baseProof(), outcome: 'noop' as const };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, true);
  assert.equal(result.checklist.rollbackCommandValid, true);
});

test('computeAuditReady: skipped proof does not require rollback', () => {
  const proof = { ...baseProof(), outcome: 'skipped' as const };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, true);
});

test('computeAuditReady: fails when allowedSurfaceCheck fails', () => {
  const proof = { ...appliedProof(), allowedSurfaceCheck: { passed: false, detail: 'No match' } };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.includes('allowedSurfaceCheck failed or missing'));
});

test('computeAuditReady: fails when gate fails', () => {
  const proof = {
    ...appliedProof(),
    gates: [
      { name: 'type-check', passed: true },
      { name: 'phase83', passed: false },
    ],
  };
  const verify = baseVerify();
  const record = baseEvidenceRecord();

  const result = computeAuditReady(proof, verify, record);

  assert.equal(result.auditReady, false);
  assert.ok(result.reasons.some(r => r.includes('gate failed: phase83')));
  assert.equal(result.checklist.gatesPassed, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// HTML Rendering Tests
// ─────────────────────────────────────────────────────────────────────────────

test('renderCustodyHtml: deterministic rendering', () => {
  const model = baseModel();
  const a = renderCustodyHtml(model);
  const b = renderCustodyHtml(model);

  assert.equal(a, b, 'Same input must produce identical output');
});

test('renderCustodyHtml: valid HTML document', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('<html'));
  assert.ok(html.includes('</html>'));
  assert.ok(html.includes('<head>'));
  assert.ok(html.includes('</head>'));
  assert.ok(html.includes('<body>'));
  assert.ok(html.includes('</body>'));
});

test('renderCustodyHtml: includes schema identifier', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('terrafusion.autonomy.custody.v1'));
});

test('renderCustodyHtml: shows AUDIT READY banner when ready', () => {
  const model = { ...baseModel(), auditReady: true, auditReadyReasons: [] };
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('AUDIT READY'));
  assert.ok(html.includes('class="banner good"'));
});

test('renderCustodyHtml: shows NOT AUDIT READY banner with reasons', () => {
  const model = {
    ...baseModel(),
    auditReady: false,
    auditReadyReasons: ['verify.ok=false', 'rollbackCommand missing'],
  };
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('NOT AUDIT READY'));
  assert.ok(html.includes('class="banner bad"'));
  assert.ok(html.includes('verify.ok=false'));
  assert.ok(html.includes('rollbackCommand missing'));
});

test('renderCustodyHtml: includes all 7 sections', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('1) Identity'));
  assert.ok(html.includes('2) Governance Surface'));
  assert.ok(html.includes('3) Patch Summary'));
  assert.ok(html.includes('4) Apply Integrity'));
  assert.ok(html.includes('5) Gates Evidence'));
  assert.ok(html.includes('6) Evidence Bundle'));
  assert.ok(html.includes('7) Chain-of-Custody Attestation'));
});

test('renderCustodyHtml: shows planItemId', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('perf-001'));
});

test('renderCustodyHtml: shows rollbackCommand for applied proof', () => {
  const model = baseModel();
  model.proof = appliedProof();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('git revert abc123def456789'));
});

test('renderCustodyHtml: shows gates table', () => {
  const model = baseModel();
  model.proof = appliedProof();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('type-check'));
  assert.ok(html.includes('phase83'));
});

test('renderCustodyHtml: shows retentionTier badge', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('merged'));
});

test('renderCustodyHtml: shows releaseTag', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('autonomy-evidence/2026-01'));
});

test('renderCustodyHtml: shows verifyCommand', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('pnpm perf:verify-bundle --zip'));
});

test('renderCustodyHtml: shows checklist items', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('Bundle verified'));
  assert.ok(html.includes('Proof present'));
  assert.ok(html.includes('Rollback command valid'));
  assert.ok(html.includes('Gates passed'));
  assert.ok(html.includes('Retention tier applied'));
});

test('renderCustodyHtml: shows manifestSha256 untruncated', () => {
  const model = baseModel();
  const sha = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const html = renderCustodyHtml(model);

  assert.ok(html.includes(sha));
});

test('renderCustodyHtml: escapes HTML in user content', () => {
  const model = baseModel();
  model.proof.patchSummary = '<script>alert("xss")</script>';
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>alert'));
});

test('renderCustodyHtml: no external resources', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(!html.includes('http://'));
  assert.ok(!html.includes('https://'));
  assert.ok(!html.includes('<script src='));
  assert.ok(!html.includes('<link rel="stylesheet" href='));
});

test('renderCustodyHtml: embedded CSS', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('<style>'));
  assert.ok(html.includes('</style>'));
});

test('renderCustodyHtml: incident tier shows badge-error', () => {
  const model = { ...baseModel() };
  model.evidenceRecord = { ...baseEvidenceRecord(), retentionTier: 'incident' as const };
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('badge-error'));
  assert.ok(html.includes('incident'));
});

test('renderCustodyHtml: ci tier shows badge-muted', () => {
  const model = { ...baseModel() };
  model.evidenceRecord = { ...baseEvidenceRecord(), retentionTier: 'ci' as const };
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('badge-muted'));
});

test('renderCustodyHtml: footer includes TerraFusion branding', () => {
  const model = baseModel();
  const html = renderCustodyHtml(model);

  assert.ok(html.includes('TerraFusion'));
  assert.ok(html.includes('Government. Transcended.'));
});

// ─────────────────────────────────────────────────────────────────────────────
// generateCustody Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

test('generateCustody: loads proof from file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify([appliedProof()]), 'utf8');

  try {
    const model = generateCustody({ proofPath });

    assert.equal(model.schema, 'terrafusion.autonomy.custody.v1');
    assert.equal(model.proof.planItemId, 'perf-001');
    assert.ok(!model.auditReady); // No verify/evidence
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: loads all optional inputs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');
  const planPath = path.join(tmpDir, 'perf.plan.json');
  const verifyPath = path.join(tmpDir, 'verify-bundle.json');
  const indexPath = path.join(tmpDir, 'evidence-index.json');

  fs.writeFileSync(proofPath, JSON.stringify([appliedProof()]), 'utf8');
  fs.writeFileSync(
    planPath,
    JSON.stringify({
      items: [{ id: 'perf-001', kind: 'debarrel-import', tier: 0, priorityScore: 90 }],
    }),
    'utf8'
  );
  fs.writeFileSync(verifyPath, JSON.stringify(baseVerify()), 'utf8');
  fs.writeFileSync(
    indexPath,
    JSON.stringify({
      schema: 'terrafusion.autonomy.evidence-index.v1',
      records: [baseEvidenceRecord()],
    }),
    'utf8'
  );

  try {
    const model = generateCustody({
      proofPath,
      planPath,
      verifyPath,
      evidenceIndexPath: indexPath,
    });

    assert.equal(model.auditReady, true);
    assert.ok(model.planItem);
    assert.ok(model.verify);
    assert.ok(model.evidenceRecord);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: handles proofs in object format', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify({ proofs: [appliedProof()] }), 'utf8');

  try {
    const model = generateCustody({ proofPath });
    assert.equal(model.proof.planItemId, 'perf-001');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: throws on missing proof file', () => {
  assert.throws(
    () => generateCustody({ proofPath: '/nonexistent/proof.json' }),
    /Cannot read proof file/
  );
});

test('generateCustody: throws on empty proofs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify([]), 'utf8');

  try {
    assert.throws(() => generateCustody({ proofPath }), /No apply proofs found/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: selects proof deterministically by planItemId', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  const proofs = [
    { ...baseProof(), planItemId: 'z-last' },
    { ...baseProof(), planItemId: 'a-first' },
    { ...baseProof(), planItemId: 'm-middle' },
  ];
  fs.writeFileSync(proofPath, JSON.stringify(proofs), 'utf8');

  try {
    const model = generateCustody({ proofPath });
    assert.equal(model.proof.planItemId, 'a-first');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: builds correct verifyCommand', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');
  const verifyPath = path.join(tmpDir, 'verify-bundle.json');

  fs.writeFileSync(proofPath, JSON.stringify([appliedProof()]), 'utf8');
  fs.writeFileSync(
    verifyPath,
    JSON.stringify({ ...baseVerify(), bundleName: 'my-bundle.zip' }),
    'utf8'
  );

  try {
    const model = generateCustody({ proofPath, verifyPath });
    assert.equal(model.verifyCommand, 'pnpm perf:verify-bundle --zip "my-bundle.zip" --strict');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

test('determinism: same input produces same custody model', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');
  const verifyPath = path.join(tmpDir, 'verify-bundle.json');
  const indexPath = path.join(tmpDir, 'evidence-index.json');

  fs.writeFileSync(proofPath, JSON.stringify([appliedProof()]), 'utf8');
  fs.writeFileSync(verifyPath, JSON.stringify(baseVerify()), 'utf8');
  fs.writeFileSync(
    indexPath,
    JSON.stringify({
      schema: 'terrafusion.autonomy.evidence-index.v1',
      records: [baseEvidenceRecord()],
    }),
    'utf8'
  );

  try {
    const model1 = generateCustody({ proofPath, verifyPath, evidenceIndexPath: indexPath });
    const model2 = generateCustody({ proofPath, verifyPath, evidenceIndexPath: indexPath });

    assert.deepEqual(model1, model2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('determinism: same model produces same HTML twice', () => {
  const model = baseModel();

  const html1 = renderCustodyHtml(model);
  const html2 = renderCustodyHtml(model);

  assert.equal(html1, html2);
  assert.equal(html1.length, html2.length);
});

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Graph Navigation Tests (Phase 4N12)
// ─────────────────────────────────────────────────────────────────────────────

test('generateCustody: builds graph when URL options provided', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify([baseProof()]), 'utf8');

  try {
    const model = generateCustody({
      proofPath,
      ledgerUrl: './ledger.html',
      releaseUrl: 'https://github.com/owner/repo/releases/tag/v1',
      bundleDownloadUrl: 'https://cdn.example.com/bundle.zip',
      dashboardUrl: './dashboard.html',
      custodyUrl: './custody.html',
    });

    assert.ok(model.graph);
    assert.equal(model.graph!.ledgerUrl, './ledger.html');
    assert.equal(model.graph!.releaseUrl, 'https://github.com/owner/repo/releases/tag/v1');
    assert.equal(model.graph!.bundleDownloadUrl, 'https://cdn.example.com/bundle.zip');
    assert.equal(model.graph!.dashboardUrl, './dashboard.html');
    assert.equal(model.graph!.custodyUrl, './custody.html');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: graph undefined when no URL options', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify([baseProof()]), 'utf8');

  try {
    const model = generateCustody({ proofPath });
    assert.equal(model.graph, undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('generateCustody: partial graph with only some URLs', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custody-test-'));
  const proofPath = path.join(tmpDir, 'apply-proofs.json');

  fs.writeFileSync(proofPath, JSON.stringify([baseProof()]), 'utf8');

  try {
    const model = generateCustody({
      proofPath,
      ledgerUrl: './ledger.html',
    });

    assert.ok(model.graph);
    assert.equal(model.graph!.ledgerUrl, './ledger.html');
    assert.equal(model.graph!.releaseUrl, undefined);
    assert.equal(model.graph!.bundleDownloadUrl, undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('renderCustodyHtml: renders nav-grid when graph provided', () => {
  const model = {
    ...baseModel(),
    graph: {
      ledgerUrl: './ledger.html',
      releaseUrl: 'https://github.com/owner/repo/releases/tag/v1',
    },
  };

  const html = renderCustodyHtml(model);
  assert.ok(html.includes('nav-grid'), 'Expected nav-grid class');
  assert.ok(html.includes('nav-link'), 'Expected nav-link class');
  assert.ok(html.includes('Evidence Graph Navigation'), 'Expected section header');
  assert.ok(html.includes('./ledger.html'), 'Expected ledger link');
  assert.ok(
    html.includes('https://github.com/owner/repo/releases/tag/v1'),
    'Expected release link'
  );
});

test('renderCustodyHtml: omits nav section when no graph', () => {
  const model = baseModel();
  delete (model as unknown as Record<string, unknown>).graph;

  const html = renderCustodyHtml(model);
  // Check for nav section heading, not CSS class (which is always present in stylesheet)
  assert.ok(!html.includes('Evidence Graph Navigation'), 'Expected no nav section');
  assert.ok(!html.includes('nav-link">📋'), 'Expected no nav links');
});

test('renderCustodyHtml: only renders provided graph links', () => {
  const model = {
    ...baseModel(),
    graph: {
      ledgerUrl: './ledger.html',
      // No releaseUrl
    },
  };

  const html = renderCustodyHtml(model);
  assert.ok(html.includes('./ledger.html'), 'Expected ledger link');
  assert.ok(!html.includes('GitHub Release'), 'Should not have release link');
});

test('renderCustodyHtml: graph link text is correct', () => {
  const model = {
    ...baseModel(),
    graph: {
      ledgerUrl: './ledger.html',
      releaseUrl: 'https://github.com/owner/repo/releases/tag/v1',
      bundleDownloadUrl: 'https://cdn.example.com/bundle.zip',
      dashboardUrl: './dashboard.html',
    },
  };

  const html = renderCustodyHtml(model);
  assert.ok(html.includes('📋 Evidence Ledger'), 'Expected ledger emoji');
  assert.ok(html.includes('🔖 GitHub Release'), 'Expected release emoji');
  assert.ok(html.includes('📦 Download Bundle'), 'Expected bundle emoji');
  assert.ok(html.includes('📊 Performance Dashboard'), 'Expected dashboard emoji');
});
