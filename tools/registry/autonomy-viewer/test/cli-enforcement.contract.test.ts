import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createAuditLogger } from '../src/security/audit/audit-log.js';
import { createMemoryAuditSink } from '../src/security/audit/audit-sinks.js';
import { MUTATION_BOUNDARY_ACTION_IDS } from '../src/security/rbac/action-map.js';
import { guardMutation } from '../src/security/rbac/cli-guard.js';

function createLogger() {
  return createAuditLogger(createMemoryAuditSink());
}

describe('Phase IIIa – CLI Enforcement Contract', () => {
  it('emits audit decision before mutation', () => {
    const logger = createLogger();
    let mutationRan = false;

    const result = guardMutation(
      {
        request: {
          actionId: 'autonomy.bootstrap.write',
          tier: 'ci',
          profile: 'county',
          now: new Date('2026-02-01T00:00:00.000Z'),
        },
        logger,
      },
      () => {
        mutationRan = true;
        assert.strictEqual(logger.entries.length, 1);
      }
    );

    assert.strictEqual(result.allowed, true);
    assert.strictEqual(mutationRan, true);
    assert.strictEqual(logger.entries.length, 1);
  });

  it('denies by default when context is ambiguous', () => {
    const logger = createLogger();
    let mutationRan = false;

    const result = guardMutation(
      {
        request: {
          actionId: 'autonomy.bootstrap.write',
          profile: 'county',
          now: new Date('2026-02-01T00:00:00.000Z'),
        },
        logger,
      },
      () => {
        mutationRan = true;
      }
    );

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(mutationRan, false);
    assert.strictEqual(logger.entries.length, 1);
  });

  it('covers every mutation boundary action', () => {
    const logger = createLogger();

    for (const actionId of MUTATION_BOUNDARY_ACTION_IDS) {
      const result = guardMutation({
        request: {
          actionId,
          tier: 'ci',
          profile: 'county',
          now: new Date('2026-02-01T00:00:00.000Z'),
        },
        logger,
      });

      assert.strictEqual(result.allowed, true);
    }
  });
});
