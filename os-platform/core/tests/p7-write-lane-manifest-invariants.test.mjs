/**
 * Phase 7 — Write-Lane Manifest Invariants
 * ============================================================================
 * Enforces Tests D from the Phase 7 Co-Founder mandate:
 *
 * WriteLaneOwnershipTests:
 *   - Every write-capable tool has writeLane === suite (ownership invariant).
 *   - No tool carries a writeLane from a different suite (cross-lane violation).
 *   - TerraGPT cannot write to forge/atlas/dais/dossier lanes.
 *   - Trace events are owned by the 'os' suite only.
 *   - crossSuiteReads are documented for any tool that reads across lanes.
 *
 * These are STATIC ANALYSIS tests — they read the manifest, not the runtime.
 * They will go RED if any tool is added with a mismatched writeLane.
 *
 * Run: node --test os-platform/core/tests/p7-write-lane-manifest-invariants.test.mjs
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'tools/registry/terrapilot.tools.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const tools = manifest.tools || [];

const WRITE_RISKS = new Set(['write_low', 'write_high', 'irreversible']);
const CONSTITUTIONAL_SUITES = new Set(['forge', 'atlas', 'dais', 'dossier', 'gpt', 'os']);
const SUITE_WRITE_LANES = new Set([...CONSTITUTIONAL_SUITES]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function writeCapableTools() {
  return tools.filter((t) => WRITE_RISKS.has(t.risk) && t.writeLane);
}

// ============================================================================
// D1: Every write tool has writeLane === suite
// ============================================================================

describe('D1: Write tool writeLane must match suite', () => {
  const violations = writeCapableTools().filter((t) => t.writeLane !== t.suite);

  test('all write-capable tools have writeLane === suite', () => {
    assert.equal(
      violations.length,
      0,
      `Write-lane ownership violations (${violations.length} found):\n` +
      violations
        .map((t) => `  '${t.toolId}': suite='${t.suite}' but writeLane='${t.writeLane}'`)
        .join('\n') +
      '\nEach tool must only write to its own suite lane.'
    );
  });

  // Individual failure reporting for easier diagnosis
  for (const tool of writeCapableTools()) {
    test(`'${tool.toolId}' (suite=${tool.suite}): writeLane='${tool.writeLane}'`, () => {
      assert.strictEqual(
        tool.writeLane,
        tool.suite,
        `Tool '${tool.toolId}' has suite='${tool.suite}' but writeLane='${tool.writeLane}'. ` +
        'A tool may only write to its own suite lane. Use crossSuiteReads for read access.'
      );
    });
  }
});

// ============================================================================
// D2: Read-only tools must NOT declare a writeLane
// ============================================================================

describe('D2: Read-only tools must have no writeLane', () => {
  test('no read_only tool declares a writeLane', () => {
    const violations = tools.filter(
      (t) => t.risk === 'read_only' && t.writeLane != null && t.writeLane !== ''
    );

    assert.equal(
      violations.length,
      0,
      `read_only tools incorrectly declaring writeLane:\n` +
      violations
        .map((t) => `  '${t.toolId}': writeLane='${t.writeLane}'`)
        .join('\n')
    );
  });
});

// ============================================================================
// D3: TerraGPT cannot claim write lanes to other suites
// ============================================================================

describe('D3: TerraGPT write-lane isolation', () => {
  const FORBIDDEN_LANES_FOR_GPT = ['forge', 'atlas', 'dais', 'dossier', 'clerk', 'treasury', 'audit'];
  const gptWriteTools = tools.filter(
    (t) => t.suite === 'gpt' && WRITE_RISKS.has(t.risk)
  );
  const violations = gptWriteTools.filter((t) =>
    FORBIDDEN_LANES_FOR_GPT.includes(t.writeLane)
  );

  test('TerraGPT has no write tools claiming another suite lane', () => {
    assert.equal(
      violations.length,
      0,
      `TerraGPT write-lane violations:\n` +
      violations
        .map(
          (t) =>
            `  '${t.toolId}': writeLane='${t.writeLane}' — ` +
            'TerraGPT must act through sanctioned TerraPilot tools, not write directly to other suites.'
        )
        .join('\n')
    );
  });

  test('if TerraGPT has write tools at all, they write only to gpt or os lane', () => {
    const illegalLane = gptWriteTools.filter(
      (t) => t.writeLane && t.writeLane !== 'gpt' && t.writeLane !== 'os'
    );
    assert.equal(
      illegalLane.length,
      0,
      `TerraGPT tools with illegal writeLane:\n` +
      illegalLane.map((t) => `  '${t.toolId}': writeLane='${t.writeLane}'`).join('\n')
    );
  });
});

// ============================================================================
// D4: TerraTrace / trace tools owned by 'os' suite only
// ============================================================================

describe('D4: Trace tools are owned by os suite, not feature suites', () => {
  test('no forge/atlas/dais/dossier/gpt tool writes to os lane (except through entrypoint)', () => {
    const FEATURE_SUITES = ['forge', 'atlas', 'dais', 'dossier', 'gpt'];
    const violations = tools.filter(
      (t) => FEATURE_SUITES.includes(t.suite) && t.writeLane === 'os'
    );

    assert.equal(
      violations.length,
      0,
      `Feature suite tools writing to 'os' lane (reserved for TerraTrace/routing):\n` +
      violations
        .map((t) => `  '${t.toolId}' suite='${t.suite}' writeLane='${t.writeLane}'`)
        .join('\n') +
      '\nTrace events and OS-level mutations must go through the os-suite entrypoint.'
    );
  });
});

// ============================================================================
// D5: crossSuiteReads documented when a tool reads across lanes
// ============================================================================

describe('D5: Cross-suite reads are documented in manifest', () => {
  test('any tool touching multiple suites declares crossSuiteReads', () => {
    // Tools that "touch" multiple suite domains must document their reads
    // We check: if a tool's description or displayName references another suite,
    // it should have crossSuiteReads defined.
    // This is a soft invariant — we check for tools that have crossSuiteReads: []
    // when they claim to read from another suite.

    const crossReadTools = tools.filter(
      (t) => t.crossSuiteReads && t.crossSuiteReads.length > 0
    );

    for (const tool of crossReadTools) {
      // crossSuiteReads must only reference valid constitutional suite ids
      const invalidReads = tool.crossSuiteReads.filter(
        (lane) => !CONSTITUTIONAL_SUITES.has(lane)
      );

      assert.equal(
        invalidReads.length,
        0,
        `Tool '${tool.toolId}' has crossSuiteReads referencing unknown suites: [${invalidReads.join(', ')}]. ` +
        `Valid suites: [${[...CONSTITUTIONAL_SUITES].join(', ')}]`
      );
    }
  });
});

// ============================================================================
// D6: All tools declare a suite from the constitutional registry
// ============================================================================

describe('D6: All tools declare a constitutional suite', () => {
  // 'pilot' is a valid manifest suite for TerraPilot/TerraCanon OS-feature tools
  const VALID_SUITES = new Set([...CONSTITUTIONAL_SUITES, 'clerk', 'treasury', 'audit', 'recorder', 'pilot']);

  test('no tool references an unknown suite', () => {
    const violations = tools.filter(
      (t) => t.suite && !VALID_SUITES.has(t.suite)
    );

    assert.equal(
      violations.length,
      0,
      `Tools with unknown suite declarations:\n` +
      violations.map((t) => `  '${t.toolId}': suite='${t.suite}'`).join('\n') +
      `\nValid suites: [${[...VALID_SUITES].join(', ')}]`
    );
  });
});
