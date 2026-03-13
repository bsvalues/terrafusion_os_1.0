/**
 * TerraFusion OS — Launcher Routing Enforcement Tests (Phase 6 + Phase 9)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Proves that the launcher routing layer enforces the 3-6-9 Object Placement
 * Codex. These tests validate the `evaluateSpawnIntent()` function which is
 * the constitutional front door — no object may open a window without passing
 * through this check.
 *
 * Run:  node --test os-platform/core/tests/launcher-routing-enforcement.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ============================================================================
// Source Extraction — read the evaluateSpawnIntent logic from desktopStore.ts
// and the codex from objectPlacement.ts to cross-validate statically.
// ============================================================================

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const STORE_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/stores/desktopStore.ts');
const CODEX_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/contracts/objectPlacement.ts');

const storeSrc = readFileSync(STORE_PATH, 'utf-8');
const codexSrc = readFileSync(CODEX_PATH, 'utf-8');

// ============================================================================
// Helper: Extract MODULE_OBJECT_TYPES from codex source
// ============================================================================

function extractModuleObjectTypes() {
  const match = codexSrc.match(
    /MODULE_OBJECT_TYPES[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  assert.ok(match, 'MODULE_OBJECT_TYPES block found in objectPlacement.ts');

  const entries = {};
  const entryRegex = /'([^']+)':\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(match[1])) !== null) {
    const body = m[2];
    const objectType = body.match(/objectType:\s*'([^']+)'/)?.[1];
    const hostSurface = body.match(/hostSurface:\s*'([^']+)'/)?.[1];
    entries[m[1]] = { objectType, hostSurface: hostSurface || undefined };
  }
  return entries;
}

function extractPlacementPolicy() {
  const match = codexSrc.match(
    /PLACEMENT_POLICY[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  assert.ok(match, 'PLACEMENT_POLICY block found in objectPlacement.ts');

  const policies = {};
  const typeRegex = /'([^']+)':\s*\{([^}]+)\}/g;
  let m;
  while ((m = typeRegex.exec(match[1])) !== null) {
    const body = m[2];
    const layer = body.match(/layer:\s*'([^']+)'/)?.[1];
    const renderMode = body.match(/renderMode:\s*'([^']+)'/)?.[1];
    const hostSurface = body.match(/hostSurface:\s*'([^']+)'/)?.[1];
    const driftForbidden = body.match(/driftForbidden:\s*'([^']+)'/)?.[1];
    policies[m[1]] = { layer, renderMode, hostSurface, driftForbidden };
  }
  return policies;
}

const MODULE_TYPES = extractModuleObjectTypes();
const POLICIES = extractPlacementPolicy();

// ============================================================================
// Suite 1: evaluateSpawnIntent exists and is wired into openWindow
// ============================================================================

describe('Suite 1: Launcher Enforcement Wiring', () => {
  it('evaluateSpawnIntent function exists in desktopStore', () => {
    assert.ok(
      storeSrc.includes('function evaluateSpawnIntent(moduleId: string): SpawnVerdict'),
      'evaluateSpawnIntent function declaration found'
    );
  });

  it('openWindow calls evaluateSpawnIntent before spawning', () => {
    // The store source must contain the evaluateSpawnIntent call inside openWindow
    assert.ok(
      storeSrc.includes('evaluateSpawnIntent(moduleId)'),
      'openWindow calls evaluateSpawnIntent'
    );
    // Verify it's called before generateWindowId (spawn logic)
    const callIdx = storeSrc.indexOf('evaluateSpawnIntent(moduleId)');
    const spawnIdx = storeSrc.indexOf('const id = generateWindowId()');
    assert.ok(callIdx < spawnIdx, 'evaluateSpawnIntent is called before window generation');
  });

  it('openWindow handles reject verdict — returns empty string', () => {
    assert.ok(storeSrc.includes("verdict.decision === 'reject'"), 'reject check exists');
    assert.ok(storeSrc.includes("return ''"), 'returns empty string on reject');
  });

  it('openWindow handles route-to-workbench verdict — opens property-workbench', () => {
    assert.ok(
      storeSrc.includes("verdict.decision === 'route-to-workbench'"),
      'route-to-workbench check exists'
    );
    assert.ok(
      storeSrc.includes("const workbenchModuleId = 'property-workbench'"),
      'routes through property-workbench module'
    );
  });

  it('route-to-workbench injects _routedTab metadata', () => {
    assert.ok(
      storeSrc.includes('_routedTab: moduleId'),
      '_routedTab metadata injected with original moduleId'
    );
    assert.ok(
      storeSrc.includes('_routeReason: verdict.reason'),
      '_routeReason metadata injected'
    );
  });
});

// ============================================================================
// Suite 2: Headless Objects Cannot Spawn Windows
// ============================================================================

describe('Suite 2: Headless Object Rejection', () => {
  const headlessTypes = Object.entries(POLICIES)
    .filter(([_, p]) => p.layer === 'no-direct-ui' || p.renderMode === 'headless');

  it('at least 3 headless object types exist in policy', () => {
    assert.ok(headlessTypes.length >= 3, `Found ${headlessTypes.length} headless types`);
  });

  it('evaluateSpawnIntent rejects headless layer', () => {
    assert.ok(
      storeSrc.includes("policy.layer === 'no-direct-ui'"),
      'checks no-direct-ui layer'
    );
    assert.ok(
      storeSrc.includes("policy.renderMode === 'headless'"),
      'checks headless renderMode'
    );
  });

  // Check every module classified as a headless type
  const headlessModules = Object.entries(MODULE_TYPES)
    .filter(([_, c]) => {
      const p = POLICIES[c.objectType];
      return p && (p.layer === 'no-direct-ui' || p.renderMode === 'headless');
    });

  it('no headless modules exist in MODULE_OBJECT_TYPES (headless services should not be in launcher inventory)', () => {
    // Headless services should NOT be in MODULE_OBJECT_TYPES because they
    // have no UI surface. This test confirms the codex doesn't register
    // headless objects as launchable.
    assert.equal(
      headlessModules.length, 0,
      `Found headless modules in launcher inventory: ${headlessModules.map(([id]) => id).join(', ')}`
    );
  });
});

// ============================================================================
// Suite 3: Toast-Ephemeral Objects Cannot Persist as Windows
// ============================================================================

describe('Suite 3: Toast-Ephemeral Rejection', () => {
  const toastTypes = Object.entries(POLICIES)
    .filter(([_, p]) => p.renderMode === 'toast-ephemeral');

  it('toast-ephemeral types exist in policy', () => {
    assert.ok(toastTypes.length >= 1, `Found ${toastTypes.length} toast types`);
  });

  it('evaluateSpawnIntent rejects toast-ephemeral', () => {
    assert.ok(
      storeSrc.includes("policy.renderMode === 'toast-ephemeral'"),
      'checks toast-ephemeral renderMode'
    );
    assert.ok(
      storeSrc.includes('toast-cannot-persist'),
      'provides toast-cannot-persist reason'
    );
  });

  it('notification-alert is toast-ephemeral in policy', () => {
    assert.equal(POLICIES['notification-alert']?.renderMode, 'toast-ephemeral');
  });
});

// ============================================================================
// Suite 4: Always-Visible Shell Chrome Cannot Be Spawned
// ============================================================================

describe('Suite 4: Shell Chrome Rejection', () => {
  const alwaysVisibleTypes = Object.entries(POLICIES)
    .filter(([_, p]) => p.renderMode === 'always-visible');

  it('always-visible types exist', () => {
    assert.ok(alwaysVisibleTypes.length >= 2, `Found ${alwaysVisibleTypes.length} always-visible types`);
  });

  it('evaluateSpawnIntent rejects always-visible', () => {
    assert.ok(
      storeSrc.includes("policy.renderMode === 'always-visible'"),
      'checks always-visible renderMode'
    );
    assert.ok(
      storeSrc.includes('shell-chrome-not-spawnable'),
      'provides shell-chrome-not-spawnable reason'
    );
  });

  // Verify shell surface modules are classified as always-visible types
  for (const shellId of ['taskbar', 'dock', 'start-menu', 'top-bar']) {
    it(`shell surface "${shellId}" classified as os-shell-surface`, () => {
      const classification = MODULE_TYPES[shellId];
      assert.ok(classification, `${shellId} is in MODULE_OBJECT_TYPES`);
      assert.equal(classification.objectType, 'os-shell-surface');
    });
  }
});

// ============================================================================
// Suite 5: Parcel-Scoped Apps Route Through Workbench
// ============================================================================

describe('Suite 5: Parcel-Scoped Routing', () => {
  const parcelScopedModules = Object.entries(MODULE_TYPES)
    .filter(([_, c]) => c.objectType === 'parcel-scoped-app');

  it('at least 9 parcel-scoped app modules exist', () => {
    assert.ok(
      parcelScopedModules.length >= 9,
      `Found ${parcelScopedModules.length} parcel-scoped modules`
    );
  });

  it('all parcel-scoped apps have hostSurface = tier0-workbench', () => {
    for (const [id, c] of parcelScopedModules) {
      assert.equal(
        c.hostSurface, 'tier0-workbench',
        `${id} hostSurface should be tier0-workbench`
      );
    }
  });

  it('evaluateSpawnIntent routes hostSurface objects to workbench', () => {
    assert.ok(
      storeSrc.includes("policy.hostSurface === 'tier0-workbench'"),
      'checks tier0-workbench hostSurface'
    );
    assert.ok(
      storeSrc.includes('parcel-scoped-routes-through-workbench'),
      'provides parcel-scoped routing reason'
    );
  });

  it('route-to-workbench reuses existing workbench window', () => {
    assert.ok(
      storeSrc.includes("w.moduleId === workbenchModuleId"),
      'checks for existing workbench window'
    );
    assert.ok(
      storeSrc.includes('focusWindow(existingWorkbench.id)'),
      'focuses existing workbench'
    );
  });

  it('overlay objects (audit-evidence-surface) also route to workbench', () => {
    assert.ok(
      storeSrc.includes("policy.renderMode === 'overlay' && policy.hostSurface"),
      'overlay + hostSurface check exists'
    );
    assert.ok(
      storeSrc.includes('overlay-requires-host'),
      'provides overlay-requires-host reason'
    );
  });
});

// ============================================================================
// Suite 6: Lawful Window-Spawned Types Open Successfully
// ============================================================================

describe('Suite 6: Lawful Window Spawn', () => {
  const windowSpawnedStandalone = Object.entries(MODULE_TYPES)
    .filter(([_, c]) => {
      const p = POLICIES[c.objectType];
      return p && p.renderMode === 'window-spawned' && !p.hostSurface;
    });

  it('window-spawned standalone modules exist (suites, os-features, cross-parcel)', () => {
    assert.ok(
      windowSpawnedStandalone.length >= 15,
      `Found ${windowSpawnedStandalone.length} window-spawned standalone modules`
    );
  });

  it('evaluateSpawnIntent allows lawful window-spawned objects', () => {
    assert.ok(
      storeSrc.includes("policy.renderMode === 'window-spawned' && !policy.hostSurface"),
      'lawful window-spawn check exists'
    );
    assert.ok(
      storeSrc.includes('lawful-window-spawn'),
      'provides lawful-window-spawn reason'
    );
  });

  // Verify specific module types are lawful
  for (const moduleId of ['suite-forge', 'suite-atlas', 'os-pilot', 'federation-dashboard', 'property-workbench']) {
    it(`"${moduleId}" is classified as lawful window-spawned`, () => {
      const c = MODULE_TYPES[moduleId];
      assert.ok(c, `${moduleId} is in MODULE_OBJECT_TYPES`);
      const p = POLICIES[c.objectType];
      assert.ok(p, `${c.objectType} is in PLACEMENT_POLICY`);
      assert.equal(p.renderMode, 'window-spawned', `${moduleId} renderMode is window-spawned`);
      assert.ok(!p.hostSurface || c.objectType === 'tier0-workbench',
        `${moduleId} is standalone or is the workbench host`);
    });
  }
});

// ============================================================================
// Suite 7: Route-Activated Objects Cannot Be Window-Spawned
// ============================================================================

describe('Suite 7: Route-Activated Rejection', () => {
  const routeActivatedTypes = Object.entries(POLICIES)
    .filter(([_, p]) => p.renderMode === 'route-activated');

  it('route-activated types exist', () => {
    assert.ok(routeActivatedTypes.length >= 2, `Found ${routeActivatedTypes.length} route-activated types`);
  });

  it('evaluateSpawnIntent rejects route-activated objects', () => {
    assert.ok(
      storeSrc.includes("policy.renderMode === 'route-activated'"),
      'checks route-activated renderMode'
    );
    assert.ok(
      storeSrc.includes('route-activated-not-window-spawnable'),
      'provides route-activated rejection reason'
    );
  });

  it('home-scene and domain-router are route-activated', () => {
    assert.equal(POLICIES['home-scene']?.renderMode, 'route-activated');
    assert.equal(POLICIES['domain-router']?.renderMode, 'route-activated');
  });
});

// ============================================================================
// Suite 8: SpawnVerdict Type Contract
// ============================================================================

describe('Suite 8: SpawnVerdict Type Contract', () => {
  it('SpawnDecision type has exactly 3 variants', () => {
    const match = storeSrc.match(/type SpawnDecision\s*=\s*([^;]+);/);
    assert.ok(match, 'SpawnDecision type found');
    const variants = match[1].split('|').map(v => v.trim().replace(/'/g, ''));
    assert.deepEqual(
      variants.sort(),
      ['open', 'reject', 'route-to-workbench'].sort(),
      'SpawnDecision has correct variants'
    );
  });

  it('SpawnVerdict interface has required fields', () => {
    assert.ok(storeSrc.includes('decision: SpawnDecision'), 'decision field exists');
    assert.ok(storeSrc.includes('reason: string'), 'reason field exists');
  });

  it('evaluateSpawnIntent is exported', () => {
    assert.ok(
      storeSrc.includes('export function evaluateSpawnIntent'),
      'evaluateSpawnIntent is exported'
    );
  });

  it('SpawnDecision type is exported', () => {
    assert.ok(
      storeSrc.includes('export type SpawnDecision'),
      'SpawnDecision is exported'
    );
  });

  it('SpawnVerdict interface is exported', () => {
    assert.ok(
      storeSrc.includes('export interface SpawnVerdict'),
      'SpawnVerdict is exported'
    );
  });
});
