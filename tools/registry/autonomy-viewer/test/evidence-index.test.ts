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

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Import the evidence index module
import {
  type EvidenceIndex,
  buildEvidenceIndex,
  loadApplyProofs,
  EVIDENCE_INDEX_SCHEMA,
  RETENTION_POLICY_VERSION,
  DEFAULT_RETENTION_DAYS,
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
    assert.equal(
      EVIDENCE_INDEX_SCHEMA,
      'terrafusion.autonomy.evidence.index.v1'
    );
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
    assert.equal(
      index.records[0].retention.policy,
      'autonomy-evidence-retention.v1'
    );
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
          assert.ok(
            !pattern.test(key),
            `PII-like field name found: ${fullPath}`
          );
        }

        // Check string values for PII patterns (shallow)
        if (typeof value === 'string') {
          for (const pattern of PII_PATTERNS) {
            assert.ok(
              !pattern.test(value),
              `PII-like value found at: ${fullPath}`
            );
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
      assert.ok(
        allowedFields.includes(field),
        `Unexpected top-level field: ${field}`
      );
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
      assert.ok(
        allowedRecordFields.includes(field),
        `Unexpected record field: ${field}`
      );
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
