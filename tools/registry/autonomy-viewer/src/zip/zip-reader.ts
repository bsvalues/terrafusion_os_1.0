/**
 * Phase 4N5 — Minimal ZIP Reader
 *
 * Reads ZIP files (STORE compression only) for verification.
 * Zero dependencies, audit-grade simplicity.
 *
 * Security:
 * - Rejects path traversal (../, absolute paths)
 * - Validates signatures and sizes
 * - No decompression (STORE only)
 */

export interface ZipFileEntry {
  path: string;
  size: number;
  compressedSize: number;
  compression: number;
  crc32: number;
  offset: number; // Offset of local header
}

export interface ZipReadResult {
  ok: boolean;
  entries: ZipFileEntry[];
  error?: string;
}

/**
 * Validate a path for security issues.
 * Rejects path traversal and absolute paths.
 */
function validatePath(path: string): { ok: boolean; reason?: string } {
  // Normalize to POSIX
  const normalized = path.replace(/\\/g, '/');

  // Reject absolute paths
  if (normalized.startsWith('/')) {
    return { ok: false, reason: 'Absolute path not allowed' };
  }

  // Reject path traversal
  const parts = normalized.split('/');
  for (const part of parts) {
    if (part === '..') {
      return { ok: false, reason: 'Path traversal (..) not allowed' };
    }
  }

  // Reject empty path
  if (normalized.length === 0) {
    return { ok: false, reason: 'Empty path not allowed' };
  }

  return { ok: true };
}

function readU16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function readU32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

/**
 * Parse ZIP central directory to get file entries.
 */
export function readZipEntries(data: Buffer): ZipReadResult {
  const entries: ZipFileEntry[] = [];

  // Find End of Central Directory (EOCD)
  // Signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = data.length - 22; i >= 0 && i >= data.length - 65535 - 22; i--) {
    if (
      data[i] === 0x50 &&
      data[i + 1] === 0x4b &&
      data[i + 2] === 0x05 &&
      data[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset < 0) {
    return { ok: false, entries: [], error: 'Cannot find End of Central Directory' };
  }

  const totalEntries = readU16LE(data, eocdOffset + 10);
  const centralDirSize = readU32LE(data, eocdOffset + 12);
  const centralDirOffset = readU32LE(data, eocdOffset + 16);

  // Validate central directory bounds
  if (centralDirOffset + centralDirSize > eocdOffset) {
    return { ok: false, entries: [], error: 'Invalid central directory bounds' };
  }

  // Parse central directory entries
  let offset = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > data.length) {
      return { ok: false, entries: [], error: 'Central directory truncated' };
    }

    // Check signature: 0x02014b50
    const sig = readU32LE(data, offset);
    if (sig !== 0x02014b50) {
      return { ok: false, entries: [], error: `Invalid central directory signature at ${offset}` };
    }

    const compression = readU16LE(data, offset + 10);
    const crc32 = readU32LE(data, offset + 16);
    const compressedSize = readU32LE(data, offset + 20);
    const uncompressedSize = readU32LE(data, offset + 24);
    const nameLength = readU16LE(data, offset + 28);
    const extraLength = readU16LE(data, offset + 30);
    const commentLength = readU16LE(data, offset + 32);
    const localHeaderOffset = readU32LE(data, offset + 42);

    if (offset + 46 + nameLength > data.length) {
      return { ok: false, entries: [], error: 'Central directory entry name truncated' };
    }

    const path = data.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');

    // Validate path security
    const pathValidation = validatePath(path);
    if (!pathValidation.ok) {
      return { ok: false, entries: [], error: `Invalid path "${path}": ${pathValidation.reason}` };
    }

    // Skip directories (paths ending with /)
    if (!path.endsWith('/')) {
      entries.push({
        path: path.replace(/\\/g, '/'), // Normalize to POSIX
        size: uncompressedSize,
        compressedSize,
        compression,
        crc32,
        offset: localHeaderOffset,
      });
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { ok: true, entries };
}

/**
 * Read file data from a ZIP entry.
 * Only supports STORE (no compression).
 */
export function readZipFileData(data: Buffer, entry: ZipFileEntry): Buffer | null {
  // Only STORE compression supported
  if (entry.compression !== 0) {
    return null;
  }

  const localOffset = entry.offset;

  // Check local file header signature: 0x04034b50
  if (localOffset + 30 > data.length) {
    return null;
  }

  const sig = readU32LE(data, localOffset);
  if (sig !== 0x04034b50) {
    return null;
  }

  const nameLength = readU16LE(data, localOffset + 26);
  const extraLength = readU16LE(data, localOffset + 28);

  const dataStart = localOffset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + entry.size;

  if (dataEnd > data.length) {
    return null;
  }

  return data.subarray(dataStart, dataEnd);
}

/**
 * Read all files from a ZIP into a Map.
 */
export function readZipFiles(data: Buffer): Map<string, Buffer> | null {
  const result = readZipEntries(data);
  if (!result.ok) {
    return null;
  }

  const files = new Map<string, Buffer>();

  for (const entry of result.entries) {
    const fileData = readZipFileData(data, entry);
    if (fileData === null) {
      return null;
    }
    files.set(entry.path, fileData);
  }

  return files;
}
