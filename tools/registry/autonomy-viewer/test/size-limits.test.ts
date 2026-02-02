/**
 * Phase 4N44a – Size Limits Contract Tests
 * =========================================
 *
 * TDD-first tests for tiered size ceilings enforcement.
 *
 * Invariants:
 *   - Per-asset, per-pack, per-release limits enforced fail-closed
 *   - Override for incident tier requires break-glass flag
 *   - All error codes are machine-parseable
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    DEFAULT_SIZE_LIMITS,
    getSizeLimitsForTier,
    SIZE_LIMITS_SCHEMA,
    SIZE_LIMITS_VERSION,
    type SizeLimits,
    validateAssetSize,
    validatePackSize,
    validateReleaseFootprint
} from '../src/size-limits.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Size Limits Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Size Limits Schema', () => {
  it('schema matches expected version', () => {
    assert.strictEqual(SIZE_LIMITS_SCHEMA, 'terrafusion.autonomy.size-limits.v1');
  });

  it('version is 4N44.1', () => {
    assert.strictEqual(SIZE_LIMITS_VERSION, '4N44.1');
  });

  it('default limits are defined for all tiers', () => {
    assert.ok(DEFAULT_SIZE_LIMITS.ci, 'ci tier missing');
    assert.ok(DEFAULT_SIZE_LIMITS.merged, 'merged tier missing');
    assert.ok(DEFAULT_SIZE_LIMITS.incident, 'incident tier missing');
  });

  it('each tier has maxAssetBytes, maxPackBytes, maxReleaseBytes', () => {
    for (const tier of ['ci', 'merged', 'incident'] as const) {
      const limits = DEFAULT_SIZE_LIMITS[tier];
      assert.ok(typeof limits.maxAssetBytes === 'number', `${tier} missing maxAssetBytes`);
      assert.ok(typeof limits.maxPackBytes === 'number', `${tier} missing maxPackBytes`);
      assert.ok(typeof limits.maxReleaseBytes === 'number', `${tier} missing maxReleaseBytes`);
    }
  });

  it('incident tier has higher limits than ci/merged', () => {
    assert.ok(DEFAULT_SIZE_LIMITS.incident.maxAssetBytes >= DEFAULT_SIZE_LIMITS.ci.maxAssetBytes);
    assert.ok(DEFAULT_SIZE_LIMITS.incident.maxPackBytes >= DEFAULT_SIZE_LIMITS.merged.maxPackBytes);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Asset Size Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Asset Size Validation', () => {
  it('accepts asset under limit', () => {
    const result = validateAssetSize({
      assetPath: 'casefile.zip',
      sizeBytes: 1024 * 1024, // 1MB
      tier: 'ci',
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('blocks single asset over limit', () => {
    const result = validateAssetSize({
      assetPath: 'huge-file.bin',
      sizeBytes: 500 * 1024 * 1024, // 500MB - over default limit
      tier: 'ci',
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'SIZE_LIMIT_EXCEEDED');
    assert.ok(result.errors[0]?.message.includes('huge-file.bin'));
  });

  it('uses tier-specific limits', () => {
    const limits: SizeLimits = {
      ci: { maxAssetBytes: 1024, maxPackBytes: 10240, maxReleaseBytes: 102400 },
      merged: { maxAssetBytes: 2048, maxPackBytes: 20480, maxReleaseBytes: 204800 },
      incident: { maxAssetBytes: 4096, maxPackBytes: 40960, maxReleaseBytes: 409600 },
    };

    // 1.5KB - over ci limit but under merged
    const ciResult = validateAssetSize({
      assetPath: 'test.bin',
      sizeBytes: 1536,
      tier: 'ci',
      limits,
    });
    assert.strictEqual(ciResult.ok, false);

    const mergedResult = validateAssetSize({
      assetPath: 'test.bin',
      sizeBytes: 1536,
      tier: 'merged',
      limits,
    });
    assert.strictEqual(mergedResult.ok, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Pack Size Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Pack Size Validation', () => {
  it('blocks public pack over limit', () => {
    const result = validatePackSize({
      packType: 'public',
      sizeBytes: 200 * 1024 * 1024, // 200MB - over default
      tier: 'ci',
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'SIZE_LIMIT_EXCEEDED');
    assert.ok(result.errors[0]?.message.includes('public'));
  });

  it('blocks internal pack over limit', () => {
    const result = validatePackSize({
      packType: 'internal',
      sizeBytes: 500 * 1024 * 1024, // 500MB - over default
      tier: 'merged',
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'SIZE_LIMIT_EXCEEDED');
  });

  it('accepts pack under limit', () => {
    const result = validatePackSize({
      packType: 'internal',
      sizeBytes: 10 * 1024 * 1024, // 10MB
      tier: 'merged',
    });
    assert.strictEqual(result.ok, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Release Footprint Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Release Footprint Validation', () => {
  it('blocks release over footprint limit', () => {
    const result = validateReleaseFootprint({
      releaseTag: 'v1.0.0',
      totalBytes: 2 * 1024 * 1024 * 1024, // 2GB - over default
      tier: 'merged',
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'RELEASE_FOOTPRINT_EXCEEDED');
    assert.ok(result.errors[0]?.message.includes('v1.0.0'));
  });

  it('accepts release under footprint limit', () => {
    const result = validateReleaseFootprint({
      releaseTag: 'v1.0.0',
      totalBytes: 50 * 1024 * 1024, // 50MB
      tier: 'merged',
    });
    assert.strictEqual(result.ok, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Incident Override + Break-Glass
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Incident Override', () => {
  it('incident override requires break-glass flag', () => {
    const limits: SizeLimits = {
      ci: { maxAssetBytes: 1024, maxPackBytes: 10240, maxReleaseBytes: 102400 },
      merged: { maxAssetBytes: 1024, maxPackBytes: 10240, maxReleaseBytes: 102400 },
      incident: { maxAssetBytes: 10240, maxPackBytes: 102400, maxReleaseBytes: 1024000 },
    };

    // Try to use incident limits without break-glass
    const result = validateAssetSize({
      assetPath: 'test.bin',
      sizeBytes: 5000, // Over ci/merged but under incident
      tier: 'incident',
      limits,
      breakGlassFlag: false, // Not set
    });

    // Without break-glass, incident tier enforcement should still apply
    // but override for extreme sizes requires explicit flag
    assert.strictEqual(result.ok, true); // Under incident limit
  });

  it('blocks oversized incident asset without break-glass', () => {
    const result = validateAssetSize({
      assetPath: 'huge-incident.bin',
      sizeBytes: 500 * 1024 * 1024, // 500MB - over incident limit
      tier: 'incident',
      breakGlassFlag: false,
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'SIZE_LIMIT_EXCEEDED');
  });

  it('allows oversized asset with break-glass flag', () => {
    const result = validateAssetSize({
      assetPath: 'huge-incident.bin',
      sizeBytes: 500 * 1024 * 1024, // 500MB
      tier: 'incident',
      breakGlassFlag: true,
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.breakGlassUsed);
  });

  it('break-glass without incident tier fails', () => {
    const result = validateAssetSize({
      assetPath: 'huge.bin',
      sizeBytes: 500 * 1024 * 1024,
      tier: 'ci', // Not incident
      breakGlassFlag: true,
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors[0]?.code, 'BREAK_GLASS_INVALID_TIER');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Error Codes
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Error Codes', () => {
  it('SIZE_LIMIT_EXCEEDED includes asset path and sizes', () => {
    const result = validateAssetSize({
      assetPath: 'data/large.bin',
      sizeBytes: 500 * 1024 * 1024,
      tier: 'ci',
    });
    assert.strictEqual(result.errors[0]?.code, 'SIZE_LIMIT_EXCEEDED');
    assert.ok(result.errors[0]?.details?.assetPath === 'data/large.bin');
    assert.ok(typeof result.errors[0]?.details?.actualBytes === 'number');
    assert.ok(typeof result.errors[0]?.details?.limitBytes === 'number');
  });

  it('RELEASE_FOOTPRINT_EXCEEDED includes release tag', () => {
    const result = validateReleaseFootprint({
      releaseTag: 'v2.0.0',
      totalBytes: 2 * 1024 * 1024 * 1024,
      tier: 'ci',
    });
    assert.strictEqual(result.errors[0]?.code, 'RELEASE_FOOTPRINT_EXCEEDED');
    assert.ok(result.errors[0]?.details?.releaseTag === 'v2.0.0');
  });

  it('BREAK_GLASS_INVALID_TIER includes tier info', () => {
    const result = validateAssetSize({
      assetPath: 'test.bin',
      sizeBytes: 500 * 1024 * 1024,
      tier: 'merged',
      breakGlassFlag: true,
    });
    assert.strictEqual(result.errors[0]?.code, 'BREAK_GLASS_INVALID_TIER');
    assert.strictEqual(result.errors[0]?.details?.tier, 'merged');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N44a – Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N44a – Helper Functions', () => {
  it('getSizeLimitsForTier returns correct limits', () => {
    const ciLimits = getSizeLimitsForTier('ci');
    assert.deepStrictEqual(ciLimits, DEFAULT_SIZE_LIMITS.ci);

    const mergedLimits = getSizeLimitsForTier('merged');
    assert.deepStrictEqual(mergedLimits, DEFAULT_SIZE_LIMITS.merged);

    const incidentLimits = getSizeLimitsForTier('incident');
    assert.deepStrictEqual(incidentLimits, DEFAULT_SIZE_LIMITS.incident);
  });

  it('getSizeLimitsForTier accepts custom limits', () => {
    const custom: SizeLimits = {
      ci: { maxAssetBytes: 100, maxPackBytes: 1000, maxReleaseBytes: 10000 },
      merged: { maxAssetBytes: 200, maxPackBytes: 2000, maxReleaseBytes: 20000 },
      incident: { maxAssetBytes: 300, maxPackBytes: 3000, maxReleaseBytes: 30000 },
    };
    const ciLimits = getSizeLimitsForTier('ci', custom);
    assert.deepStrictEqual(ciLimits, custom.ci);
  });
});
