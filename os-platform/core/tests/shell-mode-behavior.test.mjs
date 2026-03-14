/**
 * Shell Mode Behavior — Governance Test
 *
 * Enforces runtime wiring of the shell mode contract:
 *   1. Desktop.tsx gates surfaces based on useShellSurfaces()
 *   2. openWindow() triggers enterApplication()
 *   3. closeWindow() restores prior shell mode when no windows remain
 *   4. Desktop background click triggers home → desktop transition
 *   5. previousShellMode is tracked for recall
 *
 * Static-analysis test — validates source code patterns.
 *
 * @see contracts/shellMode.ts
 * @see stores/desktopStore.ts
 * @see shell/desktop/Desktop.tsx
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
// Desktop.tsx — Shell Mode Surface Gating
// ============================================================================

describe('Shell Mode Behavior — Desktop Surface Gating', () => {
  const desktopSrc = readFile('shell/desktop/Desktop.tsx');

  it('imports useShellSurfaces from desktopStore', () => {
    assert.ok(
      desktopSrc.includes('useShellSurfaces') && desktopSrc.includes('desktopStore'),
      'Desktop must import useShellSurfaces from desktopStore'
    );
  });

  it('imports useShellMode from desktopStore', () => {
    assert.ok(
      desktopSrc.includes('useShellMode') && desktopSrc.includes('desktopStore'),
      'Desktop must import useShellMode from desktopStore'
    );
  });

  it('imports useShellModeActions from desktopStore', () => {
    assert.ok(
      desktopSrc.includes('useShellModeActions') && desktopSrc.includes('desktopStore'),
      'Desktop must import useShellModeActions from desktopStore'
    );
  });

  it('calls useShellSurfaces() to get surface visibility', () => {
    assert.match(desktopSrc, /useShellSurfaces\(\)/);
  });

  it('gates StageZeroState on surface visibility (not always rendered)', () => {
    // StageZeroState must be conditionally rendered based on surfaces
    assert.match(
      desktopSrc,
      /surfaces\.\w+.*&&.*StageZeroState/s,
      'StageZeroState must be gated by surface visibility'
    );
  });

  it('gates DesktopIconGrid on desktop surface visibility', () => {
    assert.match(
      desktopSrc,
      /surfaces\.desktop.*&&.*DesktopIconGrid/s,
      'DesktopIconGrid must be gated by surfaces.desktop'
    );
  });

  it('handles click to transition from home to desktop', () => {
    assert.ok(
      desktopSrc.includes("shellMode === 'home'") &&
      desktopSrc.includes('transitionToDesktop'),
      'Desktop must handle click to transition from home to desktop'
    );
  });
});

// ============================================================================
// desktopStore.ts — Shell Mode Lifecycle Wiring
// ============================================================================

describe('Shell Mode Behavior — Store Lifecycle Wiring', () => {
  const storeSrc = readFile('stores/desktopStore.ts');

  it('declares previousShellMode in DesktopState', () => {
    assert.match(storeSrc, /previousShellMode/);
  });

  it('initializes previousShellMode to null', () => {
    assert.match(storeSrc, /previousShellMode:\s*null/);
  });

  it('setShellMode saves previousShellMode before transitioning', () => {
    // setShellMode must set previousShellMode to the current mode
    assert.ok(
      storeSrc.includes('previousShellMode: shellMode') ||
      storeSrc.includes('previousShellMode: shellMode,'),
      'setShellMode must save current mode as previousShellMode'
    );
  });

  it('openWindow calls enterApplication()', () => {
    // Find the implementation (after "// Window Actions" or second occurrence)
    const implStart = storeSrc.indexOf('openWindow: (', storeSrc.indexOf('openWindow: (') + 1);
    const implEnd = storeSrc.indexOf('closeWindow:', implStart);
    const openWindowBlock = storeSrc.substring(implStart, implEnd);
    assert.ok(
      openWindowBlock.includes('enterApplication'),
      'openWindow must call enterApplication() after creating a window'
    );
  });

  it('closeWindow restores prior mode when no windows remain', () => {
    const implStart = storeSrc.indexOf('closeWindow: (', storeSrc.indexOf('closeWindow:') + 1);
    const implEnd = storeSrc.indexOf('minimizeWindow:', implStart);
    const closeWindowBlock = storeSrc.substring(implStart, implEnd);
    assert.ok(
      closeWindowBlock.includes('newWindows.length === 0'),
      'closeWindow must check if no windows remain'
    );
    assert.ok(
      closeWindowBlock.includes('previousShellMode'),
      'closeWindow must reference previousShellMode for mode restoration'
    );
    assert.ok(
      closeWindowBlock.includes('setShellMode'),
      'closeWindow must call setShellMode to restore prior mode'
    );
  });
});

// ============================================================================
// Cross-file consistency
// ============================================================================

describe('Shell Mode Behavior — Cross-File Consistency', () => {
  const desktopSrc = readFile('shell/desktop/Desktop.tsx');
  const storeSrc = readFile('stores/desktopStore.ts');

  it('Desktop.tsx uses shellMode from store (not local state)', () => {
    // Must not declare shellMode as local useState
    assert.ok(
      !desktopSrc.includes("useState('home')") &&
      !desktopSrc.includes("useState('desktop')"),
      'shellMode must come from desktopStore, not local state'
    );
  });

  it('store exports all three shell mode hooks', () => {
    assert.match(storeSrc, /export const useShellMode/);
    assert.match(storeSrc, /export const useShellModeActions/);
    assert.match(storeSrc, /export const useShellSurfaces/);
  });

  it('previousShellMode type is TerraFusionShellMode | null', () => {
    assert.match(storeSrc, /previousShellMode:\s*TerraFusionShellMode\s*\|\s*null/);
  });
});
