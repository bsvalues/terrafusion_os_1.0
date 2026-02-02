/**
 * Phase 4N45d – DR Loss Scenarios Contract Tests
 * ===============================================
 *
 * TDD-first tests for partial loss handling:
 *   - Missing latest ledger snapshot
 *   - Missing rollup month
 *   - Missing external reports
 *
 * @module dr-loss-scenarios.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { type DRArtifact, handlePartialLoss, reconstituteHead } from '../src/dr-reconstitution.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Missing Ledger Snapshots
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Missing Ledger Snapshots', () => {
  it('selects most recent valid snapshot when latest is missing', () => {
    const artifacts: DRArtifact[] = [
      // Missing ledger-2024-06.json (latest)
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-04.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-04-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-05.json',
        sha256: 'sha256:snap2',
        timestamp: '2024-05-01T00:00:00Z',
        content: { previousHash: 'sha256:snap1', sequenceNumber: 2 },
      },
    ];

    const result = handlePartialLoss({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.recoveredHead?.sha256, 'sha256:snap2');
    assert.strictEqual(result.recoveredHead?.sequenceNumber, 2);
    // Chain is complete (seq 1 → 2), so not partial
    assert.strictEqual(result.partialRecovery, false);
  });

  it('reports missing snapshot in warnings', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-04.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-04-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
      // Gap: snapshot 2 is missing
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap3',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: 'sha256:snap2', sequenceNumber: 3 },
      },
    ];

    const result = handlePartialLoss({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, true);
    assert.ok(result.warnings?.some(w => w.includes('missing') || w.includes('gap')));
    assert.ok(result.missingArtifacts?.length > 0);
  });

  it('fails when no valid snapshots available', () => {
    const artifacts: DRArtifact[] = [];

    const result = handlePartialLoss({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DR_INSUFFICIENT_ASSETS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Missing Rollup Months
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Missing Rollup Months', () => {
  it('falls back to previous rollup when latest month missing', () => {
    const artifacts: DRArtifact[] = [
      // Missing rollup-2024-05 (latest)
      {
        type: 'rollup',
        path: 'rollup-2024-03.json',
        sha256: 'sha256:roll1',
        timestamp: '2024-03-01T00:00:00Z',
        content: { previousHash: null, month: '2024-03' },
      },
      {
        type: 'rollup',
        path: 'rollup-2024-04.json',
        sha256: 'sha256:roll2',
        timestamp: '2024-04-01T00:00:00Z',
        content: { previousHash: 'sha256:roll1', month: '2024-04' },
      },
    ];

    const result = handlePartialLoss({ artifacts, headType: 'rollup' });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.recoveredHead?.sha256, 'sha256:roll2');
    // Chain is complete (2024-03 → 2024-04), so not partial
    assert.strictEqual(result.partialRecovery, false);
  });

  it('reports rollup chain gap in warnings', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'rollup',
        path: 'rollup-2024-03.json',
        sha256: 'sha256:roll1',
        timestamp: '2024-03-01T00:00:00Z',
        content: { previousHash: null, month: '2024-03' },
      },
      // Gap: 2024-04 missing
      {
        type: 'rollup',
        path: 'rollup-2024-05.json',
        sha256: 'sha256:roll3',
        timestamp: '2024-05-01T00:00:00Z',
        content: { previousHash: 'sha256:roll2', month: '2024-05' },
      },
    ];

    const result = handlePartialLoss({ artifacts, headType: 'rollup' });

    assert.strictEqual(result.ok, true);
    assert.ok(result.warnings?.some(w => w.includes('2024-04') || w.includes('gap')));
  });

  it('handles empty rollup history gracefully', () => {
    const artifacts: DRArtifact[] = [];

    const result = handlePartialLoss({ artifacts, headType: 'rollup' });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DR_INSUFFICIENT_ASSETS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Missing External Reports
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Missing External Reports', () => {
  it('does not block head rebuild when reports missing', () => {
    const artifacts: DRArtifact[] = [
      // No verification reports
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-05.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-05-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap2',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: 'sha256:snap1', sequenceNumber: 2 },
      },
    ];

    const result = reconstituteHead({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.rebuiltHead?.sha256, 'sha256:snap2');
  });

  it('reports missing external reports in warnings', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
      // No verification reports for this release
    ];

    const result = handlePartialLoss({
      artifacts,
      headType: 'ledger',
      expectVerificationReports: true,
    });

    assert.strictEqual(result.ok, true);
    assert.ok(result.warnings?.some(w => w.includes('verification') || w.includes('report')));
  });

  it('includes missing report paths in result', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
    ];

    const result = handlePartialLoss({
      artifacts,
      headType: 'ledger',
      expectVerificationReports: true,
      expectedReportPaths: ['verify-2024-06.json'],
    });

    assert.ok(result.missingArtifacts?.includes('verify-2024-06.json'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Multi-Channel Recovery
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Multi-Channel Recovery', () => {
  it('recovers from release assets', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-head',
        path: 'ledger-head.json',
        sha256: 'sha256:head1',
        timestamp: '2024-06-01T00:00:00Z',
        source: 'github-release',
      },
    ];

    const result = reconstituteHead({
      artifacts,
      headType: 'ledger',
      preferSource: 'github-release',
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.headSource, 'existing');
  });

  it('recovers from air-gap pack artifacts', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'public-pack',
        path: 'airgap-pack-v1.0.0.tar.gz',
        sha256: 'sha256:pack1',
        timestamp: '2024-06-01T00:00:00Z',
        source: 'airgap-usb',
        content: { ledgerHeadSha256: 'sha256:head1' },
      },
    ];

    const result = reconstituteHead({
      artifacts,
      headType: 'ledger',
      preferSource: 'airgap-usb',
      preferPublicPack: true,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.headSource, 'public-pack');
  });

  it('recovers head using telemetry logs as fallback', () => {
    const artifacts: DRArtifact[] = [
      // No direct artifacts, but telemetry logs contain head updates
      {
        type: 'telemetry-log',
        path: 'telemetry-2024-06.jsonl',
        sha256: 'sha256:tel1',
        timestamp: '2024-06-01T00:00:00Z',
        source: 'file-sink',
        content: {
          events: [
            {
              eventType: 'ledger_head_updated',
              ledgerHeadSha256: 'sha256:head1',
              sequenceNumber: 3,
            },
          ],
        },
      },
    ];

    const result = reconstituteHead({
      artifacts,
      headType: 'ledger',
      useTelemetryFallback: true,
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.headSource, 'telemetry-log');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Break-Glass Reconstructability
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Break-Glass Reconstructability', () => {
  it('reconstructs break-glass deletion intent', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'deletion-intent',
        path: 'deletion-intent-2024-06-01.json',
        sha256: 'sha256:del1',
        timestamp: '2024-06-01T00:00:00Z',
        content: {
          caseId: 'ARK/2024/001234',
          reason: 'COURT_ORDER',
          deletedAt: '2024-06-01T00:00:00Z',
          authorizedBy: 'admin@terrafusion.gov',
        },
      },
    ];

    const result = handlePartialLoss({
      artifacts,
      headType: 'ledger',
      includeDeletionIntents: true,
    });

    assert.ok(result.deletionIntents);
    assert.strictEqual(result.deletionIntents.length, 1);
    assert.strictEqual(result.deletionIntents[0].caseId, 'ARK/2024/001234');
  });

  it('includes revocation context in recovery', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'revocation-record',
        path: 'revocation-2024-06-01.json',
        sha256: 'sha256:rev1',
        timestamp: '2024-06-01T00:00:00Z',
        content: {
          epochNumber: 2,
          reason: 'Key compromise',
          revokedAt: '2024-06-01T00:00:00Z',
        },
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-06-01T10:00:00Z',
        content: { previousHash: null, sequenceNumber: 1, signerEpochId: 2 },
      },
    ];

    const result = handlePartialLoss({
      artifacts,
      headType: 'ledger',
      includeRevocationContext: true,
    });

    assert.ok(result.revocationContext);
    assert.strictEqual(result.revocationContext.revokedEpochs?.length, 1);
  });
});
