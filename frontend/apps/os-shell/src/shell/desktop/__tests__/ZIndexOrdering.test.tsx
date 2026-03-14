/**
 * Z-Index Ordering Compliance Tests
 *
 * Verifies the canonical z-index architecture is correctly applied:
 * 1. All shell components import Z from zIndex.ts
 * 2. No hardcoded z-[N] Tailwind classes remain in primary shell files
 * 3. Components use Z.* constants via style props
 * 4. Z constant values are in correct ascending order
 *
 * @module shell/desktop/__tests__/ZIndexOrdering.test
 */

import * as fs from 'fs';
import * as path from 'path';
import { Z } from '../zIndex';

// ============================================================================
// Helpers
// ============================================================================

function readFile(relativePath: string): string {
  const filePath = path.resolve(__dirname, relativePath);
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================================
// Shell files that must use Z constants
// ============================================================================

const SHELL_FILES = [
  { name: 'Desktop.tsx', path: '../Desktop.tsx' },
  { name: 'Taskbar.tsx', path: '../Taskbar.tsx' },
  { name: 'StartMenu.tsx', path: '../StartMenu.tsx' },
  { name: 'CommandPalette.tsx', path: '../../command-palette/CommandPalette.tsx' },
  { name: 'AltTabSwitcher.tsx', path: '../AltTabSwitcher.tsx' },
  { name: 'WindowPeek.tsx', path: '../WindowPeek.tsx' },
  { name: 'SnapPreview.tsx', path: '../SnapPreview.tsx' },
  { name: 'AppContextMenu.tsx', path: '../AppContextMenu.tsx' },
  { name: 'ContextMenu.tsx', path: '../ContextMenu.tsx' },
  { name: 'DesktopContextMenu.tsx', path: '../DesktopContextMenu.tsx' },
  { name: 'VirtualDesktopSwitcher.tsx', path: '../VirtualDesktopSwitcher.tsx' },
  { name: 'SentinelPanel.tsx', path: '../../../sentinel/SentinelPanel.tsx' },
  { name: 'SentinelChip.tsx', path: '../../../sentinel/SentinelChip.tsx' },
  { name: 'EmergencyMountTest.tsx', path: '../../../components/emergency/EmergencyMountTest.tsx' },
  { name: 'StageZeroState.tsx', path: '../StageZeroState.tsx' },
];

// ============================================================================
// Tests
// ============================================================================

describe('Z-Index Ordering', () => {
  // --------------------------------------------------------------------------
  // All shell files import Z from zIndex.ts
  // --------------------------------------------------------------------------

  it.each(SHELL_FILES)('$name imports Z from zIndex', ({ path: p }) => {
    const content = readFile(p);
    expect(content).toMatch(/import\s*\{[^}]*Z[^}]*\}\s*from\s*['"][^'"]*zIndex['"]/);
  });

  // --------------------------------------------------------------------------
  // No hardcoded z-[N] Tailwind classes in primary shell files
  // --------------------------------------------------------------------------

  it.each(SHELL_FILES)('$name has no hardcoded z-[N] Tailwind classes', ({ path: p }) => {
    const content = readFile(p);
    // Match z-[<number>] but not in comments
    const lines = content.split('\n');
    const violations = lines.filter(
      (line) => /z-\[\d+\]/.test(line) && !line.trim().startsWith('//')  && !line.trim().startsWith('*')
    );
    expect(violations).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Components use Z.* constants in style props
  // --------------------------------------------------------------------------

  it('Taskbar uses Z.dock', () => {
    const content = readFile('../Taskbar.tsx');
    expect(content).toContain('Z.dock');
  });

  it('StartMenu uses Z.startMenu', () => {
    const content = readFile('../StartMenu.tsx');
    expect(content).toContain('Z.startMenu');
  });

  it('Desktop top bar uses Z.topbar', () => {
    const content = readFile('../Desktop.tsx');
    expect(content).toContain('Z.topbar');
  });

  it('Desktop skip-nav uses Z.skipNav', () => {
    const content = readFile('../Desktop.tsx');
    expect(content).toContain('Z.skipNav');
  });

  it('AltTabSwitcher uses Z.altTabBackdrop and Z.altTab', () => {
    const content = readFile('../AltTabSwitcher.tsx');
    expect(content).toContain('Z.altTabBackdrop');
    expect(content).toContain('Z.altTab');
  });

  it('CommandPalette uses Z.commandBackdrop and Z.commandPalette', () => {
    const content = readFile('../../command-palette/CommandPalette.tsx');
    expect(content).toContain('Z.commandBackdrop');
    expect(content).toContain('Z.commandPalette');
  });

  it('WindowPeek uses Z.peek', () => {
    const content = readFile('../WindowPeek.tsx');
    expect(content).toContain('Z.peek');
  });

  it('SnapPreview uses Z.snapPreview', () => {
    const content = readFile('../SnapPreview.tsx');
    expect(content).toContain('Z.snapPreview');
  });

  it('SentinelPanel uses Z.sentinel and Z.sentinelPanel', () => {
    const content = readFile('../../../sentinel/SentinelPanel.tsx');
    expect(content).toContain('Z.sentinel');
    expect(content).toContain('Z.sentinelPanel');
  });

  it('EmergencyMountTest uses Z.overlay', () => {
    const content = readFile('../../../components/emergency/EmergencyMountTest.tsx');
    expect(content).toContain('Z.overlay');
  });

  // --------------------------------------------------------------------------
  // No legacy z-[9999] / z-[9998] / z-[10000] values
  // --------------------------------------------------------------------------

  it.each(SHELL_FILES)(
    '$name does not contain legacy z-[9999], z-[9998], or z-[10000]',
    ({ path: p }) => {
      const content = readFile(p);
      expect(content).not.toMatch(/z-\[9999\]|z-\[9998\]|z-\[10000\]/);
      expect(content).not.toMatch(/zIndex:\s*9999|zIndex:\s*9998|zIndex:\s*10000/);
    }
  );

  // --------------------------------------------------------------------------
  // Z constant values are in correct ascending order
  // --------------------------------------------------------------------------

  it('z-index layers are in correct ascending order', () => {
    const layers = [
      { name: 'desktop', value: Z.desktop },
      { name: 'topbar', value: Z.topbar },
      { name: 'contextMenu', value: Z.contextMenu },
      { name: 'window', value: Z.window },
      { name: 'windowActive', value: Z.windowActive },
      { name: 'dock', value: Z.dock },
      { name: 'startMenu', value: Z.startMenu },
      { name: 'dockContextMenu', value: Z.dockContextMenu },
      { name: 'snapPreview', value: Z.snapPreview },
      { name: 'peek', value: Z.peek },
      { name: 'sentinel', value: Z.sentinel },
      { name: 'sentinelPanel', value: Z.sentinelPanel },
      { name: 'altTabBackdrop', value: Z.altTabBackdrop },
      { name: 'altTab', value: Z.altTab },
      { name: 'commandBackdrop', value: Z.commandBackdrop },
      { name: 'commandPalette', value: Z.commandPalette },
      { name: 'overlay', value: Z.overlay },
      { name: 'debug', value: Z.debug },
      { name: 'skipNav', value: Z.skipNav },
    ];

    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].value).toBeGreaterThanOrEqual(layers[i - 1].value);
    }
  });

  // --------------------------------------------------------------------------
  // Z constants have expected values (regression guard)
  // --------------------------------------------------------------------------

  it('Z constants have expected values', () => {
    expect(Z.desktop).toBe(0);
    expect(Z.topbar).toBe(10);
    expect(Z.dock).toBe(1000);
    expect(Z.startMenu).toBe(1010);
    expect(Z.dockContextMenu).toBe(1020);
    expect(Z.snapPreview).toBe(1040);
    expect(Z.peek).toBe(1100);
    expect(Z.sentinel).toBe(1150);
    expect(Z.sentinelPanel).toBe(1151);
    expect(Z.altTabBackdrop).toBe(1200);
    expect(Z.altTab).toBe(1201);
    expect(Z.commandBackdrop).toBe(1299);
    expect(Z.commandPalette).toBe(1300);
    expect(Z.overlay).toBe(1400);
    expect(Z.skipNav).toBe(99999);
  });
});
