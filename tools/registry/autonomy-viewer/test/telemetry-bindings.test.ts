/**
 * Phase 4N45c – Telemetry Bindings Contract Tests
 * ================================================
 *
 * TDD-first tests for cryptographic bindings:
 *   - Events include ledger head anchor when available
 *   - Events include signer epoch and revocation state
 *   - Bindings are immutable and verifiable
 *
 * @module telemetry-bindings.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    bindToLedgerHead,
    bindToSignerEpoch,
    createTelemetryEvent,
    type LedgerHeadBinding,
    type SignerEpochBinding,
    verifyBinding
} from '../src/telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Ledger Head Bindings
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Ledger Head Bindings', () => {
  it('bindToLedgerHead attaches ledger anchor', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-ledger',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const binding: LedgerHeadBinding = {
      ledgerHeadSha256: 'sha256:ledger123abc',
      releaseTag: 'v1.0.0',
      sequenceNumber: 42,
    };

    const bound = bindToLedgerHead(event, binding);

    assert.strictEqual(bound.ledgerHeadSha256, 'sha256:ledger123abc');
    assert.strictEqual(bound.releaseTag, 'v1.0.0');
    assert.strictEqual(bound.details?.ledgerSequenceNumber, 42);
  });

  it('ledger binding updates eventSha256', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-ledger',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const originalHash = event.eventSha256;

    const bound = bindToLedgerHead(event, {
      ledgerHeadSha256: 'sha256:ledger123',
      releaseTag: 'v1.0.0',
      sequenceNumber: 1,
    });

    assert.notStrictEqual(bound.eventSha256, originalHash);
  });

  it('rollup binding anchors to rollup head', () => {
    const event = createTelemetryEvent({
      eventType: 'rollup_emitted',
      correlationId: 'corr-rollup',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const bound = bindToLedgerHead(event, {
      ledgerHeadSha256: 'sha256:ledger456',
      rollupHeadSha256: 'sha256:rollup789',
      releaseTag: 'rollup/2024-01',
      sequenceNumber: 100,
    });

    assert.strictEqual(bound.ledgerHeadSha256, 'sha256:ledger456');
    assert.strictEqual(bound.rollupHeadSha256, 'sha256:rollup789');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Signer Epoch Bindings
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Signer Epoch Bindings', () => {
  it('bindToSignerEpoch attaches signer context', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-signer',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
    });

    const binding: SignerEpochBinding = {
      signerEpochId: 3,
      signerKeyId: 'sha256:key456',
      signerIdentity: 'ci-bot@github',
    };

    const bound = bindToSignerEpoch(event, binding);

    assert.strictEqual(bound.signerEpochId, 3);
    assert.strictEqual(bound.signerKeyId, 'sha256:key456');
    assert.strictEqual(bound.details?.signerIdentity, 'ci-bot@github');
  });

  it('revocation state is included when signer is revoked', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_verified',
      correlationId: 'corr-revoked',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
    });

    const binding: SignerEpochBinding = {
      signerEpochId: 2,
      signerKeyId: 'sha256:oldkey',
      signerIdentity: 'old-bot@github',
      revocationState: 'revoked',
      revokedAt: '2024-06-01T00:00:00Z',
    };

    const bound = bindToSignerEpoch(event, binding);

    assert.strictEqual(bound.revocationState, 'revoked');
    assert.strictEqual(bound.details?.revokedAt, '2024-06-01T00:00:00Z');
  });

  it('active signer has no revocation state', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-active',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
    });

    const binding: SignerEpochBinding = {
      signerEpochId: 5,
      signerKeyId: 'sha256:activekey',
      signerIdentity: 'active-bot@github',
    };

    const bound = bindToSignerEpoch(event, binding);

    assert.strictEqual(bound.revocationState, undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Binding Verification
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Binding Verification', () => {
  it('verifyBinding confirms ledger head integrity', () => {
    const event = createTelemetryEvent({
      eventType: 'ledger_published',
      correlationId: 'corr-verify',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const bound = bindToLedgerHead(event, {
      ledgerHeadSha256: 'sha256:ledger123',
      releaseTag: 'v1.0.0',
      sequenceNumber: 10,
    });

    const result = verifyBinding(bound, {
      expectedLedgerHead: 'sha256:ledger123',
    });

    assert.strictEqual(result.valid, true);
  });

  it('verifyBinding fails on ledger head mismatch', () => {
    const event = createTelemetryEvent({
      eventType: 'ledger_published',
      correlationId: 'corr-verify',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
    });

    const bound = bindToLedgerHead(event, {
      ledgerHeadSha256: 'sha256:ledger123',
      releaseTag: 'v1.0.0',
      sequenceNumber: 10,
    });

    const result = verifyBinding(bound, {
      expectedLedgerHead: 'sha256:different',
    });

    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('ledger head'));
  });

  it('verifyBinding confirms signer epoch integrity', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-verify',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
    });

    const bound = bindToSignerEpoch(event, {
      signerEpochId: 3,
      signerKeyId: 'sha256:key456',
      signerIdentity: 'bot@github',
    });

    const result = verifyBinding(bound, {
      expectedSignerEpoch: 3,
    });

    assert.strictEqual(result.valid, true);
  });

  it('verifyBinding fails on signer epoch mismatch', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-verify',
      repoIdentity: 'repo',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
    });

    const bound = bindToSignerEpoch(event, {
      signerEpochId: 3,
      signerKeyId: 'sha256:key456',
      signerIdentity: 'bot@github',
    });

    const result = verifyBinding(bound, {
      expectedSignerEpoch: 5, // Mismatch
    });

    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('signer epoch'));
  });
});
