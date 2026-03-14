/**
 * TerraFusion OS — Completion Reporting Governance Tests (Phase 10)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Proves that the completion law (the "9" in 3-6-9) is machine-enforceable:
 *   - generateCompletionReport() exists and is exported
 *   - CompletionReportEntry / CompletionReport types exist
 *   - All completionRequired types have entryPath + hasActionableUI
 *   - All evidenceRequired types also have hasEvidenceExport
 *   - Report generates with 0 incomplete entries
 *   - Exempt entries (shell surfaces, scenes, headless) don't need metadata
 *
 * Run:  node --test os-platform/core/tests/completion-reporting.test.mjs
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

const codexSrc = readFileSync(CODEX_PATH, 'utf-8');
const barrelSrc = readFileSync(BARREL_PATH, 'utf-8');

// ============================================================================
// Helper: Extract MODULE_OBJECT_TYPES entries
// ============================================================================

function extractModuleObjectTypes() {
  const match = codexSrc.match(
    /MODULE_OBJECT_TYPES[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  assert.ok(match, 'MODULE_OBJECT_TYPES block found in objectPlacement.ts');

  const entries = {};
  // Match entries like: 'key': { objectType: 'foo', hostSurface: 'bar', entryPath: 'baz', hasActionableUI: true, hasEvidenceExport: true }
  const entryRegex = /'([^']+)':\s*\{([^}]+)\}/g;
  let m;
  while ((m = entryRegex.exec(match[1])) !== null) {
    const id = m[1];
    const body = m[2];
    const objectType = body.match(/objectType:\s*'([^']+)'/)?.[1];
    const hostSurface = body.match(/hostSurface:\s*'([^']+)'/)?.[1];
    const entryPath = body.match(/entryPath:\s*'([^']+)'/)?.[1];
    const hasActionableUI = body.includes('hasActionableUI: true');
    const hasEvidenceExport = body.includes('hasEvidenceExport: true');
    entries[id] = { objectType, hostSurface, entryPath, hasActionableUI, hasEvidenceExport };
  }
  return entries;
}

function extractPlacementPolicy() {
  const match = codexSrc.match(
    /PLACEMENT_POLICY[^=]*=\s*\{([\s\S]*?)\n\};/
  );
  assert.ok(match, 'PLACEMENT_POLICY block found in objectPlacement.ts');

  const entries = {};
  // Match each policy entry block
  const entryRegex = /'([^']+)':\s*\{([\s\S]*?)\n  \}/g;
  let m;
  while ((m = entryRegex.exec(match[1])) !== null) {
    const type = m[1];
    const body = m[2];
    const completionRequired = body.includes('completionRequired: true');
    const evidenceRequired = body.includes('evidenceRequired: true');
    entries[type] = { completionRequired, evidenceRequired };
  }
  return entries;
}

const MODULE_TYPES = extractModuleObjectTypes();
const POLICY = extractPlacementPolicy();

// ============================================================================
// Suite 1: generateCompletionReport Contract
// ============================================================================

describe('Suite 1: generateCompletionReport Contract', () => {
  it('generateCompletionReport function exists in objectPlacement.ts', () => {
    assert.ok(
      codexSrc.includes('export function generateCompletionReport(): CompletionReport'),
      'generateCompletionReport function declaration found'
    );
  });

  it('CompletionReportEntry interface is exported', () => {
    assert.ok(
      codexSrc.includes('export interface CompletionReportEntry'),
      'CompletionReportEntry interface found'
    );
  });

  it('CompletionReport interface is exported', () => {
    assert.ok(
      codexSrc.includes('export interface CompletionReport'),
      'CompletionReport interface found'
    );
  });

  it('CompletionReportEntry has required fields', () => {
    assert.ok(codexSrc.includes('moduleId: string'), 'moduleId field');
    assert.ok(codexSrc.includes("status: 'complete' | 'incomplete' | 'exempt'"), 'status field');
    assert.ok(codexSrc.includes('missing: string[]'), 'missing field');
  });

  it('CompletionReport has summary counters', () => {
    // Extract the CompletionReport interface block (find closing brace after entries field)
    const start = codexSrc.indexOf('export interface CompletionReport {');
    assert.ok(start > 0, 'CompletionReport interface found');
    const reportBlock = codexSrc.slice(start, start + 300);
    assert.ok(reportBlock.includes('totalModules:'), 'totalModules counter');
    assert.ok(reportBlock.includes('complete:'), 'complete counter');
    assert.ok(reportBlock.includes('incomplete:'), 'incomplete counter');
    assert.ok(reportBlock.includes('exempt:'), 'exempt counter');
    assert.ok(reportBlock.includes('entries:'), 'entries array');
  });

  it('barrel export includes CompletionReport type', () => {
    assert.ok(
      barrelSrc.includes('CompletionReport'),
      'CompletionReport type exported from barrel'
    );
  });

  it('barrel export includes CompletionReportEntry type', () => {
    assert.ok(
      barrelSrc.includes('CompletionReportEntry'),
      'CompletionReportEntry type exported from barrel'
    );
  });

  it('barrel export includes generateCompletionReport function', () => {
    assert.ok(
      barrelSrc.includes('generateCompletionReport'),
      'generateCompletionReport exported from barrel'
    );
  });
});

// ============================================================================
// Suite 2: Completion Metadata on completionRequired Types
// ============================================================================

describe('Suite 2: completionRequired Types Have Metadata', () => {
  // Identify all types where completionRequired is true
  const completionRequiredTypes = Object.entries(POLICY)
    .filter(([_, p]) => p.completionRequired)
    .map(([type]) => type);

  it('at least 5 types require completion', () => {
    assert.ok(
      completionRequiredTypes.length >= 5,
      `Expected ≥5 completionRequired types, found ${completionRequiredTypes.length}`
    );
  });

  // For every module classified as a completionRequired type, check metadata
  for (const [moduleId, classification] of Object.entries(MODULE_TYPES)) {
    const policy = POLICY[classification.objectType];
    if (!policy || !policy.completionRequired) continue;

    it(`${moduleId} (${classification.objectType}) has entryPath`, () => {
      assert.ok(
        classification.entryPath,
        `${moduleId} must have entryPath for completion law`
      );
    });

    it(`${moduleId} (${classification.objectType}) has hasActionableUI`, () => {
      assert.ok(
        classification.hasActionableUI,
        `${moduleId} must have hasActionableUI: true for completion law`
      );
    });
  }
});

// ============================================================================
// Suite 3: Evidence-Required Types Have Evidence Export
// ============================================================================

describe('Suite 3: evidenceRequired Types Have Evidence Export', () => {
  const evidenceRequiredTypes = Object.entries(POLICY)
    .filter(([_, p]) => p.evidenceRequired)
    .map(([type]) => type);

  it('at least 2 types require evidence', () => {
    assert.ok(
      evidenceRequiredTypes.length >= 2,
      `Expected ≥2 evidenceRequired types, found ${evidenceRequiredTypes.length}`
    );
  });

  for (const [moduleId, classification] of Object.entries(MODULE_TYPES)) {
    const policy = POLICY[classification.objectType];
    if (!policy || !policy.evidenceRequired) continue;

    it(`${moduleId} (${classification.objectType}) has hasEvidenceExport`, () => {
      assert.ok(
        classification.hasEvidenceExport,
        `${moduleId} must have hasEvidenceExport: true for evidence law`
      );
    });
  }
});

// ============================================================================
// Suite 4: Exempt Types Don't Need Completion Metadata
// ============================================================================

describe('Suite 4: Exempt Types Are Correctly Classified', () => {
  const exemptTypes = Object.entries(POLICY)
    .filter(([_, p]) => !p.completionRequired)
    .map(([type]) => type);

  it('shell surfaces are exempt from completion', () => {
    assert.ok(
      !POLICY['os-shell-surface']?.completionRequired,
      'os-shell-surface does not require completion'
    );
  });

  it('home-scene is exempt from completion', () => {
    assert.ok(
      !POLICY['home-scene']?.completionRequired,
      'home-scene does not require completion'
    );
  });

  it('global-signal is exempt from completion', () => {
    assert.ok(
      !POLICY['global-signal']?.completionRequired,
      'global-signal does not require completion'
    );
  });

  it('invisible-infrastructure-service is exempt from completion', () => {
    assert.ok(
      !POLICY['invisible-infrastructure-service']?.completionRequired,
      'invisible-infrastructure-service does not require completion'
    );
  });

  it('state-signal-service is exempt from completion', () => {
    assert.ok(
      !POLICY['state-signal-service']?.completionRequired,
      'state-signal-service does not require completion'
    );
  });

  it('exempt shell surface modules lack entryPath (not needed)', () => {
    for (const shellId of ['taskbar', 'dock', 'start-menu', 'top-bar']) {
      const c = MODULE_TYPES[shellId];
      if (!c) continue;
      assert.equal(
        c.entryPath, undefined,
        `Shell surface '${shellId}' should not need entryPath`
      );
    }
  });

  it('exempt scene modules lack entryPath (not needed)', () => {
    for (const sceneId of ['home-scene', 'desktop-scene']) {
      const c = MODULE_TYPES[sceneId];
      if (!c) continue;
      assert.equal(
        c.entryPath, undefined,
        `Scene '${sceneId}' should not need entryPath`
      );
    }
  });
});

// ============================================================================
// Suite 5: Report Generator Logic
// ============================================================================

describe('Suite 5: generateCompletionReport Logic', () => {
  it('iterates over MODULE_OBJECT_TYPES', () => {
    assert.ok(
      codexSrc.includes('Object.entries(MODULE_OBJECT_TYPES)'),
      'generateCompletionReport iterates MODULE_OBJECT_TYPES'
    );
  });

  it('cross-references PLACEMENT_POLICY', () => {
    assert.ok(
      codexSrc.includes('PLACEMENT_POLICY[classification.objectType]'),
      'generateCompletionReport looks up PLACEMENT_POLICY'
    );
  });

  it('checks entryPath for completionRequired types', () => {
    assert.ok(
      codexSrc.includes("missing.push('entryPath')"),
      'missing entryPath is detected'
    );
  });

  it('checks hasActionableUI for completionRequired types', () => {
    assert.ok(
      codexSrc.includes("missing.push('actionableUI')"),
      'missing actionableUI is detected'
    );
  });

  it('checks hasEvidenceExport for evidenceRequired types', () => {
    assert.ok(
      codexSrc.includes("missing.push('evidenceExport')"),
      'missing evidenceExport is detected'
    );
  });

  it('classifies exempt entries with status exempt', () => {
    assert.ok(
      codexSrc.includes("status: 'exempt'"),
      'exempt status assigned to non-completionRequired'
    );
  });

  it('classifies complete entries with status complete', () => {
    assert.ok(
      codexSrc.includes("status: missing.length === 0 ? 'complete' : 'incomplete'"),
      'complete/incomplete status assigned based on missing array'
    );
  });
});

// ============================================================================
// Suite 6: Zero Incomplete — All Metadata Is In Place
// ============================================================================

describe('Suite 6: Zero Incomplete Modules', () => {
  // Simulate the report generator logic using extracted data
  const incompleteModules = [];

  for (const [moduleId, classification] of Object.entries(MODULE_TYPES)) {
    const policy = POLICY[classification.objectType];
    if (!policy || !policy.completionRequired) continue;

    const missing = [];
    if (!classification.entryPath) missing.push('entryPath');
    if (!classification.hasActionableUI) missing.push('actionableUI');
    if (policy.evidenceRequired && !classification.hasEvidenceExport) missing.push('evidenceExport');

    if (missing.length > 0) {
      incompleteModules.push({ moduleId, objectType: classification.objectType, missing });
    }
  }

  it('no modules are incomplete', () => {
    assert.equal(
      incompleteModules.length, 0,
      `Expected 0 incomplete modules, found ${incompleteModules.length}: ${
        incompleteModules.map(m => `${m.moduleId} (missing: ${m.missing.join(', ')})`).join('; ')
      }`
    );
  });

  it('completionRequired modules count matches expectations', () => {
    const completionRequiredCount = Object.entries(MODULE_TYPES)
      .filter(([_, c]) => POLICY[c.objectType]?.completionRequired)
      .length;
    // 5 suites + 1 workbench + 9 tabs + 3 OS features + 13+ cross-parcel apps + 3 OS utilities = 30+
    assert.ok(
      completionRequiredCount >= 25,
      `Expected ≥25 completionRequired modules, found ${completionRequiredCount}`
    );
  });

  it('exempt modules count is reasonable', () => {
    const exemptCount = Object.entries(MODULE_TYPES)
      .filter(([_, c]) => !POLICY[c.objectType]?.completionRequired)
      .length;
    // 4 shell surfaces + 2 scenes = 6
    assert.ok(
      exemptCount >= 4,
      `Expected ≥4 exempt modules, found ${exemptCount}`
    );
  });

  it('total classified modules covers full inventory', () => {
    const totalCount = Object.keys(MODULE_TYPES).length;
    // 4 shells + 2 scenes + 5 suites + 1 workbench + 9 tabs + 3 OS features + 13 cross-parcel + 3 utilities = ~40
    assert.ok(
      totalCount >= 35,
      `Expected ≥35 classified modules, found ${totalCount}`
    );
  });
});
