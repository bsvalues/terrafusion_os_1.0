/**
 * Evidence Pack Normalizer
 *
 * Strips dynamic/volatile fields from Evidence Packs to enable deterministic testing.
 *
 * Volatile fields (stripped for determinism tests):
 * - generatedAt (timestamp)
 * - executedAt (timestamp in contracts)
 * - metadata.triggeredBy (user-specific)
 * - Absolute file paths (converted to repo-relative)
 *
 * Stable fields (kept for hash comparison):
 * - contractVersion
 * - prNumber, branchRef
 * - overallStatus, lanesAudited
 * - contracts array (sorted by skillName)
 * - violationsCount, totalViolations
 * - hashes (SHA-256, contextHash)
 *
 * Usage:
 * ```
 * const pack = await aggregateEvidencePack(...);
 * const normalized = normalizeEvidencePack(pack);
 * // normalized pack is deterministic (same source → same output)
 * ```
 */

import * as path from 'path';
import { EvidencePack } from './aggregate';

/**
 * Normalize file paths to repo-relative (strip absolute paths)
 */
function normalizeFilePath(filePath: string): string {
  // Convert absolute paths to relative
  const cwd = process.cwd();
  if (filePath.startsWith(cwd)) {
    return path.relative(cwd, filePath).replace(/\\/g, '/');
  }

  // Already relative - just normalize separators
  return filePath.replace(/\\/g, '/');
}

/**
 * Strip volatile fields and normalize for deterministic comparison
 */
export function normalizeEvidencePack(evidencePack: EvidencePack): EvidencePack {
  // Deep clone to avoid mutating original
  const normalized = JSON.parse(JSON.stringify(evidencePack));

  // 1. Strip timestamps (volatile)
  delete normalized.generatedAt;

  // 2. Normalize metadata (strip volatile triggeredBy)
  if (normalized.metadata) {
    delete normalized.metadata.triggeredBy;
  }

  // 3. Normalize contracts
  if (Array.isArray(normalized.contracts)) {
    normalized.contracts = normalized.contracts.map((contract: any) => {
      // Strip executedAt timestamp
      const { executedAt, ...rest } = contract;

      // Normalize artifactPath (absolute → relative)
      rest.artifactPath = normalizeFilePath(rest.artifactPath);

      return rest;
    });

    // Sort by skillName for stable ordering (determinism)
    normalized.contracts.sort((a: any, b: any) => a.skillName.localeCompare(b.skillName));
  }

  // 4. Normalize lanesAudited (sort for determinism)
  if (Array.isArray(normalized.lanesAudited)) {
    normalized.lanesAudited.sort();
  }

  return normalized;
}

/**
 * Compute normalized hash of Evidence Pack (for determinism testing)
 *
 * This hash is based on the normalized pack (volatile fields stripped).
 * Two Evidence Packs with identical *source* contracts should have identical normalized hashes.
 */
export function computeNormalizedHash(evidencePack: EvidencePack): string {
  const crypto = require('crypto');
  const normalized = normalizeEvidencePack(evidencePack);

  // Stringify with sorted keys for determinism
  const json = JSON.stringify(normalized, Object.keys(normalized).sort());
  const hash = crypto.createHash('sha256').update(json).digest('hex');

  return `sha256:${hash}`;
}

/**
 * Compare two Evidence Packs for deterministic equivalence
 *
 * Returns true if both packs have identical normalized content.
 * Used in Phase 7A determinism burn-in tests.
 */
export function arePacksDeterministicallyEqual(pack1: EvidencePack, pack2: EvidencePack): boolean {
  const hash1 = computeNormalizedHash(pack1);
  const hash2 = computeNormalizedHash(pack2);
  return hash1 === hash2;
}
