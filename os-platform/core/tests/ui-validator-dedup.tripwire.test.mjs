/**
 * TerraCanon – UI Validator Deduplication Tripwire
 *
 * Ensures NO UI code defines local workspace validators.
 * All workspace validation must import from the canonical sources:
 *   - UI:   frontend/apps/os-shell/src/canon/reopenPersistence.ts
 *   - Core: os-platform/core/canon/reopenPersistence.mjs
 *
 * Run with: node --test os-platform/core/tests/ui-validator-dedup.tripwire.test.mjs
 *
 * @see Phase 41: Validator Deduplication
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkNoLocalWorkspaceValidators } from '../../../scripts/governance/check-no-local-workspace-validators.mjs';

describe('TerraCanon Validator Dedup Tripwire', () => {
  it('UI must not define local workspace validators (import canonical)', () => {
    const offenders = checkNoLocalWorkspaceValidators({ rootDir: process.cwd() });

    assert.equal(
      offenders.length,
      0,
      'Local workspace validators found. Replace with imports from canon/reopenPersistence:\n' +
        offenders.map(f => ` - ${f}`).join('\n')
    );
  });
});

console.log('UI Validator Dedup Tripwire Suite');
console.log('==================================');
console.log('Run with: node --test os-platform/core/tests/ui-validator-dedup.tripwire.test.mjs');
