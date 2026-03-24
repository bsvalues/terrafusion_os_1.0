/**
 * Phase 7 — Launch Surface: Dock + Top Bar Preservation Regressions
 * ============================================================================
 * Tests F from the Phase 7 Co-Founder mandate:
 *
 * LaunchSurfaceContractTests (regression additions):
 *   F1. Dock (Taskbar) and Top Bar are rendered unconditionally — they must NOT
 *       be conditionally hidden when os-pilot or os-trace windows are open.
 *   F2. OS feature modules (os-pilot, os-trace) are NOT given the maximized
 *       flag (they are overlay windows, not full-screen takeovers).
 *   F3. Parcel-scoped launch tokens route to property-workbench, not to
 *       standalone route navigation.
 *   F4. No standalone summary-card placeholder regressions in Workbench tabs.
 *       Workbench tabs must render real content, not "Coming Soon" stubs.
 *
 * Run: node --test os-platform/core/tests/p7-launch-surface-dock-preservation.test.mjs
 *
 * Depends on: node --test launch-surface-contract.test.mjs (base coverage)
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const SHELL_SRC = path.join(REPO_ROOT, 'frontend/apps/os-shell/src');

function readShellFile(relativePath) {
  return fs.readFileSync(path.join(SHELL_SRC, relativePath), 'utf-8');
}

// ============================================================================
// F1: Dock and Top Bar are unconditionally rendered
// ============================================================================

describe('F1: Desktop.tsx renders Dock and Top Bar unconditionally', () => {
  test('Taskbar (Dock) is NOT conditionally hidden per active module', () => {
    const desktop = readShellFile('shell/desktop/Desktop.tsx');

    // Bad patterns: conditional rendering gated on active module type
    const DOCK_HIDE_PATTERNS = [
      /os-pilot.*Taskbar/s,           // hiding taskbar for os-pilot
      /os-trace.*Taskbar/s,           // hiding taskbar for os-trace
      /Taskbar.*os-pilot/s,           // same reversed
      /Taskbar.*os-trace/s,
      /moduleId.*===.*'os-'.*&&.*Taskbar/s,  // module-specific gating of Taskbar
    ];

    for (const pattern of DOCK_HIDE_PATTERNS) {
      assert.ok(
        !pattern.test(desktop),
        `Desktop.tsx appears to conditionally hide Taskbar (Dock) based on active module. ` +
        `Pattern: ${pattern}. ` +
        'The Dock must be visible at all times, including when os-pilot or os-trace windows are open.'
      );
    }

    // Positive check: Taskbar must be rendered in the file
    assert.ok(
      desktop.includes('Taskbar') || desktop.includes('TaskbarWithNotifications'),
      'Desktop.tsx must render a Taskbar/Dock component.'
    );
  });

  test('DesktopTopSystemBar is NOT conditionally hidden per active module', () => {
    const desktop = readShellFile('shell/desktop/Desktop.tsx');

    const TOP_BAR_HIDE_PATTERNS = [
      /os-pilot.*DesktopTopSystemBar/s,
      /os-trace.*DesktopTopSystemBar/s,
      /DesktopTopSystemBar.*os-pilot/s,
      /DesktopTopSystemBar.*os-trace/s,
    ];

    for (const pattern of TOP_BAR_HIDE_PATTERNS) {
      assert.ok(
        !pattern.test(desktop),
        `Desktop.tsx conditionally hides DesktopTopSystemBar for OS features. ` +
        'The Top Bar must persist across all module states.'
      );
    }

    assert.ok(
      desktop.includes('DesktopTopSystemBar') || desktop.includes('TopSystemBar') || desktop.includes('SystemBar'),
      'Desktop.tsx must render a top system bar component.'
    );
  });
});

// ============================================================================
// F2: OS feature windows are NOT maximized (they are overlay windows)
// ============================================================================

describe('F2: OS feature windows open as overlays, not maximized takeovers', () => {
  test('desktopStore: os-pilot does NOT open maximized', () => {
    const store = readShellFile('stores/desktopStore.ts');

    // Should NOT have: { 'os-pilot': { maximized: true } } pattern
    // Maximized is reserved for property-workbench
    const osPilotMaximized = /os-pilot['"]\s*[^}]*maximized\s*:\s*true/.test(store);
    assert.ok(
      !osPilotMaximized,
      "desktopStore assigns maximized:true to 'os-pilot'. " +
      'OS features are overlay windows — maximized is reserved for property-workbench.'
    );
  });

  test('desktopStore: os-trace does NOT open maximized', () => {
    const store = readShellFile('stores/desktopStore.ts');

    const osTraceMaximized = /os-trace['"]\s*[^}]*maximized\s*:\s*true/.test(store);
    assert.ok(
      !osTraceMaximized,
      "desktopStore assigns maximized:true to 'os-trace'. " +
      'OS features are overlay windows — maximized is reserved for property-workbench.'
    );
  });

  test('moduleActivation: os-pilot and os-trace have window-type classification', () => {
    const activation = readShellFile('orchestration/moduleActivation.ts');

    assert.ok(
      activation.includes("'os-pilot'") || activation.includes('"os-pilot"'),
      "moduleActivation.ts must register 'os-pilot' with display metadata."
    );
    assert.ok(
      activation.includes("'os-trace'") || activation.includes('"os-trace"'),
      "moduleActivation.ts must register 'os-trace' with display metadata."
    );
  });
});

// ============================================================================
// F3: Parcel-scoped routing goes to property-workbench (no route escapes)
// ============================================================================

describe('F3: Parcel-scoped tokens route to property-workbench', () => {
  test('parcelScopedRouting or moduleActivation routes parcel token to property-workbench', () => {
    const activation = readShellFile('orchestration/moduleActivation.ts');

    // property-workbench must be activated for parcel actions
    assert.ok(
      activation.includes('property-workbench'),
      "moduleActivation.ts must reference 'property-workbench' for parcel-scoped routing. " +
      'Parcel actions must not escape to standalone route navigation.'
    );
  });

  test('no parcel-scoped actions route to suite standalone routes', () => {
    // Check parcel context indicator or header for routing behavior
    const parcelContextFiles = [
      'components/parcel/ParcelContextBanner.tsx',
      'components/parcel/ParcelContextHeader.tsx',
    ].filter((f) => {
      try {
        fs.readFileSync(path.join(SHELL_SRC, f));
        return true;
      } catch {
        return false;
      }
    });

    for (const file of parcelContextFiles) {
      const content = readShellFile(file);

      // These are route escapes that bypass Property Workbench
      const ROUTE_ESCAPE_PATTERNS = [
        /navigate\(['"]\/forge['"]/, // direct route to /forge (bypasses workbench)
        /navigate\(['"]\/atlas['"]/,
        /navigate\(['"]\/dais['"]/,
      ];

      for (const pattern of ROUTE_ESCAPE_PATTERNS) {
        assert.ok(
          !pattern.test(content),
          `${file} uses a route-escape pattern: ${pattern}. ` +
          'Parcel-scoped actions must route to property-workbench, not standalone suite routes.'
        );
      }
    }
  });
});

// ============================================================================
// F4: No "Coming Soon" stubs in canonical Workbench tabs
// ============================================================================

describe('F4: Canonical Workbench tabs render real content (no placeholder stubs)', () => {
  const WORKBENCH_TAB_FILES = [
    'pages/suites/ForgeSuiteHome.tsx',
    'pages/suites/AtlasSuiteHome.tsx',
    'pages/suites/DaisSuiteHome.tsx',
    'pages/suites/DossierSuiteHome.tsx',
    'pages/suites/GptSuiteHome.tsx',
  ].filter((f) => {
    try {
      fs.readFileSync(path.join(SHELL_SRC, f));
      return true;
    } catch {
      return false;
    }
  });

  const STUB_PATTERNS = [
    { pattern: /Coming Soon/i, label: '"Coming Soon"' },
    { pattern: /Placeholder/i, label: '"Placeholder"' },
    { pattern: /TODO: implement/i, label: '"TODO: implement"' },
    { pattern: /STUB/i, label: '"STUB"' },
  ];

  for (const file of WORKBENCH_TAB_FILES) {
    for (const { pattern, label } of STUB_PATTERNS) {
      test(`${file} has no ${label} stub`, () => {
        const content = readShellFile(file);
        assert.ok(
          !pattern.test(content),
          `${file} contains ${label} stub content. ` +
          'Constitutional Workbench tabs must render real assessment content, not placeholder stubs.'
        );
      });
    }
  }

  test('at least one canonical Workbench tab file exists', () => {
    assert.ok(
      WORKBENCH_TAB_FILES.length > 0,
      'No canonical Workbench tab files found. Expected at least one of: ' +
      'ForgeSuiteHome.tsx, AtlasSuiteHome.tsx, DaisSuiteHome.tsx, DossierSuiteHome.tsx, GptSuiteHome.tsx'
    );
  });
});
