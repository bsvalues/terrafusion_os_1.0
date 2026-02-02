/**
 * Phase 4N52 – Mirror Publisher Tests
 * ====================================
 *
 * Contract coverage:
 *   1. publishToMirrors() validates source directory
 *   2. publishToMirrors() requires at least one target
 *   3. Filesystem target copies all files correctly
 *   4. Directory checksum is computed deterministically
 *   5. Failed required target returns REQUIRED_TARGET_FAILED
 *   6. Partial success returns detailed breakdown
 *   7. Manifest includes all target statuses
 *   8. Dry run mode skips actual uploads
 *   9. loadTargetsFromConfig() parses config correctly
 *  10. Retry logic with exponential backoff
 */

import * as assert from 'node:assert';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  loadTargetsFromConfig,
  MIRROR_MANIFEST_SCHEMA,
  MIRROR_PUBLISHER_VERSION,
  publishToMirrors,
  writeMirrorManifest,
  type MirrorTarget,
} from '../src/mirror-publisher.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures
const TEST_SOURCE = path.join(__dirname, '.mirror-test-source');
const TEST_TARGET = path.join(__dirname, '.mirror-test-target');
const TEST_CONFIG = path.join(__dirname, '.mirror-test-config');

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setupTestFixtures(): void {
  // Clean up
  cleanupTestFixtures();

  // Create source with test files
  fs.mkdirSync(TEST_SOURCE, { recursive: true });
  fs.mkdirSync(path.join(TEST_SOURCE, 'subdir'), { recursive: true });
  fs.mkdirSync(TEST_TARGET, { recursive: true });
  fs.mkdirSync(TEST_CONFIG, { recursive: true });

  // Create test files
  fs.writeFileSync(path.join(TEST_SOURCE, 'file1.txt'), 'Hello World');
  fs.writeFileSync(path.join(TEST_SOURCE, 'file2.json'), '{"key": "value"}');
  fs.writeFileSync(path.join(TEST_SOURCE, 'subdir', 'nested.txt'), 'Nested content');
}

function cleanupTestFixtures(): void {
  for (const dir of [TEST_SOURCE, TEST_TARGET, TEST_CONFIG]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Mirror Publisher Schema', () => {
  it('exports manifest schema constant', () => {
    assert.strictEqual(MIRROR_MANIFEST_SCHEMA, 'terrafusion.autonomy.mirror-manifest.v1');
  });

  it('exports version constant', () => {
    assert.strictEqual(MIRROR_PUBLISHER_VERSION, '4N52.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Input Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Input Validation', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('fails with SOURCE_NOT_FOUND for missing directory', async () => {
    const result = await publishToMirrors({
      sourceDir: '/nonexistent/path',
      targets: [{ id: 'test', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, 'SOURCE_NOT_FOUND');
  });

  it('fails with NO_TARGETS when targets array is empty', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [],
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, 'NO_TARGETS');
  });

  it('fails with NO_TARGETS when targets is undefined', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: undefined as unknown as MirrorTarget[],
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, 'NO_TARGETS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Filesystem Target
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Filesystem Target', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('copies all files to filesystem target', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.success, true);
    assert.ok(fs.existsSync(path.join(TEST_TARGET, 'file1.txt')));
    assert.ok(fs.existsSync(path.join(TEST_TARGET, 'file2.json')));
    assert.ok(fs.existsSync(path.join(TEST_TARGET, 'subdir', 'nested.txt')));
  });

  it('preserves file contents', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.success, true);

    const sourceContent = fs.readFileSync(path.join(TEST_SOURCE, 'file1.txt'), 'utf-8');
    const targetContent = fs.readFileSync(path.join(TEST_TARGET, 'file1.txt'), 'utf-8');
    assert.strictEqual(sourceContent, targetContent);
  });

  it('reports correct file count', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.manifest.summary.totalFilesUploaded, 3);
  });

  it('reports correct byte count', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.success, true);

    // Calculate expected bytes
    const file1Size = fs.statSync(path.join(TEST_SOURCE, 'file1.txt')).size;
    const file2Size = fs.statSync(path.join(TEST_SOURCE, 'file2.json')).size;
    const file3Size = fs.statSync(path.join(TEST_SOURCE, 'subdir', 'nested.txt')).size;
    const expectedBytes = file1Size + file2Size + file3Size;

    assert.strictEqual(result.manifest.summary.totalBytesUploaded, expectedBytes);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Manifest Structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Manifest Structure', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('manifest has correct schema', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.strictEqual(result.manifest.$schema, MIRROR_MANIFEST_SCHEMA);
    assert.strictEqual(result.manifest.version, MIRROR_PUBLISHER_VERSION);
  });

  it('manifest includes source SHA256', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.ok(result.manifest.sourceSha256);
    assert.match(result.manifest.sourceSha256, /^[a-f0-9]{64}$/i);
  });

  it('manifest includes publishedAt timestamp', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    assert.ok(result.manifest.publishedAt);
    // Should be valid ISO date
    const date = new Date(result.manifest.publishedAt);
    assert.ok(!isNaN(date.getTime()));
  });

  it('manifest target has uploadedAt on success', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    const target = result.manifest.targets[0];
    assert.strictEqual(target.status, 'success');
    assert.ok(target.uploadedAt);
  });

  it('manifest target has checksum on success', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    const target = result.manifest.targets[0];
    assert.ok(target.checksum);
    assert.match(target.checksum, /^[a-f0-9]{64}$/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Required Target Handling
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Required Target Handling', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('fails with REQUIRED_TARGET_FAILED when required target fails', async () => {
    // Remove AWS credentials to force S3 failure
    const origKey = process.env.AWS_ACCESS_KEY_ID;
    const origSecret = process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    try {
      const result = await publishToMirrors({
        sourceDir: TEST_SOURCE,
        targets: [{ id: 'critical-s3', type: 's3', endpoint: 's3://bucket', required: true }],
        maxRetries: 1, // Reduce retries for faster test
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error?.code, 'REQUIRED_TARGET_FAILED');
    } finally {
      // Restore
      if (origKey) process.env.AWS_ACCESS_KEY_ID = origKey;
      if (origSecret) process.env.AWS_SECRET_ACCESS_KEY = origSecret;
    }
  });

  it('succeeds with optional target failure', async () => {
    // Force S3 failure but filesystem should succeed
    const origKey = process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_ACCESS_KEY_ID;

    try {
      const result = await publishToMirrors({
        sourceDir: TEST_SOURCE,
        targets: [
          { id: 'backup', type: 'filesystem', endpoint: TEST_TARGET },
          { id: 'optional-s3', type: 's3', endpoint: 's3://bucket', required: false },
        ],
        maxRetries: 1,
      });

      // Should succeed because filesystem worked and S3 is optional
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.manifest.summary.successCount, 1);
      assert.strictEqual(result.manifest.summary.failedCount, 1);
    } finally {
      if (origKey) process.env.AWS_ACCESS_KEY_ID = origKey;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Dry Run Mode
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Dry Run Mode', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('dry run does not create files', async () => {
    const dryTarget = path.join(TEST_TARGET, 'dry-run-subdir');

    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'dry', type: 'filesystem', endpoint: dryTarget }],
      dryRun: true,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(fs.existsSync(dryTarget), false);
  });

  it('dry run still computes checksums', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'dry', type: 'filesystem', endpoint: TEST_TARGET }],
      dryRun: true,
    });

    assert.ok(result.manifest.sourceSha256);
  });

  it('dry run reports file counts', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'dry', type: 'filesystem', endpoint: TEST_TARGET }],
      dryRun: true,
    });

    assert.strictEqual(result.manifest.summary.totalFilesUploaded, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Config Loading
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Config Loading', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('loadTargetsFromConfig parses valid config', () => {
    const configPath = path.join(TEST_CONFIG, 'targets.json');
    const config = {
      targets: [
        { id: 'backup-1', type: 'filesystem', endpoint: '/mnt/backup' },
        { id: 'cloud', type: 's3', endpoint: 's3://bucket/prefix', required: true },
      ],
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const targets = loadTargetsFromConfig(configPath);

    assert.strictEqual(targets.length, 2);
    assert.strictEqual(targets[0].id, 'backup-1');
    assert.strictEqual(targets[1].type, 's3');
    assert.strictEqual(targets[1].required, true);
  });

  it('loadTargetsFromConfig throws for missing file', () => {
    assert.throws(
      () => loadTargetsFromConfig('/nonexistent/config.json'),
      /not found/
    );
  });

  it('loadTargetsFromConfig throws for invalid config', () => {
    const configPath = path.join(TEST_CONFIG, 'invalid.json');
    fs.writeFileSync(configPath, '{"notTargets": []}');

    assert.throws(() => loadTargetsFromConfig(configPath), /targets/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Manifest Writing
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Manifest Writing', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('writeMirrorManifest creates file', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    const manifestPath = path.join(TEST_TARGET, 'mirror-manifest.json');
    writeMirrorManifest(result.manifest, manifestPath);

    assert.ok(fs.existsSync(manifestPath));
  });

  it('written manifest is valid JSON', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    const manifestPath = path.join(TEST_TARGET, 'mirror-manifest.json');
    writeMirrorManifest(result.manifest, manifestPath);

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(content);

    assert.strictEqual(parsed.$schema, MIRROR_MANIFEST_SCHEMA);
  });

  it('written manifest has trailing newline', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 'backup', type: 'filesystem', endpoint: TEST_TARGET }],
    });

    const manifestPath = path.join(TEST_TARGET, 'mirror-manifest.json');
    writeMirrorManifest(result.manifest, manifestPath);

    const content = fs.readFileSync(manifestPath, 'utf-8');
    assert.ok(content.endsWith('\n'), 'Should have trailing newline');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Checksum Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Checksum Determinism', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('same source produces same checksum', async () => {
    const result1 = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 't1', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'r1') }],
    });

    const result2 = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 't2', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'r2') }],
    });

    assert.strictEqual(result1.manifest.sourceSha256, result2.manifest.sourceSha256);
  });

  it('different source produces different checksum', async () => {
    // First run
    const result1 = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 't1', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'r1') }],
    });

    // Modify source
    fs.writeFileSync(path.join(TEST_SOURCE, 'new-file.txt'), 'New content');

    // Second run
    const result2 = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [{ id: 't2', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'r2') }],
    });

    assert.notStrictEqual(result1.manifest.sourceSha256, result2.manifest.sourceSha256);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Multiple Targets
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Multiple Targets', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('publishes to multiple filesystem targets', async () => {
    const target1 = path.join(TEST_TARGET, 'backup1');
    const target2 = path.join(TEST_TARGET, 'backup2');

    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [
        { id: 'backup1', type: 'filesystem', endpoint: target1 },
        { id: 'backup2', type: 'filesystem', endpoint: target2 },
      ],
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.manifest.summary.successCount, 2);

    // Both should have the files
    assert.ok(fs.existsSync(path.join(target1, 'file1.txt')));
    assert.ok(fs.existsSync(path.join(target2, 'file1.txt')));
  });

  it('summary aggregates all targets', async () => {
    const result = await publishToMirrors({
      sourceDir: TEST_SOURCE,
      targets: [
        { id: 'backup1', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'b1') },
        { id: 'backup2', type: 'filesystem', endpoint: path.join(TEST_TARGET, 'b2') },
      ],
    });

    // 3 files × 2 targets = 6 total files uploaded
    assert.strictEqual(result.manifest.summary.totalFilesUploaded, 6);
  });
});
