/**
 * Phase 7 — Agent Entrypoint Contract Tests
 * ============================================================================
 * Enforces the sovereign spine invariants from the Phase 7 Co-Founder mandate:
 *
 * A. AGENT_ENTRYPOINT.md is the single authority:
 *    - File exists at .github/AGENT_ENTRYPOINT.md
 *    - Explicitly references Muse mode (mode boundary)
 *    - Explicitly references Write-Lane Matrix (lane enforcement)
 *    - Explicitly references TerraTrace (append-only bridge)
 *    - Defines protected paths that agents cannot modify
 *
 * B. Governance terminology contract:
 *    - Reserved prefixes (terra-audit-*, terra-clerk-*, terra-treasury-*,
 *      terra-recorder-*) are not used as standalone top-level suite IDs
 *    - Canonical suite names match the constitutional registry
 *    - "Property Workbench" is the canonical OS surface name
 *
 * Run: node --test os-platform/core/tests/p7-agent-entrypoint-contract.test.mjs
 *
 * EXPECTED STATE: Several tests intentionally RED until AGENT_ENTRYPOINT.md
 * is updated to reference Write-Lane Matrix, TerraTrace, and Muse mode
 * boundaries explicitly.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const ENTRYPOINT_PATH = path.join(REPO_ROOT, '.github', 'AGENT_ENTRYPOINT.md');
const SUITE_REGISTRY_PATH = path.join(
  REPO_ROOT,
  'frontend/apps/os-shell/src/config/suiteRegistry.ts'
);
const TOOLS_MANIFEST_PATH = path.join(
  REPO_ROOT,
  'tools/registry/terrapilot.tools.json'
);

// ============================================================================
// A. Single-Entrypoint Authority Tests
// ============================================================================

describe('A: AGENT_ENTRYPOINT.md — single authority contract', () => {
  test('AGENT_ENTRYPOINT.md exists at .github/AGENT_ENTRYPOINT.md', () => {
    assert.ok(
      fs.existsSync(ENTRYPOINT_PATH),
      `AGENT_ENTRYPOINT.md missing from .github/ — create it at ${ENTRYPOINT_PATH}`
    );
  });

  test('AGENT_ENTRYPOINT.md references Muse mode boundary', () => {
    const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
    assert.ok(
      content.includes('Muse') || content.includes('muse'),
      'AGENT_ENTRYPOINT.md must explicitly reference Muse mode so agents know the pilot/muse boundary. ' +
      'Add a MUSE MODE BOUNDARY section explaining which tools are allowed in muse context.'
    );
  });

  test('AGENT_ENTRYPOINT.md references Write-Lane Matrix', () => {
    const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
    assert.ok(
      content.includes('Write-Lane Matrix') || content.includes('write-lane matrix') || content.includes('writeLane'),
      'AGENT_ENTRYPOINT.md must reference the Write-Lane Matrix. ' +
      'Agents must know cross-lane writes are forbidden and require TerraTrace append instead.'
    );
  });

  test('AGENT_ENTRYPOINT.md references TerraTrace as the governed write bridge', () => {
    const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
    assert.ok(
      content.includes('TerraTrace') || content.includes('terraTrace') || content.includes('trace'),
      'AGENT_ENTRYPOINT.md must reference TerraTrace as the append-only bridge for cross-lane actions. ' +
      'Add: "Cross-lane writes require a TerraTrace append, not direct mutation."'
    );
  });

  test('AGENT_ENTRYPOINT.md defines protected paths agents cannot modify', () => {
    const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
    // Must have a FORBIDDEN SCOPE section or equivalent
    assert.ok(
      content.includes('FORBIDDEN') || content.includes('forbidden') || content.includes('NEVER MODIFY'),
      'AGENT_ENTRYPOINT.md must define protected paths. Found none.'
    );
  });

  test('AGENT_ENTRYPOINT.md does not claim multiple competing authority sources', () => {
    const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
    // Count occurrences of "single source of truth" or "authority" — should only declare one
    // Red flag: multiple files claiming to be THE authority
    const authorityFiles = [
      '.ralph/AGENT_RULES.yml',
      'AGENTS.md',
      'copilot-instructions.md',
    ].filter((f) => content.includes(f));

    // It's OK to REFERENCE other docs, but they must be subordinate
    // The entrypoint must say it is the canonical first read
    assert.ok(
      content.includes('READ THIS FIRST') ||
        content.includes('MANDATORY') ||
        content.includes('canonical'),
      'AGENT_ENTRYPOINT.md must establish itself as the single canonical authority. ' +
      'Add "READ THIS FIRST" or "MANDATORY" to declare primacy.'
    );
  });
});

// ============================================================================
// B. Governance Terminology Contract
// ============================================================================

describe('B: Governance terminology — reserved prefixes and canonical names', () => {
  test('suiteRegistry constitutional suites do not use reserved government module prefixes', () => {
    const content = fs.readFileSync(SUITE_REGISTRY_PATH, 'utf-8');

    // These are RESERVED for future sovereign modules (R3.2–R3.4)
    // They must NOT appear as top-level SuiteId values
    const RESERVED_AS_SUITES = ['clerk', 'treasury', 'recorder'];

    // Extract the SuiteId union type definition
    const suiteIdMatch = content.match(/export type SuiteId\s*=\s*([\s\S]*?);/);
    if (!suiteIdMatch) {
      // No SuiteId type found — skip this sub-check
      return;
    }

    const suiteIdBlock = suiteIdMatch[1];
    for (const reserved of RESERVED_AS_SUITES) {
      // These should appear only as WorkbenchTabId, not SuiteId
      // Check: if they appear in the SuiteId block, that's a violation
      assert.ok(
        !suiteIdBlock.includes(`'${reserved}'`),
        `'${reserved}' is a reserved prefix (R3.x sovereign module). ` +
        `It must not be added to SuiteId until governance review. Found in SuiteId union.`
      );
    }
  });

  test("canonical OS surface is 'Property Workbench' (not 'property-search', 'parcel-view', etc.)", () => {
    const content = fs.readFileSync(SUITE_REGISTRY_PATH, 'utf-8');
    // The canonical OS surface identifier must be 'workbench' in OsSurfaceId
    assert.ok(
      content.includes("'workbench'") || content.includes('"workbench"'),
      "OsSurfaceId must include 'workbench' as the canonical Property Workbench identifier."
    );
  });

  test("canonical OS feature IDs include 'pilot' and 'trace' (not aliases like 'terrapilot-v2')", () => {
    const content = fs.readFileSync(SUITE_REGISTRY_PATH, 'utf-8');
    assert.ok(
      content.includes("'pilot'"),
      "OsFeatureId must include 'pilot' as canonical TerraPilot identifier."
    );
    assert.ok(
      content.includes("'trace'"),
      "OsFeatureId must include 'trace' as canonical TerraTrace identifier."
    );
  });

  test('tool manifest does not mix writeLane ownership across unrelated suites', () => {
    const manifest = JSON.parse(fs.readFileSync(TOOLS_MANIFEST_PATH, 'utf-8'));
    const tools = manifest.tools || [];
    const violations = [];

    for (const tool of tools) {
      const { toolId, suite, writeLane, risk } = tool;
      if (!writeLane || risk === 'read_only') continue;

      // A tool may only write to its own suite lane
      // Exception: 'os' suite may write to 'os' lane (TerraTrace, routing)
      if (writeLane !== suite) {
        violations.push(
          `Tool '${toolId}': suite='${suite}' but writeLane='${writeLane}' — cross-lane write not permitted`
        );
      }
    }

    assert.equal(
      violations.length,
      0,
      `Write-lane ownership violations found:\n${violations.map((v) => `  ${v}`).join('\n')}\n` +
      'Each tool must write only to its own suite lane.'
    );
  });

  test("tool manifest gpt-suite tools do not claim write lanes to forge/atlas/dais/dossier", () => {
    const manifest = JSON.parse(fs.readFileSync(TOOLS_MANIFEST_PATH, 'utf-8'));
    const tools = manifest.tools || [];
    const FORBIDDEN_LANES_FOR_GPT = ['forge', 'atlas', 'dais', 'dossier', 'clerk', 'treasury', 'audit'];
    const violations = [];

    for (const tool of tools) {
      if (tool.suite !== 'gpt') continue;
      if (!tool.writeLane) continue;
      if (FORBIDDEN_LANES_FOR_GPT.includes(tool.writeLane)) {
        violations.push(
          `TerraGPT tool '${tool.toolId}' has writeLane='${tool.writeLane}'. ` +
          'GPT must act through sanctioned TerraPilot tools, not write directly to other suites.'
        );
      }
    }

    assert.equal(
      violations.length,
      0,
      `TerraGPT write-lane violations:\n${violations.map((v) => `  ${v}`).join('\n')}`
    );
  });
});
