/**
 * Phase 4N45c – Telemetry Safety Contract Tests
 * ==============================================
 *
 * TDD-first tests for telemetry PII safety:
 *   - No PII fields present in events
 *   - Redaction events contain only hashes and reason codes
 *   - Sensitive data is never exposed
 *
 * @module telemetry-safety.test
 * @version 4N45.1
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    PII_FIELD_PATTERNS,
    createRedactionEvent,
    createTelemetryEvent,
    validateNoPii
} from '../src/telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – PII Safety
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – PII Safety', () => {
  it('PII field patterns are defined', () => {
    // Patterns that would indicate PII (should not appear in events)
    const expectedPatterns = [
      'email',
      'phone',
      'ssn',
      'password',
      'secret',
      'token',
      'apiKey',
      'privateKey',
      'creditCard',
      'address',
    ];

    for (const pattern of expectedPatterns) {
      assert.ok(
        PII_FIELD_PATTERNS.some(p => p.test(pattern)),
        `Expected PII pattern to match "${pattern}"`
      );
    }
  });

  it('validateNoPii passes for clean event', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, true);
    assert.deepStrictEqual(result.violations, []);
  });

  it('validateNoPii detects email-like content in details', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      details: {
        userEmail: 'user@example.com', // PII leak!
      },
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, false);
    assert.ok(result.violations.some((v: string) => v.includes('userEmail')));
  });

  it('validateNoPii detects SSN patterns', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_generated',
      correlationId: 'corr-123',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      details: {
        socialSecurityNumber: '123-45-6789', // PII leak!
      },
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, false);
  });

  it('validateNoPii allows hash values', () => {
    const event = createTelemetryEvent({
      eventType: 'redaction_applied',
      correlationId: 'corr-123',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      details: {
        redactedContentHash: 'sha256:abc123def456', // OK - hash, not content
        reasonCode: 'PII_SSN_DETECTED', // OK - code, not data
      },
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – Redaction Event Safety
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – Redaction Event Safety', () => {
  it('createRedactionEvent includes only hash and reason code', () => {
    const event = createRedactionEvent({
      correlationId: 'corr-redact',
      repoIdentity: 'github.com/terrafusion/os',
      casefileSha256: 'sha256:casefile123',
      redactedContentHash: 'sha256:redacted456',
      reasonCode: 'PII_EMAIL_DETECTED',
      fieldPath: 'owner.contact',
    });

    // Verify structure
    assert.strictEqual(event.eventType, 'redaction_applied');
    assert.ok(event.details);
    assert.strictEqual(event.details.redactedContentHash, 'sha256:redacted456');
    assert.strictEqual(event.details.reasonCode, 'PII_EMAIL_DETECTED');
    assert.strictEqual(event.details.fieldPath, 'owner.contact');

    // Verify no raw content
    assert.ok(!event.details.rawContent);
    assert.ok(!event.details.extractedValue);
    assert.ok(!event.details.originalText);
  });

  it('redaction event passes PII check', () => {
    const event = createRedactionEvent({
      correlationId: 'corr-redact',
      repoIdentity: 'github.com/terrafusion/os',
      casefileSha256: 'sha256:casefile123',
      redactedContentHash: 'sha256:redacted456',
      reasonCode: 'PII_SSN_DETECTED',
      fieldPath: 'applicant.ssn',
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, true);
  });

  it('redaction event includes proof digest', () => {
    const event = createRedactionEvent({
      correlationId: 'corr-redact',
      repoIdentity: 'github.com/terrafusion/os',
      casefileSha256: 'sha256:casefile123',
      redactedContentHash: 'sha256:redacted456',
      reasonCode: 'PII_PHONE_DETECTED',
      fieldPath: 'contact.phone',
      proofDigest: 'sha256:proof789', // Proof that redaction was applied
    });

    assert.strictEqual(event.details?.proofDigest, 'sha256:proof789');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N45c – No Secrets in Events
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N45c – No Secrets in Events', () => {
  it('private keys are never included', () => {
    const event = createTelemetryEvent({
      eventType: 'signer_epoch_created',
      correlationId: 'corr-signer',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      signerEpochId: 1,
      signerKeyId: 'sha256:pubkey123', // Public key fingerprint only
      details: {
        privateKey: '-----BEGIN PRIVATE KEY-----...', // Attempt to leak
      },
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, false);
    assert.ok(result.violations.some((v: string) => v.includes('privateKey')));
  });

  it('tokens and secrets are never included', () => {
    const event = createTelemetryEvent({
      eventType: 'casefile_signed',
      correlationId: 'corr-sign',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      casefileSha256: 'sha256:case123',
      signerEpochId: 1,
      details: {
        apiToken: 'ghp_xxxxxxxxxxxxxxxxxxxx', // Attempt to leak
      },
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, false);
  });

  it('only fingerprints and hashes are allowed for keys', () => {
    const event = createTelemetryEvent({
      eventType: 'signer_epoch_created',
      correlationId: 'corr-signer',
      repoIdentity: 'github.com/terrafusion/os',
      outcome: 'SUCCESS',
      signerEpochId: 1,
      signerKeyId: 'sha256:abc123def456', // Fingerprint only
    });

    const result = validateNoPii(event);
    assert.strictEqual(result.safe, true);
  });
});
