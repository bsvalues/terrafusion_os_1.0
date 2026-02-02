/**
 * Phase 4N44b – Chunking Contract Tests
 * ======================================
 *
 * TDD-first tests for deterministic chunking + chunk manifests.
 *
 * Invariants:
 *   - Chunking is deterministic (same input → same chunks)
 *   - Chunk boundaries are stable (content-defined or fixed-size)
 *   - Chunk manifests are canonicalized (sorted keys, stable JSON)
 *   - Recomposition matches original SHA256
 */

import * as assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

import {
    canonicalizeManifest,
    chunkBuffer,
    CHUNKING_SCHEMA,
    CHUNKING_VERSION,
    createChunkManifest,
    DEFAULT_CHUNK_SIZE,
    recomposeChunks,
    verifyChunkManifest,
    type ChunkManifest
} from '../src/chunking.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function randomBuffer(size: number, seed: number = 42): Buffer {
  // Deterministic random for reproducibility
  const buffer = Buffer.alloc(size);
  let state = seed;
  for (let i = 0; i < size; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    buffer[i] = state & 0xff;
  }
  return buffer;
}

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Chunking Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Chunking Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(CHUNKING_SCHEMA, 'terrafusion.autonomy.chunk-manifest.v1');
  });

  it('version is 4N44.1', () => {
    assert.strictEqual(CHUNKING_VERSION, '4N44.1');
  });

  it('default chunk size is between 4MB and 16MB', () => {
    assert.ok(DEFAULT_CHUNK_SIZE >= 4 * 1024 * 1024, 'chunk size should be >= 4MB');
    assert.ok(DEFAULT_CHUNK_SIZE <= 16 * 1024 * 1024, 'chunk size should be <= 16MB');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Deterministic Chunking
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Deterministic Chunking', () => {
  it('chunking is deterministic', () => {
    const data = randomBuffer(10 * 1024 * 1024, 12345); // 10MB

    const result1 = chunkBuffer(data, { chunkSize: 2 * 1024 * 1024 });
    const result2 = chunkBuffer(data, { chunkSize: 2 * 1024 * 1024 });

    assert.strictEqual(result1.chunks.length, result2.chunks.length);
    for (let i = 0; i < result1.chunks.length; i++) {
      assert.strictEqual(result1.chunks[i].sha256, result2.chunks[i].sha256);
      assert.strictEqual(result1.chunks[i].bytes, result2.chunks[i].bytes);
    }
  });

  it('produces correct number of chunks', () => {
    const chunkSize = 1024 * 1024; // 1MB
    const data = randomBuffer(5 * chunkSize + 100); // 5.something MB

    const result = chunkBuffer(data, { chunkSize });

    assert.strictEqual(result.chunks.length, 6); // 5 full + 1 partial
    assert.strictEqual(result.chunks[5].bytes, 100); // Last chunk is 100 bytes
  });

  it('handles exact multiple of chunk size', () => {
    const chunkSize = 1024;
    const data = randomBuffer(3 * chunkSize);

    const result = chunkBuffer(data, { chunkSize });

    assert.strictEqual(result.chunks.length, 3);
    for (const chunk of result.chunks) {
      assert.strictEqual(chunk.bytes, chunkSize);
    }
  });

  it('handles data smaller than chunk size', () => {
    const chunkSize = 1024 * 1024; // 1MB
    const data = randomBuffer(1000); // 1KB

    const result = chunkBuffer(data, { chunkSize });

    assert.strictEqual(result.chunks.length, 1);
    assert.strictEqual(result.chunks[0].bytes, 1000);
  });

  it('empty buffer produces empty chunks', () => {
    const result = chunkBuffer(Buffer.alloc(0), { chunkSize: 1024 });

    assert.strictEqual(result.chunks.length, 0);
    assert.strictEqual(result.originalBytes, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Chunk Manifest
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Chunk Manifest', () => {
  it('chunk manifest is canonicalized', () => {
    const data = randomBuffer(3 * 1024 * 1024); // 3MB
    const chunkSize = 1024 * 1024;

    const result = chunkBuffer(data, { chunkSize });
    const manifest = createChunkManifest(result, 'test-asset.bin');

    // Canonicalize and verify it's stable
    const canon1 = canonicalizeManifest(manifest);
    const canon2 = canonicalizeManifest(manifest);

    assert.strictEqual(canon1, canon2);

    // Verify keys are sorted (check first few chars)
    const parsed = JSON.parse(canon1);
    const keys = Object.keys(parsed);
    const sortedKeys = [...keys].sort();
    assert.deepStrictEqual(keys, sortedKeys);
  });

  it('manifest includes originalSha256', () => {
    const data = randomBuffer(2 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    assert.strictEqual(manifest.originalSha256, sha256(data));
  });

  it('manifest includes originalBytes', () => {
    const size = 2500000;
    const data = randomBuffer(size);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    assert.strictEqual(manifest.originalBytes, size);
  });

  it('manifest includes chunk count and size', () => {
    const chunkSize = 512 * 1024;
    const data = randomBuffer(2 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize });
    const manifest = createChunkManifest(result, 'test.bin');

    assert.strictEqual(manifest.chunkSize, chunkSize);
    assert.strictEqual(manifest.chunkCount, 4);
  });

  it('manifest chunks have index and sha256', () => {
    const data = randomBuffer(3 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    assert.strictEqual(manifest.chunks.length, 3);
    for (let i = 0; i < manifest.chunks.length; i++) {
      assert.strictEqual(manifest.chunks[i].index, i);
      assert.ok(typeof manifest.chunks[i].sha256 === 'string');
      assert.strictEqual(manifest.chunks[i].sha256.length, 64); // SHA256 hex
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Recomposition
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Recomposition', () => {
  it('recomposition matches original SHA256', () => {
    const data = randomBuffer(5 * 1024 * 1024, 99);
    const originalHash = sha256(data);

    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    // Simulate extracting chunks from result
    const chunks: Buffer[] = [];
    let offset = 0;
    for (const entry of result.chunks) {
      chunks.push(data.slice(offset, offset + entry.bytes));
      offset += entry.bytes;
    }

    const recomposed = recomposeChunks(manifest, chunks);

    assert.strictEqual(recomposed.ok, true);
    assert.strictEqual(recomposed.sha256, originalHash);
    assert.ok(recomposed.data?.equals(data));
  });

  it('recomposition fails with missing chunk', () => {
    const data = randomBuffer(3 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    // Only provide 2 of 3 chunks
    const chunks = [
      data.slice(0, 1024 * 1024),
      data.slice(1024 * 1024, 2 * 1024 * 1024),
      // Missing third chunk
    ];

    const recomposed = recomposeChunks(manifest, chunks);

    assert.strictEqual(recomposed.ok, false);
    assert.strictEqual(recomposed.error?.code, 'CHUNK_MISSING');
  });

  it('recomposition fails with corrupted chunk', () => {
    const data = randomBuffer(2 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    // Corrupt the second chunk
    const chunks = [
      data.slice(0, 1024 * 1024),
      Buffer.alloc(1024 * 1024, 0), // Zeroed out - wrong hash
    ];

    const recomposed = recomposeChunks(manifest, chunks);

    assert.strictEqual(recomposed.ok, false);
    assert.strictEqual(recomposed.error?.code, 'CHUNK_HASH_MISMATCH');
  });

  it('recomposition fails with wrong final hash', () => {
    const data = randomBuffer(2 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    // Tamper with original hash in manifest
    const tamperedManifest = {
      ...manifest,
      originalSha256: 'deadbeef'.repeat(8),
    };

    const chunks = [data.slice(0, 1024 * 1024), data.slice(1024 * 1024, 2 * 1024 * 1024)];

    const recomposed = recomposeChunks(tamperedManifest, chunks);

    assert.strictEqual(recomposed.ok, false);
    assert.strictEqual(recomposed.error?.code, 'RECOMPOSE_HASH_MISMATCH');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Chunk Manifest Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Chunk Manifest Verification', () => {
  it('verifyChunkManifest accepts valid manifest', () => {
    const data = randomBuffer(3 * 1024 * 1024);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });
    const manifest = createChunkManifest(result, 'test.bin');

    const verification = verifyChunkManifest(manifest);

    assert.strictEqual(verification.ok, true);
    assert.strictEqual(verification.errors.length, 0);
  });

  it('rejects manifest with mismatched chunk count', () => {
    const manifest: ChunkManifest = {
      $schema: CHUNKING_SCHEMA,
      toolVersion: CHUNKING_VERSION,
      assetPath: 'test.bin',
      originalSha256: 'a'.repeat(64),
      originalBytes: 3 * 1024 * 1024,
      chunkSize: 1024 * 1024,
      chunkCount: 5, // Wrong - only 3 chunks
      chunks: [
        { index: 0, sha256: 'b'.repeat(64), bytes: 1024 * 1024 },
        { index: 1, sha256: 'c'.repeat(64), bytes: 1024 * 1024 },
        { index: 2, sha256: 'd'.repeat(64), bytes: 1024 * 1024 },
      ],
    };

    const verification = verifyChunkManifest(manifest);

    assert.strictEqual(verification.ok, false);
    assert.ok(verification.errors.some(e => e.code === 'CHUNK_COUNT_MISMATCH'));
  });

  it('rejects manifest with non-sequential indices', () => {
    const manifest: ChunkManifest = {
      $schema: CHUNKING_SCHEMA,
      toolVersion: CHUNKING_VERSION,
      assetPath: 'test.bin',
      originalSha256: 'a'.repeat(64),
      originalBytes: 2 * 1024 * 1024,
      chunkSize: 1024 * 1024,
      chunkCount: 2,
      chunks: [
        { index: 0, sha256: 'b'.repeat(64), bytes: 1024 * 1024 },
        { index: 5, sha256: 'c'.repeat(64), bytes: 1024 * 1024 }, // Wrong index
      ],
    };

    const verification = verifyChunkManifest(manifest);

    assert.strictEqual(verification.ok, false);
    assert.ok(verification.errors.some(e => e.code === 'CHUNK_INDEX_INVALID'));
  });

  it('rejects manifest with byte sum mismatch', () => {
    const manifest: ChunkManifest = {
      $schema: CHUNKING_SCHEMA,
      toolVersion: CHUNKING_VERSION,
      assetPath: 'test.bin',
      originalSha256: 'a'.repeat(64),
      originalBytes: 5 * 1024 * 1024, // Claims 5MB
      chunkSize: 1024 * 1024,
      chunkCount: 2,
      chunks: [
        { index: 0, sha256: 'b'.repeat(64), bytes: 1024 * 1024 },
        { index: 1, sha256: 'c'.repeat(64), bytes: 1024 * 1024 }, // Only 2MB total
      ],
    };

    const verification = verifyChunkManifest(manifest);

    assert.strictEqual(verification.ok, false);
    assert.ok(verification.errors.some(e => e.code === 'CHUNK_BYTES_MISMATCH'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44b – Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44b – Chunking Edge Cases', () => {
  it('handles 1-byte file', () => {
    const data = Buffer.from([0x42]);
    const result = chunkBuffer(data, { chunkSize: 1024 });
    const manifest = createChunkManifest(result, 'tiny.bin');

    assert.strictEqual(manifest.chunkCount, 1);
    assert.strictEqual(manifest.chunks[0].bytes, 1);
  });

  it('handles file exactly at chunk boundary', () => {
    const chunkSize = 1024;
    const data = randomBuffer(chunkSize);
    const result = chunkBuffer(data, { chunkSize });

    assert.strictEqual(result.chunks.length, 1);
    assert.strictEqual(result.chunks[0].bytes, chunkSize);
  });

  it('chunk sha256 values are unique for different content', () => {
    const data = randomBuffer(3 * 1024 * 1024, 1);
    const result = chunkBuffer(data, { chunkSize: 1024 * 1024 });

    const hashes = result.chunks.map(c => c.sha256);
    const uniqueHashes = new Set(hashes);

    assert.strictEqual(uniqueHashes.size, hashes.length);
  });
});
