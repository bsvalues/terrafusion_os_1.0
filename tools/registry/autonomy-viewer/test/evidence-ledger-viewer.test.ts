/**
 * Evidence Ledger Viewer Contract Tests (Phase 4N10)
 *
 * These tests validate the static ledger viewer that shows all evidence
 * records across runs. This is the "front door" for County CIO / auditors.
 *
 * CONTRACTS:
 * - Deterministic output (same input → identical HTML)
 * - Renders incident entries with proper tier badge
 * - Shows verify command with correct bundle name
 * - Shows manifest SHA256 untruncated
 * - Sort order: tier priority → date desc → bundleName lex
 * - Offline-capable (embedded CSS, minimal JS)
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import type { EvidenceIndex, EvidenceRecord } from '../src/evidence-index.js';
import {
    buildLedgerEntries,
    buildLedgerViewModel,
    generateLedgerHtml,
} from '../src/evidence-ledger-viewer.js';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockRecord(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    recordId: 'run-12345-planItem-perf-001',
    status: 'applied',
    planItemId: 'perf-001',
    strategyId: 'inline-const',
    finalCommitSha: 'abc123def456',
    bundle: {
      name: 'autonomy-evidence-12345.zip',
      manifestSha256: 'a'.repeat(64),
      verify: {
        ok: true,
        strict: true,
      },
    },
    artifacts: {},
    rollback: {
      command: 'pnpm perf:rollback --proof perf-001',
      preview: 'pnpm perf:rollback --proof perf-001 --dry-run',
    },
    retention: {
      days: 90,
      policy: 'autonomy-evidence-retention.v1',
      tier: 'ci' as const,
    },
    ...overrides,
  };
}

function createMockIndex(overrides: Partial<EvidenceIndex> = {}): EvidenceIndex {
  return {
    schema: 'terrafusion.autonomy.evidence.index.v1',
    generatedAt: '2026-01-31T12:00:00.000Z',
    source: {
      workflow: 'autonomy-pr-lane',
      runId: '12345',
      repo: 'terrafusion/os',
      ref: 'refs/heads/main',
    },
    records: [createMockRecord()],
    ...overrides,
  };
}

function createMockIncidentIndex(): EvidenceIndex {
  return {
    schema: 'terrafusion.autonomy.evidence.index.v1',
    generatedAt: '2026-01-31T14:00:00.000Z',
    source: {
      workflow: 'autonomy-incident-publisher',
      runId: '67890',
      repo: 'terrafusion/os',
      ref: 'refs/heads/main',
    },
    records: [
      createMockRecord({
        recordId: 'run-67890-planItem-perf-002',
        bundle: {
          name: 'autonomy-incident-pr42-67890.zip',
          manifestSha256: 'b'.repeat(64),
          verify: { ok: true, strict: true },
        },
        retention: {
          days: 2555,
          policy: 'autonomy-evidence-retention.v1',
          tier: 'incident' as const,
        },
      }),
    ],
    incident: true,
    incidentSource: {
      pr: 42,
      mergedAt: '2026-01-31T13:00:00.000Z',
    },
    releaseTag: 'autonomy-incident/2026',
  };
}

function createMockMergedIndex(): EvidenceIndex {
  return {
    schema: 'terrafusion.autonomy.evidence.index.v1',
    generatedAt: '2026-01-31T10:00:00.000Z',
    source: {
      workflow: 'autonomy-evidence-publisher',
      runId: '11111',
      repo: 'terrafusion/os',
      ref: 'refs/heads/main',
    },
    records: [
      createMockRecord({
        recordId: 'run-11111-planItem-perf-003',
        bundle: {
          name: 'autonomy-evidence-11111.zip',
          manifestSha256: 'c'.repeat(64),
          verify: { ok: true, strict: true },
        },
        retention: {
          days: 365,
          policy: 'autonomy-evidence-retention.v1',
          tier: 'merged' as const,
        },
      }),
    ],
    releaseTag: 'autonomy-evidence/2026-01',
  };
}

function createDefaultViewerOptions() {
  return {
    inputPath: './test-input',
    outputPath: './test-output.html',
    title: 'Test Evidence Ledger',
    releaseBaseUrl: '',
    verbose: false,
  };
}

// =============================================================================
// Contract: Ledger Entry Building
// =============================================================================

describe('Ledger Viewer: Entry Building Contracts', () => {
  it('should build entries from index records', () => {
    const indices = [createMockIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries.length, 1, 'should have one entry');
    assert.strictEqual(entries[0].runId, '12345');
    assert.strictEqual(entries[0].bundleName, 'autonomy-evidence-12345.zip');
  });

  it('should detect ci tier from record', () => {
    const indices = [createMockIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].tier, 'ci');
  });

  it('should detect merged tier from record', () => {
    const indices = [createMockMergedIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].tier, 'merged');
  });

  it('should detect incident tier from index flag', () => {
    const indices = [createMockIncidentIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].tier, 'incident');
    assert.strictEqual(entries[0].incident, true);
    assert.strictEqual(entries[0].incidentPr, 42);
  });

  it('should use explicit releaseTag from index', () => {
    const indices = [createMockIncidentIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].releaseTag, 'autonomy-incident/2026');
  });

  it('should derive releaseTag for merged tier', () => {
    const indices = [createMockMergedIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].releaseTag, 'autonomy-evidence/2026-01');
  });

  it('should generate verify command with bundle name', () => {
    const indices = [createMockIndex()];
    const entries = buildLedgerEntries(indices);

    assert.ok(
      entries[0].verifyCommand.includes('autonomy-evidence-12345.zip'),
      'verify command must include bundle name'
    );
    assert.ok(
      entries[0].verifyCommand.includes('--strict'),
      'verify command must include --strict'
    );
  });
});

// =============================================================================
// Contract: Sort Order
// =============================================================================

describe('Ledger Viewer: Sort Order Contracts', () => {
  it('should sort by tier priority (incident > merged > ci)', () => {
    const indices = [createMockIndex(), createMockMergedIndex(), createMockIncidentIndex()];
    const entries = buildLedgerEntries(indices);

    assert.strictEqual(entries[0].tier, 'incident', 'incident should be first');
    assert.strictEqual(entries[1].tier, 'merged', 'merged should be second');
    assert.strictEqual(entries[2].tier, 'ci', 'ci should be last');
  });

  it('should sort by date descending within same tier', () => {
    const olderIndex = createMockIndex();
    olderIndex.generatedAt = '2026-01-30T12:00:00.000Z';
    olderIndex.source.runId = 'older';
    olderIndex.records[0].recordId = 'run-older-item';

    const newerIndex = createMockIndex();
    newerIndex.generatedAt = '2026-01-31T12:00:00.000Z';
    newerIndex.source.runId = 'newer';
    newerIndex.records[0].recordId = 'run-newer-item';

    const entries = buildLedgerEntries([olderIndex, newerIndex]);

    assert.strictEqual(entries[0].runId, 'newer', 'newer should be first');
    assert.strictEqual(entries[1].runId, 'older', 'older should be second');
  });

  it('should sort by bundle name lexicographically for same tier and date', () => {
    const indexA = createMockIndex();
    indexA.records[0].bundle.name = 'bundle-aaa.zip';

    const indexB = createMockIndex();
    indexB.records[0].bundle.name = 'bundle-zzz.zip';

    const entries = buildLedgerEntries([indexB, indexA]);

    assert.strictEqual(entries[0].bundleName, 'bundle-aaa.zip', 'aaa should be first');
    assert.strictEqual(entries[1].bundleName, 'bundle-zzz.zip', 'zzz should be second');
  });
});

// =============================================================================
// Contract: View Model Building
// =============================================================================

describe('Ledger Viewer: View Model Contracts', () => {
  it('should calculate summary counts correctly', () => {
    const indices = [createMockIndex(), createMockMergedIndex(), createMockIncidentIndex()];
    const entries = buildLedgerEntries(indices);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());

    assert.strictEqual(vm.summary.total, 3);
    assert.strictEqual(vm.summary.byTier.ci, 1);
    assert.strictEqual(vm.summary.byTier.merged, 1);
    assert.strictEqual(vm.summary.byTier.incident, 1);
  });

  it('should count verified and failed entries', () => {
    const failedIndex = createMockIndex();
    failedIndex.records[0].bundle.verify.ok = false;

    const entries = buildLedgerEntries([createMockIndex(), failedIndex]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());

    assert.strictEqual(vm.summary.verifiedCount, 1);
    assert.strictEqual(vm.summary.failedCount, 1);
  });

  it('should include schema version', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());

    assert.strictEqual(vm.schema, 'terrafusion.autonomy.evidence.index.v1');
  });

  it('should include title from options', () => {
    const opts = createDefaultViewerOptions();
    opts.title = 'Custom Ledger Title';

    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, opts);

    assert.strictEqual(vm.title, 'Custom Ledger Title');
  });
});

// =============================================================================
// Contract: HTML Generation
// =============================================================================

describe('Ledger Viewer: HTML Generation Contracts', () => {
  it('should generate valid HTML document', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.startsWith('<!DOCTYPE html>'), 'must start with doctype');
    assert.ok(html.includes('<html'), 'must contain html tag');
    assert.ok(html.includes('</html>'), 'must close html tag');
  });

  it('should embed CSS (no external stylesheets)', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('<style>'), 'must contain inline style tag');
    assert.ok(!html.includes('stylesheet'), 'must not reference external stylesheet');
  });

  it('should include page title', () => {
    const opts = createDefaultViewerOptions();
    opts.title = 'My Ledger Title';

    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, opts);
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('<title>My Ledger Title</title>'), 'must include title in head');
    assert.ok(html.includes('My Ledger Title'), 'must include title in body');
  });

  it('should show manifest SHA256 untruncated', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    const fullSha = 'a'.repeat(64);
    assert.ok(html.includes(fullSha), 'must include full SHA256 (64 chars)');
  });

  it('should show verify command in instructions', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('pnpm perf:verify-bundle'), 'must include verify command');
    assert.ok(html.includes('--strict'), 'must include --strict flag');
  });

  it('should render incident tier with red/error badge', () => {
    const entries = buildLedgerEntries([createMockIncidentIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('badge-error'), 'must use error badge class for incident');
    assert.ok(html.includes('Incident (7y)'), 'must show incident tier label');
  });

  it('should render merged tier with warning badge', () => {
    const entries = buildLedgerEntries([createMockMergedIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('badge-warning'), 'must use warning badge class for merged');
    assert.ok(html.includes('Merged (1y)'), 'must show merged tier label');
  });

  it('should render ci tier with muted badge', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('badge-muted'), 'must use muted badge class for ci');
    assert.ok(html.includes('CI (90d)'), 'must show ci tier label');
  });

  it('should include PR number for incident entries', () => {
    const entries = buildLedgerEntries([createMockIncidentIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('PR #42'), 'must include incident PR number');
  });

  it('should show verification status with checkmark for verified', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('✓ Verified'), 'must show verified checkmark');
    assert.ok(html.includes('verify-ok'), 'must use verify-ok class');
  });

  it('should show verification status with X for failed', () => {
    const failedIndex = createMockIndex();
    failedIndex.records[0].bundle.verify.ok = false;

    const entries = buildLedgerEntries([failedIndex]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('✗ Failed'), 'must show failed X');
    assert.ok(html.includes('verify-fail'), 'must use verify-fail class');
  });
});

// =============================================================================
// Contract: Deterministic Output
// =============================================================================

describe('Ledger Viewer: Determinism Contracts', () => {
  it('should produce identical HTML for same input', () => {
    const indices = [createMockIndex(), createMockMergedIndex()];
    const opts = createDefaultViewerOptions();

    const entries1 = buildLedgerEntries(indices);
    const vm1 = buildLedgerViewModel(entries1, opts);
    // Override generatedAt for determinism test
    vm1.generatedAt = '2026-01-31T15:00:00.000Z';
    const html1 = generateLedgerHtml(vm1);

    const entries2 = buildLedgerEntries(indices);
    const vm2 = buildLedgerViewModel(entries2, opts);
    vm2.generatedAt = '2026-01-31T15:00:00.000Z';
    const html2 = generateLedgerHtml(vm2);

    assert.strictEqual(html1, html2, 'same input must produce identical HTML');
  });

  it('should maintain stable sort order', () => {
    const indices = [createMockIndex(), createMockMergedIndex(), createMockIncidentIndex()];

    // Run multiple times
    for (let i = 0; i < 5; i++) {
      const entries = buildLedgerEntries(indices);
      assert.strictEqual(entries[0].tier, 'incident');
      assert.strictEqual(entries[1].tier, 'merged');
      assert.strictEqual(entries[2].tier, 'ci');
    }
  });
});

// =============================================================================
// Contract: Filter Functionality
// =============================================================================

describe('Ledger Viewer: Filter Contracts', () => {
  it('should include filter buttons in HTML', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('filter-btn'), 'must include filter buttons');
    assert.ok(html.includes('Incident'), 'must have incident filter');
    assert.ok(html.includes('Merged'), 'must have merged filter');
    assert.ok(html.includes('CI'), 'must have ci filter');
    assert.ok(html.includes('Verified'), 'must have verified filter');
    assert.ok(html.includes('Signed'), 'must have signed filter');
  });

  it('should include data attributes for filtering', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('data-tier="ci"'), 'must include tier data attribute');
    assert.ok(html.includes('data-verify="true"'), 'must include verify data attribute');
  });
});

// =============================================================================
// Contract: Summary Cards
// =============================================================================

describe('Ledger Viewer: Summary Contracts', () => {
  it('should display total record count', () => {
    const indices = [createMockIndex(), createMockMergedIndex()];
    const entries = buildLedgerEntries(indices);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('>2<'), 'must show total count of 2');
    assert.ok(html.includes('>Total<'), 'must label total records');
  });

  it('should display tier breakdown', () => {
    const entries = buildLedgerEntries([
      createMockIndex(),
      createMockMergedIndex(),
      createMockIncidentIndex(),
    ]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('Incident (7y)'), 'must show incident count');
    assert.ok(html.includes('Merged (1y)'), 'must show merged count');
    assert.ok(html.includes('CI (90d)'), 'must show ci count');
  });
});

// =============================================================================
// Contract: Offline Capability
// =============================================================================

describe('Ledger Viewer: Offline Contracts', () => {
  it('should not require external resources', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    // Check for no external links
    assert.ok(!html.includes('href="http'), 'must not have http links');
    assert.ok(!html.includes('href="https'), 'must not have https links');
    assert.ok(!html.includes('src="http'), 'must not have http src');
    assert.ok(!html.includes('src="https'), 'must not have https src');
  });

  it('should include offline notice in footer', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.ok(html.includes('offline-capable'), 'must mention offline capability');
  });

  it('should function without JavaScript (core content visible)', () => {
    const entries = buildLedgerEntries([createMockIndex()]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    // All table rows are visible by default (display not set to none)
    assert.ok(!html.includes('display: none'), 'rows must be visible by default');
  });
});

// =============================================================================
// Contract: Empty State
// =============================================================================

describe('Ledger Viewer: Empty State Contracts', () => {
  it('should handle empty input gracefully', () => {
    const entries = buildLedgerEntries([]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());
    const html = generateLedgerHtml(vm);

    assert.strictEqual(vm.summary.total, 0);
    assert.ok(html.includes('<!DOCTYPE html>'), 'must still produce valid HTML');
  });

  it('should show zero counts when empty', () => {
    const entries = buildLedgerEntries([]);
    const vm = buildLedgerViewModel(entries, createDefaultViewerOptions());

    assert.strictEqual(vm.summary.byTier.ci, 0);
    assert.strictEqual(vm.summary.byTier.merged, 0);
    assert.strictEqual(vm.summary.byTier.incident, 0);
    assert.strictEqual(vm.summary.verifiedCount, 0);
    assert.strictEqual(vm.summary.failedCount, 0);
  });
});
