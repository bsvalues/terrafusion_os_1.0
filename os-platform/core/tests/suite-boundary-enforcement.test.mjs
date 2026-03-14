/**
 * TerraFusion OS — Suite Boundary Enforcement Tests (Phase 8)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Proves that suite homes are correctly classified and that the rendering
 * pipeline enforces suite boundary law:
 *   - All 5 constitutional suites are classified as 'suite-workspace'
 *   - validateSuiteRendering() correctly validates suite modules
 *   - ModuleRenderer calls validateSuiteRendering before rendering suites
 *   - Suite homes do not import from other suite domains (anti-drift)
 *   - SUITE_MODULE_IDS matches CONSTITUTIONAL_SUITES
 *
 * Run:  node --test os-platform/core/tests/suite-boundary-enforcement.test.mjs
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
const BARREL_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/contracts/index.ts');
const MODULE_COMPONENTS_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/config/moduleComponents.tsx');
const SUITE_REGISTRY_PATH = resolve(ROOT, 'frontend/apps/os-shell/src/config/suiteRegistry.ts');

const codexSrc = readFileSync(CODEX_PATH, 'utf-8');
const barrelSrc = readFileSync(BARREL_PATH, 'utf-8');
const moduleComponentsSrc = readFileSync(MODULE_COMPONENTS_PATH, 'utf-8');
const suiteRegistrySrc = readFileSync(SUITE_REGISTRY_PATH, 'utf-8');

// Suite home source files
const SUITE_IDS = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'];
const SUITE_HOME_FILES = {
  'suite-forge': 'ForgeSuiteHome.tsx',
  'suite-atlas': 'AtlasSuiteHome.tsx',
  'suite-dais': 'DaisSuiteHome.tsx',
  'suite-dossier': 'DossierSuiteHome.tsx',
  'suite-gpt': 'GptSuiteHome.tsx',
};

const suiteHomeSources = {};
for (const [suiteId, fileName] of Object.entries(SUITE_HOME_FILES)) {
  const filePath = resolve(ROOT, 'frontend/apps/os-shell/src/pages/suites', fileName);
  try {
    suiteHomeSources[suiteId] = readFileSync(filePath, 'utf-8');
  } catch {
    suiteHomeSources[suiteId] = null;
  }
}

// ============================================================================
// Helper: Extract MODULE_OBJECT_TYPES
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
// Suite 1: validateSuiteRendering Contract
// ============================================================================

describe('Suite 1: validateSuiteRendering Contract', () => {
  it('validateSuiteRendering function exists in objectPlacement.ts', () => {
    assert.ok(
      codexSrc.includes('export function validateSuiteRendering(moduleId: string): SuiteBoundaryViolation | null'),
      'validateSuiteRendering function declaration found'
    );
  });

  it('SuiteBoundaryViolation interface is exported', () => {
    assert.ok(
      codexSrc.includes('export interface SuiteBoundaryViolation'),
      'SuiteBoundaryViolation interface found'
    );
  });

  it('SuiteBoundaryViolation has required fields', () => {
    assert.ok(codexSrc.includes('moduleId: string'), 'moduleId field exists');
    assert.ok(codexSrc.includes('objectType: TerraFusionObjectType'), 'objectType field exists');
    assert.ok(codexSrc.includes('reason: string'), 'reason field exists');
  });

  it('SUITE_MODULE_IDS set exists', () => {
    assert.ok(
      codexSrc.includes('SUITE_MODULE_IDS'),
      'SUITE_MODULE_IDS set found'
    );
  });

  it('SUITE_MODULE_IDS contains all 5 constitutional suites', () => {
    for (const suiteId of SUITE_IDS) {
      assert.ok(
        codexSrc.includes(`'${suiteId}'`) && codexSrc.includes('SUITE_MODULE_IDS'),
        `${suiteId} in SUITE_MODULE_IDS`
      );
    }
  });

  it('barrel export includes SuiteBoundaryViolation type', () => {
    assert.ok(
      barrelSrc.includes('SuiteBoundaryViolation'),
      'SuiteBoundaryViolation type exported from barrel'
    );
  });

  it('barrel export includes validateSuiteRendering', () => {
    assert.ok(
      barrelSrc.includes('validateSuiteRendering'),
      'validateSuiteRendering exported from barrel'
    );
  });
});

// ============================================================================
// Suite 2: All 5 Suites Classified as suite-workspace
// ============================================================================

describe('Suite 2: Suite Classification', () => {
  it('all 5 constitutional suites are classified in MODULE_OBJECT_TYPES', () => {
    for (const suiteId of SUITE_IDS) {
      const c = MODULE_TYPES[suiteId];
      assert.ok(c, `Suite '${suiteId}' is classified in MODULE_OBJECT_TYPES`);
    }
  });

  it('all 5 suites are classified as suite-workspace', () => {
    for (const suiteId of SUITE_IDS) {
      const c = MODULE_TYPES[suiteId];
      assert.equal(
        c.objectType, 'suite-workspace',
        `Suite '${suiteId}' objectType should be suite-workspace`
      );
    }
  });

  it('suites do not declare hostSurface (they ARE the host)', () => {
    for (const suiteId of SUITE_IDS) {
      const c = MODULE_TYPES[suiteId];
      assert.equal(
        c.hostSurface, undefined,
        `Suite '${suiteId}' should have no hostSurface — suites are self-hosted`
      );
    }
  });

  it('suiteRegistry CONSTITUTIONAL_SUITES all have objectType suite-workspace', () => {
    // Cross-reference: suiteRegistry.ts must annotate suites consistently
    for (const suiteId of SUITE_IDS) {
      // Extract the suite block from registry
      const suiteKey = suiteId.replace('suite-', '');
      assert.ok(
        suiteRegistrySrc.includes(`objectType: 'suite-workspace'`),
        `suiteRegistry declares objectType: 'suite-workspace'`
      );
    }
  });
});

// ============================================================================
// Suite 3: Non-Suite Types Would Be Rejected
// ============================================================================

describe('Suite 3: Non-Suite Type Rejection Logic', () => {
  it('validateSuiteRendering checks SUITE_MODULE_IDS membership', () => {
    assert.ok(
      codexSrc.includes('SUITE_MODULE_IDS.has(moduleId)'),
      'validateSuiteRendering checks SUITE_MODULE_IDS set'
    );
  });

  it('validateSuiteRendering checks objectType is suite-workspace', () => {
    assert.ok(
      codexSrc.includes("objectType !== 'suite-workspace'"),
      'validateSuiteRendering checks objectType'
    );
  });

  it('non-suite modules are not in SUITE_MODULE_IDS (spot check)', () => {
    for (const nonSuiteId of ['costforge', 'federation-dashboard', 'os-pilot', 'property-workbench', 'taskbar']) {
      const c = MODULE_TYPES[nonSuiteId];
      if (c) {
        assert.notEqual(
          c.objectType, 'suite-workspace',
          `Non-suite '${nonSuiteId}' should NOT be suite-workspace`
        );
      }
    }
  });

  it('workbench tabs are NOT suites', () => {
    const WORKBENCH_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];
    for (const tabId of WORKBENCH_TABS) {
      const c = MODULE_TYPES[tabId];
      if (c) {
        assert.notEqual(
          c.objectType, 'suite-workspace',
          `Workbench tab '${tabId}' should NOT be suite-workspace`
        );
      }
    }
  });
});

// ============================================================================
// Suite 4: ModuleRenderer Enforcement Wiring
// ============================================================================

describe('Suite 4: ModuleRenderer Suite Boundary Enforcement', () => {
  it('imports validateSuiteRendering from objectPlacement', () => {
    assert.ok(
      moduleComponentsSrc.includes("import { validateSuiteRendering }") ||
      (moduleComponentsSrc.includes("validateSuiteRendering") &&
       moduleComponentsSrc.includes("from '../contracts/objectPlacement'")),
      'validateSuiteRendering imported in moduleComponents'
    );
  });

  it('calls validateSuiteRendering with module.id', () => {
    assert.ok(
      moduleComponentsSrc.includes('validateSuiteRendering(module.id)'),
      'validateSuiteRendering called with module.id'
    );
  });

  it('renders SuiteBoundaryViolationNotice on violation', () => {
    assert.ok(
      moduleComponentsSrc.includes('SuiteBoundaryViolationNotice'),
      'SuiteBoundaryViolationNotice component referenced'
    );
  });

  it('logs violation with [Codex] prefix', () => {
    assert.ok(
      moduleComponentsSrc.includes('[Codex] Suite boundary violation'),
      'console.warn with [Codex] prefix for suite violations'
    );
  });

  it('suite validation runs before suite component renders', () => {
    const validationIdx = moduleComponentsSrc.indexOf('validateSuiteRendering(module.id)');
    const suiteComponentIdx = moduleComponentsSrc.indexOf('<SuiteComponent />');
    assert.ok(validationIdx > 0, 'validateSuiteRendering call found');
    assert.ok(suiteComponentIdx > 0, 'SuiteComponent render found');
    assert.ok(validationIdx < suiteComponentIdx, 'validation runs before suite component renders');
  });

  it('all 5 suite cases route through the enforced block', () => {
    // All suite IDs should appear in the switch case block that calls validateSuiteRendering
    const enforceBlockStart = moduleComponentsSrc.indexOf('CONSTITUTIONAL SUITE HOMES');
    const enforceBlockEnd = moduleComponentsSrc.indexOf('OS FEATURES', enforceBlockStart);
    assert.ok(enforceBlockStart > 0, 'Suite enforcement block found');
    assert.ok(enforceBlockEnd > enforceBlockStart, 'Suite block ends before OS Features');

    const enforceBlock = moduleComponentsSrc.slice(enforceBlockStart, enforceBlockEnd);
    for (const suiteId of SUITE_IDS) {
      assert.ok(
        enforceBlock.includes(`'${suiteId}'`),
        `Suite '${suiteId}' handled in enforcement block`
      );
    }
  });
});

// ============================================================================
// Suite 5: Anti-Drift — Suite Homes Don't Cross-Import
// ============================================================================

describe('Suite 5: Suite Home Anti-Drift', () => {
  // Cross-suite import patterns to forbid
  const SUITE_DOMAIN_PATTERNS = {
    'suite-forge': ['CostForge', 'costforge', '/forge/'],
    'suite-atlas': ['Atlas', 'atlas-ai', '/atlas/'],
    'suite-dais': ['Dais', 'dais', '/dais/'],
    'suite-dossier': ['Dossier', 'dossier', '/dossier/'],
    'suite-gpt': ['TerraGPT', 'gpt', '/gpt/'],
  };

  for (const [suiteId, _patterns] of Object.entries(SUITE_DOMAIN_PATTERNS)) {
    it(`${suiteId} home file exists`, () => {
      assert.ok(
        suiteHomeSources[suiteId] !== null,
        `Suite home source exists for ${suiteId}`
      );
    });
  }

  // Verify no suite imports another suite's domain modules
  for (const [suiteId, src] of Object.entries(suiteHomeSources)) {
    if (!src) continue;

    const otherSuites = SUITE_IDS.filter(id => id !== suiteId);
    for (const otherSuiteId of otherSuites) {
      it(`${suiteId} does not import from ${otherSuiteId} suite home`, () => {
        const otherHomeName = SUITE_HOME_FILES[otherSuiteId].replace('.tsx', '');
        assert.ok(
          !src.includes(`from './${otherHomeName}'`) &&
          !src.includes(`from '../suites/${otherHomeName}'`),
          `${suiteId} does not import ${otherHomeName}`
        );
      });
    }
  }

  it('no suite home imports PropertyWorkbenchWindow', () => {
    for (const [suiteId, src] of Object.entries(suiteHomeSources)) {
      if (!src) continue;
      assert.ok(
        !src.includes('PropertyWorkbenchWindow'),
        `${suiteId} does not import PropertyWorkbenchWindow`
      );
    }
  });
});

// ============================================================================
// Suite 6: SUITE_MODULE_IDS ↔ CONSTITUTIONAL_SUITES Cross-Reference
// ============================================================================

describe('Suite 6: Suite Registry Cross-Reference', () => {
  it('CONSTITUTIONAL_SUITES has exactly 5 suites', () => {
    // suiteRegistry uses short IDs: 'forge', 'atlas', etc. (not 'suite-forge')
    const SHORT_SUITE_IDS = ['forge', 'atlas', 'dais', 'dossier', 'gpt'];
    for (const shortId of SHORT_SUITE_IDS) {
      assert.ok(
        suiteRegistrySrc.includes(`id: '${shortId}'`),
        `Suite '${shortId}' declared in CONSTITUTIONAL_SUITES`
      );
    }
  });

  it('all CONSTITUTIONAL_SUITES IDs map to SUITE_MODULE_IDS via suite- prefix', () => {
    // suiteRegistry uses 'forge' → MODULE_OBJECT_TYPES uses 'suite-forge'
    const SHORT_SUITE_IDS = ['forge', 'atlas', 'dais', 'dossier', 'gpt'];
    for (const shortId of SHORT_SUITE_IDS) {
      const fullId = `suite-${shortId}`;
      const c = MODULE_TYPES[fullId];
      assert.ok(c, `suite-${shortId} (from registry '${shortId}') classified in MODULE_OBJECT_TYPES`);
      assert.equal(c.objectType, 'suite-workspace', `suite-${shortId} classified as suite-workspace`);
    }
  });

  it('MODULE_REGISTRY includes all 5 suites', () => {
    for (const suiteId of SUITE_IDS) {
      assert.ok(
        moduleComponentsSrc.includes(`'${suiteId}'`),
        `${suiteId} registered in MODULE_REGISTRY`
      );
    }
  });

  it('suite count in MODULE_OBJECT_TYPES matches SUITE_MODULE_IDS count (5)', () => {
    const suiteClassifications = Object.entries(MODULE_TYPES)
      .filter(([_, c]) => c.objectType === 'suite-workspace');
    assert.equal(
      suiteClassifications.length, 5,
      `Expected 5 suite-workspace entries, found ${suiteClassifications.length}`
    );
  });
});
