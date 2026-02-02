/**
 * Phase 4N47 – Public Disclosure Exercise Tests
 * ==============================================
 *
 * Tests for public disclosure (FOIA) pack generation:
 *   - Public pack contains only public-tier data
 *   - Internal/county/state data is absent
 *   - Verifier passes on public pack
 *   - Audit trail includes disclosure record
 *
 * @module exercise-public-disclosure.test
 * @version 4N47.1
 */

import * as assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AudienceTier = 'internal' | 'county' | 'state' | 'public';

interface CasefileEntry {
  readonly entryId: string;
  readonly audience: AudienceTier;
  readonly contentHash: string;
  readonly redacted: boolean;
}

interface PublicPack {
  readonly packId: string;
  readonly generatedAt: string;
  readonly requestType: 'FOIA' | 'PublicRecords' | 'OpenData';
  readonly requestId?: string;
  readonly entries: readonly CasefileEntry[];
  readonly excludedTiers: readonly AudienceTier[];
  readonly manifest: {
    readonly totalEntries: number;
    readonly publicEntries: number;
    readonly redactedEntries: number;
  };
}

interface DisclosureRecord {
  readonly disclosureId: string;
  readonly packId: string;
  readonly requestType: string;
  readonly requestId?: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly recipientInfo?: string;
  readonly auditTrailHash: string;
}

interface VerificationResult {
  readonly ok: boolean;
  readonly packId: string;
  readonly entriesVerified: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_TIER: AudienceTier = 'public';
const EXCLUDED_FROM_PUBLIC: readonly AudienceTier[] = ['internal', 'county', 'state'];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function createMockCasefileEntries(): CasefileEntry[] {
  return [
    { entryId: '1', audience: 'public', contentHash: 'hash1', redacted: false },
    { entryId: '2', audience: 'public', contentHash: 'hash2', redacted: false },
    { entryId: '3', audience: 'county', contentHash: 'hash3', redacted: false },
    { entryId: '4', audience: 'state', contentHash: 'hash4', redacted: false },
    { entryId: '5', audience: 'internal', contentHash: 'hash5', redacted: false },
    { entryId: '6', audience: 'public', contentHash: 'hash6', redacted: true },
  ];
}

function filterForPublicPack(entries: readonly CasefileEntry[]): CasefileEntry[] {
  return entries.filter(e => e.audience === PUBLIC_TIER);
}

function generatePublicPack(options: {
  entries: readonly CasefileEntry[];
  requestType: PublicPack['requestType'];
  requestId?: string;
}): PublicPack {
  const publicEntries = filterForPublicPack(options.entries);
  const redactedEntries = publicEntries.filter(e => e.redacted);

  return {
    packId: randomUUID(),
    generatedAt: new Date().toISOString(),
    requestType: options.requestType,
    requestId: options.requestId,
    entries: publicEntries,
    excludedTiers: [...EXCLUDED_FROM_PUBLIC],
    manifest: {
      totalEntries: options.entries.length,
      publicEntries: publicEntries.length,
      redactedEntries: redactedEntries.length,
    },
  };
}

function verifyPublicPack(pack: PublicPack): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check no non-public entries leaked
  for (const entry of pack.entries) {
    if (entry.audience !== PUBLIC_TIER) {
      errors.push(`Non-public entry found: ${entry.entryId} (${entry.audience})`);
    }
  }

  // Check excluded tiers are documented
  if (!pack.excludedTiers.includes('internal')) {
    errors.push('excludedTiers must include internal');
  }
  if (!pack.excludedTiers.includes('county')) {
    errors.push('excludedTiers must include county');
  }
  if (!pack.excludedTiers.includes('state')) {
    errors.push('excludedTiers must include state');
  }

  // Warn about redacted entries
  if (pack.manifest.redactedEntries > 0) {
    warnings.push(`Pack contains ${pack.manifest.redactedEntries} redacted entries`);
  }

  // Verify manifest counts
  if (pack.manifest.publicEntries !== pack.entries.length) {
    errors.push('Manifest publicEntries count mismatch');
  }

  return {
    ok: errors.length === 0,
    packId: pack.packId,
    entriesVerified: pack.entries.length,
    errors,
    warnings,
  };
}

function createDisclosureRecord(pack: PublicPack, generatedBy: string): DisclosureRecord {
  const auditTrailHash = createHash('sha256')
    .update(JSON.stringify({ packId: pack.packId, generatedAt: pack.generatedAt }))
    .digest('hex');

  return {
    disclosureId: randomUUID(),
    packId: pack.packId,
    requestType: pack.requestType,
    requestId: pack.requestId,
    generatedAt: pack.generatedAt,
    generatedBy,
    auditTrailHash,
  };
}

function assertNoSensitiveData(pack: PublicPack): void {
  for (const entry of pack.entries) {
    if (entry.audience !== PUBLIC_TIER) {
      throw new Error(`Sensitive data leak: ${entry.entryId} is ${entry.audience}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Public Pack Generation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Public Pack Generation', () => {
  it('generates pack with only public entries', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    assert.ok(pack.entries.every(e => e.audience === 'public'));
  });

  it('excludes internal entries', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    assert.ok(!pack.entries.some(e => e.audience === 'internal'));
  });

  it('excludes county entries', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    assert.ok(!pack.entries.some(e => e.audience === 'county'));
  });

  it('excludes state entries', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    assert.ok(!pack.entries.some(e => e.audience === 'state'));
  });

  it('documents excluded tiers', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    assert.ok(pack.excludedTiers.includes('internal'));
    assert.ok(pack.excludedTiers.includes('county'));
    assert.ok(pack.excludedTiers.includes('state'));
  });

  it('includes redacted public entries', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    // Entry 6 is public but redacted
    assert.ok(pack.entries.some(e => e.redacted));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Public Pack Manifest
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Public Pack Manifest', () => {
  it('manifest shows total entry count', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    assert.strictEqual(pack.manifest.totalEntries, allEntries.length);
  });

  it('manifest shows public entry count', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    // 3 public entries in mock data
    assert.strictEqual(pack.manifest.publicEntries, 3);
  });

  it('manifest shows redacted entry count', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    // 1 redacted public entry in mock data (entry 6)
    assert.strictEqual(pack.manifest.redactedEntries, 1);
  });

  it('manifest counts match actual entries', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    assert.strictEqual(pack.manifest.publicEntries, pack.entries.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Public Pack Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Public Pack Verification', () => {
  it('verifier passes on valid public pack', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    const result = verifyPublicPack(pack);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('verifier fails if non-public entry present', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    // Inject a non-public entry
    const tamperedPack: PublicPack = {
      ...pack,
      entries: [
        ...pack.entries,
        { entryId: 'bad', audience: 'internal', contentHash: 'badhash', redacted: false },
      ],
    };

    const result = verifyPublicPack(tamperedPack);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('Non-public entry')));
  });

  it('verifier warns about redacted entries', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    const result = verifyPublicPack(pack);
    assert.ok(result.warnings.some(w => w.includes('redacted')));
  });

  it('verifier counts entries verified', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    const result = verifyPublicPack(pack);
    assert.strictEqual(result.entriesVerified, pack.entries.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Disclosure Record
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Disclosure Record', () => {
  it('creates disclosure record for pack', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
      requestId: 'FOIA-2025-001',
    });

    const record = createDisclosureRecord(pack, 'operator-1');
    assert.ok(record.disclosureId);
    assert.strictEqual(record.packId, pack.packId);
    assert.strictEqual(record.requestType, 'FOIA');
    assert.strictEqual(record.requestId, 'FOIA-2025-001');
  });

  it('disclosure record includes audit trail hash', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'PublicRecords',
    });

    const record = createDisclosureRecord(pack, 'operator-1');
    assert.ok(record.auditTrailHash);
    assert.strictEqual(record.auditTrailHash.length, 64);
  });

  it('disclosure record captures operator', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    const record = createDisclosureRecord(pack, 'foia-coordinator');
    assert.strictEqual(record.generatedBy, 'foia-coordinator');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Request Types
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Request Types', () => {
  it('supports FOIA request type', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    assert.strictEqual(pack.requestType, 'FOIA');
  });

  it('supports PublicRecords request type', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'PublicRecords',
    });

    assert.strictEqual(pack.requestType, 'PublicRecords');
  });

  it('supports OpenData request type', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'OpenData',
    });

    assert.strictEqual(pack.requestType, 'OpenData');
  });

  it('tracks request ID when provided', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
      requestId: 'FOIA-2025-042',
    });

    assert.strictEqual(pack.requestId, 'FOIA-2025-042');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Absence Assertions
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Absence Assertions', () => {
  it('assertNoSensitiveData passes on valid pack', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    assert.doesNotThrow(() => assertNoSensitiveData(pack));
  });

  it('assertNoSensitiveData throws on tampered pack', () => {
    const pack = generatePublicPack({
      entries: createMockCasefileEntries(),
      requestType: 'FOIA',
    });

    const tamperedPack: PublicPack = {
      ...pack,
      entries: [
        ...pack.entries,
        { entryId: 'leak', audience: 'internal', contentHash: 'leaked', redacted: false },
      ],
    };

    assert.throws(() => assertNoSensitiveData(tamperedPack), /Sensitive data leak/);
  });

  it('no internal data in generated pack', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    const internalEntries = pack.entries.filter(e => e.audience === 'internal');
    assert.strictEqual(internalEntries.length, 0);
  });

  it('no county data in generated pack', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    const countyEntries = pack.entries.filter(e => e.audience === 'county');
    assert.strictEqual(countyEntries.length, 0);
  });

  it('no state data in generated pack', () => {
    const allEntries = createMockCasefileEntries();
    const pack = generatePublicPack({
      entries: allEntries,
      requestType: 'FOIA',
    });

    const stateEntries = pack.entries.filter(e => e.audience === 'state');
    assert.strictEqual(stateEntries.length, 0);
  });
});
