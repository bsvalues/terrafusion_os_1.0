/**
 * Phase 4N3 — Deterministic ZIP Writer
 *
 * Minimal ZIP (STORE, no compression) with fixed timestamps for determinism.
 * Zero dependencies, audit-grade reproducibility.
 *
 * Determinism guarantees:
 * - Stable file order (sorted by zipPath)
 * - Fixed mtime (1980-01-01 00:00:00 UTC)
 * - No random IDs or variable-length headers
 * - No data descriptors
 */

import { crc32 } from './crc32.ts';

export interface ZipEntry {
  zipPath: string; // POSIX path inside zip
  data: Buffer;
  mode?: number; // Unix permissions (default: 0o100644)
}

function toDosDateTime(): { time: number; date: number } {
  // Fixed timestamp: 1980-01-01 00:00:00 for determinism
  // DOS date format: bits 0-4 = day (1-31), bits 5-8 = month (1-12), bits 9-15 = year from 1980
  // DOS time format: bits 0-4 = seconds/2, bits 5-10 = minutes, bits 11-15 = hours
  const dosDate = (0 << 9) | (1 << 5) | 1; // 1980-01-01
  const dosTime = 0; // 00:00:00
  return { time: dosTime & 0xffff, date: dosDate & 0xffff };
}

function writeU16LE(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n & 0xffff, 0);
  return b;
}

function writeU32LE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

/**
 * Build a deterministic ZIP file from entries.
 *
 * @param entries Array of files to include
 * @returns Buffer containing the ZIP file
 */
export function buildDeterministicZip(entries: ZipEntry[]): Buffer {
  const { time, date } = toDosDateTime();

  // Normalize and sort entries for determinism
  const normalized = entries
    .map(e => ({
      ...e,
      zipPath: e.zipPath.replace(/\\/g, '/').replace(/^\/+/, ''),
      mode: e.mode ?? 0o100644, // Regular file default
    }))
    .sort((a, b) => a.zipPath.localeCompare(b.zipPath));

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];

  let offset = 0;

  for (const e of normalized) {
    const name = Buffer.from(e.zipPath, 'utf8');
    const data = e.data;
    const c = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + name length)
    // Signature:     4 bytes  0x04034b50
    // Version:       2 bytes  20 (2.0)
    // Flags:         2 bytes  0
    // Compression:   2 bytes  0 (store)
    // Mod time:      2 bytes
    // Mod date:      2 bytes
    // CRC32:         4 bytes
    // Compressed:    4 bytes
    // Uncompressed:  4 bytes
    // Name length:   2 bytes
    // Extra length:  2 bytes  0
    const localHeader = Buffer.concat([
      writeU32LE(0x04034b50),
      writeU16LE(20),
      writeU16LE(0),
      writeU16LE(0),
      writeU16LE(time),
      writeU16LE(date),
      writeU32LE(c),
      writeU32LE(size),
      writeU32LE(size),
      writeU16LE(name.length),
      writeU16LE(0),
      name,
    ]);

    localParts.push(localHeader, data);

    // Central directory header (46 bytes + name length)
    // Signature:        4 bytes  0x02014b50
    // Version made by:  2 bytes  0x0314 (Unix, 2.0)
    // Version needed:   2 bytes  20
    // Flags:            2 bytes  0
    // Compression:      2 bytes  0
    // Mod time/date:    2/2 bytes
    // CRC32:            4 bytes
    // Compressed size:  4 bytes
    // Uncompressed:     4 bytes
    // Name length:      2 bytes
    // Extra length:     2 bytes  0
    // Comment length:   2 bytes  0
    // Disk start:       2 bytes  0
    // Internal attrs:   2 bytes  0
    // External attrs:   4 bytes  (mode << 16)
    // Local offset:     4 bytes
    const versionMadeBy = 0x0314; // Unix (0x03), version 2.0 (0x14)
    const extAttrs = (e.mode! & 0xffff) << 16;

    const centralHeader = Buffer.concat([
      writeU32LE(0x02014b50),
      writeU16LE(versionMadeBy),
      writeU16LE(20),
      writeU16LE(0),
      writeU16LE(0),
      writeU16LE(time),
      writeU16LE(date),
      writeU32LE(c),
      writeU32LE(size),
      writeU32LE(size),
      writeU16LE(name.length),
      writeU16LE(0),
      writeU16LE(0),
      writeU16LE(0),
      writeU16LE(0),
      writeU32LE(extAttrs >>> 0),
      writeU32LE(offset),
      name,
    ]);

    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const centralOffset = offset;
  const centralSize = centralDir.length;

  // End of central directory (22 bytes)
  // Signature:           4 bytes  0x06054b50
  // Disk number:         2 bytes  0
  // Central dir disk:    2 bytes  0
  // Entries on disk:     2 bytes
  // Total entries:       2 bytes
  // Central dir size:    4 bytes
  // Central dir offset:  4 bytes
  // Comment length:      2 bytes  0
  const eocd = Buffer.concat([
    writeU32LE(0x06054b50),
    writeU16LE(0),
    writeU16LE(0),
    writeU16LE(normalized.length),
    writeU16LE(normalized.length),
    writeU32LE(centralSize),
    writeU32LE(centralOffset),
    writeU16LE(0),
  ]);

  return Buffer.concat([...localParts, centralDir, eocd]);
}
