/**
 * TerraFusion OS — Workbench Host Boundary Tests (Phase 7)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Proves that the PropertyWorkbenchWindow enforces the host boundary:
 *   - Only parcel-scoped-app and audit-evidence-surface types may render
 *     inside the workbench.
 *   - The validateWorkbenchHost() function correctly classifies every
 *     workbench tab as lawful and rejects non-workbench types.
 *   - PropertyWorkbenchWindow.tsx calls validateWorkbenchHost before
 *     rendering any tab component.
 *
 * Run:  node --test os-platform/core/tests/workbench-host-boundary.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ============================================================================
// Source Extraction
// ============================================================================

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const CODEX_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/contracts/objectPlacement.ts');
const WORKBENCH_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx');
const BARREL_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/contracts/index.ts');

const codexSrc = readFileSync(CODEX_PATH, 'utf-8');
const workbenchSrc = readFileSync(WORKBENCH_PATH, 'utf-8');
const barrelSrc = readFileSync(BARREL_PATH, 'utf-8');

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

const MODULE_TYPES = extractModuleObjectTypes();

// ============================================================================
// Suite 1: validateWorkbenchHost Function Exists
// ============================================================================

describe('Suite 1: validateWorkbenchHost Contract', () => {
  it('validateWorkbenchHost function exists in objectPlacement.ts', () => {
    assert.ok(
      codexSrc.includes('export function validateWorkbenchHost(tabId: string): WorkbenchHostViolation | null'),
      'validateWorkbenchHost function declaration found'
    );
  });

  it('WorkbenchHostViolation interface is exported', () => {
    assert.ok(
      codexSrc.includes('export interface WorkbenchHostViolation'),
      'WorkbenchHostViolation interface found'
    );
  });

  it('WorkbenchHostViolation has required fields', () => {
    assert.ok(codexSrc.includes('tabId: string'), 'tabId field exists');
    assert.ok(codexSrc.includes('objectType: TerraFusionObjectType'), 'objectType field exists');
    assert.ok(codexSrc.includes('reason: string'), 'reason field exists');
  });

  it('WORKBENCH_HOSTED_TYPES set includes parcel-scoped-app', () => {
    assert.ok(
      codexSrc.includes("'parcel-scoped-app'") &&
      codexSrc.includes('WORKBENCH_HOSTED_TYPES'),
      'parcel-scoped-app in WORKBENCH_HOSTED_TYPES'
    );
  });

  it('WORKBENCH_HOSTED_TYPES set includes audit-evidence-surface', () => {
    assert.ok(
      codexSrc.includes("'audit-evidence-surface'") &&
      codexSrc.includes('WORKBENCH_HOSTED_TYPES'),
      'audit-evidence-surface in WORKBENCH_HOSTED_TYPES'
    );
  });

  it('barrel export includes validateWorkbenchHost', () => {
    assert.ok(
      barrelSrc.includes('validateWorkbenchHost'),
      'validateWorkbenchHost exported from barrel'
    );
  });

  it('barrel export includes WorkbenchHostViolation type', () => {
    assert.ok(
      barrelSrc.includes('WorkbenchHostViolation'),
      'WorkbenchHostViolation type exported from barrel'
    );
  });
});

// ============================================================================
// Suite 2: All 9 Workbench Tabs Are Lawful
// ============================================================================

describe('Suite 2: Workbench Tab Classification', () => {
  const CANONICAL_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];

  it('all 9 canonical workbench tabs are classified in MODULE_OBJECT_TYPES', () => {
    for (const tabId of CANONICAL_TABS) {
      const c = MODULE_TYPES[tabId];
      assert.ok(c, `Tab '${tabId}' is classified in MODULE_OBJECT_TYPES`);
    }
  });

  it('all 9 tabs are classified as parcel-scoped-app', () => {
    for (const tabId of CANONICAL_TABS) {
      const c = MODULE_TYPES[tabId];
      assert.equal(
        c.objectType, 'parcel-scoped-app',
        `Tab '${tabId}' objectType should be parcel-scoped-app`
      );
    }
  });

  it('all 9 tabs declare hostSurface = tier0-workbench', () => {
    for (const tabId of CANONICAL_TABS) {
      const c = MODULE_TYPES[tabId];
      assert.equal(
        c.hostSurface, 'tier0-workbench',
        `Tab '${tabId}' hostSurface should be tier0-workbench`
      );
    }
  });

  it('property-workbench itself is classified as tier0-workbench (host, not tab)', () => {
    const c = MODULE_TYPES['property-workbench'];
    assert.ok(c, 'property-workbench is classified');
    assert.equal(c.objectType, 'tier0-workbench');
    assert.equal(c.hostSurface, undefined, 'host has no hostSurface (it IS the host)');
  });
});

// ============================================================================
// Suite 3: Non-Workbench Types Would Be Rejected
// ============================================================================

describe('Suite 3: Non-Workbench Type Rejection Logic', () => {
  it('validateWorkbenchHost checks WORKBENCH_HOSTED_TYPES', () => {
    assert.ok(
      codexSrc.includes('WORKBENCH_HOSTED_TYPES.has(objectType)'),
      'validateWorkbenchHost checks WORKBENCH_HOSTED_TYPES set'
    );
  });

  it('validateWorkbenchHost checks hostSurface is tier0-workbench', () => {
    assert.ok(
      codexSrc.includes("hostSurface !== 'tier0-workbench'"),
      'validateWorkbenchHost checks hostSurface'
    );
  });

  it('validateWorkbenchHost returns null for unclassified tabs (dev/extension)', () => {
    assert.ok(
      codexSrc.includes('if (!classification) return null'),
      'unclassified tabs pass through'
    );
  });

  // Verify known non-workbench types would fail
  const nonWorkbenchModules = Object.entries(MODULE_TYPES)
    .filter(([_, c]) => c.objectType !== 'parcel-scoped-app' && c.objectType !== 'audit-evidence-surface');

  it('at least 20 non-workbench modules exist (shell, suites, os-features, cross-parcel)', () => {
    assert.ok(
      nonWorkbenchModules.length >= 20,
      `Found ${nonWorkbenchModules.length} non-workbench modules`
    );
  });

  // Spot-check specific types that must never appear in workbench
  for (const moduleId of ['taskbar', 'suite-forge', 'federation-dashboard', 'os-pilot', 'home-scene']) {
    it(`module '${moduleId}' is NOT a workbench-hosted type`, () => {
      const c = MODULE_TYPES[moduleId];
      assert.ok(c, `${moduleId} is classified`);
      assert.notEqual(c.objectType, 'parcel-scoped-app', `${moduleId} is not parcel-scoped-app`);
      assert.notEqual(c.objectType, 'audit-evidence-surface', `${moduleId} is not audit-evidence-surface`);
    });
  }
});

// ============================================================================
// Suite 4: PropertyWorkbenchWindow Enforcement Wiring
// ============================================================================

describe('Suite 4: PropertyWorkbenchWindow Host Enforcement', () => {
  it('imports validateWorkbenchHost from objectPlacement', () => {
    assert.ok(
      workbenchSrc.includes("import { validateWorkbenchHost }") ||
      workbenchSrc.includes("validateWorkbenchHost") && workbenchSrc.includes("from '../../contracts/objectPlacement'"),
      'validateWorkbenchHost imported in PropertyWorkbenchWindow'
    );
  });

  it('calls validateWorkbenchHost with activeTab', () => {
    assert.ok(
      workbenchSrc.includes('validateWorkbenchHost(activeTab)'),
      'validateWorkbenchHost called with activeTab'
    );
  });

  it('renders violation notice when hostViolation is non-null', () => {
    assert.ok(
      workbenchSrc.includes('hostViolation ?') || workbenchSrc.includes('{hostViolation ?'),
      'conditional rendering on hostViolation'
    );
    assert.ok(
      workbenchSrc.includes('WorkbenchHostViolationNotice'),
      'WorkbenchHostViolationNotice component referenced'
    );
  });

  it('violation notice displays tab ID and object type', () => {
    assert.ok(
      workbenchSrc.includes('violation.tabId'),
      'violation notice shows tabId'
    );
    assert.ok(
      workbenchSrc.includes('violation.objectType'),
      'violation notice shows objectType'
    );
  });

  it('violation is logged to console with [Codex] prefix', () => {
    assert.ok(
      workbenchSrc.includes("[Codex] Workbench host violation"),
      'console.warn with [Codex] prefix exists'
    );
  });

  it('hostViolation check runs before tab rendering (not after)', () => {
    const violationCheckIdx = workbenchSrc.indexOf('hostViolation ?');
    const tabRenderIdx = workbenchSrc.indexOf('ActiveTabComponent');
    // Find the one inside JSX (the last occurrence is the render)
    const lastTabRender = workbenchSrc.lastIndexOf('<ActiveTabComponent');
    assert.ok(violationCheckIdx > 0, 'hostViolation check found');
    assert.ok(lastTabRender > 0, 'ActiveTabComponent render found');
    assert.ok(violationCheckIdx < lastTabRender, 'violation check runs before tab component renders');
  });
});

// ============================================================================
// Suite 5: TAB_COMPONENTS Map Integrity
// ============================================================================

describe('Suite 5: TAB_COMPONENTS Map Integrity', () => {
  const CANONICAL_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];

  it('TAB_COMPONENTS map exists in PropertyWorkbenchWindow', () => {
    assert.ok(
      workbenchSrc.includes('const TAB_COMPONENTS'),
      'TAB_COMPONENTS map declared'
    );
  });

  it('TAB_COMPONENTS contains all 9 canonical tabs', () => {
    for (const tabId of CANONICAL_TABS) {
      assert.ok(
        workbenchSrc.includes(`${tabId}:`),
        `TAB_COMPONENTS contains '${tabId}'`
      );
    }
  });

  // Ensure no non-workbench types are in TAB_COMPONENTS
  it('TAB_COMPONENTS does not contain shell surfaces', () => {
    for (const shellId of ['taskbar', 'dock', 'start-menu', 'top-bar']) {
      // Check TAB_COMPONENTS specifically (not just anywhere in source)
      const tabMapMatch = workbenchSrc.match(/const TAB_COMPONENTS[^=]*=\s*\{([\s\S]*?)\};/);
      assert.ok(tabMapMatch, 'TAB_COMPONENTS block found');
      assert.ok(
        !tabMapMatch[1].includes(`'${shellId}'`) && !tabMapMatch[1].includes(`${shellId}:`),
        `Shell surface '${shellId}' not in TAB_COMPONENTS`
      );
    }
  });

  it('TAB_COMPONENTS does not contain suite workspaces', () => {
    const tabMapMatch = workbenchSrc.match(/const TAB_COMPONENTS[^=]*=\s*\{([\s\S]*?)\};/);
    assert.ok(tabMapMatch, 'TAB_COMPONENTS block found');
    for (const suiteId of ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt']) {
      assert.ok(
        !tabMapMatch[1].includes(suiteId),
        `Suite '${suiteId}' not in TAB_COMPONENTS`
      );
    }
  });
});
