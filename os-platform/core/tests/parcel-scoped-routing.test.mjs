/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — Parcel-Scoped Routing Test
 *
 * Enforces the constitutional rule: parcel-scoped actions MUST
 * route to Workbench tabs, never standalone windows.
 *
 * Checks:
 * 1. suiteRegistry.ts exports workbench href utility functions
 * 2. Each suite with workbenchTab: true has a valid workbenchTarget
 * 3. workbenchTarget tabIds are valid VALID_WORKBENCH_TAB_IDS members
 *
 * Static analysis test — reads source files, checks routing contracts.
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
// Canonical Tab IDs (must match suiteRegistry.ts)
// ============================================================================

const CANONICAL_TAB_IDS = [
  'summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot',
];

// ============================================================================
// Tests
// ============================================================================

describe('Parcel-Scoped Routing Contracts', () => {
  const registryPath = resolve(SHELL, 'config/suiteRegistry.ts');
  const registrySource = readFileSync(registryPath, 'utf-8');

  it('suiteRegistry exports getWorkbenchHref or equivalent routing function', () => {
    // Check for workbench href utility — could be getWorkbenchHref, getWorkbenchHrefById, etc.
    const hrefPatterns = [
      'getWorkbenchHref',
      'getWorkbenchHrefById',
      'getWorkbenchHrefWithContext',
      'buildWorkbenchUrl',
      'workbenchHref',
    ];

    const hasHrefUtil = hrefPatterns.some((p) => registrySource.includes(p));

    // Also check for an exported function that builds /property/ URLs
    const hasPropertyRoute = /export\s+(?:function|const)\s+\w+.*\/property\//s.test(registrySource);

    assert.ok(
      hasHrefUtil || hasPropertyRoute,
      `suiteRegistry.ts does not export a workbench href utility function.\n` +
      `Expected one of: ${hrefPatterns.join(', ')}\n` +
      `Or an exported function that builds /property/ URLs.`
    );
  });

  it('all constitutional suites with workbenchTab: true have a workbenchTarget', () => {
    // Extract the CONSTITUTIONAL_SUITES array content
    const arrayRe = /CONSTITUTIONAL_SUITES[^[]*\[([\s\S]*?)\]\s*as\s*const/;
    const arrayMatch = arrayRe.exec(registrySource);
    assert.ok(arrayMatch, 'CONSTITUTIONAL_SUITES array not found');

    const arrayContent = arrayMatch[1];

    // Split into individual suite objects by finding `id:` boundaries
    // Each suite starts with `{` and contains `id:` — use a simpler approach:
    // find all id + workbenchTab + workbenchTarget patterns
    const suiteRe = /id:\s*['"](\w+)['"][\s\S]*?workbenchTab:\s*(true|false)/g;
    let m;
    const suitesWithWorkbenchTab = [];

    while ((m = suiteRe.exec(arrayContent)) !== null) {
      if (m[2] === 'true') {
        suitesWithWorkbenchTab.push(m[1]);
      }
    }

    assert.ok(suitesWithWorkbenchTab.length > 0,
      'No suites found with workbenchTab: true in CONSTITUTIONAL_SUITES'
    );

    // For each suite with workbenchTab: true, verify workbenchTarget with tabId
    for (const suiteId of suitesWithWorkbenchTab) {
      // Find this suite's block and its workbenchTarget
      const targetRe = new RegExp(
        `id:\\s*['"]${suiteId}['"][\\s\\S]*?workbenchTarget:\\s*\\{\\s*tabId:\\s*['"]([\\w]+)['"]`,
      );
      const tm = targetRe.exec(arrayContent);

      assert.ok(tm,
        `Suite "${suiteId}" has workbenchTab: true but no workbenchTarget with tabId`
      );

      // tabId must be a valid canonical tab
      assert.ok(
        CANONICAL_TAB_IDS.includes(tm[1]),
        `Suite "${suiteId}" workbenchTarget.tabId "${tm[1]}" is not a valid canonical tab.\n` +
        `Valid tabs: [${CANONICAL_TAB_IDS.join(', ')}]`
      );
    }
  });

  it('CONSTITUTIONAL_SUITES has exactly 5 entries', () => {
    // Count suite definitions — look for id: 'xxx' within the array
    const re = /CONSTITUTIONAL_SUITES[^[]*\[([\s\S]*?)\]\s*as\s*const/;
    const m = re.exec(registrySource);
    assert.ok(m, 'CONSTITUTIONAL_SUITES array not found');

    const idMatches = m[1].match(/id:\s*['"]\w+['"]/g) || [];
    assert.equal(idMatches.length, 5,
      `Expected 5 constitutional suites, found ${idMatches.length}`
    );
  });

  it('each suite home uses ParcelContextBanner with correct suiteTabId', () => {
    const SUITES_DIR = resolve(SHELL, 'pages/suites');

    const suiteHomes = [
      { file: 'ForgeSuiteHome.tsx', expectedTabId: 'forge' },
      { file: 'AtlasSuiteHome.tsx', expectedTabId: 'atlas' },
      { file: 'DaisSuiteHome.tsx', expectedTabId: 'dais' },
      { file: 'DossierSuiteHome.tsx', expectedTabId: 'dossier' },
      { file: 'GptSuiteHome.tsx', expectedTabId: 'pilot' }, // GPT routes to pilot tab per registry
    ];

    for (const { file, expectedTabId } of suiteHomes) {
      const filePath = resolve(SUITES_DIR, file);
      let source;
      try {
        source = readFileSync(filePath, 'utf-8');
      } catch {
        assert.fail(`Missing suite home: ${file}`);
        continue;
      }

      // Check for ParcelContextBanner import
      assert.ok(
        source.includes('ParcelContextBanner'),
        `${file} does not import or use ParcelContextBanner`
      );

      // Check suiteTabId prop matches expected
      const tabIdRe = /suiteTabId\s*=\s*["'](\w+)["']/;
      const tm = tabIdRe.exec(source);
      if (tm) {
        assert.equal(tm[1], expectedTabId,
          `${file} ParcelContextBanner suiteTabId="${tm[1]}" but expected "${expectedTabId}"`
        );
      }
      // If no explicit suiteTabId found, that's OK — it may be passed as a variable
    }
  });
});
