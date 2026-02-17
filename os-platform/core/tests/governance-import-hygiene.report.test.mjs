/**
 * TerraCanon – Governance Import Hygiene Report (Non-Blocking)
 *
 * Surfaces any non-barrel governance imports in CI logs.
 * Always passes — informational only, not enforcement.
 *
 * Run with: node --test os-platform/core/tests/governance-import-hygiene.report.test.mjs
 *
 * @see Phase 43: Import Hygiene
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reportNonBarrelGovernanceImports } from '../../../scripts/governance/report-non-barrel-governance-imports.mjs';

describe('Governance Import Hygiene Report (informational)', () => {
  it('reports non-barrel governance imports (always passes)', () => {
    const offenders = reportNonBarrelGovernanceImports({ rootDir: process.cwd() });

    if (offenders.length > 0) {
      console.log(
        'ℹ️ Non-barrel governance imports detected (migrate to canon/governance.ts):\n' +
          offenders.map(f => ` - ${f}`).join('\n')
      );
    } else {
      console.log('✅ No non-barrel governance imports detected.');
    }

    // Always pass — informational only
    assert.ok(true);
  });
});

console.log('Governance Import Hygiene Report Suite');
console.log('=======================================');
console.log(
  'Run with: node --test os-platform/core/tests/governance-import-hygiene.report.test.mjs'
);
