/**
 * Shell Mode Contract — Governance Test
 *
 * Enforces the architectural rule:
 *   "Home is a shell state, not a forever overlay."
 *   "Desktop is never permanently trapped behind Home."
 *
 * Static-analysis test that validates shellMode.ts contract and
 * desktopStore.ts integration against the canonical Shell Mode spec.
 *
 * @see contracts/shellMode.ts
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..', 'frontend', 'apps', 'os-shell', 'src');

function readFile(relPath) {
  const full = resolve(ROOT, relPath);
  assert.ok(existsSync(full), `Required file missing: ${relPath}`);
  return readFileSync(full, 'utf-8');
}

// ============================================================================
// Contract file existence and shape
// ============================================================================

describe('Shell Mode Contract — Source of Truth', () => {
  const contractSrc = readFile('contracts/shellMode.ts');

  it('declares TerraFusionShellMode with exactly 3 modes', () => {
    assert.match(contractSrc, /type TerraFusionShellMode\s*=\s*'home'\s*\|\s*'desktop'\s*\|\s*'application'/);
  });

  it('exports SHELL_SURFACE_POLICY with all 3 mode keys', () => {
    assert.match(contractSrc, /SHELL_SURFACE_POLICY/);
    for (const mode of ['home', 'desktop', 'application']) {
      assert.match(contractSrc, new RegExp(`${mode}:\\s*\\{`), `Missing policy for mode: ${mode}`);
    }
  });

  it('enforces dock visible in ALL modes (Truth #5)', () => {
    // dock: 'visible' must appear in every mode block
    const dockMatches = contractSrc.match(/dock:\s*'visible'/g);
    assert.ok(dockMatches, 'dock visibility declarations not found');
    assert.ok(dockMatches.length >= 3, `dock must be visible in all 3 modes, found ${dockMatches.length} declarations`);
  });

  it('exports INITIAL_SHELL_MODE = home (Truth #1)', () => {
    assert.match(contractSrc, /INITIAL_SHELL_MODE.*=\s*'home'/);
  });

  it('exports VALID_TRANSITIONS for all modes', () => {
    assert.match(contractSrc, /VALID_TRANSITIONS/);
    for (const mode of ['home', 'desktop', 'application']) {
      assert.match(contractSrc, new RegExp(`${mode}:\\s*\\[`), `Missing transitions for mode: ${mode}`);
    }
  });

  it('desktop can be reached from home (Truth #2, #6)', () => {
    // home transitions must include 'desktop'
    const homeTransitions = contractSrc.match(/home:\s*\[([^\]]+)\]/);
    assert.ok(homeTransitions, 'home transitions not found');
    assert.ok(homeTransitions[1].includes("'desktop'"), 'home must transition to desktop');
  });

  it('home can be reached from desktop (Truth #4)', () => {
    const desktopTransitions = contractSrc.match(/desktop:\s*\[([^\]]+)\]/);
    assert.ok(desktopTransitions, 'desktop transitions not found');
    assert.ok(desktopTransitions[1].includes("'home'"), 'desktop must transition to home');
  });

  it('home can be reached from application (Truth #4)', () => {
    const appTransitions = contractSrc.match(/application:\s*\[([^\]]+)\]/);
    assert.ok(appTransitions, 'application transitions not found');
    assert.ok(appTransitions[1].includes("'home'"), 'application must transition to home');
  });

  it('exports isValidTransition helper', () => {
    assert.match(contractSrc, /export function isValidTransition/);
  });

  it('exports getSurfacePolicy helper', () => {
    assert.match(contractSrc, /export function getSurfacePolicy/);
  });

  it('declares all 6 SHELL_MODE_TRUTHS', () => {
    const truths = [
      'system-starts-in-home',
      'user-can-enter-desktop',
      'app-launch-enters-application',
      'home-recall-preserves-session',
      'dock-always-accessible',
      'desktop-not-trapped-behind-home',
    ];
    for (const truth of truths) {
      assert.ok(contractSrc.includes(truth), `Missing truth: ${truth}`);
    }
  });
});

// ============================================================================
// desktopStore integration
// ============================================================================

describe('Shell Mode Contract — desktopStore Integration', () => {
  const storeSrc = readFile('stores/desktopStore.ts');

  it('imports TerraFusionShellMode from contracts', () => {
    assert.match(storeSrc, /import.*TerraFusionShellMode.*from.*contracts\/shellMode/);
  });

  it('imports INITIAL_SHELL_MODE from contracts', () => {
    assert.ok(
      storeSrc.includes('INITIAL_SHELL_MODE') && storeSrc.includes("contracts/shellMode"),
      'desktopStore must import INITIAL_SHELL_MODE from contracts/shellMode'
    );
  });

  it('declares shellMode in DesktopState interface', () => {
    assert.match(storeSrc, /shellMode:\s*TerraFusionShellMode/);
  });

  it('initializes shellMode to INITIAL_SHELL_MODE', () => {
    assert.match(storeSrc, /shellMode:\s*INITIAL_SHELL_MODE/);
  });

  it('exposes setShellMode action', () => {
    assert.match(storeSrc, /setShellMode/);
  });

  it('exposes enterDesktop convenience action', () => {
    assert.match(storeSrc, /enterDesktop/);
  });

  it('exposes enterHome convenience action', () => {
    assert.match(storeSrc, /enterHome/);
  });

  it('exposes enterApplication convenience action', () => {
    assert.match(storeSrc, /enterApplication/);
  });

  it('uses isValidTransition guard in setShellMode', () => {
    assert.match(storeSrc, /isValidTransition/);
  });

  it('exports useShellMode hook', () => {
    assert.match(storeSrc, /export const useShellMode/);
  });

  it('exports useShellModeActions hook', () => {
    assert.match(storeSrc, /export const useShellModeActions/);
  });

  it('exports useShellSurfaces hook', () => {
    assert.match(storeSrc, /export const useShellSurfaces/);
  });
});

// ============================================================================
// contracts/index.ts barrel re-export
// ============================================================================

describe('Shell Mode Contract — Barrel Export', () => {
  const indexSrc = readFile('contracts/index.ts');

  it('re-exports TerraFusionShellMode type', () => {
    assert.match(indexSrc, /TerraFusionShellMode/);
  });

  it('re-exports SHELL_SURFACE_POLICY', () => {
    assert.match(indexSrc, /SHELL_SURFACE_POLICY/);
  });

  it('re-exports INITIAL_SHELL_MODE', () => {
    assert.match(indexSrc, /INITIAL_SHELL_MODE/);
  });

  it('re-exports isValidTransition', () => {
    assert.match(indexSrc, /isValidTransition/);
  });
});

// ============================================================================
// Surface policy content validation
// ============================================================================

describe('Shell Mode Contract — Surface Policy Rules', () => {
  const contractSrc = readFile('contracts/shellMode.ts');

  it('home mode hides desktop surface', () => {
    // In the home block, desktop should be hidden
    const homeBlock = contractSrc.match(/home:\s*\{([^}]+)\}/);
    assert.ok(homeBlock, 'home surface block not found');
    assert.ok(homeBlock[1].includes("desktop: 'hidden'"), 'home mode must hide desktop');
  });

  it('desktop mode hides home surfaces', () => {
    // In the desktop block, home surfaces should be hidden
    const desktopBlock = contractSrc.match(/desktop:\s*\{([^}]+)\}/);
    assert.ok(desktopBlock, 'desktop surface block not found');
    assert.ok(desktopBlock[1].includes("recentWork: 'hidden'"), 'desktop mode must hide recentWork');
    assert.ok(desktopBlock[1].includes("quickActions: 'hidden'"), 'desktop mode must hide quickActions');
    assert.ok(desktopBlock[1].includes("countyMap: 'hidden'"), 'desktop mode must hide countyMap');
  });

  it('home surfaces are visible in home mode', () => {
    const homeBlock = contractSrc.match(/home:\s*\{([^}]+)\}/);
    assert.ok(homeBlock, 'home surface block not found');
    assert.ok(homeBlock[1].includes("recentWork: 'visible'"), 'home mode must show recentWork');
    assert.ok(homeBlock[1].includes("quickActions: 'visible'"), 'home mode must show quickActions');
    assert.ok(homeBlock[1].includes("countyMap: 'visible'"), 'home mode must show countyMap');
  });

  it('desktop surface is visible in desktop mode', () => {
    const desktopBlock = contractSrc.match(/desktop:\s*\{([^}]+)\}/);
    assert.ok(desktopBlock, 'desktop surface block not found');
    assert.ok(desktopBlock[1].includes("desktop: 'visible'"), 'desktop mode must show desktop surface');
  });

  it('application mode recedes desktop (does not hide it)', () => {
    const appBlock = contractSrc.match(/application:\s*\{([^}]+)\}/);
    assert.ok(appBlock, 'application surface block not found');
    assert.ok(appBlock[1].includes("desktop: 'receded'"), 'application mode must recede desktop, not hide it');
  });
});
