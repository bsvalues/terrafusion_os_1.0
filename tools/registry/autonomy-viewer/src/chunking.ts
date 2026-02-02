/**
 * Phase 4N44b – Deterministic Chunking
 * =====================================
 *
 * Fixed-size chunking with stable boundaries and cryptographic manifests.
 *
 * Invariants:
 *   - Same input always produces same chunks (deterministic)
 *   - Chunk manifests are canonicalized (sorted keys, stable JSON)
 *   - Recomposition proof matches original SHA256 offline
 */

import * as crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const CHUNKING_SCHEMA = 'terrafusion.autonomy.chunk-manifest.v1';
export const CHUNKING_VERSION = '4N44.1';

/** Default chunk size: 8MB (balance between overhead and parallelism) */
export const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single chunk entry in the manifest.
 */
export interface ChunkEntry {
  /** 0-based chunk index */
  index: number;
  /** SHA256 hash of chunk content */
  sha256: string;
  /** Size in bytes */
  bytes: number;
}

/**
 * Chunk manifest - describes how an asset was chunked.
 */
export interface ChunkManifest {
  /** Schema identifier */
  $schema: typeof CHUNKING_SCHEMA;
  /** Tool version */
  toolVersion: typeof CHUNKING_VERSION;
  /** Original asset path */
  assetPath: string;
  /** SHA256 of original (unchunked) content */
  originalSha256: string;
  /** Original size in bytes */
  originalBytes: number;
  /** Chunk size used */
  chunkSize: number;
  /** Total number of chunks */
  chunkCount: number;
  /** Ordered list of chunks */
  chunks: ChunkEntry[];
}

/**
 * Result of chunking operation.
 */
export interface ChunkingResult {
  /** Chunk entries (metadata only) */
  chunks: ChunkEntry[];
  /** Original size in bytes */
  originalBytes: number;
  /** Original SHA256 */
  originalSha256: string;
  /** Chunk size used */
  chunkSize: number;
}

/**
 * Error codes for chunk operations.
 */
export type ChunkErrorCode =
  | 'CHUNK_MISSING'
  | 'CHUNK_HASH_MISMATCH'
  | 'CHUNK_COUNT_MISMATCH'
  | 'CHUNK_INDEX_INVALID'
  | 'CHUNK_BYTES_MISMATCH'
  | 'RECOMPOSE_HASH_MISMATCH';

/**
 * Chunk operation error.
 */
export interface ChunkError {
  code: ChunkErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result of recomposition.
 */
export interface RecomposeResult {
  ok: boolean;
  /** Recomposed data (if successful) */
  data?: Buffer;
  /** SHA256 of recomposed data */
  sha256?: string;
  /** Error (if failed) */
  error?: ChunkError;
}

/**
 * Result of chunk manifest verification.
 */
export interface ChunkVerificationResult {
  ok: boolean;
  errors: ChunkError[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SHA256 of a buffer.
 */
function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunking Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for chunking.
 */
export interface ChunkOptions {
  /** Chunk size in bytes (default: 8MB) */
  chunkSize?: number;
}

/**
 * Chunk a buffer into fixed-size pieces.
 *
 * This is deterministic: same input + options = same output.
 */
export function chunkBuffer(data: Buffer, options: ChunkOptions = {}): ChunkingResult {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;

  if (data.length === 0) {
    return {
      chunks: [],
      originalBytes: 0,
      originalSha256: sha256Buffer(data),
      chunkSize,
    };
  }

  const chunks: ChunkEntry[] = [];
  let offset = 0;
  let index = 0;

  while (offset < data.length) {
    const end = Math.min(offset + chunkSize, data.length);
    const chunkData = data.slice(offset, end);

    chunks.push({
      index,
      sha256: sha256Buffer(chunkData),
      bytes: chunkData.length,
    });

    offset = end;
    index++;
  }

  return {
    chunks,
    originalBytes: data.length,
    originalSha256: sha256Buffer(data),
    chunkSize,
  };
}

/**
 * Create a chunk manifest from chunking result.
 */
export function createChunkManifest(result: ChunkingResult, assetPath: string): ChunkManifest {
  return {
    $schema: CHUNKING_SCHEMA,
    toolVersion: CHUNKING_VERSION,
    assetPath,
    originalSha256: result.originalSha256,
    originalBytes: result.originalBytes,
    chunkSize: result.chunkSize,
    chunkCount: result.chunks.length,
    chunks: result.chunks,
  };
}

/**
 * Canonicalize a chunk manifest for signing.
 *
 * Keys are sorted alphabetically at all levels.
 */
export function canonicalizeManifest(manifest: ChunkManifest): string {
  // Sort keys at top level
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(manifest).sort();

  for (const key of keys) {
    const value = manifest[key as keyof ChunkManifest];
    if (Array.isArray(value)) {
      // Sort chunk entries by index and canonicalize each
      sorted[key] = (value as ChunkEntry[]).map(entry => {
        const entryKeys = Object.keys(entry).sort();
        const sortedEntry: Record<string, unknown> = {};
        for (const k of entryKeys) {
          sortedEntry[k] = entry[k as keyof ChunkEntry];
        }
        return sortedEntry;
      });
    } else {
      sorted[key] = value;
    }
  }

  return JSON.stringify(sorted, null, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Recomposition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recompose chunks back into original data.
 *
 * Verifies each chunk hash and final recomposed hash.
 */
export function recomposeChunks(manifest: ChunkManifest, chunks: Buffer[]): RecomposeResult {
  // Check chunk count
  if (chunks.length !== manifest.chunkCount) {
    return {
      ok: false,
      error: {
        code: 'CHUNK_MISSING',
        message: `Expected ${manifest.chunkCount} chunks, got ${chunks.length}`,
        details: {
          expected: manifest.chunkCount,
          actual: chunks.length,
        },
      },
    };
  }

  // Verify each chunk hash
  for (let i = 0; i < chunks.length; i++) {
    const expectedHash = manifest.chunks[i].sha256;
    const actualHash = sha256Buffer(chunks[i]);

    if (actualHash !== expectedHash) {
      return {
        ok: false,
        error: {
          code: 'CHUNK_HASH_MISMATCH',
          message: `Chunk ${i} hash mismatch: expected ${expectedHash.substring(0, 16)}..., got ${actualHash.substring(0, 16)}...`,
          details: {
            chunkIndex: i,
            expectedHash,
            actualHash,
          },
        },
      };
    }
  }

  // Recompose
  const recomposed = Buffer.concat(chunks);
  const recomposedHash = sha256Buffer(recomposed);

  // Verify final hash
  if (recomposedHash !== manifest.originalSha256) {
    return {
      ok: false,
      error: {
        code: 'RECOMPOSE_HASH_MISMATCH',
        message: `Recomposed hash mismatch: expected ${manifest.originalSha256.substring(0, 16)}..., got ${recomposedHash.substring(0, 16)}...`,
        details: {
          expectedHash: manifest.originalSha256,
          actualHash: recomposedHash,
        },
      },
    };
  }

  return {
    ok: true,
    data: recomposed,
    sha256: recomposedHash,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a chunk manifest for internal consistency.
 *
 * Does NOT verify actual chunk content - just manifest structure.
 */
export function verifyChunkManifest(manifest: ChunkManifest): ChunkVerificationResult {
  const errors: ChunkError[] = [];

  // Check chunk count matches array length
  if (manifest.chunkCount !== manifest.chunks.length) {
    errors.push({
      code: 'CHUNK_COUNT_MISMATCH',
      message: `chunkCount (${manifest.chunkCount}) doesn't match chunks array length (${manifest.chunks.length})`,
      details: {
        declared: manifest.chunkCount,
        actual: manifest.chunks.length,
      },
    });
  }

  // Check indices are sequential starting from 0
  for (let i = 0; i < manifest.chunks.length; i++) {
    if (manifest.chunks[i].index !== i) {
      errors.push({
        code: 'CHUNK_INDEX_INVALID',
        message: `Chunk at position ${i} has index ${manifest.chunks[i].index}, expected ${i}`,
        details: {
          position: i,
          actualIndex: manifest.chunks[i].index,
          expectedIndex: i,
        },
      });
    }
  }

  // Check byte sum matches originalBytes
  const totalBytes = manifest.chunks.reduce((sum, c) => sum + c.bytes, 0);
  if (totalBytes !== manifest.originalBytes) {
    errors.push({
      code: 'CHUNK_BYTES_MISMATCH',
      message: `Sum of chunk bytes (${totalBytes}) doesn't match originalBytes (${manifest.originalBytes})`,
      details: {
        sumBytes: totalBytes,
        declaredBytes: manifest.originalBytes,
      },
    });
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chunk an asset and get both result and manifest.
 */
export function chunkAsset(
  data: Buffer,
  assetPath: string,
  options: ChunkOptions = {}
): { result: ChunkingResult; manifest: ChunkManifest } {
  const result = chunkBuffer(data, options);
  const manifest = createChunkManifest(result, assetPath);
  return { result, manifest };
}

/**
 * Check if an asset should be chunked based on size.
 */
export function shouldChunk(sizeBytes: number, chunkSize: number = DEFAULT_CHUNK_SIZE): boolean {
  // Chunk if larger than 1.5x chunk size (avoid creating 2-chunk files for marginal oversize)
  return sizeBytes > chunkSize * 1.5;
}
