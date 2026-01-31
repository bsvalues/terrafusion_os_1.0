/**
 * Phase 4N3 — Evidence Manifest Builder
 *
 * Creates an audit-grade manifest with SHA256 hashes for every file in the bundle.
 * This enables integrity verification without unpacking the ZIP.
 */

import crypto from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ManifestEntry {
  path: string; // POSIX path inside ZIP
  sha256: string;
  bytes: number;
}

export interface EvidenceManifest {
  schema: 'terrafusion.autonomy.evidence.v1';
  createdAtUtc: string;
  baseSha: string;
  planBaseSha?: string;
  runId?: string;
  nodeVersion?: string;
  files: ManifestEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SHA256 hash of a buffer.
 */
export function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Join path parts with POSIX separators.
 */
export function posixJoin(...parts: string[]): string {
  return parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Builder
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildManifestArgs {
  baseSha: string;
  planBaseSha?: string;
  runId?: string;
  files: Array<{ zipPath: string; data: Buffer }>;
}

/**
 * Build an evidence manifest from file entries.
 *
 * @param args Manifest configuration
 * @returns EvidenceManifest object
 */
export function buildManifest(args: BuildManifestArgs): EvidenceManifest {
  const files: ManifestEntry[] = args.files
    .map(f => ({
      path: f.zipPath,
      sha256: sha256(f.data),
      bytes: f.data.length,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    schema: 'terrafusion.autonomy.evidence.v1',
    createdAtUtc: new Date().toISOString(),
    baseSha: args.baseSha,
    planBaseSha: args.planBaseSha,
    runId: args.runId,
    nodeVersion: process.version,
    files,
  };
}

/**
 * Verify that all files in the manifest match their SHA256 hashes.
 *
 * @param manifest The manifest to verify
 * @param files Actual file contents by zipPath
 * @returns Array of paths that failed verification (empty = all passed)
 */
export function verifyManifest(manifest: EvidenceManifest, files: Map<string, Buffer>): string[] {
  const failures: string[] = [];

  for (const entry of manifest.files) {
    const data = files.get(entry.path);
    if (!data) {
      failures.push(entry.path);
      continue;
    }
    const actual = sha256(data);
    if (actual !== entry.sha256) {
      failures.push(entry.path);
    }
  }

  return failures;
}
