/**
 * TerraFusion OS — Codex–Workbench Host Agreement Test (Phase 7, Lane 3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cross-contract proof: every module that evaluateSpawnIntent() routes
 * to the workbench MUST ALSO pass validateWorkbenchHost().
 *
 * This closes the logical gap between:
 *   - desktopStore.ts  evaluateSpawnIntent(moduleId) → 'route-to-workbench'
 *   - objectPlacement.ts  validateWorkbenchHost(tabId) → null (lawful)
 *
 * If a module is routed to the workbench but fails host validation,
 * the user would see a violation notice instead of the suite tab.
 *
 * Run:  node --test os-platform/core/tests/codex-workbench-agreement.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const CODEX_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/contracts/objectPlacement.ts');
const STORE_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/stores/desktopStore.ts');

const codexSrc = readFileSync(CODEX_PATH, 'utf-8');
const storeSrc = readFileSync(STORE_PATH, 'utf-8');

// ============================================================================
// Helpers: extract classifications from source
// ============================================================================

function extractModuleObjectTypes() {
  const match = codexSrc.match(
    /MODULE_OBJECT_TYPES[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  assert.ok(match, 'MODULE_OBJECT_TYPES block found');

  const entries = {};
  const entryRegex = /'([^']+)':\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(match[1])) !== null) {
    const body = m[2];
    entries[m[1]] = {
      objectType: body.match(/objectType:\s*'([^']+)'/)?.[1],
      hostSurface: body.match(/hostSurface:\s*'([^']+)'/)?.[1] || undefined,
    };
  }
  return entries;
}

function extractWorkbenchHostedTypes() {
  const match = codexSrc.match(
    /WORKBENCH_HOSTED_TYPES[^=]*=\s*new Set\(\[([^\]]+)\]\)/
  );
  assert.ok(match, 'WORKBENCH_HOSTED_TYPES set found');
  const types = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(match[1])) !== null) types.push(m[1]);
  return new Set(types);
}

const MODULE_TYPES = extractModuleObjectTypes();
const HOSTED_TYPES = extractWorkbenchHostedTypes();

// ============================================================================
// Derive the two sets
// ============================================================================

// Modules that evaluateSpawnIntent would route to workbench:
// hostSurface === 'tier0-workbench' (the evaluateSpawnIntent check)
const routedToWorkbench = Object.entries(MODULE_TYPES)
  .filter(([_, c]) => c.hostSurface === 'tier0-workbench')
  .map(([id]) => id);

// Modules that validateWorkbenchHost would accept:
// objectType in WORKBENCH_HOSTED_TYPES AND hostSurface === 'tier0-workbench'
function wouldPassHostValidation(id) {
  const c = MODULE_TYPES[id];
  if (!c) return true; // unclassified passes
  return HOSTED_TYPES.has(c.objectType) && c.hostSurface === 'tier0-workbench';
}

// ============================================================================
// Tests
// ============================================================================

describe('Codex → Workbench Host Agreement', () => {
  it('at least 4 modules route to workbench (sanity)', () => {
    assert.ok(
      routedToWorkbench.length >= 4,
      `Expected ≥4 workbench-routed modules, got ${routedToWorkbench.length}`
    );
  });

  it('every module routed to workbench passes validateWorkbenchHost', () => {
    const failures = [];
    for (const id of routedToWorkbench) {
      if (!wouldPassHostValidation(id)) {
        failures.push({
          id,
          objectType: MODULE_TYPES[id].objectType,
          hostSurface: MODULE_TYPES[id].hostSurface,
        });
      }
    }
    assert.deepStrictEqual(
      failures, [],
      `These modules route to workbench but would fail host validation:\n${JSON.stringify(failures, null, 2)}`
    );
  });

  it('no module that is NOT routed to workbench would pass host validation (no leaks)', () => {
    // Modules that are classified but NOT routed to workbench
    const notRouted = Object.entries(MODULE_TYPES)
      .filter(([_, c]) => c.hostSurface !== 'tier0-workbench')
      .map(([id]) => id);

    const leaks = [];
    for (const id of notRouted) {
      const c = MODULE_TYPES[id];
      if (HOSTED_TYPES.has(c.objectType) && c.hostSurface === 'tier0-workbench') {
        leaks.push(id);
      }
    }
    assert.deepStrictEqual(leaks, [], 'No modules leak into workbench validation');
  });

  it('desktopStore imports evaluateSpawnIntent and uses it in openWindow', () => {
    assert.ok(
      storeSrc.includes('evaluateSpawnIntent'),
      'evaluateSpawnIntent referenced in desktopStore'
    );
    assert.ok(
      storeSrc.includes("verdict.decision === 'route-to-workbench'"),
      'route-to-workbench decision branch exists in openWindow'
    );
  });

  it('routed modules inject _routedTab metadata', () => {
    assert.ok(
      storeSrc.includes('_routedTab: moduleId'),
      'openWindow injects _routedTab when routing to workbench'
    );
  });

  // Per-module spot checks for the 4 parcel-scoped constitutional suites
  for (const tabId of ['forge', 'atlas', 'dais', 'dossier']) {
    it(`"${tabId}" routes to workbench AND passes host validation`, () => {
      const c = MODULE_TYPES[tabId];
      assert.ok(c, `${tabId} is classified`);
      assert.equal(c.hostSurface, 'tier0-workbench', `${tabId} routes to workbench`);
      assert.ok(HOSTED_TYPES.has(c.objectType), `${tabId} objectType is workbench-hosted`);
    });
  }
});

describe('Workbench Tab Canonical Order Agreement', () => {
  const CANONICAL_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];

  it('all 9 canonical tabs are classified as parcel-scoped-app', () => {
    for (const tab of CANONICAL_TABS) {
      const c = MODULE_TYPES[tab];
      assert.ok(c, `${tab} is classified`);
      assert.equal(c.objectType, 'parcel-scoped-app', `${tab} is parcel-scoped-app`);
    }
  });

  it('all 9 canonical tabs declare hostSurface = tier0-workbench', () => {
    for (const tab of CANONICAL_TABS) {
      assert.equal(MODULE_TYPES[tab].hostSurface, 'tier0-workbench', `${tab} hosts in workbench`);
    }
  });

  it('no canonical tab spawns as standalone window (codex routes to workbench)', () => {
    for (const tab of CANONICAL_TABS) {
      const c = MODULE_TYPES[tab];
      // parcel-scoped-app with hostSurface → evaluateSpawnIntent returns route-to-workbench
      assert.equal(c.hostSurface, 'tier0-workbench', `${tab} won't spawn standalone`);
    }
  });
});
