#!/usr/bin/env node
// ============================================================================
// WORKBENCH-V0.2 SLICE-H STEP-3 — Dry-Run Preview Panel static tests
// ----------------------------------------------------------------------------
// Structural / contract tests that run without any server or DB running.
// Verifies the panel files satisfy the SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §8
// hard rules and the Slice H Step 3 acceptance criteria.
//
// Usage:
//   node tools/sync/workbench/tests/panel-slice-h.test.mjs
//
// Exit codes:
//   0  all tests passed
//   1  one or more tests failed
//
// Tests:
//   T1.  Panel HTML contains dry-run-preview section
//   T2.  Panel HTML loads app.js
//   T3.  server.mjs registers /api/dry-run-preview/run endpoint
//   T4.  server.mjs proxies to port 5000
//   T5.  app.js renders the amber notice (NO DATA HAS MOVED)
//   T6.  app.js has "Preview Improvement Lane" button text
//   T7.  app.js has no "Run Drain" action label
//   T8.  app.js has no approve / commit button controls
//   T9.  app.js calls /api/dry-run-preview/run (not a drain endpoint)
//   T10. app.js renders drp-amber-notice class
//   T11. app.js renders all required count fields
//   T12. styles.css contains drp-amber-notice styles
//   T13. styles.css contains drp-btn styles
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert';

const __dir  = dirname(fileURLToPath(import.meta.url));
const PANEL  = join(__dir, '..', 'panel');
const SERVER = join(__dir, '..', 'server.mjs');

const html   = readFileSync(join(PANEL, 'index.html'), 'utf8');
const js     = readFileSync(join(PANEL, 'app.js'),     'utf8');
const css    = readFileSync(join(PANEL, 'styles.css'), 'utf8');
const server = readFileSync(SERVER,                    'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓  ' + name);
    passed++;
  } catch (e) {
    console.log('  ✗  ' + name);
    console.log('       ' + e.message);
    failed++;
  }
}

console.log('');
console.log('  Slice H — Dry-Run Preview Panel (structural contract tests)');
console.log('  ─────────────────────────────────────────────────────');

// ── HTML structure ────────────────────────────────────────────────────────────

test('T1. index.html has dry-run-preview section', () => {
  assert.ok(
    html.includes('id="dry-run-preview"'),
    'Expected id="dry-run-preview" in index.html'
  );
});

test('T2. index.html loads app.js', () => {
  assert.ok(
    html.includes('src="app.js"'),
    'Expected <script src="app.js"> in index.html'
  );
});

// ── Server proxy ──────────────────────────────────────────────────────────────

test('T3. server.mjs registers /api/dry-run-preview/run', () => {
  assert.ok(
    server.includes('/api/dry-run-preview/run'),
    'Expected /api/dry-run-preview/run handler in server.mjs'
  );
});

test('T4. server.mjs proxies to port 5000', () => {
  assert.ok(
    server.includes('port: 5000'),
    'Expected "port: 5000" proxy target in server.mjs'
  );
});

test('T5. server.mjs reads body before forwarding', () => {
  assert.ok(
    server.includes('readBody(req)'),
    'Expected readBody(req) call in server.mjs'
  );
});

test('T6. server.mjs passes dryRun: true to API', () => {
  assert.ok(
    server.includes("dryRun:          true"),
    'Expected dryRun: true in forwardToApi payload in server.mjs'
  );
});

// ── app.js — amber notice ─────────────────────────────────────────────────────

test('T7. app.js renders DRY-RUN PREVIEW — NO DATA HAS MOVED', () => {
  assert.ok(
    js.includes('NO DATA HAS MOVED'),
    'Expected "NO DATA HAS MOVED" in app.js'
  );
});

test('T8. app.js uses drp-amber-notice CSS class', () => {
  assert.ok(
    js.includes('drp-amber-notice'),
    'Expected drp-amber-notice class in app.js'
  );
});

// ── app.js — button label ─────────────────────────────────────────────────────

test('T9. app.js has "Preview Improvement Lane" button text (contract §8)', () => {
  assert.ok(
    js.includes('Preview Improvement Lane'),
    'Expected "Preview Improvement Lane" button text in app.js'
  );
});

// ── app.js — no write-capable controls ───────────────────────────────────────

test('T10. app.js has no "Run Drain" action label', () => {
  // Check for literal "Run Drain" as displayed text (not in path strings or comments)
  const forbidden = ['"Run Drain"', "'Run Drain'", '>Run Drain<', 'textContent = \'Run Drain\''];
  for (const f of forbidden) {
    assert.ok(!js.includes(f), 'Found forbidden drain label "' + f + '" in app.js');
  }
});

test('T11. app.js has no approve / commit action controls', () => {
  const forbidden = [
    'approve-btn', 'commit-btn',
    '"Approve for drain"', '"Commit"', '"Execute drain"',
    'textContent = \'Approve', 'textContent = \'Commit',
  ];
  for (const f of forbidden) {
    assert.ok(!js.includes(f), 'Found forbidden control "' + f + '" in app.js');
  }
});

// ── app.js — endpoint call ────────────────────────────────────────────────────

test('T12. app.js calls /api/dry-run-preview/run (proxy, not drain)', () => {
  assert.ok(
    js.includes('/api/dry-run-preview/run'),
    'Expected /api/dry-run-preview/run fetch in app.js'
  );
  assert.ok(
    !js.includes('/api/sync/workbench/drain'),
    'Found forbidden drain endpoint /api/sync/workbench/drain in app.js'
  );
});

// ── app.js — required count fields ───────────────────────────────────────────

test('T13. app.js renders all required count fields', () => {
  const required = [
    'sourceCount',
    'canonicalCount',
    'estimatedInserts',
    'estimatedUpdates',
    'estimatedDeletes',
    'quarantineCandidateCount',
    'previewRunId',
    'durationMs',
  ];
  for (const field of required) {
    assert.ok(js.includes(field), 'Expected field "' + field + '" in app.js result rendering');
  }
});

// ── CSS ────────────────────────────────────────────────────────────────────────

test('T14. styles.css contains drp-amber-notice', () => {
  assert.ok(css.includes('.drp-amber-notice'), 'Expected .drp-amber-notice in styles.css');
});

test('T15. styles.css contains drp-btn', () => {
  assert.ok(css.includes('.drp-btn'), 'Expected .drp-btn in styles.css');
});

test('T16. styles.css contains dry-run-preview section', () => {
  assert.ok(css.includes('.dry-run-preview'), 'Expected .dry-run-preview in styles.css');
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('  ─────────────────────────────────────────────────────');
console.log('  ' + (passed + failed) + ' tests — ' + passed + ' passed' +
            (failed ? ', ' + failed + ' failed' : ''));
console.log('');

if (failed > 0) {
  process.exit(1);
}
