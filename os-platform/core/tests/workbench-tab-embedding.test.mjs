/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — Workbench Tab Embedding Test
 *
 * Enforces that PropertyWorkbenchWindow.tsx (desktop window adapter)
 * and PropertyWorkbench.tsx (route-based) both contain all 9
 * canonical workbench tabs from VALID_WORKBENCH_TAB_IDS.
 *
 * Single source of truth: suiteRegistry.ts VALID_WORKBENCH_TAB_IDS
 * Canonical order: summary, forge, atlas, dais, clerk, treasury, audit, dossier, pilot
 *
 * Static analysis test — reads source files, checks tab definitions.
 * ═══════════════════════════════════════════════════════════════
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..', '..', '..');
const SHELL = resolve(REPO, 'frontend/apps/os-shell/src');

// ============================================================================
// Canonical Tab IDs — extracted from suiteRegistry.ts at build time
// ============================================================================

const CANONICAL_TAB_IDS = [
  'summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot',
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract tab IDs from a TAB_COMPONENTS or similar Record<string, ...> block.
 * Looks for lines like: `  tabId: Component,`
 */
function extractRecordKeys(source, recordName) {
  // Match: const RECORD_NAME: Record<...> = { ... };
  // Find the block between { and }
  const re = new RegExp(`const\\s+${recordName}[^{]*\\{([^}]+)\\}`, 's');
  const m = re.exec(source);
  if (!m) return [];

  const block = m[1];
  // Extract keys: `  keyName: SomeValue,`
  const keyRe = /^\s*(\w+)\s*:/gm;
  const keys = [];
  let km;
  while ((km = keyRe.exec(block)) !== null) {
    keys.push(km[1]);
  }
  return keys;
}

/**
 * Extract tab IDs from a TABS or WORKBENCH_TABS array definition.
 * Looks for `id: 'tabId'` within array elements.
 */
function extractTabArrayIds(source, arrayName) {
  // Find the array block
  const re = new RegExp(`const\\s+${arrayName}[^\\[]*\\[([\\s\\S]*?)\\]\\s*(?:as\\s+const)?;`, 's');
  const m = re.exec(source);
  if (!m) return [];

  const block = m[1];
  // Extract id values: `id: 'tabId'`
  const idRe = /id:\s*['"](\w+)['"]/g;
  const ids = [];
  let im;
  while ((im = idRe.exec(block)) !== null) {
    ids.push(im[1]);
  }
  return ids;
}

// ============================================================================
// Verify canonical IDs match suiteRegistry.ts source
// ============================================================================

describe('Canonical Tab ID Source of Truth', () => {
  it('VALID_WORKBENCH_TAB_IDS in suiteRegistry.ts matches expected canonical list', () => {
    const registryPath = resolve(SHELL, 'config/suiteRegistry.ts');
    const source = readFileSync(registryPath, 'utf-8');

    // Find the start of the array value (skip the type annotation `[]`)
    const startIdx = source.indexOf('VALID_WORKBENCH_TAB_IDS');
    assert.ok(startIdx >= 0, 'VALID_WORKBENCH_TAB_IDS not found in suiteRegistry.ts');

    // Find the `= [` assignment, not the `[]` in the type
    const eqIdx = source.indexOf('=', startIdx);
    assert.ok(eqIdx > startIdx, 'No assignment found for VALID_WORKBENCH_TAB_IDS');

    const bracketStart = source.indexOf('[', eqIdx);
    const bracketEnd = source.indexOf(']', bracketStart + 1);
    assert.ok(bracketStart > 0 && bracketEnd > bracketStart, 'Could not find array brackets');

    const arrayContent = source.slice(bracketStart + 1, bracketEnd);
    const idRe = /['"](\w+)['"]/g;
    const ids = [];
    let im;
    while ((im = idRe.exec(arrayContent)) !== null) {
      ids.push(im[1]);
    }

    assert.deepEqual(ids, CANONICAL_TAB_IDS,
      `suiteRegistry.ts VALID_WORKBENCH_TAB_IDS does not match canonical list.\n` +
      `Expected: [${CANONICAL_TAB_IDS.join(', ')}]\n` +
      `Got:      [${ids.join(', ')}]`
    );
  });
});

// ============================================================================
// PropertyWorkbenchWindow.tsx — Desktop Window Adapter
// ============================================================================

describe('PropertyWorkbenchWindow Tab Embedding', () => {
  const windowPath = resolve(SHELL, 'pages/workbench/PropertyWorkbenchWindow.tsx');
  const source = readFileSync(windowPath, 'utf-8');

  it('TAB_COMPONENTS has all 9 canonical tab entries', () => {
    const keys = extractRecordKeys(source, 'TAB_COMPONENTS');

    assert.equal(keys.length, 9,
      `TAB_COMPONENTS has ${keys.length} entries, expected 9.\nFound: [${keys.join(', ')}]`
    );

    for (const tabId of CANONICAL_TAB_IDS) {
      assert.ok(keys.includes(tabId),
        `TAB_COMPONENTS missing tab: "${tabId}". Found: [${keys.join(', ')}]`
      );
    }
  });

});

// ============================================================================
// PropertyWorkbenchSurface.tsx — Shared Canonical Workbench Surface
// ============================================================================

describe('PropertyWorkbenchSurface Tab Embedding', () => {
  const surfacePath = resolve(SHELL, 'pages/workbench/PropertyWorkbenchSurface.tsx');
  const source = readFileSync(surfacePath, 'utf-8');

  it('WORKBENCH_TABS has all 9 canonical tab entries in correct order', () => {
    const ids = extractTabArrayIds(source, 'WORKBENCH_TABS');

    assert.equal(ids.length, 9,
      `WORKBENCH_TABS has ${ids.length} entries, expected 9.\nFound: [${ids.join(', ')}]`
    );

    assert.deepEqual(ids, CANONICAL_TAB_IDS,
      `WORKBENCH_TABS order does not match canonical order.\n` +
      `Expected: [${CANONICAL_TAB_IDS.join(', ')}]\n` +
      `Got:      [${ids.join(', ')}]`
    );
  });

  it('renders the full 9-tab Workbench by default without forward-staged presentation gating', () => {
    assert.doesNotMatch(
      source,
      /applyForwardStagedGate\(\s*WORKBENCH_TABS\.filter/s,
      'PropertyWorkbenchSurface must not hide canonical Workbench tabs from the rendered rail',
    );
    assert.match(
      source,
      /const filteredTabs[\s\S]*WORKBENCH_TABS\.filter\(\(tab\) => visibleTabs\.includes\(tab\.id\)\)/,
      'PropertyWorkbenchSurface must render from the full role-visible canonical tab list',
    );
  });
});

describe('Workbench role visibility source', () => {
  const rolesPath = resolve(SHELL, 'config/workbenchRoles.ts');
  const source = readFileSync(rolesPath, 'utf-8');

  it('ALL_TAB_SLUGS preserves all 9 canonical tabs in order', () => {
    const m = source.match(/ALL_TAB_SLUGS[^=]*=\s*\[([\s\S]*?)\]\s+as const/);
    assert.ok(m, 'ALL_TAB_SLUGS not found in workbenchRoles.ts');
    const ids = [...m[1].matchAll(/['"](\w+)['"]/g)].map((match) => match[1]);
    assert.deepEqual(
      ids,
      CANONICAL_TAB_IDS,
      `ALL_TAB_SLUGS must not drop Workbench tabs.\nExpected: [${CANONICAL_TAB_IDS.join(', ')}]\nGot:      [${ids.join(', ')}]`,
    );
  });
});

// ============================================================================
// PropertyWorkbench.tsx — Route Bridge Only
// ============================================================================

describe('PropertyWorkbench Route Bridge', () => {
  const workbenchPath = resolve(SHELL, 'pages/workbench/PropertyWorkbench.tsx');
  const source = readFileSync(workbenchPath, 'utf-8');

  it('does not own a second canonical tab array or route Outlet host', () => {
    assert.doesNotMatch(
      source,
      /const\s+WORKBENCH_TABS\b/,
      'PropertyWorkbench route bridge must not own a second WORKBENCH_TABS host array',
    );
    assert.doesNotMatch(
      source,
      /<\s*Outlet\b/,
      'PropertyWorkbench route bridge must not render nested tab routes as a second host',
    );
  });

  it('passes the routed parcel and tab into the canonical Workbench through Cortex activation', () => {
    assert.match(
      source,
      /activateModule\s*\(\s*['"]property-workbench['"]\s*,/,
      'PropertyWorkbench route bridge must activate the canonical Workbench through activateModule',
    );
    assert.match(
      source,
      /metadata:\s*\{\s*parcelId,\s*tabId:\s*routedTabId/s,
      'PropertyWorkbench route bridge must pass parcel/tab context as activation metadata',
    );
    assert.doesNotMatch(
      source,
      /openWorkbenchWindow/,
      'PropertyWorkbench route bridge must not bypass Cortex with openWorkbenchWindow',
    );
    for (const tabId of CANONICAL_TAB_IDS) {
      assert.ok(source.includes(`'${tabId}'`), `route bridge VALID_ROUTE_TABS missing "${tabId}"`);
    }
  });

  it('does not apply presentation gates in the bridge', () => {
    assert.doesNotMatch(
      source,
      /applyForwardStagedGate/,
      'route bridge must not own rendered-tab presentation gating',
    );
  });
});

// ============================================================================
// Tab Component Files Exist
// ============================================================================

describe('Workbench Tab Component Files', () => {
  const tabDir = resolve(SHELL, 'pages/workbench/tabs');

  for (const tabId of CANONICAL_TAB_IDS) {
    const componentName = `Property${tabId.charAt(0).toUpperCase()}${tabId.slice(1)}`;
    it(`${componentName}.tsx exists`, () => {
      const filePath = resolve(tabDir, `${componentName}.tsx`);
      try {
        readFileSync(filePath);
      } catch {
        assert.fail(`Missing tab component: ${componentName}.tsx`);
      }
    });
  }
});
