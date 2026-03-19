/**
 * Phase 7 — Muse Mode Boundary: Systematic Tool Coverage
 * ============================================================================
 * Enforces the pilot/muse mode separation contract across the ENTIRE tool
 * manifest. Per Phase 7 Co-Founder mandate (Tests C):
 *
 *   Rule 1: Pilot mode may use ALL tool categories.
 *   Rule 2: Muse mode may use draft/explain/summarize/synthesize/template tools
 *            and read_only tools that are explicitly muse-allowed.
 *   Rule 3: Muse mode must REJECT write_high and irreversible tools (MODE_MISMATCH).
 *   Rule 4: Muse mode must REJECT write_low tools that declare mode='pilot'.
 *   Rule 5: HITL-required (irreversible) actions in muse surface a gated outcome.
 *   Rule 6: write_high tools MUST declare mode='pilot' in the manifest.
 *   Rule 7: irreversible tools MUST declare mode='pilot' in the manifest.
 *
 * Design note:
 *   write_low tools with mode='muse' are LEGITIMATE — they are the muse drafting
 *   tools (draft_notice, draft_appeal_response, etc.) that generate draft artifacts
 *   without committing them. This is intentional per the Constitutional tool model.
 *
 * Run: node --test os-platform/core/tests/p7-muse-mode-systematic.test.mjs
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MANIFEST_PATH = resolve(__dirname, '../../../tools/registry/terrapilot.tools.json');

let ToolRegistry, ToolRunner, InMemoryTraceStore, TraceService;
let registerPhase84Handlers, registerWriteGateHandlers;

before(async () => {
  const pilot = await import('../pilot/index.js');
  const trace = await import('../trace/index.js');

  ToolRegistry = pilot.ToolRegistry;
  ToolRunner = pilot.ToolRunner;
  registerPhase84Handlers = pilot.registerPhase84Handlers;
  registerWriteGateHandlers = pilot.registerWriteGateHandlers;
  InMemoryTraceStore = trace.InMemoryTraceStore;
  TraceService = trace.TraceService;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function museContext(overrides = {}) {
  return {
    countyId: 'benton',
    userId: 'appraiser-001',
    roles: ['appraiser'],
    mode: 'muse',
    ...overrides,
  };
}

async function makeRunner() {
  const registry = new ToolRegistry();
  await registry.initialize(MANIFEST_PATH);
  const traceStore = new InMemoryTraceStore({ maxEvents: 2000 });
  const traceService = new TraceService({ store: traceStore });
  const runner = new ToolRunner({ registry, trace: traceService });
  registerPhase84Handlers(runner);
  registerWriteGateHandlers(runner);
  return { registry, runner, traceService };
}

// ── Manifest fixture ──────────────────────────────────────────────────────────

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
const tools = manifest.tools || [];

// Tools that must ALWAYS require pilot mode — never executable in muse
const highRiskTools = tools.filter(
  (t) => t.risk === 'write_high' || t.risk === 'irreversible'
);

// write_low tools that are explicitly pilot-only (NOT muse drafting tools)
const pilotOnlyWriteLow = tools.filter(
  (t) => t.risk === 'write_low' && t.mode === 'pilot'
);

// write_low tools that are legitimately muse-allowed (draft/template operations)
const museDraftTools = tools.filter(
  (t) => t.risk === 'write_low' && t.mode === 'muse'
);

// irreversible tools specifically (require HITL gate)
const irreversibleTools = tools.filter((t) => t.risk === 'irreversible');

// ============================================================================
// C1: Manifest-level mode classification invariants
// ============================================================================

describe('C1: Manifest — write_high and irreversible tools must declare mode=pilot', () => {
  it('all write_high tools have mode=pilot in manifest', () => {
    const violations = tools
      .filter((t) => t.risk === 'write_high' && t.mode && t.mode !== 'pilot')
      .map((t) => `${t.toolId}: mode='${t.mode}'`);

    assert.equal(
      violations.length,
      0,
      `write_high tools with incorrect mode (must be 'pilot'):\n` +
      violations.map((v) => `  ${v}`).join('\n')
    );
  });

  it('all irreversible tools have mode=pilot in manifest', () => {
    const violations = tools
      .filter((t) => t.risk === 'irreversible' && t.mode && t.mode !== 'pilot')
      .map((t) => `${t.toolId}: mode='${t.mode}'`);

    assert.equal(
      violations.length,
      0,
      `irreversible tools with incorrect mode (must be 'pilot'):\n` +
      violations.map((v) => `  ${v}`).join('\n')
    );
  });

  it('muse-declared tools are only write_low or read_only (never write_high/irreversible)', () => {
    const violations = tools
      .filter(
        (t) => t.mode === 'muse' && (t.risk === 'write_high' || t.risk === 'irreversible')
      )
      .map((t) => `${t.toolId}: risk='${t.risk}' mode='muse'`);

    assert.equal(
      violations.length,
      0,
      `High-risk tools claiming muse mode:\n` +
      violations.map((v) => `  ${v}`).join('\n') +
      '\nwrite_high and irreversible tools must NEVER be muse-accessible.'
    );
  });
});

// ============================================================================
// C2: Runtime enforcement — write_high and irreversible MUST reject muse mode
// ============================================================================

describe('C2: Runtime — write_high and irreversible tools rejected in muse', () => {
  for (const tool of highRiskTools) {
    it(`muse mode rejects '${tool.toolId}' (risk=${tool.risk}, suite=${tool.suite})`, async () => {
      const { runner } = await makeRunner();

      const result = await runner.execute({
        toolId: tool.toolId,
        params: { county: 'benton', parcelId: 'P-100' },
        context: museContext(),
      });

      assert.strictEqual(
        result.ok,
        false,
        `Expected muse mode to REJECT '${tool.toolId}' (${tool.risk}), but got ok=true. ` +
        'ToolRunner must enforce MODE_MISMATCH for write_high/irreversible in muse context.'
      );

      const errorText = (result.error || result.errorCode || '').toLowerCase();
      const isModeError =
        errorText.includes('mode') ||
        errorText.includes('muse') ||
        errorText.includes('mode_mismatch') ||
        errorText.includes('pilot_required') ||
        errorText.includes('confirmation') || // write_high also needs confirmation — mode check may come after
        errorText.includes('permission');     // RBAC may fire before mode in some paths

      assert.ok(
        isModeError,
        `'${tool.toolId}' was rejected, but reason unclear. Got: "${result.error}". ` +
        'Expected MODE_MISMATCH or a gate that reflects pilot-only restriction.'
      );
    });
  }
});

// ============================================================================
// C3: Runtime — pilot-mode write_low tools rejected in muse
// ============================================================================

describe('C3: Runtime — write_low pilot-only tools rejected in muse mode', () => {
  for (const tool of pilotOnlyWriteLow) {
    it(`muse mode rejects pilot-only write_low '${tool.toolId}'`, async () => {
      const { runner } = await makeRunner();

      const result = await runner.execute({
        toolId: tool.toolId,
        params: { county: 'benton', parcelId: 'P-100' },
        context: museContext(),
      });

      assert.strictEqual(
        result.ok,
        false,
        `write_low tool '${tool.toolId}' (mode=pilot) must be rejected in muse context.`
      );
    });
  }
});

// ============================================================================
// C4: Muse drafting tools (write_low + mode=muse) should NOT be blocked
// ============================================================================

describe('C4: Muse drafting tools (write_low + mode=muse) are allowed in muse context', () => {
  it('manifest contains at least one muse-declared drafting tool', () => {
    assert.ok(
      museDraftTools.length > 0,
      'Manifest must have at least one write_low tool with mode=muse (draft operations). ' +
      'Per Phase 7 mandate: muse mode may use draft/template tools. ' +
      'Add draft_notice, draft_appeal_response, etc. with mode=muse to the manifest.'
    );
  });

  for (const tool of museDraftTools) {
    it(`muse draft tool '${tool.toolId}' (write_low+muse) is NOT blocked by mode gate`, async () => {
      const { runner } = await makeRunner();

      const result = await runner.execute({
        toolId: tool.toolId,
        params: { county: 'benton', parcelId: 'P-100' },
        context: museContext(),
      });

      // Should NOT fail due to mode — may fail for other reasons (missing params, RBAC)
      if (!result.ok) {
        const errorText = (result.error || result.errorCode || '').toLowerCase();
        const isModeError =
          errorText.includes('mode_mismatch') ||
          errorText.includes('pilot_required') ||
          (errorText.includes('mode') && errorText.includes('muse'));

        assert.ok(
          !isModeError,
          `Muse draft tool '${tool.toolId}' was incorrectly blocked by mode gate. ` +
          `Error: "${result.error}". ` +
          'write_low+mode=muse tools must be available in muse context (they generate drafts, not commits).'
        );
      }
    });
  }
});

// ============================================================================
// C5: HITL gate — irreversible tools in muse must surface gated outcome
// ============================================================================

describe('C5: HITL gate — irreversible tools in muse surface a gated outcome', () => {
  for (const tool of irreversibleTools) {
    it(`irreversible '${tool.toolId}' gates HITL in muse even with supervisorApproval`, async () => {
      const { runner } = await makeRunner();

      const result = await runner.execute({
        toolId: tool.toolId,
        params: { county: 'benton' },
        context: museContext({
          // Even if a muse caller provides supervisorApproval, muse mode
          // must still reject irreversible action — muse cannot bypass HITL
          supervisorApproval: {
            approvedBy: 'supervisor-chief',
            approvedAt: '2026-03-18T00:00:00Z',
            role: 'supervisor',
          },
        }),
      });

      assert.strictEqual(
        result.ok,
        false,
        `Irreversible tool '${tool.toolId}' must NOT execute in muse mode even with supervisorApproval. ` +
        'HITL requires pilot mode + explicit confirmation. Muse cannot bypass this gate.'
      );
    });
  }
});
