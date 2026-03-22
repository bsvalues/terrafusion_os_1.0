#!/usr/bin/env node
/**
 * check-skip-ceiling.mjs
 *
 * Parses vitest JSON output and enforces the ratified skip baseline.
 *
 * Rules:
 *   1. Total skipped tests must be <= SKIP_CEILING (222).
 *   2. Any file that has a NEW skip count compared to the per-file baseline
 *      is flagged — allows ratchet improvements, blocks regressions.
 *
 * Usage:
 *   node tools/registry/check-skip-ceiling.mjs [path-to-vitest-results.json]
 *
 * Exits 0 on pass, 1 on violation.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Ratified baseline (sealed 2026-03-21, commit 0099d44e2) ──────────────────
const SKIP_CEILING = 222;

/**
 * Per-file skip baselines. Files NOT listed here have a baseline of 0 — any
 * skip in an unlisted file is a violation.
 *
 * Categories:
 *   [jsdom]   CSS layout / scroll / focus can't be simulated in jsdom
 *   [radix]   Radix data-attribute selectors differ from what tests expect
 *   [async]   Async timing issues flagged as flaky
 *   [missing] Feature not yet implemented
 *   [msw]     MSW TextEncoder polyfill not available in this Jest/Vitest env
 *   [backend] Requires running backend services (SQL Server, PACS, etc.)
 *   [a11y]    jest-axe concurrency issues
 *   [ph]      Placeholder — "write the exam before the course" TDD stubs
 */
const FILE_BASELINES = {
  // ── UI primitives ────────────────────────────────────────────────────────
  'src/components/ui/alert-dialog.test.tsx': { count: 1,  category: 'missing' },
  'src/components/ui/aspect-ratio.test.tsx': { count: 10, category: 'jsdom,radix,a11y' },
  'src/components/ui/button.test.tsx':       { count: 1,  category: 'jsdom' },
  'src/components/ui/calendar.test.tsx':     { count: 35, category: 'jsdom' },
  'src/components/ui/dialog.test.tsx':       { count: 5,  category: 'radix,jsdom' },
  'src/components/ui/dropdown-menu.test.tsx':{ count: 3,  category: 'jsdom' },
  'src/components/ui/label.test.tsx':        { count: 1,  category: 'jsdom' },
  'src/components/ui/menubar.test.tsx':      { count: 6,  category: 'jsdom' },
  'src/components/ui/navigation-menu.test.tsx':{ count: 13, category: 'jsdom,radix' },
  'src/components/ui/popover.test.tsx':      { count: 1,  category: 'jsdom' },
  'src/components/ui/scroll-area.test.tsx':  { count: 14, category: 'jsdom' },
  'src/components/ui/select.test.tsx':       { count: 16, category: 'jsdom,radix' },
  'src/components/ui/sheet.test.tsx':        { count: 5,  category: 'jsdom' },
  'src/components/ui/slider.test.tsx':       { count: 7,  category: 'jsdom,a11y' },
  'src/components/ui/sonner.test.tsx':       { count: 8,  category: 'jsdom,async' },
  'src/components/ui/toast.test.tsx':        { count: 5,  category: 'jsdom,async' },
  'src/components/ui/tooltip.test.tsx':      { count: 3,  category: 'jsdom' },
  // ── Form / switch ────────────────────────────────────────────────────────
  'src/tests/switch.test.tsx':               { count: 3,  category: 'jsdom,radix' },
  // ── Shell / desktop ──────────────────────────────────────────────────────
  'src/shell/desktop/Desktop.altTab.test.tsx':           { count: 2, category: 'jsdom,async' },
  'src/shell/desktop/__tests__/DesktopErrorBoundary.test.tsx': { count: 0, category: '' },
  // ── Error boundaries ─────────────────────────────────────────────────────
  'src/tests/ErrorBoundary.test.tsx':        { count: 5,  category: 'jsdom,async' },
  // ── Integration stubs ─────────────────────────────────────────────────────
  'src/tests/integration/APIServices.integration.test.tsx':          { count: 1, category: 'msw' },
  'src/tests/integration/AuthenticationFlow.integration.test.tsx':   { count: 1, category: 'msw' },
  'src/tests/integration/CountyEmployeeWorkspace.integration.test.tsx': { count: 1, category: 'msw' },
  'src/tests/integration/ResearchPortal.integration.test.tsx':       { count: 1, category: 'msw' },
  'src/tests/integration/SystemIntegration.e2e.test.tsx':            { count: 1, category: 'backend' },
  'src/tests/integration/EliteIntegrationTestSuite.test.ts':         { count: 1, category: 'backend' },
  'src/tests/security/SecurityAudit.test.tsx':                       { count: 1, category: 'backend' },
  // ── Integration workflows ────────────────────────────────────────────────
  'src/__tests__/integration/dialog-workflows.integration.test.tsx': { count: 1,  category: 'jsdom' },
  'src/__tests__/integration/navigation-workflows.integration.test.tsx': { count: 1, category: 'jsdom' },
  // ── Feature tests ────────────────────────────────────────────────────────
  'src/__tests__/smoke/gpt-studio-smoke.test.tsx':                   { count: 1, category: 'async' },
  'src/__tests__/costforge/EnhancedCostCalculator.test.tsx':         { count: 1, category: 'missing' },
  'src/__tests__/desktop/CommandHistory.test.tsx':                   { count: 1, category: 'missing' },
  'src/__tests__/EmergencyEliteQuantumInterface.test.tsx':           { count: 1, category: 'missing' },
  // ── AI / live feature placeholders ───────────────────────────────────────
  'src/features/gpt/components/__tests__/SystemGptAtlasPanel.test.tsx': { count: 14, category: 'ph' },
};

// ─── Parse args ───────────────────────────────────────────────────────────────
function resolveAllowedResultsPath(inputPath) {
  const candidate = inputPath ?? 'vitest-results.json';

  if (
    typeof candidate !== 'string' ||
    candidate.includes('/') ||
    candidate.includes('\\') ||
    candidate.includes('..') ||
    candidate !== 'vitest-results.json'
  ) {
    console.error(
      `❌ [skip-ceiling] Unsupported results path: ${String(candidate)}. Use vitest-results.json in the current working directory.`
    );
    process.exit(1);
  }

  return resolve(candidate);
}

const resultsPath = resolveAllowedResultsPath(process.argv[2]);

let raw;
try {
  raw = JSON.parse(readFileSync(resultsPath, 'utf8'));
} catch (e) {
  console.error(`❌ [skip-ceiling] Cannot read ${resultsPath}: ${e.message}`);
  process.exit(1);
}

// ─── Extract per-file skip counts from vitest JSON ───────────────────────────
// vitest --reporter=json shape: { testResults: [{ testFilePath, assertionResults: [...] }] }
// Each assertionResult has status: 'pending' for skipped tests.
const violations = [];
let totalSkipped = 0;

for (const fileResult of raw.testResults ?? []) {
  const fullPath = fileResult.testFilePath ?? fileResult.name ?? '';

  // Normalise to relative path (src/...)
  const rel = fullPath.replace(/^.*?[/\\](src[/\\])/, 'src/').replace(/\\/g, '/');

  const skipped = (fileResult.assertionResults ?? []).filter(
    (t) => t.status === 'pending' || t.status === 'skipped'
  ).length;

  totalSkipped += skipped;

  if (skipped === 0) continue;

  const baseline = FILE_BASELINES[rel];

  if (baseline === undefined) {
    violations.push(
      `UNCLASSIFIED  ${rel}  (${skipped} skip${skipped > 1 ? 's' : ''})` +
        `  — add entry to FILE_BASELINES in check-skip-ceiling.mjs with a category tag`
    );
  } else if (skipped > baseline.count) {
    violations.push(
      `REGRESSION    ${rel}  (${skipped} > baseline ${baseline.count})  [${baseline.category}]`
    );
  }
  // skipped < baseline.count → improvement, no violation (ratchet down is fine)
}

// ─── Report ───────────────────────────────────────────────────────────────────
console.log(`\n📊 Vitest skip audit`);
console.log(`   Total skipped : ${totalSkipped}`);
console.log(`   Ceiling       : ${SKIP_CEILING}`);
console.log(`   Violations    : ${violations.length}\n`);

if (totalSkipped > SKIP_CEILING) {
  violations.unshift(
    `CEILING       Total skipped ${totalSkipped} exceeds ratified ceiling ${SKIP_CEILING}`
  );
}

if (violations.length > 0) {
  console.error('❌ Skip ceiling violations:\n');
  for (const v of violations) console.error(`   ${v}`);
  console.error(
    '\nTo resolve:\n' +
      '  • Fix the underlying skip (preferred)\n' +
      '  • Or add/update the FILE_BASELINES entry with an explicit category tag\n' +
      '  • Never raise SKIP_CEILING without a ratified checkpoint commit\n'
  );
  process.exit(1);
}

console.log('✅ Skip ceiling passed — no regressions, no unclassified skips.');
process.exit(0);
