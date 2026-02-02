import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ACTION_IDS, ACTION_MAP, MUTATION_BOUNDARY_BINS } from '../src/security/rbac/action-map.js';

describe('Phase IIIa – Action Map Contract', () => {
  it('every mutation boundary has an action ID', () => {
    for (const bin of MUTATION_BOUNDARY_BINS) {
      assert.ok(ACTION_MAP[bin], `Missing action definition for ${bin}`);
      assert.ok(ACTION_MAP[bin].actionId, `Missing actionId for ${bin}`);
    }
  });

  it('action IDs are unique', () => {
    const unique = new Set(ACTION_IDS);
    assert.strictEqual(unique.size, ACTION_IDS.length);
  });

  it('action IDs match the canonical list', () => {
    const expected = [
      'autonomy.accreditation.packet.write',
      'autonomy.airgap.bundle.write',
      'autonomy.bootstrap.write',
      'autonomy.closeout.proof.write',
      'autonomy.county_kit.write',
      'autonomy.drills.write',
      'autonomy.fleet_enroll.write',
      'autonomy.mirror.publish.write',
    ];

    assert.deepEqual([...ACTION_IDS].sort(), expected.sort());
  });

  it('action map contains only mutation boundaries', () => {
    const mapKeys = Object.keys(ACTION_MAP).sort();
    const expected = [...MUTATION_BOUNDARY_BINS].sort();
    assert.deepEqual(mapKeys, expected);
  });
});
