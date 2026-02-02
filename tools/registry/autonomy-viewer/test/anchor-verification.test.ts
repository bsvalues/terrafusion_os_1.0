/**
 * Phase 4N38 – Two-Channel Anchoring Contract Tests
 * ==================================================
 *
 * Tests for defense-in-depth anchor verification.
 *
 * Test Groups:
 *   1. computeAnchors() - Anchor computation
 *   2. verifyAnchors() - Tier-based verification
 *   3. getAnchorBadge() - Badge generation
 *   4. Tier requirements - CI/merged/incident
 *   5. Determinism - Same input → same output
 */

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    type AnchorInput,
    computeAnchors,
    getAnchorBadge,
    verifyAnchors,
} from '../src/anchor-verification.js';

import { ANCHOR_TIER_REQUIREMENTS, ANCHOR_TOOL_VERSION } from '../src/evidence-index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createValidInput(tier: 'ci' | 'merged' | 'incident' = 'merged'): AnchorInput {
  return {
    tier,
    artifactSha256: 'abc123def456789012345678901234567890123456789012345678901234',
    artifactName: 'autonomy-evidence-2026-01.zip',
    rekor: {
      logIndex: 12345678,
      uuid: 'abc123def456789012345678901234567890123456789012345678901234',
      integratedTime: 1735689600,
      entryUrl: 'https://rekor.sigstore.dev/api/v1/log/entries/abc123',
      bundleValid: true,
    },
    release: {
      tag: 'autonomy-evidence/2026-01',
      assetName: 'autonomy-evidence-2026-01.zip',
      assetUrl:
        'https://github.com/bsvalues/terrafusion_os_1.0/releases/download/autonomy-evidence%2F2026-01/autonomy-evidence-2026-01.zip',
      expectedSha256: 'abc123def456789012345678901234567890123456789012345678901234',
      actualSha256: 'abc123def456789012345678901234567890123456789012345678901234',
    },
    signature: {
      artifact: 'autonomy-evidence-2026-01.zip',
      identity:
        'https://github.com/bsvalues/terrafusion_os_1.0/.github/workflows/autonomy-evidence-publisher.yml@refs/heads/main',
      issuer: 'https://token.actions.githubusercontent.com',
      tripletComplete: true,
      verified: true,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema/Types
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – Anchor Schema/Types', () => {
  it('exports ANCHOR_TOOL_VERSION', () => {
    assert.match(ANCHOR_TOOL_VERSION, /^4N38\.\d+$/);
  });

  it('exports ANCHOR_TIER_REQUIREMENTS', () => {
    assert.equal(ANCHOR_TIER_REQUIREMENTS.ci, 1);
    assert.equal(ANCHOR_TIER_REQUIREMENTS.merged, 2);
    assert.equal(ANCHOR_TIER_REQUIREMENTS.incident, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeAnchors
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – computeAnchors', () => {
  it('returns 3/3 anchors when all pass', () => {
    const input = createValidInput();
    const result = computeAnchors(input);

    assert.equal(result.anchorCount, 3);
    assert.equal(result.anchorTotal, 3);
    assert.equal(result.status, 'ok');
    assert.ok(result.rekor?.ok);
    assert.ok(result.release?.ok);
    assert.ok(result.signature?.ok);
  });

  it('returns 2/3 anchors when one fails', () => {
    const input = createValidInput();
    input.rekor = undefined;
    const result = computeAnchors(input);

    assert.equal(result.anchorCount, 2);
    assert.equal(result.status, 'ok');
    assert.equal(result.tierResult.ok, true);
  });

  it('returns 1/3 anchors when two fail', () => {
    const input = createValidInput();
    input.rekor = undefined;
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.anchorCount, 1);
    assert.equal(result.tierResult.ok, false); // merged tier needs 2
  });

  it('returns 0/3 anchors when all fail', () => {
    const input = createValidInput();
    input.rekor = undefined;
    input.release = undefined;
    input.signature = undefined;
    const result = computeAnchors(input);

    assert.equal(result.anchorCount, 0);
    assert.equal(result.status, 'none');
    assert.equal(result.tierResult.ok, false);
  });

  it('includes schema and toolVersion', () => {
    const input = createValidInput();
    const result = computeAnchors(input);

    assert.equal(result.schema, 'terrafusion.autonomy.anchors.v1');
    assert.equal(result.toolVersion, ANCHOR_TOOL_VERSION);
  });

  it('includes artifact metadata', () => {
    const input = createValidInput();
    const result = computeAnchors(input);

    assert.equal(result.artifactSha256, input.artifactSha256);
    assert.equal(result.artifactName, input.artifactName);
  });

  it('detects Rekor bundle invalid', () => {
    const input = createValidInput();
    input.rekor!.bundleValid = false;
    const result = computeAnchors(input);

    assert.equal(result.rekor?.ok, false);
    assert.ok(result.rekor?.error);
  });

  it('detects release SHA mismatch', () => {
    const input = createValidInput();
    input.release!.actualSha256 = 'different-sha';
    const result = computeAnchors(input);

    assert.equal(result.release?.ok, false);
    assert.equal(result.release?.shaMatch, false);
    assert.ok(result.release?.error);
  });

  it('detects signature verification failure', () => {
    const input = createValidInput();
    input.signature!.verified = false;
    const result = computeAnchors(input);

    assert.equal(result.signature?.ok, false);
    assert.ok(result.signature?.error);
  });

  it('detects incomplete triplet', () => {
    const input = createValidInput();
    input.signature!.tripletComplete = false;
    const result = computeAnchors(input);

    assert.equal(result.signature?.ok, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Tier Requirements
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – Tier Requirements', () => {
  it('CI tier passes with 1/3 anchors', () => {
    const input = createValidInput('ci');
    input.rekor = undefined;
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.tier, 'ci');
    assert.equal(result.tierResult.required, 1);
    assert.equal(result.tierResult.ok, true);
  });

  it('CI tier fails with 0/3 anchors', () => {
    const input = createValidInput('ci');
    input.rekor = undefined;
    input.release = undefined;
    input.signature = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.ok, false);
  });

  it('merged tier fails with 1/3 anchors', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.tier, 'merged');
    assert.equal(result.tierResult.required, 2);
    assert.equal(result.tierResult.ok, false);
    assert.equal(result.status, 'insufficient');
  });

  it('merged tier passes with 2/3 anchors', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.ok, true);
  });

  it('incident tier fails with 1/3 anchors', () => {
    const input = createValidInput('incident');
    input.rekor = undefined;
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.tier, 'incident');
    assert.equal(result.tierResult.required, 2);
    assert.equal(result.tierResult.ok, false);
  });

  it('incident tier passes with 2/3 anchors', () => {
    const input = createValidInput('incident');
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.tierResult.ok, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: verifyAnchors
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – verifyAnchors', () => {
  it('returns ok=true for merged tier with 2/3 anchors', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    const anchors = computeAnchors(input);
    const result = verifyAnchors(anchors, 'merged');

    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it('returns ok=false for merged tier with 1/3 anchors', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    input.release = undefined;
    const anchors = computeAnchors(input);
    const result = verifyAnchors(anchors, 'merged');

    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].includes('Insufficient anchors'));
  });

  it('returns ok=true for CI tier even with 1/3 anchors (warns)', () => {
    const input = createValidInput('ci');
    input.rekor = undefined;
    input.release = undefined;
    const anchors = computeAnchors(input);
    const result = verifyAnchors(anchors, 'ci');

    // CI always passes but may warn
    assert.equal(result.ok, true);
  });

  it('collects individual anchor errors', () => {
    const input = createValidInput('merged');
    input.rekor!.bundleValid = false;
    input.release!.actualSha256 = 'wrong-sha';
    const anchors = computeAnchors(input);
    const result = verifyAnchors(anchors, 'merged');

    assert.ok(result.errors.some(e => e.includes('Rekor')));
    assert.ok(result.errors.some(e => e.includes('Release')));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: getAnchorBadge
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – getAnchorBadge', () => {
  it('returns success badge for 3/3 anchors', () => {
    const input = createValidInput('merged');
    const anchors = computeAnchors(input);
    const badge = getAnchorBadge(anchors);

    assert.equal(badge.text, '3/3');
    assert.equal(badge.class, 'anchor-ok');
    assert.ok(badge.title.includes('Rekor'));
    assert.ok(badge.title.includes('Release'));
    assert.ok(badge.title.includes('Signature'));
  });

  it('returns success badge for 2/3 anchors (merged tier ok)', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    const anchors = computeAnchors(input);
    const badge = getAnchorBadge(anchors);

    assert.equal(badge.text, '2/3');
    assert.equal(badge.class, 'anchor-ok');
  });

  it('returns warn badge for 1/3 anchors on CI tier', () => {
    const input = createValidInput('ci');
    input.rekor = undefined;
    input.release = undefined;
    const anchors = computeAnchors(input);
    const badge = getAnchorBadge(anchors);

    assert.equal(badge.text, '1/3');
    assert.equal(badge.class, 'anchor-warn');
    assert.ok(badge.title.includes('below minimum'));
  });

  it('returns fail badge for insufficient anchors on merged tier', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    input.release = undefined;
    const anchors = computeAnchors(input);
    const badge = getAnchorBadge(anchors);

    assert.equal(badge.text, '1/3');
    assert.equal(badge.class, 'anchor-fail');
    assert.ok(badge.title.includes('insufficient'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – Determinism', () => {
  it('produces identical anchor counts for same input (10x)', () => {
    const input = createValidInput();
    const results: number[] = [];

    for (let i = 0; i < 10; i++) {
      const anchors = computeAnchors(input);
      results.push(anchors.anchorCount);
    }

    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], results[0]);
    }
  });

  it('produces identical tierResult for same input', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;

    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      const anchors = computeAnchors(input);
      results.push(anchors.tierResult.ok);
    }

    for (let i = 1; i < results.length; i++) {
      assert.equal(results[i], results[0]);
    }
  });

  it('anchor ordering is consistent', () => {
    const input = createValidInput();

    const anchors1 = computeAnchors(input);
    const anchors2 = computeAnchors(input);

    // Check order of anchor types in result
    assert.equal(!!anchors1.rekor, !!anchors2.rekor);
    assert.equal(!!anchors1.release, !!anchors2.release);
    assert.equal(!!anchors1.signature, !!anchors2.signature);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N38 – Edge Cases', () => {
  it('handles missing release actualSha256', () => {
    const input = createValidInput();
    input.release!.actualSha256 = undefined;
    const result = computeAnchors(input);

    assert.equal(result.release?.ok, false);
    assert.equal(result.anchorCount, 2);
  });

  it('handles Rekor with bundleValid=false and missing fields', () => {
    const input = createValidInput();
    input.rekor = {
      logIndex: 0,
      uuid: '',
      integratedTime: 0,
      entryUrl: '',
      bundleValid: false,
    };
    const result = computeAnchors(input);

    assert.equal(result.rekor?.ok, false);
    assert.equal(result.rekor?.logIndex, 0);
  });

  it('handles signature with tripletComplete=false but verified=true', () => {
    const input = createValidInput();
    input.signature!.tripletComplete = false;
    input.signature!.verified = true;
    const result = computeAnchors(input);

    // Both must be true for anchor to pass
    assert.equal(result.signature?.ok, false);
  });

  it('status is insufficient when tier fails but some anchors exist', () => {
    const input = createValidInput('merged');
    input.rekor = undefined;
    input.release = undefined;
    const result = computeAnchors(input);

    assert.equal(result.anchorCount, 1);
    assert.equal(result.status, 'insufficient');
  });
});
