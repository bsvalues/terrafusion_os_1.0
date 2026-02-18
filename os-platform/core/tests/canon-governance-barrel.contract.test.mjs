/**
 * TerraCanon – Governance Barrel Contract Tripwire
 *
 * Ensures the canonical barrel (canon/governance.ts) re-exports:
 *   - isValidWorkspace  (function, from reopenPersistence)
 *   - STORAGE_KEY_LAST_CLOSED (const, from reopenPersistence)
 *   - Workspace (type export, from reopenPersistence)
 *   - Phase 47: envelope v2 exports from lastClosedEnvelope
 *
 * This is a static analysis test — it reads the barrel source and asserts
 * that the expected export lines are present. No TS compile needed.
 *
 * Run with: node --test os-platform/core/tests/canon-governance-barrel.contract.test.mjs
 *
 * @see Phase 42: Barrel Export
 * @see Phase 47: Operational Hardening (envelope v2)
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const BARREL_PATH = resolve(process.cwd(), 'frontend/apps/os-shell/src/canon/governance.ts');

let barrelSource;
try {
  barrelSource = readFileSync(BARREL_PATH, 'utf-8');
} catch (err) {
  barrelSource = null;
}

describe('TerraCanon Governance Barrel Contract', () => {
  it('barrel file exists at canonical path', () => {
    assert.ok(
      barrelSource !== null,
      `Barrel not found at ${BARREL_PATH}. Phase 42 requires canon/governance.ts.`
    );
  });

  it('re-exports isValidWorkspace from reopenPersistence', () => {
    assert.ok(barrelSource, 'barrel source not loaded');
    assert.match(
      barrelSource,
      /export\s*\{[^}]*isValidWorkspace[^}]*\}\s*from\s*['"]\.\/reopenPersistence['"]/,
      'Barrel must re-export isValidWorkspace from ./reopenPersistence'
    );
  });

  it('re-exports STORAGE_KEY_LAST_CLOSED from reopenPersistence', () => {
    assert.ok(barrelSource, 'barrel source not loaded');
    assert.match(
      barrelSource,
      /export\s*\{[^}]*STORAGE_KEY_LAST_CLOSED[^}]*\}\s*from\s*['"]\.\/reopenPersistence['"]/,
      'Barrel must re-export STORAGE_KEY_LAST_CLOSED from ./reopenPersistence'
    );
  });

  it('re-exports Workspace type from reopenPersistence', () => {
    assert.ok(barrelSource, 'barrel source not loaded');
    assert.match(
      barrelSource,
      /export\s+type\s*\{[^}]*Workspace[^}]*\}\s*from\s*['"]\.\/reopenPersistence['"]/,
      'Barrel must re-export Workspace type from ./reopenPersistence'
    );
  });

  it('barrel imports ONLY from canonical governance sources', () => {
    assert.ok(barrelSource, 'barrel source not loaded');
    // Every from-clause must point to ./reopenPersistence or ./lastClosedEnvelope
    const fromClauses = barrelSource.match(/from\s+['"][^'"]+['"]/g) || [];
    assert.ok(fromClauses.length > 0, 'Barrel must have at least one from-clause');
    for (const clause of fromClauses) {
      assert.match(
        clause,
        /from\s+['"]\.\/(reopenPersistence|lastClosedEnvelope)['"]/,
        `Unexpected import source in barrel: ${clause}`
      );
    }
  });

  it('re-exports envelope v2 functions from lastClosedEnvelope', () => {
    assert.ok(barrelSource, 'barrel source not loaded');
    assert.match(
      barrelSource,
      /export\s*\{[^}]*parseLastClosedV2[^}]*\}\s*from\s*['"]\.\/lastClosedEnvelope['"]/,
      'Barrel must re-export parseLastClosedV2 from ./lastClosedEnvelope'
    );
    assert.match(
      barrelSource,
      /export\s*\{[^}]*serializeLastClosedV2[^}]*\}\s*from\s*['"]\.\/lastClosedEnvelope['"]/,
      'Barrel must re-export serializeLastClosedV2 from ./lastClosedEnvelope'
    );
  });
});

console.log('Governance Barrel Contract Tripwire Suite');
console.log('==========================================');
console.log(
  'Run with: node --test os-platform/core/tests/canon-governance-barrel.contract.test.mjs'
);
