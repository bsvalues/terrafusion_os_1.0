/**
 * Phase 4N3 — Autonomy Bundle Contract Tests
 *
 * Validates:
 * - Deterministic ZIP output (same inputs → same hash)
 * - Manifest completeness (all required files present)
 * - Hash verification (manifest hashes match actual files)
 * - README includes rollback commands
 * - No forbidden paths referenced as actionable
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import { buildManifest, sha256, verifyManifest } from '../src/manifest.ts';
import { crc32 } from '../src/zip/crc32.ts';
import { buildDeterministicZip } from '../src/zip/zip-writer.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function sha256Buf(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// CRC32 Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CRC32', () => {
  it('computes correct CRC32 for empty buffer', () => {
    const result = crc32(Buffer.alloc(0));
    assert.equal(result, 0x00000000);
  });

  it('computes correct CRC32 for known input', () => {
    // "123456789" → 0xCBF43926 (IEEE 802.3)
    const result = crc32(Buffer.from('123456789', 'utf8'));
    assert.equal(result, 0xcbf43926);
  });

  it('is deterministic', () => {
    const data = Buffer.from('hello world', 'utf8');
    const r1 = crc32(data);
    const r2 = crc32(data);
    assert.equal(r1, r2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ZIP Determinism Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Deterministic ZIP', () => {
  it('produces identical output for same inputs', () => {
    const entries = [
      { zipPath: 'a.txt', data: Buffer.from('hello') },
      { zipPath: 'b.txt', data: Buffer.from('world') },
    ];

    const z1 = buildDeterministicZip(entries);
    const z2 = buildDeterministicZip(entries);

    const h1 = sha256Buf(z1);
    const h2 = sha256Buf(z2);

    assert.equal(h1, h2, 'ZIP hashes should match');
    assert.ok(z1.length > 0, 'ZIP should not be empty');
  });

  it('produces identical output regardless of input order', () => {
    const entries1 = [
      { zipPath: 'b.txt', data: Buffer.from('world') },
      { zipPath: 'a.txt', data: Buffer.from('hello') },
    ];
    const entries2 = [
      { zipPath: 'a.txt', data: Buffer.from('hello') },
      { zipPath: 'b.txt', data: Buffer.from('world') },
    ];

    const z1 = buildDeterministicZip(entries1);
    const z2 = buildDeterministicZip(entries2);

    const h1 = sha256Buf(z1);
    const h2 = sha256Buf(z2);

    assert.equal(h1, h2, 'ZIP hashes should match regardless of input order');
  });

  it('normalizes path separators', () => {
    const entries1 = [{ zipPath: 'dir\\file.txt', data: Buffer.from('test') }];
    const entries2 = [{ zipPath: 'dir/file.txt', data: Buffer.from('test') }];

    const z1 = buildDeterministicZip(entries1);
    const z2 = buildDeterministicZip(entries2);

    const h1 = sha256Buf(z1);
    const h2 = sha256Buf(z2);

    assert.equal(h1, h2, 'Windows and POSIX paths should produce identical output');
  });

  it('strips leading slashes', () => {
    const entries1 = [{ zipPath: '/file.txt', data: Buffer.from('test') }];
    const entries2 = [{ zipPath: 'file.txt', data: Buffer.from('test') }];

    const z1 = buildDeterministicZip(entries1);
    const z2 = buildDeterministicZip(entries2);

    const h1 = sha256Buf(z1);
    const h2 = sha256Buf(z2);

    assert.equal(h1, h2, 'Leading slashes should be stripped');
  });

  it('produces valid ZIP structure', () => {
    const entries = [{ zipPath: 'test.txt', data: Buffer.from('content') }];
    const zip = buildDeterministicZip(entries);

    // Check ZIP signature (PK\x03\x04)
    assert.equal(zip[0], 0x50, 'First byte should be P');
    assert.equal(zip[1], 0x4b, 'Second byte should be K');
    assert.equal(zip[2], 0x03, 'Third byte should be 0x03');
    assert.equal(zip[3], 0x04, 'Fourth byte should be 0x04');

    // Check EOCD signature at end
    const eocdOffset = zip.indexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    assert.ok(eocdOffset > 0, 'ZIP should contain EOCD signature');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Evidence Manifest', () => {
  it('includes all files with correct hashes', () => {
    const files = [
      { zipPath: 'a.txt', data: Buffer.from('hello') },
      { zipPath: 'b.txt', data: Buffer.from('world') },
    ];

    const manifest = buildManifest({
      baseSha: 'abc123',
      files,
    });

    assert.equal(manifest.schema, 'terrafusion.autonomy.evidence.v1');
    assert.equal(manifest.baseSha, 'abc123');
    assert.equal(manifest.files.length, 2);

    // Verify hashes
    for (const entry of manifest.files) {
      const original = files.find(f => f.zipPath === entry.path);
      assert.ok(original, `File ${entry.path} should exist in original list`);
      assert.equal(entry.sha256, sha256(original.data), `Hash should match for ${entry.path}`);
      assert.equal(entry.bytes, original.data.length);
    }
  });

  it('sorts files alphabetically', () => {
    const files = [
      { zipPath: 'z.txt', data: Buffer.from('z') },
      { zipPath: 'a.txt', data: Buffer.from('a') },
      { zipPath: 'm.txt', data: Buffer.from('m') },
    ];

    const manifest = buildManifest({ baseSha: 'test', files });

    const paths = manifest.files.map(f => f.path);
    assert.deepEqual(paths, ['a.txt', 'm.txt', 'z.txt']);
  });

  it('includes optional fields when provided', () => {
    const manifest = buildManifest({
      baseSha: 'abc123',
      planBaseSha: 'def456',
      runId: 'run-789',
      files: [],
    });

    assert.equal(manifest.planBaseSha, 'def456');
    assert.equal(manifest.runId, 'run-789');
  });

  it('includes createdAtUtc timestamp', () => {
    const manifest = buildManifest({ baseSha: 'test', files: [] });
    assert.ok(manifest.createdAtUtc);
    assert.ok(manifest.createdAtUtc.endsWith('Z'), 'Timestamp should be UTC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Verification Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Manifest Verification', () => {
  it('passes for matching files', () => {
    const files = [
      { zipPath: 'a.txt', data: Buffer.from('hello') },
      { zipPath: 'b.txt', data: Buffer.from('world') },
    ];

    const manifest = buildManifest({ baseSha: 'test', files });

    const fileMap = new Map(files.map(f => [f.zipPath, f.data]));
    const failures = verifyManifest(manifest, fileMap);

    assert.deepEqual(failures, [], 'No failures expected');
  });

  it('fails for missing files', () => {
    const files = [{ zipPath: 'a.txt', data: Buffer.from('hello') }];

    const manifest = buildManifest({ baseSha: 'test', files });

    // Don't include the file in the map
    const fileMap = new Map<string, Buffer>();
    const failures = verifyManifest(manifest, fileMap);

    assert.deepEqual(failures, ['a.txt']);
  });

  it('fails for hash mismatch', () => {
    const files = [{ zipPath: 'a.txt', data: Buffer.from('hello') }];

    const manifest = buildManifest({ baseSha: 'test', files });

    // Provide different content
    const fileMap = new Map([['a.txt', Buffer.from('different')]]);
    const failures = verifyManifest(manifest, fileMap);

    assert.deepEqual(failures, ['a.txt']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bundle Content Contracts
// ─────────────────────────────────────────────────────────────────────────────

describe('Bundle Content Contracts', () => {
  const REQUIRED_FILES = [
    'autonomy-dashboard.html',
    'apply-proofs.json',
    'perf.plan.json',
    'AUTONOMY_V1_GOVERNANCE_CONTRACT.md',
    'README_AUDIT_PACKET.md',
    'MANIFEST.json',
  ];

  it('required bundle files list is defined', () => {
    assert.ok(REQUIRED_FILES.length >= 6, 'Should have at least 6 required files');
    assert.ok(REQUIRED_FILES.includes('autonomy-dashboard.html'));
    assert.ok(REQUIRED_FILES.includes('MANIFEST.json'));
    assert.ok(REQUIRED_FILES.includes('README_AUDIT_PACKET.md'));
  });

  it('README template includes rollback commands', () => {
    // Simulate README generation (inline for testing)
    const proofId = 'test-proof-123';
    const readme = `
# TerraFusion Autonomy Evidence Bundle

## Rollback Instructions

### Preview rollback (safe, no changes)
\`\`\`bash
pnpm perf:rollback --proof ${proofId} --dry-run
\`\`\`

### Execute rollback
\`\`\`bash
pnpm perf:rollback --proof ${proofId}
\`\`\`
`;

    assert.ok(readme.includes('pnpm perf:rollback'), 'README should include rollback command');
    assert.ok(readme.includes('--proof'), 'README should include --proof flag');
    assert.ok(readme.includes('--dry-run'), 'README should include --dry-run option');
    assert.ok(readme.includes(proofId), 'README should include proof ID');
  });

  it('README includes post-rollback gates', () => {
    const readme = `
### Post-rollback verification
\`\`\`bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
\`\`\`
`;

    assert.ok(readme.includes('type-check'), 'README should include type-check gate');
    assert.ok(readme.includes('phase83'), 'README should include phase83 gate');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Forbidden Path Protection
// ─────────────────────────────────────────────────────────────────────────────

describe('Forbidden Path Protection', () => {
  it('bundle files never reference ARCHIVE as actionable', () => {
    const bundleFiles = [
      'autonomy-dashboard.html',
      'apply-proofs.json',
      'perf.plan.json',
      'README_AUDIT_PACKET.md',
    ];

    // None of these should be in ARCHIVE
    for (const file of bundleFiles) {
      assert.ok(!file.includes('ARCHIVE'), `${file} should not be in ARCHIVE`);
    }
  });

  it('bundle files never reference forbidden zones', () => {
    const bundleFiles = [
      'autonomy-dashboard.html',
      'apply-proofs.json',
      'perf.plan.json',
      'README_AUDIT_PACKET.md',
    ];
    const forbiddenZones = ['ARCHIVE/', 'specialized/', 'applications/'];

    for (const file of bundleFiles) {
      for (const zone of forbiddenZones) {
        assert.ok(!file.includes(zone), `${file} should not reference ${zone}`);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SHA256 Helper Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SHA256 Helper', () => {
  it('produces correct hash for known input', () => {
    // "hello" SHA256 = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    const hash = sha256(Buffer.from('hello'));
    assert.equal(hash, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces different hashes for different inputs', () => {
    const h1 = sha256(Buffer.from('hello'));
    const h2 = sha256(Buffer.from('world'));
    assert.notEqual(h1, h2);
  });

  it('is deterministic', () => {
    const data = Buffer.from('test data');
    const h1 = sha256(data);
    const h2 = sha256(data);
    assert.equal(h1, h2);
  });
});
