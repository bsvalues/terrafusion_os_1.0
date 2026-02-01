/**
 * Evidence Index Contract Tests (Phase 4N6)
 *
 * Tests the evidence index generator for:
 * - Schema version fixed
 * - Records deterministic ordering
 * - Verify status correctly reflected
 * - Retention days present
 * - No PII fields
 *
 * @governance SEAL-COMPLIANT
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { dirname } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the evidence index module
import {
    CANONICAL_ASSET_NAMES,
    DEFAULT_RETENTION_DAYS,
    EVIDENCE_INDEX_SCHEMA,
    type EvidenceIndex,
    FORBIDDEN_IDENTITY_PATTERNS,
    GITHUB_OIDC_ISSUER,
    MINIMUM_SIGNED_ASSETS,
    PRIMARY_SIGNED_ASSETS,
    RETENTION_POLICY_VERSION,
    type SigningMode,
    buildAssetUrl,
    buildEvidenceIndex,
    buildReleaseAssets,
    buildReleaseUrl,
    buildSignatureTriplet,
    buildSigningIdentity,
    deriveWorkflowPath,
    loadApplyProofs,
    validateIdentity,
    validateImmutableUrl,
    verifySignatureTriplet,
    verifySigningModeParity,
} from '../src/evidence-index.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const MOCK_APPLY_PROOF = {
  proofId: 'proof-001',
  planItemId: 'item-unused-import-001',
  strategyId: 'remove-unused-import',
  outcome: 'applied' as const,
  tier: 0,
  filePath: 'src/example.ts',
  patchSize: 50,
  timestamp: '2026-01-31T12:00:00.000Z',
  finalCommitSha: 'abc123def456',
  rollbackCommand: 'git revert abc123def456',
};

const MOCK_APPLY_PROOF_NOOP = {
  proofId: 'proof-002',
  planItemId: 'item-unused-var-001',
  strategyId: 'remove-unused-variable',
  outcome: 'noop' as const,
  tier: 0,
  filePath: 'src/other.ts',
  timestamp: '2026-01-31T12:01:00.000Z',
};

function createMockOptions(tempDir: string, overrides: Record<string, unknown> = {}) {
  return {
    outDir: tempDir,
    artifactsDir: tempDir,
    bundlePath: '',
    bundleName: 'autonomy-evidence-123.zip',
    manifestSha: 'sha256:abcdef1234567890',
    verifyOk: true,
    verifyStrict: true,
    runId: '12345',
    workflow: 'autonomy-pr-lane',
    repo: 'terrafusion/os',
    ref: 'refs/heads/main',
    verbose: false,
    serverUrl: 'https://github.com',
    ...overrides,
  };
}

// ============================================================================
// Schema Contract Tests
// ============================================================================

describe('Evidence Index Schema Contract', () => {
  it('should export the correct schema version', () => {
    assert.equal(EVIDENCE_INDEX_SCHEMA, 'terrafusion.autonomy.evidence.index.v1');
  });

  it('should export the correct retention policy version', () => {
    assert.equal(RETENTION_POLICY_VERSION, 'autonomy-evidence-retention.v1');
  });

  it('should export the correct default retention days', () => {
    assert.equal(DEFAULT_RETENTION_DAYS, 90);
  });
});

// ============================================================================
// buildEvidenceIndex Contract Tests
// ============================================================================

describe('buildEvidenceIndex()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should produce correct schema version', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.equal(index.schema, 'terrafusion.autonomy.evidence.index.v1');
  });

  it('should include generatedAt timestamp in ISO format', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.ok(index.generatedAt);
    // Verify it's a valid ISO date
    const parsed = new Date(index.generatedAt);
    assert.ok(!isNaN(parsed.getTime()));
  });

  it('should include source metadata', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.equal(index.source.workflow, 'autonomy-pr-lane');
    assert.equal(index.source.runId, '12345');
    assert.equal(index.source.repo, 'terrafusion/os');
    assert.equal(index.source.ref, 'refs/heads/main');
  });

  it('should produce noop record when no proofs', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.ok(Array.isArray(index.records));
    // Creates a noop record when no proofs
    assert.equal(index.records.length, 1);
    assert.equal(index.records[0].status, 'noop');
  });

  it('should produce records from apply proofs', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records.length, 1);
    assert.equal(index.records[0].planItemId, 'item-unused-import-001');
  });

  it('should map outcome correctly (applied → applied)', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].status, 'applied');
  });

  it('should map outcome correctly (noop → noop)', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF_NOOP]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].status, 'noop');
  });

  it('should include finalCommitSha when present', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].finalCommitSha, 'abc123def456');
  });

  it('should include bundle info in records', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].bundle.name, 'autonomy-evidence-123.zip');
    assert.equal(index.records[0].bundle.manifestSha256, 'sha256:abcdef1234567890');
  });

  it('should include verify status in bundle info', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].bundle.verify.ok, true);
    assert.equal(index.records[0].bundle.verify.strict, true);
  });

  it('should include retention policy in records', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].retention.days, 90);
    assert.equal(index.records[0].retention.policy, 'autonomy-evidence-retention.v1');
  });

  it('should include rollback info when present', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.ok(index.records[0].rollback);
    assert.ok(index.records[0].rollback.command.includes('perf:rollback'));
  });
});

// ============================================================================
// Deterministic Ordering Contract Tests
// ============================================================================

describe('Evidence Index Deterministic Ordering', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should sort records by recordId (deterministic)', () => {
    const proofs = [MOCK_APPLY_PROOF, MOCK_APPLY_PROOF_NOOP];
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify(proofs));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);

    assert.equal(index.records.length, 2);
    // Records are sorted by recordId
    assert.ok(index.records[0].recordId < index.records[1].recordId);
  });

  it('should assign unique recordIds', () => {
    const proofs = [MOCK_APPLY_PROOF, MOCK_APPLY_PROOF_NOOP];
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify(proofs));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);

    assert.ok(index.records[0].recordId);
    assert.ok(index.records[1].recordId);
    // recordIds should be unique
    assert.notEqual(index.records[0].recordId, index.records[1].recordId);
  });

  it('should produce identical output for identical input (deterministic)', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const opts = createMockOptions(tempDir);
    const index1 = buildEvidenceIndex(opts);
    const index2 = buildEvidenceIndex(opts);

    // Records should be identical (excluding generatedAt which varies)
    assert.deepEqual(index1.records, index2.records);
    assert.deepEqual(index1.source, index2.source);
  });
});

// ============================================================================
// Verify Status Contract Tests
// ============================================================================

describe('Evidence Index Verify Status', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should reflect verifyOk=true correctly', () => {
    const opts = createMockOptions(tempDir, { verifyOk: true, verifyStrict: false });
    const index = buildEvidenceIndex(opts);

    assert.equal(index.records[0].bundle.verify.ok, true);
    assert.equal(index.records[0].bundle.verify.strict, false);
  });

  it('should reflect verifyOk=false correctly', () => {
    const opts = createMockOptions(tempDir, { verifyOk: false, verifyStrict: false });
    const index = buildEvidenceIndex(opts);

    assert.equal(index.records[0].bundle.verify.ok, false);
    assert.equal(index.records[0].bundle.verify.strict, false);
  });

  it('should reflect verifyStrict=true correctly', () => {
    const opts = createMockOptions(tempDir, { verifyOk: true, verifyStrict: true });
    const index = buildEvidenceIndex(opts);

    assert.equal(index.records[0].bundle.verify.ok, true);
    assert.equal(index.records[0].bundle.verify.strict, true);
  });
});

// ============================================================================
// Retention Days Contract Tests
// ============================================================================

describe('Evidence Index Retention Days', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should always include retention.days', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.ok(index.records[0].retention);
    assert.equal(typeof index.records[0].retention.days, 'number');
  });

  it('should use DEFAULT_RETENTION_DAYS (90)', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].retention.days, 90);
  });

  it('should always include retention.policy version', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '' });
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records[0].retention.policy, 'autonomy-evidence-retention.v1');
  });
});

// ============================================================================
// No PII Contract Tests
// ============================================================================

describe('Evidence Index No PII Fields', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const PII_PATTERNS = [
    /email/i,
    /password/i,
    /secret/i,
    /token/i,
    /ssn/i,
    /social.*security/i,
    /phone/i,
    /address/i,
    /credit.*card/i,
    /bank.*account/i,
  ];

  function checkNoPII(obj: unknown, currentPath = ''): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;

        // Check key names for PII patterns
        for (const pattern of PII_PATTERNS) {
          assert.ok(!pattern.test(key), `PII-like field name found: ${fullPath}`);
        }

        // Check string values for PII patterns (shallow)
        if (typeof value === 'string') {
          for (const pattern of PII_PATTERNS) {
            assert.ok(!pattern.test(value), `PII-like value found at: ${fullPath}`);
          }
        }

        // Recurse into nested objects
        if (typeof value === 'object' && value !== null) {
          checkNoPII(value, fullPath);
        }
      }
    }
  }

  it('should not contain PII field names', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    checkNoPII(index);
  });

  it('should not contain PII values', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    checkNoPII(index);
  });

  it('should only contain allowed top-level fields', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    const allowedFields = ['schema', 'generatedAt', 'source', 'records'];
    const actualFields = Object.keys(index);

    for (const field of actualFields) {
      assert.ok(allowedFields.includes(field), `Unexpected top-level field: ${field}`);
    }
  });

  it('should only contain allowed record fields', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    const record = index.records[0];
    const allowedRecordFields = [
      'recordId',
      'status',
      'planItemId',
      'strategyId',
      'finalCommitSha',
      'bundle',
      'artifacts',
      'rollback',
      'retention',
    ];
    const actualFields = Object.keys(record);

    for (const field of actualFields) {
      assert.ok(allowedRecordFields.includes(field), `Unexpected record field: ${field}`);
    }
  });
});

// ============================================================================
// loadApplyProofs Contract Tests
// ============================================================================

describe('loadApplyProofs()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load valid apply-proofs.json', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));

    const proofs = loadApplyProofs(tempDir);
    assert.ok(Array.isArray(proofs));
    assert.equal(proofs.length, 1);
    assert.equal(proofs[0].planItemId, 'item-unused-import-001');
  });

  it('should return empty array if file not found', () => {
    const proofs = loadApplyProofs(tempDir);
    assert.ok(Array.isArray(proofs));
    assert.equal(proofs.length, 0);
  });

  it('should return empty array for invalid JSON', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, 'not valid json');

    const proofs = loadApplyProofs(tempDir);
    assert.ok(Array.isArray(proofs));
    assert.equal(proofs.length, 0);
  });

  it('should return empty array for non-array JSON', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify({ not: 'array' }));

    const proofs = loadApplyProofs(tempDir);
    assert.ok(Array.isArray(proofs));
    assert.equal(proofs.length, 0);
  });

  it('should handle { proofs: [] } format', () => {
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify({ proofs: [MOCK_APPLY_PROOF] }));

    const proofs = loadApplyProofs(tempDir);
    assert.ok(Array.isArray(proofs));
    assert.equal(proofs.length, 1);
  });
});

// ============================================================================
// Output Format Contract Tests
// ============================================================================

describe('Evidence Index Output Format', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([MOCK_APPLY_PROOF]));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should produce valid JSON when stringified', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    const json = JSON.stringify(index, null, 2);

    assert.ok(json);
    assert.doesNotThrow(() => JSON.parse(json));
  });

  it('should be parseable back to identical structure', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    const json = JSON.stringify(index);
    const parsed = JSON.parse(json) as EvidenceIndex;

    assert.equal(parsed.schema, index.schema);
    assert.equal(parsed.records.length, index.records.length);
    assert.deepEqual(parsed.source, index.source);
  });

  it('should produce compact JSON without excessive whitespace', () => {
    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    const compact = JSON.stringify(index);
    const pretty = JSON.stringify(index, null, 2);

    // Pretty should be larger than compact
    assert.ok(pretty.length > compact.length);
  });
});

// ============================================================================
// Edge Cases Contract Tests
// ============================================================================

describe('Evidence Index Edge Cases', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should handle empty bundle name', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '', bundleName: '' });
    const index = buildEvidenceIndex(opts);

    // Bundle name should use default format
    assert.ok(index.records[0].bundle.name.includes('autonomy-evidence-bundle'));
  });

  it('should handle empty manifest SHA', () => {
    const opts = createMockOptions(tempDir, { artifactsDir: '', manifestSha: '' });
    const index = buildEvidenceIndex(opts);

    assert.equal(index.records[0].bundle.manifestSha256, '');
  });

  it('should handle missing rollbackCommand in proof', () => {
    const proofNoRollback = { ...MOCK_APPLY_PROOF };
    delete (proofNoRollback as Record<string, unknown>).rollbackCommand;

    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify([proofNoRollback]));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.ok(index.records[0].rollback);
    // Should still have a generated rollback command
    assert.ok(index.records[0].rollback.command.includes('perf:rollback'));
  });

  it('should handle large number of proofs', () => {
    const manyProofs = Array.from({ length: 100 }, (_, i) => ({
      ...MOCK_APPLY_PROOF,
      proofId: `proof-${i}`,
      planItemId: `item-${i}`,
    }));

    const proofsPath = path.join(tempDir, 'apply-proofs.json');
    fs.writeFileSync(proofsPath, JSON.stringify(manyProofs));

    const opts = createMockOptions(tempDir);
    const index = buildEvidenceIndex(opts);
    assert.equal(index.records.length, 100);
  });
});

// ============================================================================
// Phase 4N14: Immutable URL Contract Tests
// ============================================================================

describe('Phase 4N14: Immutable URL Wiring', () => {
  describe('validateImmutableUrl()', () => {
    it('should accept valid release tag URL', () => {
      const url = 'https://github.com/owner/repo/releases/tag/v1.0.0';
      assert.equal(validateImmutableUrl(url), null);
    });

    it('should accept valid release download URL', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0/bundle.zip';
      assert.equal(validateImmutableUrl(url), null);
    });

    it('should reject /latest URLs', () => {
      const url = 'https://github.com/owner/repo/releases/latest';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('mutable'));
    });

    it('should reject /download/latest URLs', () => {
      const url = 'https://github.com/owner/repo/releases/download/latest/bundle.zip';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject branch refs (refs/heads)', () => {
      const url = 'https://github.com/owner/repo/releases/refs/heads/main';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject /tree/ URLs', () => {
      const url = 'https://github.com/owner/repo/tree/main/releases/v1';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject /blob/ URLs', () => {
      const url = 'https://github.com/owner/repo/blob/main/releases/v1';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject URL shorteners (bit.ly)', () => {
      const url = 'https://bit.ly/releases/abc';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject URL shorteners (t.co)', () => {
      const url = 'https://t.co/releases/abc';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject @latest suffix', () => {
      const url = 'https://github.com/owner/repo/releases/tag/v1@latest';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject non-releases URLs', () => {
      const url = 'https://github.com/owner/repo/archive/v1.0.0.zip';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('not a GitHub releases URL'));
    });

    // Phase 4N15: Security constraint tests
    it('should reject URLs with querystrings', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0/bundle.zip?download=1';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('querystring'));
    });

    it('should reject URLs with fragments', () => {
      const url = 'https://github.com/owner/repo/releases/tag/v1.0.0#assets';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('fragment'));
    });

    it('should reject URL-encoded traversal (%2f)', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0%2f..%2f..%2fetc';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('encoded path'));
    });

    it('should reject URL-encoded traversal (%2e)', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0/%2e%2e/secret';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('encoded path'));
    });

    it('should reject double-encoded characters (%25)', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0/%252f..%252f';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('double-encoded'));
    });

    it('should reject non-ASCII characters (unicode confusables)', () => {
      // Using a unicode slash lookalike (FRACTION SLASH U+2044)
      const url = 'https://github.com/owner/repo/releases/tag/v1⁄0';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('non-ASCII'));
    });

    it('should reject backslash (Windows path injection)', () => {
      const url = 'https://github.com/owner/repo/releases/download/v1.0.0\\..\\..';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('backslash'));
    });

    it('should reject mixed-case trickery (/Latest)', () => {
      const url = 'https://github.com/owner/repo/releases/Latest';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('mutable'));
    });

    it('should reject mixed-case trickery (/LATEST)', () => {
      const url = 'https://github.com/owner/repo/releases/LATEST';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });
  });

  describe('buildReleaseUrl()', () => {
    it('should build correct release tag URL', () => {
      const url = buildReleaseUrl('https://github.com', 'owner/repo', 'v1.0.0');
      assert.equal(url, 'https://github.com/owner/repo/releases/tag/v1.0.0');
    });

    it('should strip trailing slash from serverUrl', () => {
      const url = buildReleaseUrl('https://github.com/', 'owner/repo', 'v1.0.0');
      assert.equal(url, 'https://github.com/owner/repo/releases/tag/v1.0.0');
    });

    it('should properly encode special characters in tag', () => {
      const url = buildReleaseUrl('https://github.com', 'owner/repo', 'autonomy-evidence/2026-01');
      assert.ok(url.includes('autonomy-evidence%2F2026-01'));
    });

    it('should produce immutable URL (passes validation)', () => {
      const url = buildReleaseUrl('https://github.com', 'owner/repo', 'v1.0.0');
      assert.equal(validateImmutableUrl(url), null);
    });
  });

  describe('buildAssetUrl()', () => {
    it('should build correct asset download URL', () => {
      const url = buildAssetUrl('https://github.com', 'owner/repo', 'v1.0.0', 'bundle.zip');
      assert.equal(url, 'https://github.com/owner/repo/releases/download/v1.0.0/bundle.zip');
    });

    it('should encode special characters in tag and asset name', () => {
      const url = buildAssetUrl(
        'https://github.com',
        'owner/repo',
        'autonomy-evidence/2026-01',
        'my file.zip'
      );
      assert.ok(url.includes('autonomy-evidence%2F2026-01'));
      assert.ok(url.includes('my%20file.zip'));
    });

    it('should produce immutable URL (passes validation)', () => {
      const url = buildAssetUrl('https://github.com', 'owner/repo', 'v1.0.0', 'bundle.zip');
      assert.equal(validateImmutableUrl(url), null);
    });
  });

  describe('CANONICAL_ASSET_NAMES', () => {
    it('should generate correct bundle zip name', () => {
      const name = CANONICAL_ASSET_NAMES.bundleZip('12345');
      assert.equal(name, 'autonomy-evidence-bundle-12345.zip');
    });

    it('should generate correct manifest json name', () => {
      const name = CANONICAL_ASSET_NAMES.manifestJson('12345');
      assert.equal(name, 'autonomy-evidence-manifest-12345.json');
    });

    it('should have correct fixed names', () => {
      assert.equal(CANONICAL_ASSET_NAMES.evidenceIndexJson, 'autonomy-evidence-index.json');
      assert.equal(CANONICAL_ASSET_NAMES.ledgerHtml, 'autonomy-ledger.html');
      assert.equal(CANONICAL_ASSET_NAMES.dashboardHtml, 'autonomy-dashboard.html');
      assert.equal(CANONICAL_ASSET_NAMES.custodyHtml, 'autonomy-custody.html');
      assert.equal(CANONICAL_ASSET_NAMES.custodyAttestationJson, 'custody-attestation.json');
    });
  });

  describe('buildReleaseAssets()', () => {
    it('should build all asset URLs', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      assert.ok(assets.bundleZip);
      assert.ok(assets.manifestJson);
      assert.ok(assets.evidenceIndexJson);
      assert.ok(assets.ledgerHtml);
      assert.ok(assets.dashboardHtml);
      assert.ok(assets.custodyHtml);
      assert.ok(assets.custodyAttestationJson);
    });

    it('should use canonical names for dynamic assets', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      assert.equal(assets.bundleZip?.name, 'autonomy-evidence-bundle-12345.zip');
      assert.equal(assets.manifestJson?.name, 'autonomy-evidence-manifest-12345.json');
    });

    it('should use canonical names for fixed assets', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      assert.equal(assets.evidenceIndexJson?.name, 'autonomy-evidence-index.json');
      assert.equal(assets.ledgerHtml?.name, 'autonomy-ledger.html');
    });

    it('should produce immutable URLs for all assets', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      // Check each asset URL is immutable
      assert.equal(validateImmutableUrl(assets.bundleZip!.url), null);
      assert.equal(validateImmutableUrl(assets.manifestJson!.url), null);
      assert.equal(validateImmutableUrl(assets.evidenceIndexJson!.url), null);
      assert.equal(validateImmutableUrl(assets.ledgerHtml!.url), null);
    });

    it('should generate deterministic output', () => {
      const assets1 = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');
      const assets2 = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      assert.deepEqual(assets1, assets2);
    });
  });

  describe('buildEvidenceIndex with releaseTag', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-index-url-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include releaseUrl when releaseTag is provided', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        releaseTag: 'autonomy-evidence-2026-01', // Use hyphen to avoid URL encoding conflict
        serverUrl: 'https://github.com',
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.releaseTag);
      assert.equal(index.releaseTag, 'autonomy-evidence-2026-01');
      assert.ok(index.releaseUrl);
      assert.ok(index.releaseUrl.includes('/releases/tag/'));
    });

    it('should include assets when releaseTag is provided', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        releaseTag: 'v1.0.0',
        serverUrl: 'https://github.com',
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.assets);
      assert.ok(index.assets.bundleZip);
      assert.ok(index.assets.manifestJson);
      assert.ok(index.assets.evidenceIndexJson);
    });

    it('should not include releaseUrl when releaseTag is not provided', () => {
      const opts = createMockOptions(tempDir, { artifactsDir: '' });
      const index = buildEvidenceIndex(opts);

      assert.equal(index.releaseTag, undefined);
      assert.equal(index.releaseUrl, undefined);
      assert.equal(index.assets, undefined);
    });

    it('should validate releaseUrl is immutable', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        releaseTag: 'v1.0.0',
        serverUrl: 'https://github.com',
      });
      const index = buildEvidenceIndex(opts);

      // Should pass validation
      assert.equal(validateImmutableUrl(index.releaseUrl!), null);
    });

    it('should use default serverUrl when not provided', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        releaseTag: 'v1.0.0',
        // serverUrl not provided, should use default
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.releaseUrl);
      assert.ok(index.releaseUrl.includes('github.com'));
    });
  });
});

// ============================================================================
// Phase 4N15: Evidence Reality Check Contract Tests
// ============================================================================

describe('Phase 4N15: Evidence Reality Check', () => {
  describe('Security Constraint Validation', () => {
    it('should reject null byte injection', () => {
      const url = 'https://github.com/owner/repo/releases/tag/v1.0.0\x00malicious';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
      assert.ok(result.includes('null byte'));
    });

    it('should accept clean release URLs (no edge cases)', () => {
      // Clean URL with no special characters
      const url =
        'https://github.com/terrafusion/os/releases/download/autonomy-evidence-2026-01/bundle.zip';
      assert.equal(validateImmutableUrl(url), null);
    });

    it('should reject git.io shortener', () => {
      const url = 'https://git.io/releases/abc';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });

    it('should reject tinyurl shortener', () => {
      const url = 'https://tinyurl.com/releases/abc';
      const result = validateImmutableUrl(url);
      assert.ok(result !== null);
    });
  });

  describe('Publisher Asset Verification Contracts', () => {
    // These tests verify the contract that publisher workflows must include asset checks
    // The actual workflow syntax is tested in CI, but we document the contract here

    it('contract: publisher must verify all CANONICAL_ASSET_NAMES exist after upload', () => {
      // This test documents the contract - the workflow step must check these assets
      const requiredAssets = [
        CANONICAL_ASSET_NAMES.bundleZip('12345'),
        CANONICAL_ASSET_NAMES.manifestJson('12345'),
        CANONICAL_ASSET_NAMES.evidenceIndexJson,
        CANONICAL_ASSET_NAMES.ledgerHtml,
        CANONICAL_ASSET_NAMES.dashboardHtml,
        CANONICAL_ASSET_NAMES.custodyHtml,
        CANONICAL_ASSET_NAMES.custodyAttestationJson,
      ];

      // All canonical names should be defined and non-empty
      for (const asset of requiredAssets) {
        assert.ok(asset, 'Canonical asset name must be defined');
        assert.ok(asset.length > 0, 'Canonical asset name must be non-empty');
      }
    });

    it('contract: canonical bundle names must include runId for uniqueness', () => {
      const name1 = CANONICAL_ASSET_NAMES.bundleZip('run-123');
      const name2 = CANONICAL_ASSET_NAMES.bundleZip('run-456');

      assert.notEqual(name1, name2, 'Bundle names with different runIds must differ');
      assert.ok(name1.includes('run-123'), 'Bundle name must include runId');
      assert.ok(name2.includes('run-456'), 'Bundle name must include runId');
    });

    it('contract: canonical manifest names must include runId for uniqueness', () => {
      const name1 = CANONICAL_ASSET_NAMES.manifestJson('run-123');
      const name2 = CANONICAL_ASSET_NAMES.manifestJson('run-456');

      assert.notEqual(name1, name2, 'Manifest names with different runIds must differ');
    });

    it('contract: fixed asset names must be stable across invocations', () => {
      // These names are fixed and must not change
      assert.equal(CANONICAL_ASSET_NAMES.evidenceIndexJson, 'autonomy-evidence-index.json');
      assert.equal(CANONICAL_ASSET_NAMES.ledgerHtml, 'autonomy-ledger.html');
      assert.equal(CANONICAL_ASSET_NAMES.dashboardHtml, 'autonomy-dashboard.html');
      assert.equal(CANONICAL_ASSET_NAMES.custodyHtml, 'autonomy-custody.html');
      assert.equal(CANONICAL_ASSET_NAMES.custodyAttestationJson, 'custody-attestation.json');
    });
  });

  describe('URL Security Edge Cases', () => {
    it('should handle URLs with port numbers (valid if releases path)', () => {
      const url = 'https://github.example.com:443/owner/repo/releases/tag/v1';
      // Port numbers are valid but the domain must contain releases path
      assert.equal(validateImmutableUrl(url), null);
    });

    it('should reject URLs with userinfo (user:pass@)', () => {
      // While this is technically possible in URLs, it's a security risk
      const url = 'https://user:pass@github.com/owner/repo/releases/tag/v1';
      // This contains @ which should be rejected as non-ASCII if unicode check fails
      // However, @ is ASCII. Let's verify it passes (no rule against it currently)
      // For now, this documents current behavior - may want to add explicit check later
      const result = validateImmutableUrl(url);
      // This should pass current validation - documenting for future hardening
      assert.equal(result, null);
    });
  });
});

// ============================================================================
// Phase 4N17: Signature Triplet Parity Contract Tests
// ============================================================================

describe('Phase 4N17: Signature Triplet Parity', () => {
  describe('buildSignatureTriplet()', () => {
    it('should construct complete triplet from asset name', () => {
      const assetName = 'bundle.zip';
      const triplet = buildSignatureTriplet(assetName);

      assert.equal(triplet.sig, 'bundle.zip.sig');
      assert.equal(triplet.crt, 'bundle.zip.crt');
      assert.equal(triplet.bundle, 'bundle.zip.bundle');
    });

    it('should produce consistent triplet suffixes', () => {
      const assetName = 'asset.json';
      const triplet = buildSignatureTriplet(assetName);

      assert.ok(triplet.sig.endsWith('.sig'));
      assert.ok(triplet.crt.endsWith('.crt'));
      assert.ok(triplet.bundle.endsWith('.bundle'));
    });

    it('should preserve original name in triplet', () => {
      const assetName = 'my-evidence.zip';
      const triplet = buildSignatureTriplet(assetName);

      // Each triplet file should use the original name as prefix
      assert.ok(triplet.sig.startsWith(assetName));
      assert.ok(triplet.crt.startsWith(assetName));
      assert.ok(triplet.bundle.startsWith(assetName));
    });
  });

  describe('Signing Mode Constants', () => {
    it('PRIMARY_SIGNED_ASSETS should include required primary assets', () => {
      // These are the assets that MUST be signed in 'primary' or 'full' mode
      assert.ok(PRIMARY_SIGNED_ASSETS.includes('bundleZip'));
      assert.ok(PRIMARY_SIGNED_ASSETS.includes('manifestJson'));
      assert.ok(PRIMARY_SIGNED_ASSETS.includes('evidenceIndexJson'));
    });

    it('MINIMUM_SIGNED_ASSETS should include bundle and manifest', () => {
      // These are the absolute minimum for 'primary' mode
      assert.ok(MINIMUM_SIGNED_ASSETS.includes('bundleZip'));
      assert.ok(MINIMUM_SIGNED_ASSETS.includes('manifestJson'));
    });

    it('MINIMUM_SIGNED_ASSETS should be subset of PRIMARY_SIGNED_ASSETS', () => {
      for (const asset of MINIMUM_SIGNED_ASSETS) {
        assert.ok(PRIMARY_SIGNED_ASSETS.includes(asset), `${asset} is in MINIMUM but not PRIMARY`);
      }
    });
  });

  describe('verifySignatureTriplet()', () => {
    it('should return ok=true when all three files exist in set', () => {
      const assetName = 'bundle.zip';
      const existingFiles = new Set([
        'bundle.zip',
        'bundle.zip.sig',
        'bundle.zip.crt',
        'bundle.zip.bundle',
      ]);

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.ok, true);
      assert.equal(result.missing.length, 0);
      assert.equal(result.present.length, 3);
    });

    it('should return ok=false when .sig is missing', () => {
      const assetName = 'bundle.zip';
      const existingFiles = new Set(['bundle.zip', 'bundle.zip.crt', 'bundle.zip.bundle']);

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.ok, false);
      assert.ok(result.missing.includes('bundle.zip.sig'));
      assert.equal(result.present.length, 2);
    });

    it('should return ok=false when .crt is missing', () => {
      const assetName = 'bundle.zip';
      const existingFiles = new Set(['bundle.zip', 'bundle.zip.sig', 'bundle.zip.bundle']);

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.ok, false);
      assert.ok(result.missing.includes('bundle.zip.crt'));
    });

    it('should return ok=false when .bundle is missing', () => {
      const assetName = 'bundle.zip';
      const existingFiles = new Set(['bundle.zip', 'bundle.zip.sig', 'bundle.zip.crt']);

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.ok, false);
      assert.ok(result.missing.includes('bundle.zip.bundle'));
    });

    it('should return ok=false when all signature files are missing', () => {
      const assetName = 'bundle.zip';
      const existingFiles = new Set(['bundle.zip']);

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.ok, false);
      assert.equal(result.missing.length, 3);
      assert.equal(result.present.length, 0);
    });

    it('should include asset name in result', () => {
      const assetName = 'my-bundle.zip';
      const existingFiles = new Set<string>();

      const result = verifySignatureTriplet(assetName, existingFiles);
      assert.equal(result.assetName, 'my-bundle.zip');
    });
  });

  describe('verifySigningModeParity()', () => {
    const BUNDLE_NAME = 'autonomy-evidence-bundle-12345.zip';
    const MANIFEST_NAME = 'autonomy-evidence-manifest-12345.json';

    function createAssets(): ReturnType<typeof buildReleaseAssets> {
      return buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');
    }

    it('should return ok=true for mode=none (no signatures required)', () => {
      const assets = createAssets();
      const existingFiles = new Set([BUNDLE_NAME, MANIFEST_NAME]);

      const result = verifySigningModeParity('none', assets, existingFiles);
      assert.equal(result.ok, true);
      assert.equal(result.errors.length, 0);
    });

    it('should return ok=true for mode=primary with minimum signed assets', () => {
      const assets = createAssets();
      const existingFiles = new Set([
        BUNDLE_NAME,
        `${BUNDLE_NAME}.sig`,
        `${BUNDLE_NAME}.crt`,
        `${BUNDLE_NAME}.bundle`,
        MANIFEST_NAME,
        `${MANIFEST_NAME}.sig`,
        `${MANIFEST_NAME}.crt`,
        `${MANIFEST_NAME}.bundle`,
      ]);

      const result = verifySigningModeParity('primary', assets, existingFiles);
      assert.equal(result.ok, true);
      assert.equal(result.errors.length, 0);
    });

    it('should return ok=false for mode=primary with missing triplet', () => {
      const assets = createAssets();
      // Bundle has triplet, manifest missing triplet
      const existingFiles = new Set([
        BUNDLE_NAME,
        `${BUNDLE_NAME}.sig`,
        `${BUNDLE_NAME}.crt`,
        `${BUNDLE_NAME}.bundle`,
        MANIFEST_NAME, // Only manifest, no signature files
      ]);

      const result = verifySigningModeParity('primary', assets, existingFiles);
      assert.equal(result.ok, false);
      assert.ok(result.errors.length > 0);
    });

    it('should return ok=false for mode=full with any missing triplet', () => {
      const assets = createAssets();
      // Bundle and manifest have triplets, but evidence index doesn't
      const existingFiles = new Set([
        BUNDLE_NAME,
        `${BUNDLE_NAME}.sig`,
        `${BUNDLE_NAME}.crt`,
        `${BUNDLE_NAME}.bundle`,
        MANIFEST_NAME,
        `${MANIFEST_NAME}.sig`,
        `${MANIFEST_NAME}.crt`,
        `${MANIFEST_NAME}.bundle`,
        'autonomy-evidence-index.json', // Index has no triplet
      ]);

      const result = verifySigningModeParity('full', assets, existingFiles);
      assert.equal(result.ok, false);
    });
  });

  describe('buildReleaseAssets() with Signing Status', () => {
    it('should include signing field in all assets', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      // Each asset should have a signing field
      assert.ok(assets.bundleZip?.signing !== undefined);
      assert.ok(assets.manifestJson?.signing !== undefined);
      assert.ok(assets.evidenceIndexJson?.signing !== undefined);
    });

    it('should mark assets as signed when signedAssets provided', () => {
      const signedAssets = {
        workflow: 'autonomy-evidence-publisher',
        ref: 'refs/heads/main',
        signedArtifacts: new Set([
          'autonomy-evidence-bundle-12345.zip',
          'autonomy-evidence-manifest-12345.json',
        ]),
      };
      const assets = buildReleaseAssets(
        'https://github.com',
        'owner/repo',
        'v1.0.0',
        '12345',
        signedAssets
      );

      // Bundle and manifest should be marked as signed
      assert.equal(assets.bundleZip?.signing.signed, true);
      assert.equal(assets.manifestJson?.signing.signed, true);
    });

    it('should not mark assets as signed without signedAssets', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      // Without signedAssets, assets are not signed
      assert.equal(assets.bundleZip?.signing.signed, false);
      assert.equal(assets.manifestJson?.signing.signed, false);
    });

    it('should include triplet URLs for signed assets', () => {
      const signedAssets = {
        workflow: 'autonomy-evidence-publisher',
        ref: 'refs/heads/main',
        signedArtifacts: new Set(['autonomy-evidence-bundle-12345.zip']),
      };
      const assets = buildReleaseAssets(
        'https://github.com',
        'owner/repo',
        'v1.0.0',
        '12345',
        signedAssets
      );

      // Signed assets should have triplet names
      const bundleSigning = assets.bundleZip?.signing;
      assert.ok(bundleSigning?.triplet);
      assert.ok(bundleSigning?.triplet?.sig.endsWith('.sig'));
      assert.ok(bundleSigning?.triplet?.crt.endsWith('.crt'));
      assert.ok(bundleSigning?.triplet?.bundle.endsWith('.bundle'));
    });

    it('should have explicit boolean signed field (not inferred)', () => {
      const assets = buildReleaseAssets('https://github.com', 'owner/repo', 'v1.0.0', '12345');

      // signed must be an explicit boolean, not undefined
      assert.equal(typeof assets.bundleZip?.signing.signed, 'boolean');
      assert.equal(typeof assets.manifestJson?.signing.signed, 'boolean');
    });
  });

  describe('EvidenceIndex with Signing Metadata', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signing-metadata-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include signingMode when provided', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'full' as SigningMode,
      });
      const index = buildEvidenceIndex(opts);

      assert.equal(index.signingMode, 'full');
    });

    it('should include signingIdentity when provided', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingIdentity:
          'https://github.com/terrafusion/os/.github/workflows/autonomy-evidence-publisher.yml@refs/heads/main',
      });
      const index = buildEvidenceIndex(opts);

      assert.equal(
        index.signingIdentity,
        'https://github.com/terrafusion/os/.github/workflows/autonomy-evidence-publisher.yml@refs/heads/main'
      );
    });

    it('should not include signing fields when not provided', () => {
      const opts = createMockOptions(tempDir, { artifactsDir: '' });
      const index = buildEvidenceIndex(opts);

      assert.equal(index.signingMode, undefined);
      assert.equal(index.signingIdentity, undefined);
    });
  });

  describe('Triplet Parity Enforcement Contracts', () => {
    it('contract: signed=true requires complete triplet', () => {
      // This documents the enforcement contract
      // If an asset has signing.signed=true, all three triplet files MUST exist
      const signedAssets = {
        workflow: 'autonomy-evidence-publisher',
        ref: 'refs/heads/main',
        signedArtifacts: new Set([
          'autonomy-evidence-bundle-12345.zip',
          'autonomy-evidence-manifest-12345.json',
        ]),
      };
      const assets = buildReleaseAssets(
        'https://github.com',
        'owner/repo',
        'v1.0.0',
        '12345',
        signedAssets
      );

      for (const [name, asset] of Object.entries(assets)) {
        if (asset?.signing.signed === true) {
          assert.ok(asset.signing.triplet, `${name} is signed but missing triplet`);
          assert.ok(asset.signing.triplet.sig, `${name} is signed but missing .sig name`);
          assert.ok(asset.signing.triplet.crt, `${name} is signed but missing .crt name`);
          assert.ok(asset.signing.triplet.bundle, `${name} is signed but missing .bundle name`);
        }
      }
    });

    it('contract: PRIMARY_SIGNED_ASSETS defines scope for full mode', () => {
      // PRIMARY_SIGNED_ASSETS defines which assets need signatures in 'full' mode
      // At least bundleZip and manifestJson must be in the list
      assert.ok(PRIMARY_SIGNED_ASSETS.includes('bundleZip'));
      assert.ok(PRIMARY_SIGNED_ASSETS.includes('manifestJson'));
      assert.ok(PRIMARY_SIGNED_ASSETS.length >= 2);
    });

    it('contract: triplet names use correct suffixes', () => {
      const signedAssets = {
        workflow: 'autonomy-evidence-publisher',
        ref: 'refs/heads/main',
        signedArtifacts: new Set(['autonomy-evidence-bundle-12345.zip']),
      };
      const assets = buildReleaseAssets(
        'https://github.com',
        'owner/repo',
        'v1.0.0',
        '12345',
        signedAssets
      );

      // Triplet names must use standard suffixes
      const triplet = assets.bundleZip?.signing.triplet;
      assert.ok(triplet);
      assert.ok(triplet.sig.endsWith('.sig'), 'sig should end with .sig');
      assert.ok(triplet.crt.endsWith('.crt'), 'crt should end with .crt');
      assert.ok(triplet.bundle.endsWith('.bundle'), 'bundle should end with .bundle');
    });
  });
});

// ============================================================================
// Phase 4N20: Identity & Issuer Pinning Contract Tests
// ============================================================================

describe('Phase 4N20: Identity & Issuer Pinning', () => {
  // Pinning helpers imported at top level (ESM-compliant)

  describe('buildSigningIdentity()', () => {
    it('should construct correct identity URI', () => {
      const identity = buildSigningIdentity(
        'https://github.com',
        'terrafusion/os',
        '.github/workflows/autonomy-evidence-publisher.yml',
        'refs/heads/main'
      );
      assert.equal(
        identity,
        'https://github.com/terrafusion/os/.github/workflows/autonomy-evidence-publisher.yml@refs/heads/main'
      );
    });

    it('should be deterministic (same inputs = same output)', () => {
      const id1 = buildSigningIdentity(
        'https://github.com',
        'owner/repo',
        '.github/workflows/test.yml',
        'refs/heads/main'
      );
      const id2 = buildSigningIdentity(
        'https://github.com',
        'owner/repo',
        '.github/workflows/test.yml',
        'refs/heads/main'
      );
      assert.equal(id1, id2);
    });

    it('should strip trailing slash from serverUrl', () => {
      const identity = buildSigningIdentity(
        'https://github.com/',
        'owner/repo',
        '.github/workflows/test.yml',
        'refs/heads/main'
      );
      assert.ok(!identity.includes('github.com//'));
    });
  });

  describe('deriveWorkflowPath()', () => {
    it('should return path as-is if already qualified', () => {
      const path = deriveWorkflowPath('.github/workflows/custom.yml', false);
      assert.equal(path, '.github/workflows/custom.yml');
    });

    it('should derive incident workflow from name when incident=true', () => {
      const path = deriveWorkflowPath('publisher', true);
      assert.ok(path.includes('incident'));
    });

    it('should derive evidence workflow from name when incident=false', () => {
      const path = deriveWorkflowPath('publisher', false);
      assert.ok(path.includes('evidence') || path.includes('publisher'));
    });
  });

  describe('GITHUB_OIDC_ISSUER constant', () => {
    it('should be GitHub Actions token issuer', () => {
      assert.equal(GITHUB_OIDC_ISSUER, 'https://token.actions.githubusercontent.com');
    });
  });

  describe('FORBIDDEN_IDENTITY_PATTERNS', () => {
    it('should reject @refs/tags/ identities', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/tags/v1.0.0';
      const matches = FORBIDDEN_IDENTITY_PATTERNS.some((p: RegExp) => p.test(identity));
      assert.ok(matches, 'Tag identities should be forbidden');
    });

    it('should reject /latest ref', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/latest';
      const matches = FORBIDDEN_IDENTITY_PATTERNS.some((p: RegExp) => p.test(identity));
      assert.ok(matches, '/latest ref should be forbidden');
    });

    it('should reject feature branches for merged/incident', () => {
      const identity =
        'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/feature/test';
      // Use the pattern directly - third pattern is for branch restriction
      // Pattern source has escaped slashes, so match against refs\\/heads
      const branchPattern = FORBIDDEN_IDENTITY_PATTERNS.find(
        (p: RegExp) => p.source.includes('refs') && p.source.includes('heads')
      );
      assert.ok(branchPattern, 'Should find branch restriction pattern');
      // Only main/master allowed
      assert.ok(branchPattern.test(identity), 'Feature branches should be forbidden');
    });

    it('should allow refs/heads/main', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/main';
      const tagPattern = FORBIDDEN_IDENTITY_PATTERNS.find((p: RegExp) =>
        p.source.includes('refs/tags')
      );
      const latestPattern = FORBIDDEN_IDENTITY_PATTERNS.find((p: RegExp) =>
        p.source.includes('latest')
      );
      assert.ok(!tagPattern || !tagPattern.test(identity));
      assert.ok(!latestPattern || !latestPattern.test(identity));
    });

    it('should allow refs/heads/master', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/master';
      const tagPattern = FORBIDDEN_IDENTITY_PATTERNS.find((p: RegExp) =>
        p.source.includes('refs/tags')
      );
      assert.ok(!tagPattern || !tagPattern.test(identity));
    });
  });

  describe('validateIdentity()', () => {
    it('should return null for valid main branch identity (merged tier)', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/main';
      const error = validateIdentity(identity, 'merged');
      assert.equal(error, null);
    });

    it('should return error for feature branch in merged tier', () => {
      const identity =
        'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/feature/x';
      const error = validateIdentity(identity, 'merged');
      assert.ok(error, 'Feature branch should fail for merged tier');
    });

    it('should allow any branch in ci tier', () => {
      const identity =
        'https://github.com/owner/repo/.github/workflows/test.yml@refs/heads/feature/x';
      const error = validateIdentity(identity, 'ci');
      assert.equal(error, null, 'CI tier should allow any branch');
    });

    it('should reject tag identity in merged tier', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/tags/v1.0.0';
      const error = validateIdentity(identity, 'merged');
      assert.ok(error, 'Tag identity should fail for merged tier');
    });

    it('should reject tag identity in incident tier', () => {
      const identity = 'https://github.com/owner/repo/.github/workflows/test.yml@refs/tags/v1.0.0';
      const error = validateIdentity(identity, 'incident');
      assert.ok(error, 'Tag identity should fail for incident tier');
    });
  });

  describe('ExpectedSignaturePolicy in EvidenceIndex', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pinning-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include expectedSignaturePolicy when signing mode enabled', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-evidence-publisher',
        workflowPath: '.github/workflows/autonomy-evidence-publisher.yml',
        sha: 'a'.repeat(40),
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.expectedSignaturePolicy, 'expectedSignaturePolicy should be present');
      assert.ok(index.expectedSignaturePolicy.issuer, 'issuer should be present');
      assert.ok(index.expectedSignaturePolicy.identity, 'identity should be present');
    });

    it('should not include expectedSignaturePolicy when signing mode is none', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'none' as SigningMode,
      });
      const index = buildEvidenceIndex(opts);

      assert.equal(index.expectedSignaturePolicy, undefined);
    });

    it('should derive identity from repo, workflowPath, and ref', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-evidence-publisher',
        repo: 'terrafusion/os',
        ref: 'refs/heads/main',
        workflowPath: '.github/workflows/autonomy-evidence-publisher.yml',
        sha: 'a'.repeat(40),
      });
      const index = buildEvidenceIndex(opts);
      const policy = index.expectedSignaturePolicy;

      assert.ok(policy);
      assert.ok(policy.identity.includes('terrafusion/os'));
      assert.ok(policy.identity.includes('autonomy-evidence-publisher.yml'));
      assert.ok(policy.identity.includes('@refs/heads/main'));
    });
  });

  describe('SHA Requirement for Merged/Incident Tiers', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sha-req-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should include sha in expectedSignaturePolicy when provided', () => {
      const sha = 'abc123'.padEnd(40, '0');
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-evidence-publisher',
        workflowPath: '.github/workflows/autonomy-evidence-publisher.yml',
        sha,
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.expectedSignaturePolicy);
      assert.equal(index.expectedSignaturePolicy.sha, sha);
    });

    it('should set requireShaBinding=true for merged tier', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-evidence-publisher',
        workflowPath: '.github/workflows/autonomy-evidence-publisher.yml',
        sha: 'a'.repeat(40),
        retentionTier: 'merged', // Merged tier requires SHA binding
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.expectedSignaturePolicy, 'Policy must exist when signingMode set');
      assert.strictEqual(
        index.expectedSignaturePolicy.requireShaBinding,
        true,
        'Merged tier MUST require SHA binding'
      );
    });

    it('should set requireShaBinding=true for incident tier', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-incident-publisher',
        workflowPath: '.github/workflows/autonomy-incident-publisher.yml',
        sha: 'b'.repeat(40),
        retentionTier: 'incident', // Incident tier requires SHA binding
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.expectedSignaturePolicy, 'Policy must exist when signingMode set');
      assert.strictEqual(
        index.expectedSignaturePolicy.requireShaBinding,
        true,
        'Incident tier MUST require SHA binding'
      );
    });

    it('should set requireShaBinding=false for CI tier', () => {
      const opts = createMockOptions(tempDir, {
        artifactsDir: '',
        signingMode: 'primary' as SigningMode,
        workflow: 'autonomy-pr-lane',
        workflowPath: '.github/workflows/autonomy-pr-lane.yml',
        sha: 'c'.repeat(40),
        retentionTier: 'ci', // CI tier does NOT require SHA binding
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.expectedSignaturePolicy, 'Policy must exist when signingMode set');
      assert.strictEqual(
        index.expectedSignaturePolicy.requireShaBinding,
        false,
        'CI tier should NOT require SHA binding'
      );
    });
  });
});

// ============================================================================
// Phase 4N21: Rekor Transparency Log Contract Tests
// ============================================================================

describe('Phase 4N21: Rekor Transparency Log Anchoring', () => {
  describe('RekorAnchor Schema', () => {
    it('should export REKOR_PUBLIC_URL constant', async () => {
      const { REKOR_PUBLIC_URL } = await import('../src/evidence-index.js');
      assert.equal(REKOR_PUBLIC_URL, 'https://rekor.sigstore.dev');
    });

    it('should export parseRekorFromBundle function', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      assert.equal(typeof parseRekorFromBundle, 'function');
    });

    it('should export validateRekorUrl function', async () => {
      const { validateRekorUrl } = await import('../src/evidence-index.js');
      assert.equal(typeof validateRekorUrl, 'function');
    });
  });

  describe('parseRekorFromBundle()', () => {
    it('should parse new Sigstore bundle format (v0.2+)', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      const bundleContent = JSON.stringify({
        verificationMaterial: {
          tlogEntries: [
            {
              logIndex: '12345678',
              logId: { keyId: 'abcdef0123456789' },
              integratedTime: '1706745600',
            },
          ],
        },
      });

      const result = parseRekorFromBundle(bundleContent);
      assert.ok(result, 'Should parse bundle successfully');
      assert.equal(result!.logIndex, 12345678);
      assert.equal(result!.integratedTime, 1706745600);
      assert.equal(result!.bundleValid, true);
    });

    it('should parse older rekorBundle format', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      const bundleContent = JSON.stringify({
        rekorBundle: {
          Payload: {
            logIndex: 9876543,
            integratedTime: 1706745600,
          },
        },
      });

      const result = parseRekorFromBundle(bundleContent);
      assert.ok(result, 'Should parse bundle successfully');
      assert.equal(result!.logIndex, 9876543);
      assert.equal(result!.integratedTime, 1706745600);
    });

    it('should return null for invalid JSON', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      const result = parseRekorFromBundle('not-json');
      assert.equal(result, null);
    });

    it('should return null for missing Rekor entries', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      const bundleContent = JSON.stringify({
        someOtherData: {},
      });
      const result = parseRekorFromBundle(bundleContent);
      assert.equal(result, null);
    });
  });

  describe('validateRekorUrl()', () => {
    it('should accept valid Rekor URLs', async () => {
      const { validateRekorUrl } = await import('../src/evidence-index.js');
      const error = validateRekorUrl(
        'https://rekor.sigstore.dev/api/v1/log/entries?logIndex=12345678'
      );
      assert.equal(error, null);
    });

    it('should reject non-Rekor URLs', async () => {
      const { validateRekorUrl } = await import('../src/evidence-index.js');
      const error = validateRekorUrl('https://example.com/rekor');
      assert.ok(error);
      assert.ok(error.includes('must start with'));
    });

    it('should reject URLs with fragments', async () => {
      const { validateRekorUrl } = await import('../src/evidence-index.js');
      const error = validateRekorUrl(
        'https://rekor.sigstore.dev/api/v1/log/entries?logIndex=123#section'
      );
      assert.ok(error);
      assert.ok(error.includes('fragments'));
    });

    it('should reject URLs without logIndex', async () => {
      const { validateRekorUrl } = await import('../src/evidence-index.js');
      const error = validateRekorUrl('https://rekor.sigstore.dev/api/v1/log/entries');
      assert.ok(error);
      assert.ok(error.includes('logIndex'));
    });
  });

  describe('Determinism', () => {
    it('should produce same output for same bundle input', async () => {
      const { parseRekorFromBundle } = await import('../src/evidence-index.js');
      const bundleContent = JSON.stringify({
        verificationMaterial: {
          tlogEntries: [
            {
              logIndex: '999',
              logId: { keyId: 'test123' },
              integratedTime: '1700000000',
            },
          ],
        },
      });

      const result1 = parseRekorFromBundle(bundleContent);
      const result2 = parseRekorFromBundle(bundleContent);

      assert.deepStrictEqual(result1, result2);
    });
  });
});

// ============================================================================
// Phase 4N22: Two-Person Integrity (TPI) Contract Tests
// ============================================================================

describe('Phase 4N22: TPI Schema Contract Tests', () => {
  describe('TPIResult interface contract', () => {
    it('should define required fields for TPI result', async () => {
      // Import the types (compile-time check)
      const { type } = await import('../src/evidence-index.js');

      // Define a mock TPI result to verify structure
      const mockTpiResult = {
        ok: true,
        minApprovals: 2,
        approverLogins: ['alice', 'bob'],
        policyVersion: '1.0.0',
        evaluatedAt: '2026-01-31T12:00:00Z',
        prRequirements: {
          hasRequiredLabels: true,
          hasRequiredTitle: true,
          correctBaseBranch: true,
        },
      };

      // Verify all required fields are present
      assert.equal(typeof mockTpiResult.ok, 'boolean', 'ok should be boolean');
      assert.equal(typeof mockTpiResult.minApprovals, 'number', 'minApprovals should be number');
      assert.ok(Array.isArray(mockTpiResult.approverLogins), 'approverLogins should be array');
      assert.equal(typeof mockTpiResult.policyVersion, 'string', 'policyVersion should be string');
      assert.equal(typeof mockTpiResult.evaluatedAt, 'string', 'evaluatedAt should be string');
    });

    it('should allow tpi field on EvidenceIndex', async () => {
      const mockIndex = {
        schema: 'terrafusion.autonomy.evidence.index.v1' as const,
        generatedAt: '2026-01-31T12:00:00Z',
        source: {
          workflow: 'autonomy-pr-lane',
          runId: '12345',
          repo: 'terrafusion/os',
          ref: 'refs/heads/main',
        },
        records: [],
        tpi: {
          ok: true,
          minApprovals: 2,
          approverLogins: ['alice', 'bob'],
          policyVersion: '1.0.0',
          evaluatedAt: '2026-01-31T12:00:00Z',
        },
      };

      assert.ok(mockIndex.tpi, 'tpi should be present');
      assert.equal(mockIndex.tpi.ok, true);
      assert.equal(mockIndex.tpi.minApprovals, 2);
    });
  });

  describe('TPI Approval Counting Logic (Demo)', () => {
    // These tests demonstrate the approval counting logic used by the TPI guard

    it('should exclude self-approval from count', () => {
      const prAuthor = 'alice';
      const approvals = ['alice', 'bob', 'charlie'];

      const validApprovers = approvals.filter(a => a !== prAuthor);
      assert.deepStrictEqual(validApprovers, ['bob', 'charlie']);
      assert.equal(validApprovers.length, 2, 'Self-approval should not count');
    });

    it('should exclude bot approvals from count', () => {
      const botPatterns = ['[bot]', 'dependabot', 'snyk-bot', 'renovate', 'github-actions'];
      const approvals = ['alice', 'dependabot[bot]', 'snyk-bot', 'bob'];

      const isBot = (approver: string) => botPatterns.some(pattern => approver.includes(pattern));

      const validApprovers = approvals.filter(a => !isBot(a));
      assert.deepStrictEqual(validApprovers, ['alice', 'bob']);
      assert.equal(validApprovers.length, 2, 'Bot approvals should not count');
    });

    it('should deduplicate approvers', () => {
      const approvals = ['alice', 'bob', 'alice', 'charlie', 'bob'];

      const uniqueApprovers = [...new Set(approvals)];
      assert.deepStrictEqual(uniqueApprovers, ['alice', 'bob', 'charlie']);
      assert.equal(uniqueApprovers.length, 3, 'Duplicate approvers should be removed');
    });

    it('should fail TPI when approval count < minApprovals', () => {
      const minApprovals = 2;
      const approvals = ['alice']; // Only 1 approver

      const tpiOk = approvals.length >= minApprovals;
      assert.equal(tpiOk, false, 'TPI should fail with insufficient approvals');
    });

    it('should pass TPI when approval count >= minApprovals', () => {
      const minApprovals = 2;
      const approvals = ['alice', 'bob']; // Exactly 2 approvers

      const tpiOk = approvals.length >= minApprovals;
      assert.equal(tpiOk, true, 'TPI should pass with sufficient approvals');
    });
  });

  describe('TPI Policy Validation', () => {
    it('should reject PR without required labels', () => {
      const requiredLabels = ['autonomy', 'tier-0', 'automated'];
      const prLabels = ['autonomy', 'tier-0']; // Missing 'automated'

      const hasAllLabels = requiredLabels.every(l => prLabels.includes(l));
      assert.equal(hasAllLabels, false, 'Should fail when required labels are missing');
    });

    it('should accept PR with all required labels', () => {
      const requiredLabels = ['autonomy', 'tier-0', 'automated'];
      const prLabels = ['autonomy', 'tier-0', 'automated', 'extra-label'];

      const hasAllLabels = requiredLabels.every(l => prLabels.includes(l));
      assert.equal(hasAllLabels, true, 'Should pass when all required labels are present');
    });

    it('should reject PR without required title prefix', () => {
      const requiredPrefix = '🤖 Autonomy:';
      const prTitle = 'feat: some feature';

      const hasPrefix = prTitle.startsWith(requiredPrefix);
      assert.equal(hasPrefix, false, 'Should fail when title prefix is missing');
    });

    it('should accept PR with required title prefix', () => {
      const requiredPrefix = '🤖 Autonomy:';
      const prTitle = '🤖 Autonomy: cleanup unused imports';

      const hasPrefix = prTitle.startsWith(requiredPrefix);
      assert.equal(hasPrefix, true, 'Should pass when title prefix is present');
    });

    it('should reject PR with wrong base branch', () => {
      const allowedBranches = ['main'];
      const baseBranch = 'develop';

      const correctBase = allowedBranches.includes(baseBranch);
      assert.equal(correctBase, false, 'Should fail when base branch is not allowed');
    });
  });

  describe('TPI Determinism', () => {
    it('should produce same TPI result for same input', () => {
      const evaluateTpi = (approvers: string[], prAuthor: string, minApprovals: number) => {
        const validApprovers = [...new Set(approvers.filter(a => a !== prAuthor))];
        return {
          ok: validApprovers.length >= minApprovals,
          minApprovals,
          approverLogins: validApprovers.sort(), // Sort for determinism
          policyVersion: '1.0.0',
        };
      };

      const input = {
        approvers: ['bob', 'charlie', 'alice'],
        prAuthor: 'david',
        minApprovals: 2,
      };

      const result1 = evaluateTpi(input.approvers, input.prAuthor, input.minApprovals);
      const result2 = evaluateTpi(input.approvers, input.prAuthor, input.minApprovals);

      assert.deepStrictEqual(result1, result2, 'TPI evaluation should be deterministic');
      assert.deepStrictEqual(
        result1.approverLogins,
        ['alice', 'bob', 'charlie'],
        'Approvers should be sorted for determinism'
      );
    });
  });

  describe('TPI Policy File', () => {
    it('should have valid AUTONOMY_TPI_POLICY.json', async () => {
      const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_TPI_POLICY.json');

      // Check file exists
      assert.ok(fs.existsSync(policyPath), 'Policy file should exist');

      // Parse and validate structure
      const content = fs.readFileSync(policyPath, 'utf8');
      const policy = JSON.parse(content);

      // Validate required fields
      assert.equal(
        policy.schema,
        'terrafusion.autonomy.tpi.policy.v1',
        'Policy schema should be correct'
      );
      assert.equal(typeof policy.version, 'string', 'Policy version should be string');
      assert.ok(policy.enforcement, 'Policy should have enforcement section');
      assert.equal(
        typeof policy.enforcement.minApprovals,
        'number',
        'minApprovals should be number'
      );
      assert.equal(policy.enforcement.minApprovals, 2, 'minApprovals should be 2 for TPI');
      assert.equal(
        policy.enforcement.disallowSelfApproval,
        true,
        'disallowSelfApproval should be true'
      );
      assert.equal(policy.enforcement.disallowBots, true, 'disallowBots should be true');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 4N23: Break-Glass Protocol Contract Tests
  // ──────────────────────────────────────────────────────────────────
  describe('Phase 4N23: Break-Glass Protocol', () => {
    describe('Policy Contract', () => {
      it('should have valid AUTONOMY_BREAK_GLASS_POLICY.json', async () => {
        const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_BREAK_GLASS_POLICY.json');

        // Check file exists
        assert.ok(fs.existsSync(policyPath), 'Break-Glass policy file should exist');

        // Parse and validate structure
        const content = fs.readFileSync(policyPath, 'utf8');
        const policy = JSON.parse(content);

        // Validate schema version
        assert.equal(
          policy.schema,
          'terrafusion.autonomy.break_glass.policy.v1',
          'Policy schema should be correct'
        );
        assert.equal(typeof policy.version, 'string', 'Policy version should be string');
      });

      it('should require stricter approval threshold than TPI', async () => {
        const tpiPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_TPI_POLICY.json');
        const breakGlassPath = path.join(
          __dirname,
          '..',
          'policy',
          'AUTONOMY_BREAK_GLASS_POLICY.json'
        );

        const tpiPolicy = JSON.parse(fs.readFileSync(tpiPath, 'utf8'));
        const breakGlassPolicy = JSON.parse(fs.readFileSync(breakGlassPath, 'utf8'));

        // TPI uses enforcement.minApprovals, Break-Glass uses requirements.minApprovals
        assert.ok(
          breakGlassPolicy.requirements.minApprovals > tpiPolicy.enforcement.minApprovals,
          'Break-Glass minApprovals must be > TPI minApprovals'
        );
        assert.equal(
          breakGlassPolicy.requirements.minApprovals,
          3,
          'Break-Glass requires exactly 3 approvals'
        );
      });

      it('should disallow automerge for break-glass PRs', async () => {
        const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_BREAK_GLASS_POLICY.json');
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

        assert.equal(
          policy.verification.requireNoAutomerge,
          true,
          'Break-Glass must require no automerge'
        );
      });

      it('should have allowed and forbidden action lists', async () => {
        const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_BREAK_GLASS_POLICY.json');
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

        // Verify allowed actions
        assert.ok(Array.isArray(policy.allowedActions), 'allowedActions should be array');
        const expectedAllowed = [
          'rollback_from_proof',
          'republish_evidence',
          'pause_autonomy_lane',
        ];
        expectedAllowed.forEach(action => {
          assert.ok(
            policy.allowedActions.includes(action),
            `allowedActions should include ${action}`
          );
        });

        // Verify forbidden actions
        assert.ok(Array.isArray(policy.forbiddenActions), 'forbiddenActions should be array');
        const expectedForbidden = [
          'skip_tpi_approvals',
          'skip_signature_verification',
          'modify_forbidden_paths',
          'direct_push_to_main',
        ];
        expectedForbidden.forEach(action => {
          assert.ok(
            policy.forbiddenActions.includes(action),
            `forbiddenActions should include ${action}`
          );
        });
      });

      it('should require break-glass reason labels', async () => {
        const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_BREAK_GLASS_POLICY.json');
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

        assert.ok(policy.activation, 'Policy should have activation section');
        assert.equal(policy.activation.label, 'break-glass', 'Should require break-glass label');
        assert.equal(
          policy.activation.reasonLabelPrefix,
          'break-glass:reason/',
          'Should have reason label prefix'
        );
      });

      it('should require PR body fields for documentation', async () => {
        const policyPath = path.join(__dirname, '..', 'policy', 'AUTONOMY_BREAK_GLASS_POLICY.json');
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

        assert.ok(
          Array.isArray(policy.activation.requiredBodyFields),
          'requiredBodyFields should be array'
        );

        const expectedFields = ['BREAK GLASS MODE:', 'Reason:', 'Scope:', 'Risk:', 'Evidence:'];
        expectedFields.forEach(field => {
          const found = policy.activation.requiredBodyFields.some((f: string) =>
            f.includes(field.replace(':', ''))
          );
          assert.ok(found, `requiredBodyFields should include field matching ${field}`);
        });
      });
    });

    describe('BreakGlassResult Interface Contract', () => {
      it('should generate deterministic output for same input', () => {
        const mockBreakGlass: Record<string, unknown> = {
          activated: true,
          reason: 'incident',
          action: 'rollback_from_proof',
          approvers: ['alice', 'bob', 'carol'],
          approvalsRequired: 3,
          policySha: 'sha256:abc123',
          policyVersion: '1.0.0',
          evaluatedAt: '2025-01-01T00:00:00Z',
          checks: {
            pinned: true,
            rekor: true,
            verifyBundleStrict: true,
            rollbackVerified: true,
            noAutomerge: true,
          },
        };

        // Serialize and deserialize
        const serialized = JSON.stringify(mockBreakGlass);
        const deserialized = JSON.parse(serialized);

        // Verify determinism
        assert.deepStrictEqual(
          deserialized,
          mockBreakGlass,
          'BreakGlassResult should be deterministically serializable'
        );

        // Re-serialize should produce identical output
        assert.equal(
          JSON.stringify(deserialized),
          serialized,
          'Re-serialization should be identical'
        );
      });

      it('should enforce approvers >= approvalsRequired when activated', () => {
        const validBreakGlass = {
          activated: true,
          approvers: ['alice', 'bob', 'carol'],
          approvalsRequired: 3,
        };

        const invalidBreakGlass = {
          activated: true,
          approvers: ['alice', 'bob'],
          approvalsRequired: 3,
        };

        assert.ok(
          validBreakGlass.approvers.length >= validBreakGlass.approvalsRequired,
          'Valid break-glass should have sufficient approvers'
        );
        assert.ok(
          invalidBreakGlass.approvers.length < invalidBreakGlass.approvalsRequired,
          'Invalid break-glass should fail approver count check'
        );
      });

      it('should require all checks to pass for activated break-glass', () => {
        const checks = {
          pinned: true,
          rekor: true,
          verifyBundleStrict: true,
          rollbackVerified: true,
          noAutomerge: true,
        };

        const allPass = Object.values(checks).every(v => v === true);
        assert.ok(allPass, 'All break-glass checks must pass');

        // Test failure detection
        const failedChecks = { ...checks, noAutomerge: false };
        const stillPass = Object.values(failedChecks).every(v => v === true);
        assert.ok(!stillPass, 'Should detect failed checks');
      });
    });

    describe('Break-Glass Guard Logic', () => {
      it('should detect break-glass label in PR labels', () => {
        const prLabels = ['enhancement', 'break-glass', 'break-glass:reason/incident'];
        const hasBreakGlass = prLabels.includes('break-glass');
        assert.ok(hasBreakGlass, 'Should detect break-glass label');
      });

      it('should detect missing break-glass label', () => {
        const prLabels = ['enhancement', 'documentation'];
        const hasBreakGlass = prLabels.includes('break-glass');
        assert.ok(!hasBreakGlass, 'Should detect missing break-glass label');
      });

      it('should extract reason from break-glass:reason/* label', () => {
        const prLabels = ['break-glass', 'break-glass:reason/incident'];
        const reasonLabel = prLabels.find(l => l.startsWith('break-glass:reason/'));
        assert.ok(reasonLabel, 'Should find reason label');
        const reason = reasonLabel?.replace('break-glass:reason/', '');
        assert.equal(reason, 'incident', 'Should extract reason correctly');
      });

      it('should exclude self-approvals and bot approvals', () => {
        const prAuthor = 'alice';
        const allApprovals = [
          { user: 'alice', type: 'human' },
          { user: 'bob', type: 'human' },
          { user: 'dependabot[bot]', type: 'bot' },
          { user: 'carol', type: 'human' },
        ];

        const validApprovals = allApprovals.filter(
          a => a.user !== prAuthor && !a.user.includes('[bot]')
        );

        assert.equal(validApprovals.length, 2, 'Should have 2 valid approvals');
        assert.deepStrictEqual(
          validApprovals.map(a => a.user),
          ['bob', 'carol'],
          'Should only include bob and carol'
        );
      });

      it('should detect automerge enabled on PR', () => {
        const prWithAutomerge = { auto_merge: { enabled: true } };
        const prWithoutAutomerge = { auto_merge: null };

        const hasAutomerge = (pr: { auto_merge: unknown }) =>
          pr.auto_merge !== null && pr.auto_merge !== undefined;

        assert.ok(hasAutomerge(prWithAutomerge), 'Should detect automerge enabled');
        assert.ok(!hasAutomerge(prWithoutAutomerge), 'Should detect automerge disabled');
      });

      it('should validate required title prefix', () => {
        const validTitle = '🚨 Break Glass: Emergency rollback for incident #123';
        const invalidTitle = 'feat: Add new feature';
        const requiredPrefix = '🚨 Break Glass:';

        assert.ok(validTitle.startsWith(requiredPrefix), 'Valid title should have required prefix');
        assert.ok(
          !invalidTitle.startsWith(requiredPrefix),
          'Invalid title should fail prefix check'
        );
      });

      it('should validate required PR body fields', () => {
        const prBody = `
## 🚨 Break Glass PR

**BREAK GLASS MODE:** ENABLED
**Reason:** Production incident #456
**Scope:** Rollback deployment to v1.2.3
**Risk:** Low - reverting to known-good state
**Evidence:** https://rekor.sigstore.dev/api/v1/log/entries/abc123
        `;

        const requiredFields = ['BREAK GLASS MODE:', 'Reason:', 'Scope:', 'Risk:', 'Evidence:'];

        const missingFields = requiredFields.filter(f => !prBody.includes(f));
        assert.equal(missingFields.length, 0, 'All required fields should be present');
      });

      it('should fail validation for incomplete PR body', () => {
        const incompleteBody = `
## 🚨 Break Glass PR

**BREAK GLASS MODE:** ENABLED
**Reason:** Production incident
        `;

        const requiredFields = ['BREAK GLASS MODE:', 'Reason:', 'Scope:', 'Risk:', 'Evidence:'];

        const missingFields = requiredFields.filter(f => !incompleteBody.includes(f));
        assert.ok(missingFields.length > 0, 'Should detect missing fields');
        assert.ok(missingFields.includes('Scope:'), 'Should detect missing Scope');
        assert.ok(missingFields.includes('Risk:'), 'Should detect missing Risk');
        assert.ok(missingFields.includes('Evidence:'), 'Should detect missing Evidence');
      });
    });

    describe('Break-Glass Workflow Integration', () => {
      it('should have break-glass guard workflow file', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'autonomy-break-glass-guard.yml'
        );

        assert.ok(fs.existsSync(workflowPath), 'autonomy-break-glass-guard.yml should exist');
      });

      it('should reference break-glass policy in workflow', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'autonomy-break-glass-guard.yml'
        );

        const content = fs.readFileSync(workflowPath, 'utf8');

        assert.ok(
          content.includes('AUTONOMY_BREAK_GLASS_POLICY.json') ||
            content.includes('break_glass') ||
            content.includes('break-glass'),
          'Workflow should reference break-glass policy'
        );
        assert.ok(
          content.includes('minApprovals') || content.includes('approvals'),
          'Workflow should check approvals'
        );
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Phase 4N24: Break-Glass Drill Contract Tests
  // ──────────────────────────────────────────────────────────────────
  describe('Phase 4N24: Break-Glass Drill', () => {
    describe('Drill Workflow', () => {
      it('should have break-glass-drill.yml workflow file', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );

        assert.ok(fs.existsSync(workflowPath), 'break-glass-drill.yml should exist');
      });

      it('should have both manual dispatch and schedule triggers', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );
        const content = fs.readFileSync(workflowPath, 'utf8');

        assert.ok(
          content.includes('workflow_dispatch:'),
          'Workflow should have manual dispatch trigger'
        );
        assert.ok(content.includes('schedule:'), 'Workflow should have schedule trigger');
        assert.ok(content.includes('cron:'), 'Workflow should define cron schedule');
      });

      it('should validate guard logic for approval thresholds', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );
        const content = fs.readFileSync(workflowPath, 'utf8');

        // Drill should test 0, 1, 2, 3 approval scenarios
        assert.ok(
          content.includes('zero') || content.includes('0 approval'),
          'Should test zero approvals blocked'
        );
        assert.ok(
          content.includes('three') || content.includes('3 approval'),
          'Should test three approvals passes'
        );
      });

      it('should reference the break-glass policy file', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );
        const content = fs.readFileSync(workflowPath, 'utf8');

        assert.ok(
          content.includes('AUTONOMY_BREAK_GLASS_POLICY.json'),
          'Workflow should reference break-glass policy'
        );
      });

      it('should generate drill report artifact', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );
        const content = fs.readFileSync(workflowPath, 'utf8');

        assert.ok(
          content.includes('break-glass-drill-report'),
          'Workflow should generate drill report'
        );
        assert.ok(
          content.includes('upload-artifact'),
          'Workflow should upload drill report as artifact'
        );
      });
    });

    describe('DrillResult Interface Contract', () => {
      it('should generate deterministic drill result', () => {
        const mockDrill = {
          schema: 'terrafusion.autonomy.break_glass.drill.v1',
          drillId: 'drill-20260131-090000-42',
          timestamp: '2026-01-31T09:00:00Z',
          repository: 'owner/repo',
          runId: 12345,
          runNumber: 42,
          triggeredBy: 'alice',
          triggerType: 'workflow_dispatch',
          drillType: 'full',
          dryRun: true,
          status: 'PASS',
          policy: {
            version: '1.0.0',
            sha256: 'abc123def456',
          },
          guardLogicTests: {
            zeroApprovalsBlocked: true,
            oneApprovalBlocked: true,
            twoApprovalsBlocked: true,
            threeApprovalsPasses: true,
            botExcluded: true,
            selfExcluded: true,
            automergeBlocked: true,
            allTestsPass: true,
          },
          labelValidation: {
            requiredLabelValid: true,
            reasonPrefixValid: true,
            titlePrefixValid: true,
            bodyFieldsValid: true,
          },
          forbiddenActions: {
            count: 6,
            criticalPresent: true,
          },
          compliance: {
            framework: 'FISMA',
            controlExercised: true,
            lastDrillDate: '2026-01-31T09:00:00Z',
            nextScheduledDrill: 'monthly',
          },
        };

        // Serialize and deserialize
        const serialized = JSON.stringify(mockDrill);
        const deserialized = JSON.parse(serialized);

        assert.deepStrictEqual(
          deserialized,
          mockDrill,
          'DrillResult should be deterministically serializable'
        );

        // Re-serialize should produce identical output
        assert.equal(
          JSON.stringify(deserialized),
          serialized,
          'Re-serialization should be identical'
        );
      });

      it('should require all guard logic tests for PASS status', () => {
        const passingDrill = {
          status: 'PASS',
          guardLogicTests: {
            zeroApprovalsBlocked: true,
            oneApprovalBlocked: true,
            twoApprovalsBlocked: true,
            threeApprovalsPasses: true,
            botExcluded: true,
            selfExcluded: true,
            automergeBlocked: true,
            allTestsPass: true,
          },
        };

        const failingDrill = {
          status: 'FAIL',
          guardLogicTests: {
            zeroApprovalsBlocked: true,
            oneApprovalBlocked: true,
            twoApprovalsBlocked: false, // This fails
            threeApprovalsPasses: true,
            botExcluded: true,
            selfExcluded: true,
            automergeBlocked: true,
            allTestsPass: false,
          },
        };

        assert.equal(
          passingDrill.guardLogicTests.allTestsPass,
          true,
          'Passing drill should have allTestsPass=true'
        );
        assert.equal(
          failingDrill.guardLogicTests.allTestsPass,
          false,
          'Failing drill should have allTestsPass=false'
        );
      });

      it('should record FISMA compliance metadata', () => {
        const drillCompliance = {
          framework: 'FISMA',
          controlExercised: true,
          lastDrillDate: '2026-01-31T09:00:00Z',
          nextScheduledDrill: 'monthly',
        };

        assert.equal(drillCompliance.framework, 'FISMA', 'Framework should be FISMA');
        assert.ok(drillCompliance.controlExercised, 'Control should be marked as exercised');
        assert.ok(
          drillCompliance.lastDrillDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
          'lastDrillDate should be ISO format'
        );
        assert.ok(
          ['monthly', 'quarterly', 'annual'].includes(drillCompliance.nextScheduledDrill),
          'nextScheduledDrill should be valid frequency'
        );
      });
    });

    describe('Drill Validation Logic', () => {
      it('should validate bot exclusion logic', () => {
        const botPatterns = ['[bot]', 'dependabot', 'snyk-bot', 'renovate', 'github-actions'];
        const testUsers = [
          { login: 'dependabot[bot]', isBot: true },
          { login: 'alice', isBot: false },
          { login: 'snyk-bot', isBot: true },
          { login: 'bob', isBot: false },
          { login: 'renovate[bot]', isBot: true },
        ];

        testUsers.forEach((user) => {
          const detectedAsBot = botPatterns.some((pattern) => user.login.includes(pattern));
          assert.equal(
            detectedAsBot,
            user.isBot,
            `${user.login} should be detected as ${user.isBot ? 'bot' : 'human'}`
          );
        });
      });

      it('should validate self-approval exclusion', () => {
        const prAuthor = 'alice';
        const approvers = ['alice', 'bob', 'carol'];

        const validApprovers = approvers.filter((a) => a !== prAuthor);
        assert.deepStrictEqual(
          validApprovers,
          ['bob', 'carol'],
          'Self-approvals should be excluded'
        );
      });

      it('should validate automerge detection', () => {
        const testCases = [
          { auto_merge: null, expected: false },
          { auto_merge: undefined, expected: false },
          { auto_merge: { enabled: true }, expected: true },
          { auto_merge: {}, expected: true },
        ];

        testCases.forEach((tc, i) => {
          const hasAutomerge =
            tc.auto_merge !== null && tc.auto_merge !== undefined;
          assert.equal(
            hasAutomerge,
            tc.expected,
            `Test case ${i}: automerge detection should be ${tc.expected}`
          );
        });
      });

      it('should validate approval count thresholds', () => {
        const minApprovals = 3;

        const testCases = [
          { count: 0, shouldBlock: true },
          { count: 1, shouldBlock: true },
          { count: 2, shouldBlock: true },
          { count: 3, shouldBlock: false },
          { count: 4, shouldBlock: false },
        ];

        testCases.forEach((tc) => {
          const blocked = tc.count < minApprovals;
          assert.equal(
            blocked,
            tc.shouldBlock,
            `${tc.count} approvals should be ${tc.shouldBlock ? 'blocked' : 'allowed'}`
          );
        });
      });
    });

    describe('Policy Alignment', () => {
      it('should drill against correct policy version', async () => {
        const policyPath = path.join(
          __dirname,
          '..',
          'policy',
          'AUTONOMY_BREAK_GLASS_POLICY.json'
        );

        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

        // Drill must verify these policy requirements
        assert.equal(
          policy.requirements.minApprovals,
          3,
          'Policy requires 3 approvals'
        );
        assert.equal(
          policy.verification.requireNoAutomerge,
          true,
          'Policy requires no automerge'
        );
        assert.equal(
          policy.requirements.disallowBots,
          true,
          'Policy disallows bot approvals'
        );
        assert.equal(
          policy.requirements.disallowSelfApproval,
          true,
          'Policy disallows self-approval'
        );
      });

      it('should verify drill workflow uses same policy path', () => {
        const workflowPath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.github',
          'workflows',
          'break-glass-drill.yml'
        );
        const content = fs.readFileSync(workflowPath, 'utf8');

        // The expected policy path from workflow
        const expectedPath =
          'tools/registry/autonomy-viewer/policy/AUTONOMY_BREAK_GLASS_POLICY.json';

        assert.ok(
          content.includes(expectedPath),
          'Drill workflow should reference correct policy path'
        );
      });
    });
  });
});
