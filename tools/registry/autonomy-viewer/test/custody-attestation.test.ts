/**
 * Phase 4N13 — Custody Attestation Contract Tests
 *
 * Tests for the custody attestation system that makes evidence self-verifying.
 *
 * INVARIANTS TESTED:
 * - Deterministic output (same input → same output, 10x)
 * - One-byte change in any artifact fails verification
 * - Mutable refs (latest, branch URLs) are rejected
 * - Required fields are present (runId, generatedAt, schema, hashes, toolVersion)
 * - Strict mode rejects extra files
 * - Missing required artifacts are reported
 */

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import {
  ATTESTATION_SCHEMA,
  buildAttestation,
  containsMutableRef,
  REQUIRED_ARTIFACTS,
  TOOL_VERSION,
  validateNoMutableUrls,
  type CustodyAttestation,
} from '../src/custody-attest.js';
import { verifyCustodyAttestation } from '../src/verify-custody.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createTestArtifacts(tmpDir: string): void {
  // Create required artifacts
  fs.writeFileSync(path.join(tmpDir, 'autonomy-ledger.html'), '<!DOCTYPE html><html><body>Ledger</body></html>');
  fs.writeFileSync(path.join(tmpDir, 'autonomy-dashboard.html'), '<!DOCTYPE html><html><body>Dashboard</body></html>');
  fs.writeFileSync(path.join(tmpDir, 'autonomy-evidence-index.json'), JSON.stringify({
    schema: 'terrafusion.autonomy.evidence.index.v1',
    records: [],
  }));
  fs.writeFileSync(path.join(tmpDir, 'autonomy-custody.html'), '<!DOCTYPE html><html><body>Custody</body></html>');
}

function createTestAttestationFile(tmpDir: string, attestation: CustodyAttestation): void {
  fs.writeFileSync(
    path.join(tmpDir, 'custody-attestation.json'),
    JSON.stringify(attestation, null, 2)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests (CRITICAL)
// ─────────────────────────────────────────────────────────────────────────────

test('determinism: same input produces identical attestation hash list 10 times', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const results: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const result = buildAttestation({ inputDir: tmpDir, runId: 'test-run-123' });
      // Compare hashes only (exclude generatedAt which varies)
      const hashStr = JSON.stringify(result.attestation.hashes);
      results.push(hashStr);
    }

    // All 10 runs should produce identical hash lists
    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], first, `Run ${i + 1} produced different hashes than run 1`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('determinism: same input produces identical foundArtifacts order 10 times', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const results: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const result = buildAttestation({ inputDir: tmpDir, runId: 'test-run-123' });
      results.push(JSON.stringify(result.attestation.foundArtifacts));
    }

    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], first, `Run ${i + 1} produced different artifact order`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Integrity Tests (CRITICAL)
// ─────────────────────────────────────────────────────────────────────────────

test('integrity: one-byte change in artifact fails verification', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    // Build attestation
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-run-123' });
    assert.ok(result.ok, 'Initial attestation should succeed');

    // Save attestation
    createTestAttestationFile(tmpDir, result.attestation);

    // Verify passes initially
    const verifyBefore = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(verifyBefore.ok, 'Verification should pass before modification');

    // Modify one byte in dashboard
    const dashboardPath = path.join(tmpDir, 'autonomy-dashboard.html');
    const original = fs.readFileSync(dashboardPath, 'utf8');
    fs.writeFileSync(dashboardPath, original + 'X');  // Add one byte

    // Verify now fails
    const verifyAfter = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(!verifyAfter.ok, 'Verification should fail after modification');
    assert.ok(
      verifyAfter.errors.some(e => e.type === 'hash_mismatch'),
      'Should report hash mismatch error'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('integrity: verification detects missing file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    // Build attestation
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-run-123' });
    createTestAttestationFile(tmpDir, result.attestation);

    // Delete a file
    fs.unlinkSync(path.join(tmpDir, 'autonomy-ledger.html'));

    // Verify fails
    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(!verifyResult.ok, 'Verification should fail for missing file');
    assert.ok(
      verifyResult.errors.some(e => e.type === 'file_missing' && e.path === 'autonomy-ledger.html'),
      'Should report missing ledger file'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Mutable URL Rejection Tests (CRITICAL)
// ─────────────────────────────────────────────────────────────────────────────

test('mutable URL: rejects /latest endpoint', () => {
  const result = containsMutableRef('https://github.com/owner/repo/releases/latest');
  assert.ok(result !== null, 'Should detect /latest as mutable');
});

test('mutable URL: rejects download/latest', () => {
  const result = containsMutableRef('https://example.com/download/latest/bundle.zip');
  assert.ok(result !== null, 'Should detect download/latest as mutable');
});

test('mutable URL: rejects refs/heads/ (branch reference)', () => {
  const result = containsMutableRef('https://github.com/owner/repo/tree/refs/heads/main');
  assert.ok(result !== null, 'Should detect refs/heads/ as mutable');
});

test('mutable URL: rejects @latest version tag', () => {
  const result = containsMutableRef('https://cdn.example.com/package@latest');
  assert.ok(result !== null, 'Should detect @latest as mutable');
});

test('mutable URL: rejects URL shorteners', () => {
  assert.ok(containsMutableRef('https://bit.ly/abc123') !== null, 'Should detect bit.ly');
  assert.ok(containsMutableRef('https://tinyurl.com/abc123') !== null, 'Should detect tinyurl');
  assert.ok(containsMutableRef('https://git.io/abc123') !== null, 'Should detect git.io');
});

test('mutable URL: accepts immutable tagged release', () => {
  const result = containsMutableRef('https://github.com/owner/repo/releases/tag/v1.0.0');
  assert.equal(result, null, 'Should accept tagged release URL');
});

test('mutable URL: accepts SHA-pinned URL', () => {
  const result = containsMutableRef('https://github.com/owner/repo/tree/abc123def456789');
  assert.equal(result, null, 'Should accept SHA-pinned URL');
});

test('validateNoMutableUrls: detects mutable URL in JSON content', () => {
  const content = JSON.stringify({
    releaseUrl: 'https://github.com/owner/repo/releases/latest',
    bundleDownloadUrl: 'https://cdn.example.com/bundle.zip',
  });
  const errors = validateNoMutableUrls(content);
  assert.ok(errors.length > 0, 'Should detect mutable URL');
  assert.ok(errors[0].type === 'mutable_url', 'Error type should be mutable_url');
});

test('validateNoMutableUrls: accepts immutable URLs in JSON', () => {
  const content = JSON.stringify({
    releaseUrl: 'https://github.com/owner/repo/releases/tag/v1.0.0',
    bundleDownloadUrl: 'https://cdn.example.com/v1/bundle.zip',
  });
  const errors = validateNoMutableUrls(content);
  assert.equal(errors.length, 0, 'Should accept all immutable URLs');
});

// ─────────────────────────────────────────────────────────────────────────────
// Required Fields Tests
// ─────────────────────────────────────────────────────────────────────────────

test('attestation: includes schema field', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.equal(result.attestation.schema, ATTESTATION_SCHEMA);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: includes toolVersion field', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.equal(result.attestation.toolVersion, TOOL_VERSION);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: includes runId field', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'my-run-id-123' });
    assert.equal(result.attestation.runId, 'my-run-id-123');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: includes generatedAt field in ISO format', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(result.attestation.generatedAt, 'generatedAt should be present');
    // ISO 8601 format check
    const parsed = new Date(result.attestation.generatedAt);
    assert.ok(!isNaN(parsed.getTime()), 'generatedAt should be valid ISO date');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: includes inputDir field', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.equal(result.attestation.inputDir, tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: hashes array contains all required artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    const hashNames = result.attestation.hashes.map(h => h.name);
    
    for (const required of REQUIRED_ARTIFACTS) {
      assert.ok(hashNames.includes(required), `Should include ${required} in hashes`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: each hash entry has sha256, bytes, source', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    
    for (const hash of result.attestation.hashes) {
      assert.ok(hash.name, 'Hash entry should have name');
      assert.ok(hash.sha256, 'Hash entry should have sha256');
      assert.ok(typeof hash.sha256 === 'string' && hash.sha256.length === 64, 'sha256 should be 64-char hex');
      assert.ok(typeof hash.bytes === 'number' && hash.bytes >= 0, 'bytes should be non-negative number');
      assert.ok(hash.source === 'file' || hash.source === 'zip-entry', 'source should be file or zip-entry');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Missing Artifacts Tests
// ─────────────────────────────────────────────────────────────────────────────

test('attestation: reports missing required artifacts', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  // Create only one artifact
  fs.writeFileSync(path.join(tmpDir, 'autonomy-ledger.html'), 'content');

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(!result.ok, 'Should not be ok when missing artifacts');
    assert.ok(result.attestation.missingRequired.length > 0, 'Should report missing artifacts');
    assert.ok(result.attestation.missingRequired.includes('autonomy-dashboard.html'));
    assert.ok(result.attestation.missingRequired.includes('autonomy-custody.html'));
    assert.ok(result.attestation.missingRequired.includes('autonomy-evidence-index.json'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: errors include missing_required type', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  fs.writeFileSync(path.join(tmpDir, 'autonomy-ledger.html'), 'content');

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    const missingErrors = result.errors.filter(e => e.type === 'missing_required');
    assert.ok(missingErrors.length > 0, 'Should have missing_required errors');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Strict Mode Tests
// ─────────────────────────────────────────────────────────────────────────────

test('strict mode: rejects extra files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    // Build attestation
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    createTestAttestationFile(tmpDir, result.attestation);

    // Add an extra file that matches evidence pattern
    fs.writeFileSync(path.join(tmpDir, 'autonomy-evidence-bundle-extra.zip'), 'fake zip');

    // Strict verification fails
    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: true,
    });
    assert.ok(!verifyResult.ok, 'Strict mode should fail for extra files');
    assert.ok(
      verifyResult.errors.some(e => e.type === 'extra_file'),
      'Should report extra_file error'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('strict mode: passes when no extra files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    // Build attestation
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    createTestAttestationFile(tmpDir, result.attestation);

    // Strict verification passes
    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: true,
    });
    assert.ok(verifyResult.ok, 'Strict mode should pass when no extra files');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification Round-trip Tests
// ─────────────────────────────────────────────────────────────────────────────

test('round-trip: build then verify succeeds', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    // Build attestation
    const buildResult = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(buildResult.ok, 'Build should succeed');
    createTestAttestationFile(tmpDir, buildResult.attestation);

    // Verify attestation
    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(verifyResult.ok, 'Verification should succeed');
    assert.equal(verifyResult.filesVerified, buildResult.attestation.hashes.length);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('verification: reports correct filesVerified count', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const buildResult = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    createTestAttestationFile(tmpDir, buildResult.attestation);

    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.equal(verifyResult.filesVerified, 4, 'Should verify 4 required files');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema Validation Tests
// ─────────────────────────────────────────────────────────────────────────────

test('verification: rejects wrong schema version', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);

  try {
    const buildResult = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    
    // Tamper with schema
    const tampered = { ...buildResult.attestation, schema: 'wrong.schema.v1' };
    fs.writeFileSync(
      path.join(tmpDir, 'custody-attestation.json'),
      JSON.stringify(tampered, null, 2)
    );

    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(!verifyResult.ok, 'Should reject wrong schema');
    assert.ok(
      verifyResult.errors.some(e => e.type === 'schema_mismatch'),
      'Should report schema_mismatch error'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('verification: rejects invalid JSON', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'custody-attestation.json'), 'not valid json {');

    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(!verifyResult.ok, 'Should reject invalid JSON');
    assert.ok(
      verifyResult.errors.some(e => e.type === 'attestation_invalid'),
      'Should report attestation_invalid error'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('verification: reports missing attestation file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));

  try {
    const verifyResult = verifyCustodyAttestation({
      inputDir: tmpDir,
      attestPath: path.join(tmpDir, 'custody-attestation.json'),
      strict: false,
    });
    assert.ok(!verifyResult.ok, 'Should fail for missing attestation');
    assert.ok(
      verifyResult.errors.some(e => e.type === 'attestation_missing'),
      'Should report attestation_missing error'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

test('attestation: handles empty directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(!result.ok, 'Should not be ok for empty directory');
    assert.equal(result.attestation.hashes.length, 0, 'No hashes for empty dir');
    assert.equal(result.attestation.foundArtifacts.length, 0, 'No artifacts found');
    assert.equal(result.attestation.missingRequired.length, REQUIRED_ARTIFACTS.length);
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: ignores non-evidence files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);
  
  // Add non-evidence files
  fs.writeFileSync(path.join(tmpDir, 'random.txt'), 'random content');
  fs.writeFileSync(path.join(tmpDir, 'config.yaml'), 'key: value');

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(!result.attestation.foundArtifacts.includes('random.txt'));
    assert.ok(!result.attestation.foundArtifacts.includes('config.yaml'));
    assert.equal(result.attestation.foundArtifacts.length, 4, 'Only 4 evidence artifacts');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

test('attestation: handles optional bundle files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'attest-test-'));
  createTestArtifacts(tmpDir);
  
  // Add optional bundle (fake ZIP - just for pattern matching)
  fs.writeFileSync(path.join(tmpDir, 'autonomy-evidence-bundle-12345.zip'), 'fake zip content');

  try {
    const result = buildAttestation({ inputDir: tmpDir, runId: 'test-123' });
    assert.ok(result.attestation.foundArtifacts.includes('autonomy-evidence-bundle-12345.zip'));
    assert.equal(result.attestation.foundArtifacts.length, 5, '4 required + 1 optional');
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});
