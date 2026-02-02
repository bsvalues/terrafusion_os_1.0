/**
 * Phase 4N43a — Verification Report Schema Tests
 * ===============================================
 *
 * Contract tests for external verification report schema.
 * Validates determinism, schema stability, and error code mapping.
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    ERROR_CODE_ATTACK_CLASS,
    VERIFICATION_REPORT_SCHEMA,
    VERIFICATION_REPORT_VERSION,
    type VerificationErrorCode,
    addVerificationError,
    canonicalizeForDigest,
    captureVerifierEnvironment,
    computeReportDigestSha256,
    createVerificationReport,
    extractReportDigest,
    finalizeReport,
    getAttackClass
} from '../src/verification-report.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Report Schema', () => {
  it('has correct schema identifier', () => {
    const report = createVerificationReport();
    assert.strictEqual(report.$schema, VERIFICATION_REPORT_SCHEMA);
    assert.strictEqual(report.$schema, 'terrafusion.autonomy.verification-report.v1');
  });

  it('has correct version', () => {
    const report = createVerificationReport();
    assert.strictEqual(report.version, VERIFICATION_REPORT_VERSION);
    assert.strictEqual(report.version, '1.0.0');
  });

  it('default report defaults to fail state', () => {
    const report = createVerificationReport();
    assert.strictEqual(report.result, 'fail');
  });

  it('includes all required chain status fields', () => {
    const report = createVerificationReport();

    // Ledger chain status
    assert.ok('ledgerChainStatus' in report);
    assert.ok('ok' in report.ledgerChainStatus);
    assert.ok('headSha256' in report.ledgerChainStatus);
    assert.ok('previousSha256' in report.ledgerChainStatus);
    assert.ok('sequenceNumber' in report.ledgerChainStatus);
    assert.ok('chainDepthVerified' in report.ledgerChainStatus);

    // Release chain status
    assert.ok('releaseChainStatus' in report);
    assert.ok('ok' in report.releaseChainStatus);
    assert.ok('releaseTag' in report.releaseChainStatus);
    assert.ok('previousReleaseTag' in report.releaseChainStatus);
    assert.ok('previousCasefileSha256' in report.releaseChainStatus);
    assert.ok('chainDepthVerified' in report.releaseChainStatus);
  });

  it('includes repo identity observed', () => {
    const report = createVerificationReport();
    assert.ok('repoIdentityObserved' in report);
    assert.ok('repoId' in report.repoIdentityObserved);
    assert.ok('ownerRepo' in report.repoIdentityObserved);
    assert.ok('defaultBranch' in report.repoIdentityObserved);
    assert.ok('consistent' in report.repoIdentityObserved);
  });

  it('includes verifier environment', () => {
    const report = createVerificationReport();
    assert.ok('verifierEnvironment' in report);
    assert.ok('platform' in report.verifierEnvironment);
    assert.ok('platformRelease' in report.verifierEnvironment);
    assert.ok('arch' in report.verifierEnvironment);
    assert.ok('nodeVersion' in report.verifierEnvironment);
    assert.ok('toolVersion' in report.verifierEnvironment);
    assert.ok('runnerType' in report.verifierEnvironment);
  });

  it('captures verifier environment correctly', () => {
    const env = captureVerifierEnvironment({
      toolCommit: 'abc123',
      runnerType: 'github-actions',
      runnerName: 'ubuntu-latest',
    });

    assert.ok(env.platform.length > 0);
    assert.ok(env.platformRelease.length > 0);
    assert.ok(env.arch.length > 0);
    assert.ok(env.nodeVersion.startsWith('v'));
    assert.strictEqual(env.toolVersion, VERIFICATION_REPORT_VERSION);
    assert.strictEqual(env.toolCommit, 'abc123');
    assert.strictEqual(env.runnerType, 'github-actions');
    assert.strictEqual(env.runnerName, 'ubuntu-latest');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Determinism Tests (Critical for signing)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Report Determinism', () => {
  it('digest excludes volatile timestamp field', () => {
    const report1 = createVerificationReport({
      result: 'pass',
      verifiedAt: '2025-01-01T00:00:00.000Z',
    });

    const report2 = createVerificationReport({
      result: 'pass',
      verifiedAt: '2025-12-31T23:59:59.999Z',
    });

    const digest1 = extractReportDigest(report1);
    const digest2 = extractReportDigest(report2);

    // Digests should be identical despite different timestamps
    assert.deepStrictEqual(digest1, digest2);
  });

  it('digest excludes platform-specific environment details', () => {
    const report1 = createVerificationReport({
      result: 'pass',
      verifierEnvironment: {
        platform: 'linux',
        platformRelease: '5.4.0',
        arch: 'x64',
        nodeVersion: 'v20.0.0',
        toolVersion: '1.0.0',
        runnerType: 'github-actions',
        runnerName: 'ubuntu-latest',
      },
    });

    const report2 = createVerificationReport({
      result: 'pass',
      verifierEnvironment: {
        platform: 'win32',
        platformRelease: '10.0.19041',
        arch: 'x64',
        nodeVersion: 'v18.0.0',
        toolVersion: '1.0.0', // Same tool version
        runnerType: 'local',
      },
    });

    const digest1 = extractReportDigest(report1);
    const digest2 = extractReportDigest(report2);

    // Digests should be identical since they only include toolVersion
    assert.strictEqual(digest1.toolVersion, digest2.toolVersion);
    assert.strictEqual(computeReportDigestSha256(report1), computeReportDigestSha256(report2));
  });

  it('same inputs produce identical digest hash (100x)', () => {
    const baseReport = createVerificationReport({
      result: 'pass',
      casefileSha256: 'abc123def456',
      ledgerHeadSha256: 'def789ghi012',
      manifestSha256: 'manifest123',
      releaseTag: 'v1.0.0',
      ledgerChainStatus: {
        ok: true,
        headSha256: 'headhash',
        previousSha256: 'prevhash',
        sequenceNumber: 5,
        chainDepthVerified: 5,
      },
      releaseChainStatus: {
        ok: true,
        releaseTag: 'v1.0.0',
        previousReleaseTag: 'v0.9.0',
        previousCasefileSha256: 'prevcasefile',
        chainDepthVerified: 3,
      },
      repoIdentityObserved: {
        repoId: 12345,
        ownerRepo: 'terrafusion-io/terrafusion_os',
        defaultBranch: 'main',
        consistent: true,
      },
    });

    const firstHash = computeReportDigestSha256(baseReport);

    for (let i = 0; i < 100; i++) {
      const hash = computeReportDigestSha256(baseReport);
      assert.strictEqual(hash, firstHash, `Hash mismatch on iteration ${i}`);
    }
  });

  it('produces valid SHA256 hex string', () => {
    const report = createVerificationReport({ result: 'pass' });
    const hash = computeReportDigestSha256(report);

    assert.strictEqual(hash.length, 64, 'SHA256 hex should be 64 chars');
    assert.ok(/^[a-f0-9]{64}$/.test(hash), 'Should be lowercase hex');
  });

  it('different inputs produce different digest hashes', () => {
    const report1 = createVerificationReport({ result: 'pass' });
    const report2 = createVerificationReport({ result: 'fail' });

    assert.notStrictEqual(computeReportDigestSha256(report1), computeReportDigestSha256(report2));
  });

  it('error code order is normalized in digest', () => {
    const report1 = createVerificationReport({
      result: 'fail',
      errorCodes: ['CASEFILE_HASH_MISMATCH', 'LEDGER_CHAIN_BROKEN', 'REPO_ID_MISMATCH'],
    });

    const report2 = createVerificationReport({
      result: 'fail',
      errorCodes: ['REPO_ID_MISMATCH', 'CASEFILE_HASH_MISMATCH', 'LEDGER_CHAIN_BROKEN'],
    });

    // Digest should sort error codes for determinism
    const digest1 = extractReportDigest(report1);
    const digest2 = extractReportDigest(report2);

    assert.deepStrictEqual(digest1.errorCodes, digest2.errorCodes);
    assert.strictEqual(computeReportDigestSha256(report1), computeReportDigestSha256(report2));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Canonicalization', () => {
  it('sorts object keys alphabetically', () => {
    const obj = { z: 1, a: 2, m: 3 };
    const canonical = canonicalizeForDigest(obj);

    assert.strictEqual(canonical, '{"a":2,"m":3,"z":1}');
  });

  it('handles nested objects', () => {
    const obj = { outer: { z: 1, a: 2 }, first: true };
    const canonical = canonicalizeForDigest(obj);

    assert.strictEqual(canonical, '{"first":true,"outer":{"a":2,"z":1}}');
  });

  it('preserves array order', () => {
    const obj = { items: [3, 1, 2] };
    const canonical = canonicalizeForDigest(obj);

    assert.strictEqual(canonical, '{"items":[3,1,2]}');
  });

  it('produces compact JSON without whitespace', () => {
    const obj = { key: 'value', nested: { inner: 'data' } };
    const canonical = canonicalizeForDigest(obj);

    assert.ok(!canonical.includes(' '), 'Should have no spaces');
    assert.ok(!canonical.includes('\n'), 'Should have no newlines');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Error Handling', () => {
  it('addVerificationError sets result to fail', () => {
    const report = createVerificationReport({ result: 'pass' });
    assert.strictEqual(report.result, 'pass');

    addVerificationError(report, {
      code: 'CASEFILE_HASH_MISMATCH',
      message: 'Hash mismatch detected',
    });

    assert.strictEqual(report.result, 'fail');
    assert.strictEqual(report.errors.length, 1);
    assert.ok(report.errorCodes.includes('CASEFILE_HASH_MISMATCH'));
  });

  it('addVerificationError does not duplicate error codes', () => {
    const report = createVerificationReport();

    addVerificationError(report, { code: 'CASEFILE_HASH_MISMATCH', message: 'First' });
    addVerificationError(report, { code: 'CASEFILE_HASH_MISMATCH', message: 'Second' });

    assert.strictEqual(report.errors.length, 2);
    assert.strictEqual(report.errorCodes.length, 1);
  });

  it('finalizeReport sets pass when no errors', () => {
    const report = createVerificationReport();
    report.errors = [];
    report.errorCodes = [];

    const finalized = finalizeReport(report);
    assert.strictEqual(finalized.result, 'pass');
  });

  it('finalizeReport sets fail when errors present', () => {
    const report = createVerificationReport({ result: 'pass' });
    report.errors.push({ code: 'CASEFILE_CORRUPT', message: 'Corrupted' });

    const finalized = finalizeReport(report);
    assert.strictEqual(finalized.result, 'fail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error Code Attack Class Mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Attack Class Mapping', () => {
  it('every error code has an attack class', () => {
    const allCodes: VerificationErrorCode[] = [
      'CASEFILE_NOT_FOUND',
      'CASEFILE_HASH_MISMATCH',
      'CASEFILE_CORRUPT',
      'MANIFEST_NOT_FOUND',
      'MANIFEST_HASH_MISMATCH',
      'MANIFEST_INVALID',
      'MANIFEST_SCHEMA_MISMATCH',
      'TRIPLET_MISSING',
      'SIGNATURE_INVALID',
      'CERTIFICATE_INVALID',
      'BUNDLE_INVALID',
      'LEDGER_HEAD_NOT_FOUND',
      'LEDGER_HEAD_INVALID',
      'LEDGER_HASH_MISMATCH',
      'LEDGER_CHAIN_BROKEN',
      'LEDGER_SEQUENCE_GAP',
      'RELEASE_CHAIN_BROKEN',
      'RELEASE_LINKAGE_INVALID',
      'REPO_ID_MISMATCH',
      'REPO_SLUG_MISMATCH',
      'DEFAULT_BRANCH_MISMATCH',
      'POLICY_MISMATCH',
      'ISSUER_MISMATCH',
      'IDENTITY_MISMATCH',
      'REF_MISMATCH',
      'SHA_MISMATCH',
      'DOWNLOAD_FAILED',
      'VERIFICATION_TIMEOUT',
      'UNKNOWN_ERROR',
    ];

    for (const code of allCodes) {
      const attackClass = getAttackClass(code);
      assert.ok(attackClass.length > 0, `Code ${code} should have attack class`);
      assert.ok(ERROR_CODE_ATTACK_CLASS[code], `Code ${code} should be in map`);
    }
  });

  it('chain-related codes map to attack classes', () => {
    assert.strictEqual(getAttackClass('LEDGER_CHAIN_BROKEN'), 'Chain Continuity Attack');
    assert.strictEqual(getAttackClass('LEDGER_SEQUENCE_GAP'), 'Chain Truncation Attack');
    assert.strictEqual(getAttackClass('RELEASE_CHAIN_BROKEN'), 'Release Continuity Attack');
  });

  it('repo identity codes map to spoofing attacks', () => {
    assert.strictEqual(getAttackClass('REPO_ID_MISMATCH'), 'Fork Spoofing Attack');
    assert.strictEqual(getAttackClass('REPO_SLUG_MISMATCH'), 'Repository Spoofing Attack');
    assert.strictEqual(getAttackClass('DEFAULT_BRANCH_MISMATCH'), 'Branch Spoofing Attack');
  });

  it('tampering codes map to tampering attacks', () => {
    assert.strictEqual(getAttackClass('CASEFILE_HASH_MISMATCH'), 'Casefile Tampering');
    assert.strictEqual(getAttackClass('MANIFEST_HASH_MISMATCH'), 'Manifest Tampering');
    assert.strictEqual(getAttackClass('LEDGER_HASH_MISMATCH'), 'Ledger Tampering');
    assert.strictEqual(getAttackClass('SIGNATURE_INVALID'), 'Signature Forgery Attempt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Report Digest Schema Stability
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Digest Schema Stability', () => {
  it('digest has expected fields only', () => {
    const report = createVerificationReport({
      result: 'pass',
      casefileSha256: 'abc',
      sourceUrl: 'https://example.com', // Should be excluded from digest
    });

    const digest = extractReportDigest(report);

    // Required fields
    const expectedKeys = [
      '$schema',
      'version',
      'result',
      'casefileSha256',
      'ledgerHeadSha256',
      'manifestSha256',
      'ledgerChainStatus',
      'releaseChainStatus',
      'repoIdentityObserved',
      'errorCodes',
      'releaseTag',
      'toolVersion',
    ];

    const actualKeys = Object.keys(digest).sort();
    assert.deepStrictEqual(actualKeys, expectedKeys.sort());

    // Excluded fields
    assert.ok(!('verifiedAt' in digest), 'verifiedAt should be excluded');
    assert.ok(!('verifierEnvironment' in digest), 'verifierEnvironment should be excluded');
    assert.ok(!('sourceUrl' in digest), 'sourceUrl should be excluded');
    assert.ok(!('assetsVerified' in digest), 'assetsVerified should be excluded');
    assert.ok(!('errors' in digest), 'detailed errors should be excluded');
  });

  it('digest toolVersion matches report environment', () => {
    const report = createVerificationReport();
    const digest = extractReportDigest(report);

    assert.strictEqual(digest.toolVersion, report.verifierEnvironment.toolVersion);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full Report Creation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43a – Full Report Creation', () => {
  it('creates complete passing report', () => {
    const report = createVerificationReport({
      result: 'pass',
      casefileSha256: 'abc123',
      ledgerHeadSha256: 'def456',
      manifestSha256: 'ghi789',
      releaseTag: 'v1.0.0',
      ledgerChainStatus: {
        ok: true,
        headSha256: 'headhash',
        previousSha256: 'prevhash',
        sequenceNumber: 5,
        chainDepthVerified: 5,
      },
      releaseChainStatus: {
        ok: true,
        releaseTag: 'v1.0.0',
        previousReleaseTag: 'v0.9.0',
        previousCasefileSha256: 'prevcasefile',
        chainDepthVerified: 3,
      },
      repoIdentityObserved: {
        repoId: 12345,
        ownerRepo: 'terrafusion-io/terrafusion_os',
        defaultBranch: 'main',
        consistent: true,
      },
      assetsVerified: ['casefile.zip', 'ledger-head.json', 'sealed-manifest.json'],
    });

    assert.strictEqual(report.result, 'pass');
    assert.strictEqual(report.errors.length, 0);
    assert.strictEqual(report.errorCodes.length, 0);
    assert.ok(report.verifiedAt.length > 0);
    assert.strictEqual(report.assetsVerified.length, 3);
  });

  it('creates complete failing report with errors', () => {
    const report = createVerificationReport();

    addVerificationError(report, {
      code: 'CASEFILE_HASH_MISMATCH',
      message: 'Casefile hash does not match manifest',
      details: { expected: 'abc', actual: 'xyz' },
    });

    addVerificationError(report, {
      code: 'LEDGER_CHAIN_BROKEN',
      message: 'Chain continuity violated',
      details: { sequenceNumber: 5, expectedSequence: 6 },
    });

    finalizeReport(report);

    assert.strictEqual(report.result, 'fail');
    assert.strictEqual(report.errors.length, 2);
    assert.deepStrictEqual(report.errorCodes, ['CASEFILE_HASH_MISMATCH', 'LEDGER_CHAIN_BROKEN']);
  });
});
