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

  it('TABS array has all 9 canonical tab entries in correct order', () => {
    const ids = extractTabArrayIds(source, 'TABS');

    assert.equal(ids.length, 9,
      `TABS array has ${ids.length} entries, expected 9.\nFound: [${ids.join(', ')}]`
    );

    assert.deepEqual(ids, CANONICAL_TAB_IDS,
      `TABS array order does not match canonical order.\n` +
      `Expected: [${CANONICAL_TAB_IDS.join(', ')}]\n` +
      `Got:      [${ids.join(', ')}]`
    );
  });
});

// ============================================================================
// PropertyWorkbench.tsx — Route-Based Workbench
// ============================================================================

describe('PropertyWorkbench Route Tab Embedding', () => {
  const workbenchPath = resolve(SHELL, 'pages/workbench/PropertyWorkbench.tsx');
  const source = readFileSync(workbenchPath, 'utf-8');

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

  it('tabPathMap includes all 8 non-summary tab paths', () => {
    // summary is the default (empty path), so tabPathMap has 8 entries
    const re = /tabPathMap[^{]*\{([^}]+)\}/s;
    const m = re.exec(source);
    assert.ok(m, 'tabPathMap not found in PropertyWorkbench.tsx');

    const nonSummaryTabs = CANONICAL_TAB_IDS.filter((id) => id !== 'summary');
    for (const tabId of nonSummaryTabs) {
      assert.ok(m[1].includes(tabId),
        `tabPathMap missing path for "${tabId}"`
      );
    }
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
