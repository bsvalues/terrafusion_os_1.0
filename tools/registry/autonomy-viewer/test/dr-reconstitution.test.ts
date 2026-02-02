/**
 * Phase 4N45d – DR Reconstitution Contract Tests
 * ===============================================
 *
 * TDD-first tests for disaster recovery reconstitution:
 *   - Head reconstitution from released artifacts only
 *   - Chain validation during rebuild
 *   - Fail-closed on ambiguity
 *
 * @module dr-reconstitution.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createDRReport,
    discoverArtifacts,
    DR_SCHEMA,
    DR_VERSION,
    reconstituteHead,
    validateChain,
    type DRArtifact,
    type DRReconstitutionResult
} from '../src/dr-reconstitution.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Schema
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Schema', () => {
  it('schema matches expected identifier', () => {
    assert.strictEqual(DR_SCHEMA, 'terrafusion.autonomy.dr.v1');
  });

  it('version is 4N45.1', () => {
    assert.strictEqual(DR_VERSION, '4N45.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Artifact Discovery
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Artifact Discovery', () => {
  it('discovers ledger head from artifact bag', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-head',
        path: 'ledger-head.json',
        sha256: 'sha256:head1',
        timestamp: '2024-06-01T00:00:00Z',
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-05.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-05-01T00:00:00Z',
      },
    ];

    const discovered = discoverArtifacts(artifacts);

    assert.strictEqual(discovered.ledgerHead?.sha256, 'sha256:head1');
    assert.strictEqual(discovered.ledgerSnapshots.length, 1);
  });

  it('discovers rollup chain from artifacts', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'rollup',
        path: 'rollup-2024-03.json',
        sha256: 'sha256:roll1',
        timestamp: '2024-03-01T00:00:00Z',
      },
      {
        type: 'rollup',
        path: 'rollup-2024-04.json',
        sha256: 'sha256:roll2',
        timestamp: '2024-04-01T00:00:00Z',
      },
      {
        type: 'rollup-head',
        path: 'rollup-head.json',
        sha256: 'sha256:rollhead',
        timestamp: '2024-04-15T00:00:00Z',
      },
    ];

    const discovered = discoverArtifacts(artifacts);

    assert.strictEqual(discovered.rollupHead?.sha256, 'sha256:rollhead');
    assert.strictEqual(discovered.rollups.length, 2);
  });

  it('discovers verification reports', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'verification-report',
        path: 'verify-2024-06.json',
        sha256: 'sha256:ver1',
        timestamp: '2024-06-01T00:00:00Z',
      },
      {
        type: 'ledger-head',
        path: 'ledger-head.json',
        sha256: 'sha256:head',
        timestamp: '2024-06-01T00:00:00Z',
      },
    ];

    const discovered = discoverArtifacts(artifacts);

    assert.strictEqual(discovered.verificationReports.length, 1);
  });

  it('discovers telemetry logs', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'telemetry-log',
        path: 'telemetry-2024-06.jsonl',
        sha256: 'sha256:tel1',
        timestamp: '2024-06-01T00:00:00Z',
      },
    ];

    const discovered = discoverArtifacts(artifacts);

    assert.strictEqual(discovered.telemetryLogs.length, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Head Reconstitution
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Head Reconstitution', () => {
  it('rebuilds ledger head when missing', () => {
    const artifacts: DRArtifact[] = [
      // No ledger-head, only snapshots
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
    assert.strictEqual(result.rebuiltHead?.sequenceNumber, 2);
    assert.strictEqual(result.headSource, 'reconstructed');
  });

  it('rebuilds rollup head when missing', () => {
    const artifacts: DRArtifact[] = [
      // No rollup-head, only rollups
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

    const result = reconstituteHead({ artifacts, headType: 'rollup' });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.rebuiltHead?.sha256, 'sha256:roll2');
    assert.strictEqual(result.headSource, 'reconstructed');
  });

  it('uses existing head when valid', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'ledger-head',
        path: 'ledger-head.json',
        sha256: 'sha256:head1',
        timestamp: '2024-06-01T00:00:00Z',
        content: { sha256: 'sha256:snap2', sequenceNumber: 2 },
      },
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
    assert.strictEqual(result.headSource, 'existing');
  });

  it('fails closed when multiple candidate heads exist', () => {
    const artifacts: DRArtifact[] = [
      // Fork: two competing heads at same sequence
      {
        type: 'ledger-snapshot',
        path: 'ledger-fork-a.json',
        sha256: 'sha256:snapA',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: 'sha256:snap1', sequenceNumber: 2 },
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-fork-b.json',
        sha256: 'sha256:snapB',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: 'sha256:snap1', sequenceNumber: 2 },
      },
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-05.json',
        sha256: 'sha256:snap1',
        timestamp: '2024-05-01T00:00:00Z',
        content: { previousHash: null, sequenceNumber: 1 },
      },
    ];

    const result = reconstituteHead({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DR_HEAD_AMBIGUOUS');
  });

  it('fails closed when chain break detected during rebuild', () => {
    const artifacts: DRArtifact[] = [
      // Chain break: snap2 claims previous that doesn't exist
      {
        type: 'ledger-snapshot',
        path: 'ledger-2024-06.json',
        sha256: 'sha256:snap2',
        timestamp: '2024-06-01T00:00:00Z',
        content: { previousHash: 'sha256:missing', sequenceNumber: 2 },
      },
    ];

    const result = reconstituteHead({ artifacts, headType: 'ledger' });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errorCode, 'DR_CHAIN_BROKEN');
  });

  it('rebuilds using public pack where possible', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'public-pack',
        path: 'public-pack-v1.0.0.tar.gz',
        sha256: 'sha256:pack1',
        timestamp: '2024-06-01T00:00:00Z',
        content: { releaseTag: 'v1.0.0', ledgerHeadSha256: 'sha256:head1' },
      },
    ];

    const result = reconstituteHead({ artifacts, headType: 'ledger', preferPublicPack: true });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.headSource, 'public-pack');
  });

  it('requires internal pack for restricted history', () => {
    const artifacts: DRArtifact[] = [
      {
        type: 'internal-pack',
        path: 'internal-pack-v1.0.0.tar.gz',
        sha256: 'sha256:pack1',
        timestamp: '2024-06-01T00:00:00Z',
        content: { audience: 'internal', ledgerHeadSha256: 'sha256:head1' },
      },
    ];

    const result = reconstituteHead({ artifacts, headType: 'ledger', requireInternalPack: true });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.headSource, 'internal-pack');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – Chain Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – Chain Validation', () => {
  it('validates complete chain', () => {
    const chain = [
      { sha256: 'sha256:snap1', previousHash: null, sequenceNumber: 1 },
      { sha256: 'sha256:snap2', previousHash: 'sha256:snap1', sequenceNumber: 2 },
      { sha256: 'sha256:snap3', previousHash: 'sha256:snap2', sequenceNumber: 3 },
    ];

    const result = validateChain(chain);

    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.chainLength, 3);
  });

  it('detects broken chain link', () => {
    const chain = [
      { sha256: 'sha256:snap1', previousHash: null, sequenceNumber: 1 },
      { sha256: 'sha256:snap3', previousHash: 'sha256:missing', sequenceNumber: 3 }, // Broken
    ];

    const result = validateChain(chain);

    assert.strictEqual(result.valid, false);
    assert.ok(result.brokenLinks?.includes('sha256:missing'));
  });

  it('detects sequence gap', () => {
    const chain = [
      { sha256: 'sha256:snap1', previousHash: null, sequenceNumber: 1 },
      { sha256: 'sha256:snap3', previousHash: 'sha256:snap1', sequenceNumber: 3 }, // Gap at 2
    ];

    const result = validateChain(chain);

    assert.strictEqual(result.valid, false);
    assert.ok(result.gaps?.includes(2));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45d – DR Report
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45d – DR Report', () => {
  it('creates reconstitution report with rebuilt head', () => {
    const result: DRReconstitutionResult = {
      ok: true,
      rebuiltHead: { sha256: 'sha256:head1', sequenceNumber: 3 },
      headSource: 'reconstructed',
      artifacts: [],
      missingArtifacts: [],
      warnings: [],
    };

    const report = createDRReport({
      result,
      repoIdentity: 'github.com/terrafusion/os',
      correlationId: 'dr-123',
    });

    assert.strictEqual(report.$schema, DR_SCHEMA);
    assert.strictEqual(report.outcome, 'SUCCESS');
    assert.strictEqual(report.rebuiltHeadSha256, 'sha256:head1');
  });

  it('report includes missing artifacts list', () => {
    const result: DRReconstitutionResult = {
      ok: true,
      rebuiltHead: { sha256: 'sha256:head1', sequenceNumber: 2 },
      headSource: 'reconstructed',
      artifacts: [],
      missingArtifacts: ['ledger-2024-05.json', 'rollup-2024-04.json'],
      warnings: ['Partial history recovered'],
    };

    const report = createDRReport({
      result,
      repoIdentity: 'github.com/terrafusion/os',
      correlationId: 'dr-456',
    });

    assert.deepStrictEqual(report.missingArtifacts, ['ledger-2024-05.json', 'rollup-2024-04.json']);
    assert.ok(report.warnings.includes('Partial history recovered'));
  });

  it('report includes error code on failure', () => {
    const result: DRReconstitutionResult = {
      ok: false,
      errorCode: 'DR_CHAIN_BROKEN',
      errorMessage: 'Chain break at sha256:missing',
      artifacts: [],
      missingArtifacts: [],
      warnings: [],
    };

    const report = createDRReport({
      result,
      repoIdentity: 'github.com/terrafusion/os',
      correlationId: 'dr-789',
    });

    assert.strictEqual(report.outcome, 'FAILURE');
    assert.strictEqual(report.errorCode, 'DR_CHAIN_BROKEN');
  });

  it('report is hashable for signing', () => {
    const result: DRReconstitutionResult = {
      ok: true,
      rebuiltHead: { sha256: 'sha256:head1', sequenceNumber: 1 },
      headSource: 'reconstructed',
      artifacts: [],
      missingArtifacts: [],
      warnings: [],
    };

    const report = createDRReport({
      result,
      repoIdentity: 'github.com/terrafusion/os',
      correlationId: 'dr-sign',
    });

    assert.ok(report.reportSha256);
    assert.ok(report.reportSha256.startsWith('sha256:'));
  });
});
