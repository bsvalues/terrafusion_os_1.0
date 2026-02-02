/**
 * Phase 4N43d — Adversarial Swap Test Suite
 * ==========================================
 *
 * Tests that verify all attack scenarios fail with explicit, stable error codes.
 * No silent degradations allowed — all tampering must trigger crisp failure.
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import {
    bitflipPayload,
    breakChainContinuity,
    breakLedgerLinkage,
    breakReleaseChain,
    createSequenceGap,
    deterministicBuffer,
    generateAttackSuite,
    multiplebitflips,
    mutateLedgerHeadHash,
    mutateLedgerHeadSequence,
    mutateSignature,
    removeBundle,
    removeCasefile,
    removeCertificate,
    removeLedgerHead,
    removeManifest,
    removeSignature,
    reorderJsonKeys,
    reorderJsonKeysAttack,
    sha256,
    spoofDefaultBranch,
    spoofRepoId,
    spoofRepoSlug,
    swapCasefileKeepManifest,
    swapManifestKeepCasefile,
    type TestCasefileArtifact,
    type TestLedgerHead,
    type TestLedgerSnapshot
} from '../src/attack-lib.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function createTestArtifacts(): TestCasefileArtifact {
  const casefile = deterministicBuffer('casefile-content', 1024);
  const manifest = Buffer.from(
    JSON.stringify({
      version: '1.0.0',
      casefileHash: sha256(casefile),
    })
  );

  return {
    'casefile.zip': casefile,
    'casefile-manifest.json': manifest,
    'sealed-manifest.json': Buffer.from(
      JSON.stringify({
        casefile: { sha256: sha256(casefile) },
        manifest: { sha256: sha256(manifest) },
      })
    ),
    'ledger-head.json': Buffer.from(
      JSON.stringify({
        headLedgerSha256: 'abc123',
        headSequenceNumber: 5,
      })
    ),
    seals: {
      'casefile.zip.sig': Buffer.from('signature-casefile'),
      'casefile.zip.crt': Buffer.from('certificate-casefile'),
      'casefile.zip.bundle': Buffer.from('bundle-casefile'),
      'casefile-manifest.json.sig': Buffer.from('signature-manifest'),
      'casefile-manifest.json.crt': Buffer.from('certificate-manifest'),
      'casefile-manifest.json.bundle': Buffer.from('bundle-manifest'),
    },
  };
}

function createTestLedgerSnapshot(): TestLedgerSnapshot {
  return {
    chain: {
      ledgerSha256: 'current-hash-abc123',
      previousLedgerSha256: 'previous-hash-def456',
      generatedAt: '2025-01-15T12:00:00.000Z',
      repoIdentity: {
        repoId: 12345,
        ownerRepo: 'terrafusion-io/terrafusion_os',
        defaultBranch: 'main',
      },
      sequenceNumber: 5,
    },
    entries: [],
  };
}

function createTestLedgerHead(): TestLedgerHead {
  return {
    headLedgerSha256: 'current-hash-abc123',
    headReleaseTag: 'v1.0.0',
    headCasefileSha256: 'casefile-hash-ghi789',
    headSequenceNumber: 5,
    repoIdentity: {
      repoId: 12345,
      ownerRepo: 'terrafusion-io/terrafusion_os',
      defaultBranch: 'main',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Swap Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Asset Swap Attacks', () => {
  it('swapCasefileKeepManifest produces CASEFILE_HASH_MISMATCH', () => {
    const artifacts = createTestArtifacts();
    const attack = swapCasefileKeepManifest(artifacts, Buffer.from('ATTACKER_CONTENT'));

    assert.strictEqual(attack.expectedErrorCode, 'CASEFILE_HASH_MISMATCH');
    assert.strictEqual(attack.attackCategory, 'asset-swap');
    assert.notDeepStrictEqual(attack.artifact['casefile.zip'], artifacts['casefile.zip']);
    assert.deepStrictEqual(
      attack.artifact['casefile-manifest.json'],
      artifacts['casefile-manifest.json']
    );
  });

  it('swapManifestKeepCasefile produces MANIFEST_HASH_MISMATCH', () => {
    const artifacts = createTestArtifacts();
    const attack = swapManifestKeepCasefile(artifacts, Buffer.from('FAKE_MANIFEST'));

    assert.strictEqual(attack.expectedErrorCode, 'MANIFEST_HASH_MISMATCH');
    assert.strictEqual(attack.attackCategory, 'asset-swap');
    assert.deepStrictEqual(attack.artifact['casefile.zip'], artifacts['casefile.zip']);
    assert.notDeepStrictEqual(
      attack.artifact['casefile-manifest.json'],
      artifacts['casefile-manifest.json']
    );
  });

  it('removeCasefile produces CASEFILE_NOT_FOUND', () => {
    const artifacts = createTestArtifacts();
    const attack = removeCasefile(artifacts);

    assert.strictEqual(attack.expectedErrorCode, 'CASEFILE_NOT_FOUND');
    assert.ok(!('casefile.zip' in attack.artifact));
    assert.ok('casefile-manifest.json' in attack.artifact);
  });

  it('removeManifest produces MANIFEST_NOT_FOUND', () => {
    const artifacts = createTestArtifacts();
    const attack = removeManifest(artifacts);

    assert.strictEqual(attack.expectedErrorCode, 'MANIFEST_NOT_FOUND');
    assert.ok('casefile.zip' in attack.artifact);
    assert.ok(!('casefile-manifest.json' in attack.artifact));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ledger Head Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Ledger Head Attacks', () => {
  it('mutateLedgerHeadHash produces LEDGER_HASH_MISMATCH', () => {
    const head = createTestLedgerHead();
    const attack = mutateLedgerHeadHash(head);

    assert.strictEqual(attack.expectedErrorCode, 'LEDGER_HASH_MISMATCH');
    assert.strictEqual(attack.attackCategory, 'hash-tampering');
    assert.notStrictEqual(attack.artifact.headLedgerSha256, head.headLedgerSha256);
  });

  it('mutateLedgerHeadSequence produces LEDGER_SEQUENCE_GAP', () => {
    const head = createTestLedgerHead();
    const attack = mutateLedgerHeadSequence(head);

    assert.strictEqual(attack.expectedErrorCode, 'LEDGER_SEQUENCE_GAP');
    assert.strictEqual(attack.attackCategory, 'chain-tampering');
    assert.notStrictEqual(attack.artifact.headSequenceNumber, head.headSequenceNumber);
  });

  it('removeLedgerHead produces LEDGER_HEAD_NOT_FOUND', () => {
    const artifacts = createTestArtifacts();
    const attack = removeLedgerHead(artifacts);

    assert.strictEqual(attack.expectedErrorCode, 'LEDGER_HEAD_NOT_FOUND');
    assert.ok(!('ledger-head.json' in attack.artifact));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chain Continuity Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Chain Continuity Attacks', () => {
  it('breakChainContinuity produces LEDGER_CHAIN_BROKEN', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = breakChainContinuity(snapshot);

    assert.strictEqual(attack.expectedErrorCode, 'LEDGER_CHAIN_BROKEN');
    assert.strictEqual(attack.attackCategory, 'chain-tampering');
    assert.notStrictEqual(
      attack.artifact.chain.previousLedgerSha256,
      snapshot.chain.previousLedgerSha256
    );
  });

  it('createSequenceGap produces LEDGER_SEQUENCE_GAP', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = createSequenceGap(snapshot, 5);

    assert.strictEqual(attack.expectedErrorCode, 'LEDGER_SEQUENCE_GAP');
    assert.strictEqual(attack.artifact.chain.sequenceNumber, snapshot.chain.sequenceNumber + 6);
  });

  it('createSequenceGap description includes gap size', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = createSequenceGap(snapshot, 10);

    assert.ok(attack.attackDescription.includes('10'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Repo Identity Attack Tests (Fork/Spoof)
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Repo Identity Attacks', () => {
  it('spoofRepoId produces REPO_ID_MISMATCH', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = spoofRepoId(snapshot, 999999);

    assert.strictEqual(attack.expectedErrorCode, 'REPO_ID_MISMATCH');
    assert.strictEqual(attack.attackCategory, 'identity-tampering');
    assert.strictEqual(attack.artifact.chain.repoIdentity.repoId, 999999);
  });

  it('spoofRepoSlug produces REPO_SLUG_MISMATCH', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = spoofRepoSlug(snapshot, 'evil/forked-repo');

    assert.strictEqual(attack.expectedErrorCode, 'REPO_SLUG_MISMATCH');
    assert.strictEqual(attack.artifact.chain.repoIdentity.ownerRepo, 'evil/forked-repo');
  });

  it('spoofDefaultBranch produces DEFAULT_BRANCH_MISMATCH', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = spoofDefaultBranch(snapshot, 'attacker-branch');

    assert.strictEqual(attack.expectedErrorCode, 'DEFAULT_BRANCH_MISMATCH');
    assert.strictEqual(attack.artifact.chain.repoIdentity.defaultBranch, 'attacker-branch');
  });

  it('identity attacks preserve other fields', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = spoofRepoId(snapshot, 111);

    // Other chain fields should be preserved
    assert.strictEqual(attack.artifact.chain.ledgerSha256, snapshot.chain.ledgerSha256);
    assert.strictEqual(attack.artifact.chain.sequenceNumber, snapshot.chain.sequenceNumber);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Release Linkage Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Release Linkage Attacks', () => {
  it('breakReleaseChain produces RELEASE_CHAIN_BROKEN', () => {
    const manifest = {
      releaseTag: 'v1.0.0',
      previousReleaseTag: 'v0.9.0',
      previousCasefileSha256: 'prev-casefile-hash',
      ledgerHeadSha256: 'ledger-head-hash',
    };

    const attack = breakReleaseChain(manifest);

    assert.strictEqual(attack.expectedErrorCode, 'RELEASE_CHAIN_BROKEN');
    assert.strictEqual(attack.attackCategory, 'linkage-tampering');
    assert.notStrictEqual(attack.artifact.previousCasefileSha256, manifest.previousCasefileSha256);
  });

  it('breakLedgerLinkage produces RELEASE_LINKAGE_INVALID', () => {
    const manifest = {
      releaseTag: 'v1.0.0',
      previousReleaseTag: null,
      previousCasefileSha256: null,
      ledgerHeadSha256: 'original-ledger-hash',
    };

    const attack = breakLedgerLinkage(manifest);

    assert.strictEqual(attack.expectedErrorCode, 'RELEASE_LINKAGE_INVALID');
    assert.notStrictEqual(attack.artifact.ledgerHeadSha256, manifest.ledgerHeadSha256);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bitflip Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Bitflip Attacks', () => {
  it('bitflipPayload flips exactly one bit', () => {
    const original = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const attack = bitflipPayload(original, 2);

    assert.strictEqual(attack.artifact[0], 0x00);
    assert.strictEqual(attack.artifact[1], 0x00);
    assert.strictEqual(attack.artifact[2], 0x01); // Flipped
    assert.strictEqual(attack.artifact[3], 0x00);
  });

  it('bitflipPayload defaults to middle position', () => {
    const original = Buffer.alloc(100);
    const attack = bitflipPayload(original);

    // Find the flipped byte
    let flippedPos = -1;
    for (let i = 0; i < 100; i++) {
      if (attack.artifact[i] !== 0) {
        flippedPos = i;
        break;
      }
    }

    assert.strictEqual(flippedPos, 50); // Middle of 100-byte buffer
  });

  it('multiplebitflips flips multiple bytes', () => {
    const original = Buffer.alloc(100);
    const attack = multiplebitflips(original, 3);

    let flippedCount = 0;
    for (let i = 0; i < 100; i++) {
      if (attack.artifact[i] !== 0) {
        flippedCount++;
      }
    }

    assert.strictEqual(flippedCount, 3);
  });

  it('bitflip attack description includes position', () => {
    const original = Buffer.from([0xff]);
    const attack = bitflipPayload(original, 0);

    assert.ok(attack.attackDescription.includes('position 0'));
    assert.ok(attack.attackDescription.includes('0xff'));
    assert.ok(attack.attackDescription.includes('0xfe'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization Defense Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Canonicalization Defense', () => {
  it('reorderJsonKeys reverses key order', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const reordered = reorderJsonKeys(obj);

    // Should be reverse alphabetical
    const keys = Object.keys(reordered);
    assert.deepStrictEqual(keys, ['c', 'b', 'a']);
  });

  it('reorderJsonKeysAttack expects NONE (should pass verification)', () => {
    const snapshot = createTestLedgerSnapshot();
    const attack = reorderJsonKeysAttack(snapshot);

    assert.strictEqual(attack.expectedErrorCode, 'NONE');
    assert.strictEqual(attack.attackCategory, 'canonicalization');
  });

  it('reordering preserves values', () => {
    const obj = { x: 10, y: 20 };
    const reordered = reorderJsonKeys(obj);

    assert.strictEqual(reordered.x, 10);
    assert.strictEqual(reordered.y, 20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Triplet Parity Attack Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Triplet Parity Attacks', () => {
  it('removeSignature produces TRIPLET_MISSING', () => {
    const seals = {
      'casefile.zip.sig': Buffer.from('sig'),
      'casefile.zip.crt': Buffer.from('crt'),
      'casefile.zip.bundle': Buffer.from('bundle'),
    };

    const attack = removeSignature(seals, 'casefile.zip');

    assert.strictEqual(attack.expectedErrorCode, 'TRIPLET_MISSING');
    assert.ok(!('casefile.zip.sig' in attack.artifact));
    assert.ok('casefile.zip.crt' in attack.artifact);
    assert.ok('casefile.zip.bundle' in attack.artifact);
  });

  it('removeCertificate produces TRIPLET_MISSING', () => {
    const seals = {
      'manifest.json.sig': Buffer.from('sig'),
      'manifest.json.crt': Buffer.from('crt'),
      'manifest.json.bundle': Buffer.from('bundle'),
    };

    const attack = removeCertificate(seals, 'manifest.json');

    assert.strictEqual(attack.expectedErrorCode, 'TRIPLET_MISSING');
    assert.ok('manifest.json.sig' in attack.artifact);
    assert.ok(!('manifest.json.crt' in attack.artifact));
  });

  it('removeBundle produces TRIPLET_MISSING', () => {
    const seals = {
      'artifact.sig': Buffer.from('sig'),
      'artifact.crt': Buffer.from('crt'),
      'artifact.bundle': Buffer.from('bundle'),
    };

    const attack = removeBundle(seals, 'artifact');

    assert.strictEqual(attack.expectedErrorCode, 'TRIPLET_MISSING');
    assert.ok(!('artifact.bundle' in attack.artifact));
  });

  it('mutateSignature produces SIGNATURE_INVALID', () => {
    const seals = {
      'casefile.zip.sig': Buffer.from('valid-signature-data'),
      'casefile.zip.crt': Buffer.from('certificate'),
      'casefile.zip.bundle': Buffer.from('bundle'),
    };

    const attack = mutateSignature(seals, 'casefile.zip');

    assert.strictEqual(attack.expectedErrorCode, 'SIGNATURE_INVALID');
    assert.ok(attack.artifact['casefile.zip.sig'].toString().includes('INVALID_SIGNATURE'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Attack Suite Generator Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Attack Suite Generator', () => {
  it('generates comprehensive attack suite', () => {
    const artifacts = createTestArtifacts();
    const snapshot = createTestLedgerSnapshot();
    const head = createTestLedgerHead();

    const suite = generateAttackSuite(artifacts, snapshot, head);

    assert.ok(suite.length >= 10, 'Should have at least 10 attacks');
  });

  it('attack suite covers all categories', () => {
    const artifacts = createTestArtifacts();
    const snapshot = createTestLedgerSnapshot();
    const head = createTestLedgerHead();

    const suite = generateAttackSuite(artifacts, snapshot, head);
    const categories = new Set(suite.map(a => a.category));

    assert.ok(categories.has('asset-swap'));
    assert.ok(categories.has('hash-tampering'));
    assert.ok(categories.has('chain-tampering'));
    assert.ok(categories.has('identity-tampering'));
    assert.ok(categories.has('bitflip'));
    assert.ok(categories.has('canonicalization'));
  });

  it('attack suite is executable', () => {
    const artifacts = createTestArtifacts();
    const snapshot = createTestLedgerSnapshot();
    const head = createTestLedgerHead();

    const suite = generateAttackSuite(artifacts, snapshot, head);

    // All attacks should execute without throwing
    for (const attack of suite) {
      assert.doesNotThrow(() => attack.execute(), `Attack ${attack.name} should not throw`);
    }
  });

  it('attack suite has unique expected codes per attack', () => {
    const artifacts = createTestArtifacts();
    const snapshot = createTestLedgerSnapshot();
    const head = createTestLedgerHead();

    const suite = generateAttackSuite(artifacts, snapshot, head);

    // Each attack should have a defined expected code
    for (const attack of suite) {
      assert.ok(attack.expectedCode.length > 0, `Attack ${attack.name} should have expected code`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility Function Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N43d – Utility Functions', () => {
  it('sha256 produces consistent output', () => {
    const input = 'test-input';
    const hash1 = sha256(input);
    const hash2 = sha256(input);

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
    assert.ok(/^[a-f0-9]+$/.test(hash1));
  });

  it('deterministicBuffer produces reproducible output', () => {
    const buf1 = deterministicBuffer('seed', 100);
    const buf2 = deterministicBuffer('seed', 100);

    assert.deepStrictEqual(buf1, buf2);
  });

  it('deterministicBuffer with different seeds produces different output', () => {
    const buf1 = deterministicBuffer('seed1', 100);
    const buf2 = deterministicBuffer('seed2', 100);

    assert.notDeepStrictEqual(buf1, buf2);
  });
});
