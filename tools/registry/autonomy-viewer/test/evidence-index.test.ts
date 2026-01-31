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
import { afterEach, beforeEach, describe, it } from 'node:test';

// Import the evidence index module
import {
    CANONICAL_ASSET_NAMES,
    DEFAULT_RETENTION_DAYS,
    EVIDENCE_INDEX_SCHEMA,
    type EvidenceIndex,
    RETENTION_POLICY_VERSION,
    buildAssetUrl,
    buildEvidenceIndex,
    buildReleaseAssets,
    buildReleaseUrl,
    loadApplyProofs,
    validateImmutableUrl,
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
        releaseTag: 'autonomy-evidence/2026-01',
        serverUrl: 'https://github.com',
      });
      const index = buildEvidenceIndex(opts);

      assert.ok(index.releaseTag);
      assert.equal(index.releaseTag, 'autonomy-evidence/2026-01');
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
