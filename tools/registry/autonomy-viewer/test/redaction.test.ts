/**
 * Phase 4N42 – Redaction Contract Tests
 * ======================================
 *
 * TDD-first tests for PII detection, redaction, and proof generation.
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    DEFAULT_PII_PATTERNS,
    detectPii,
    detectPiiInJson,
    generateRedactionProof,
    isRedactionDeterministic,
    redactContent,
    REDACTION_PROOF_SCHEMA,
    verifyRedactionProof,
    type RedactionProof
} from '../src/redaction.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – Redaction Schema', () => {
  it('schema identifier is correct', () => {
    assert.equal(REDACTION_PROOF_SCHEMA, 'terrafusion.autonomy.redaction-proof.v1');
  });

  it('default patterns include SSN detection', () => {
    const ssnPattern = DEFAULT_PII_PATTERNS.find(p => p.category === 'SSN');
    assert.ok(ssnPattern, 'SSN pattern should exist');
  });

  it('default patterns include email detection', () => {
    const emailPattern = DEFAULT_PII_PATTERNS.find(p => p.category === 'EMAIL');
    assert.ok(emailPattern, 'EMAIL pattern should exist');
  });

  it('default patterns include credential detection', () => {
    const credPattern = DEFAULT_PII_PATTERNS.find(p => p.category === 'CREDENTIAL');
    assert.ok(credPattern, 'CREDENTIAL pattern should exist');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PII Detection Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – PII Detection', () => {
  it('detects SSN with dashes', () => {
    const content = 'Social security: 123-45-6789';
    const detections = detectPii(content, 'test.txt');

    const ssnDetection = detections.find(d => d.pattern.category === 'SSN');
    assert.ok(ssnDetection, 'Should detect SSN');
    assert.equal(ssnDetection?.value, '123-45-6789');
  });

  it('detects email addresses', () => {
    const content = 'Contact: john.doe@example.com for more info';
    const detections = detectPii(content, 'test.txt');

    const emailDetection = detections.find(d => d.pattern.category === 'EMAIL');
    assert.ok(emailDetection, 'Should detect email');
    assert.equal(emailDetection?.value, 'john.doe@example.com');
  });

  it('detects phone numbers', () => {
    const content = 'Call (555) 123-4567 for assistance';
    const detections = detectPii(content, 'test.txt');

    const phoneDetection = detections.find(d => d.pattern.category === 'PHONE');
    assert.ok(phoneDetection, 'Should detect phone number');
  });

  it('detects EIN/Tax ID', () => {
    const content = 'Business EIN: 12-3456789';
    const detections = detectPii(content, 'test.txt');

    const taxDetection = detections.find(d => d.pattern.category === 'TAX_ID');
    assert.ok(taxDetection, 'Should detect Tax ID');
  });

  it('detects GitHub tokens', () => {
    const content = 'export TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz';
    const detections = detectPii(content, 'test.txt');

    const credDetection = detections.find(d => d.pattern.category === 'CREDENTIAL');
    assert.ok(credDetection, 'Should detect GitHub token');
  });

  it('detects AWS access keys', () => {
    const content = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    const detections = detectPii(content, 'test.txt');

    const credDetection = detections.find(d => d.pattern.category === 'CREDENTIAL');
    assert.ok(credDetection, 'Should detect AWS key');
  });

  it('detects multiple PII in same content', () => {
    const content = `
      Name: John Doe
      SSN: 123-45-6789
      Email: john@example.com
      Phone: 555-123-4567
    `;
    const detections = detectPii(content, 'test.txt');

    assert.ok(detections.length >= 3, `Expected at least 3 detections, got ${detections.length}`);
  });

  it('includes line number in location', () => {
    const content = 'Line 1\nSSN: 123-45-6789\nLine 3';
    const detections = detectPii(content, 'test.txt');

    const ssnDetection = detections.find(d => d.pattern.category === 'SSN');
    assert.ok(ssnDetection?.location.includes('line:2'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JSON PII Detection Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – JSON PII Detection', () => {
  it('detects PII in JSON field values', () => {
    const content = JSON.stringify({
      owner: {
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com',
      },
    });

    const detections = detectPiiInJson(content, 'test.json');

    // Should detect SSN and email both by pattern and field name
    assert.ok(detections.length >= 2);
  });

  it('detects PII by field name pattern', () => {
    const content = JSON.stringify({
      parcelOwner: 'Jane Smith',
      ownerAddress: '123 Main St',
    });

    const detections = detectPiiInJson(content, 'test.json');

    // Should detect NAME and ADDRESS by field name
    const nameDetection = detections.find(d => d.pattern.category === 'NAME');
    assert.ok(nameDetection, 'Should detect NAME by field pattern');
  });

  it('handles nested JSON objects', () => {
    const content = JSON.stringify({
      records: [{ ssn: '111-22-3333' }, { ssn: '444-55-6666' }],
    });

    const detections = detectPiiInJson(content, 'test.json');

    // Should detect both SSNs
    const ssnDetections = detections.filter(d => d.pattern.category === 'SSN');
    assert.ok(ssnDetections.length >= 2, `Expected 2+ SSN detections, got ${ssnDetections.length}`);
  });

  it('includes JSON path in location', () => {
    const content = JSON.stringify({
      owner: { ssn: '123-45-6789' },
    });

    const detections = detectPiiInJson(content, 'test.json');

    const jsonPathDetection = detections.find(d => d.location.startsWith('json:'));
    assert.ok(jsonPathDetection, 'Should include JSON path');
    assert.ok(jsonPathDetection?.location.includes('owner'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Redaction Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – Redaction Engine', () => {
  it('test_pii_detection_triggers_fail_closed', () => {
    const result = redactContent({
      artifactPath: 'test.txt',
      content: 'SSN: 123-45-6789',
      performRedaction: false, // Disabled
      failOnPii: true, // Fail-closed
    });

    assert.ok(!result.ok, 'Should fail when PII detected but redaction disabled');
    assert.ok(result.errors.some(e => e.code === 'PII_DETECTED_REDACTION_FAILED'));
  });

  it('redacts SSN with placeholder', () => {
    const result = redactContent({
      artifactPath: 'test.txt',
      content: 'SSN: 123-45-6789',
      performRedaction: true,
    });

    assert.ok(result.ok);
    assert.ok(!result.redactedContent.includes('123-45-6789'));
    assert.ok(result.redactedContent.includes('[REDACTED-SSN]'));
  });

  it('redacts email with placeholder', () => {
    const result = redactContent({
      artifactPath: 'test.txt',
      content: 'Email: john@example.com',
      performRedaction: true,
    });

    assert.ok(!result.redactedContent.includes('john@example.com'));
    assert.ok(result.redactedContent.includes('[REDACTED-EMAIL]'));
  });

  it('creates redaction entries for each detection', () => {
    const result = redactContent({
      artifactPath: 'test.txt',
      content: 'SSN: 123-45-6789, Email: test@example.com',
      performRedaction: true,
    });

    assert.ok(result.entries.length >= 2);
    assert.ok(result.entries.every(e => e.originalValueHash.length === 64)); // SHA256
  });

  it('preserves original length in entry', () => {
    const ssn = '123-45-6789';
    const result = redactContent({
      artifactPath: 'test.txt',
      content: `SSN: ${ssn}`,
      performRedaction: true,
    });

    const ssnEntry = result.entries.find(e => e.piiCategory === 'SSN');
    assert.ok(ssnEntry);
    assert.equal(ssnEntry?.originalLength, ssn.length);
  });

  it('does not modify already redacted content', () => {
    const content = 'SSN: [REDACTED-SSN]';
    const result = redactContent({
      artifactPath: 'test.txt',
      content,
      performRedaction: true,
    });

    // Should not detect already redacted content as PII
    const ssnDetection = result.detections.find(
      d => d.pattern.category === 'SSN' && !d.value.includes('REDACTED')
    );
    assert.ok(!ssnDetection, 'Should not detect already redacted SSN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Proof Generation Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – Redaction Proof', () => {
  it('test_redaction_produces_redaction_proof', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
      performRedaction: true,
    });

    assert.ok(result.ok);
    assert.ok(result.proof);
    assert.equal(result.proof.$schema, REDACTION_PROOF_SCHEMA);
    assert.equal(result.proof.recordId, 'test-run-123');
    assert.ok(result.proof.redactionPerformed);
    assert.ok(result.proof.redactionCount > 0);
  });

  it('proof includes entries digest for reproducibility', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    assert.ok(result.proof.entriesDigest);
    assert.equal(result.proof.entriesDigest.length, 64); // SHA256
  });

  it('proof includes original and redacted SHA256', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'original-sha256',
      performRedaction: true,
    });

    assert.equal(result.proof.originalCasefileSha256, 'original-sha256');
    assert.ok(result.proof.redactedCasefileSha256);
    assert.notEqual(result.proof.originalCasefileSha256, result.proof.redactedCasefileSha256);
  });

  it('proof tracks clean artifacts', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [
        { path: 'data.txt', content: 'SSN: 123-45-6789' },
        { path: 'clean.txt', content: 'No PII here' },
      ],
      originalCasefileSha256: 'abc123',
    });

    assert.ok(result.proof.cleanArtifacts.includes('clean.txt'));
    assert.ok(!result.proof.cleanArtifacts.includes('data.txt'));
  });

  it('test_redaction_is_deterministic_given_same_inputs', () => {
    const artifacts = [{ path: 'data.txt', content: 'SSN: 123-45-6789\nEmail: test@example.com' }];

    const result1 = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts,
      originalCasefileSha256: 'abc123',
    });

    const result2 = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts,
      originalCasefileSha256: 'abc123',
    });

    // Same inputs should produce same outputs
    assert.ok(isRedactionDeterministic(result1.proof, result2.proof));
    assert.equal(result1.proof.entriesDigest, result2.proof.entriesDigest);
    assert.equal(result1.proof.redactedCasefileSha256, result2.proof.redactedCasefileSha256);
  });

  it('different inputs produce different proofs', () => {
    const result1 = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    const result2 = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 987-65-4321' }],
      originalCasefileSha256: 'abc123',
    });

    // Different SSNs should produce different entries digest
    assert.ok(!isRedactionDeterministic(result1.proof, result2.proof));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Proof Verification Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – Proof Verification', () => {
  it('valid proof passes verification', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    const verification = verifyRedactionProof(result.proof);
    assert.ok(verification.ok, `Verification failed: ${verification.errors.join(', ')}`);
  });

  it('tampered entries digest fails verification', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    // Tamper with digest
    const tamperedProof: RedactionProof = {
      ...result.proof,
      entriesDigest: 'tampered-digest',
    };

    const verification = verifyRedactionProof(tamperedProof);
    assert.ok(!verification.ok);
    assert.ok(verification.errors.some(e => e.includes('digest')));
  });

  it('mismatched count fails verification', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    // Tamper with count
    const tamperedProof: RedactionProof = {
      ...result.proof,
      redactionCount: 999,
    };

    const verification = verifyRedactionProof(tamperedProof);
    assert.ok(!verification.ok);
    assert.ok(verification.errors.some(e => e.includes('count')));
  });

  it('wrong schema version fails verification', () => {
    const result = generateRedactionProof({
      recordId: 'test-run-123',
      artifacts: [{ path: 'data.txt', content: 'SSN: 123-45-6789' }],
      originalCasefileSha256: 'abc123',
    });

    const tamperedProof: RedactionProof = {
      ...result.proof,
      $schema: 'wrong.schema.v1' as typeof REDACTION_PROOF_SCHEMA,
    };

    const verification = verifyRedactionProof(tamperedProof);
    assert.ok(!verification.ok);
    assert.ok(verification.errors.some(e => e.includes('Schema')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N42c – Redaction Edge Cases', () => {
  it('handles empty content', () => {
    const result = redactContent({
      artifactPath: 'empty.txt',
      content: '',
      performRedaction: true,
    });

    assert.ok(result.ok);
    assert.equal(result.detections.length, 0);
    assert.equal(result.redactedContent, '');
  });

  it('handles content with no PII', () => {
    const result = redactContent({
      artifactPath: 'clean.txt',
      content: 'This is clean content with no sensitive data.',
      performRedaction: true,
    });

    assert.ok(result.ok);
    assert.equal(result.detections.length, 0);
    assert.equal(result.redactedContent, 'This is clean content with no sensitive data.');
  });

  it('handles overlapping detections correctly', () => {
    // This shouldn't happen with proper patterns, but test resilience
    const content = 'Contact: 123-45-6789 or 123456789';
    const result = redactContent({
      artifactPath: 'test.txt',
      content,
      performRedaction: true,
    });

    assert.ok(result.ok);
    assert.ok(!result.redactedContent.includes('123-45-6789'));
  });

  it('handles large content efficiently', () => {
    const largePII = 'SSN: 123-45-6789\n'.repeat(1000);
    const start = Date.now();

    const result = redactContent({
      artifactPath: 'large.txt',
      content: largePII,
      performRedaction: true,
    });

    const duration = Date.now() - start;

    assert.ok(result.ok);
    assert.ok(result.entries.length >= 1000);
    assert.ok(duration < 5000, `Should complete within 5s, took ${duration}ms`);
  });

  it('handles invalid JSON gracefully in JSON detection', () => {
    const content = '{ invalid json';

    // Should not throw, just fall back to text detection
    const detections = detectPiiInJson(content, 'bad.json');
    assert.ok(Array.isArray(detections));
  });
});
