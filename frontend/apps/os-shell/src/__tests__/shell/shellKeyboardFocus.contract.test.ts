/**
 * Phase 13 -- Shell Keyboard & Focus Contract Tests
 * ===================================================
 *
 * Pure store tests (no rendering) for focus management state transitions:
 *   - openWindow sets activeWindowId
 *   - closeWindow promotes next-highest-z window
 *   - closeWindow on last window clears activeWindowId
 *   - minimizeWindow promotes next-highest-z window
 *   - focusWindow on minimized window restores it
 *   - focusWindow on already-active window minimizes it (toggle behavior)
 *
 * Also tests keyboard shortcut contracts (source inspection):
 *   - Ctrl+K toggles command palette
 *   - Ctrl+` toggles start menu
 *   - Escape closes overlays
 *   - Input elements are skipped for module shortcuts
 *
 * @see stores/desktopStore.ts — window lifecycle
 * @see hooks/useKeyboardShortcuts.ts — global shortcuts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDesktopStore } from '../../stores/desktopStore';

// ============================================================================
// Helpers
// ============================================================================

/** Reset store to clean state before each test */
function resetStore() {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    shellMode: 'home' as any,
    previousShellMode: null,
  });
}

// ============================================================================
// 1. openWindow — Focus Transitions
// ============================================================================

describe('openWindow Focus Transitions', () => {
  beforeEach(resetStore);

  it('openWindow sets activeWindowId to the new window', () => {
    const store = useDesktopStore.getState();
    const id = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    expect(id).toBeTruthy();
    expect(useDesktopStore.getState().activeWindowId).toBe(id);
  });

  it('opening a second window moves activeWindowId to the new window', () => {
    const store = useDesktopStore.getState();
    const id1 = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const id2 = useDesktopStore.getState().openWindow('suite-atlas', 'TerraAtlas', 'map');
    expect(useDesktopStore.getState().activeWindowId).toBe(id2);
    expect(id1).not.toBe(id2);
  });

  it('new window gets higher zIndex than previous', () => {
    const store = useDesktopStore.getState();
    store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const state1 = useDesktopStore.getState();
    const w1 = state1.windows[0];

    state1.openWindow('suite-atlas', 'TerraAtlas', 'map');
    const state2 = useDesktopStore.getState();
    const w2 = state2.windows[1];

    expect(w2.zIndex).toBeGreaterThan(w1.zIndex);
  });
});

// ============================================================================
// 2. closeWindow — Focus Promotion
// ============================================================================

describe('closeWindow Focus Promotion', () => {
  beforeEach(resetStore);

  it('closing the active window promotes the next-highest-z window', () => {
    const store = useDesktopStore.getState();
    const id1 = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const id2 = useDesktopStore.getState().openWindow('suite-atlas', 'TerraAtlas', 'map');

    // id2 is active. Close it. id1 should become active.
    useDesktopStore.getState().closeWindow(id2);
    expect(useDesktopStore.getState().activeWindowId).toBe(id1);
  });

  it('closing the last window sets activeWindowId to null', () => {
    const store = useDesktopStore.getState();
    const id = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    useDesktopStore.getState().closeWindow(id);
    expect(useDesktopStore.getState().activeWindowId).toBeNull();
    expect(useDesktopStore.getState().windows.length).toBe(0);
  });

  it('closing a non-active window does not change activeWindowId', () => {
    const store = useDesktopStore.getState();
    const id1 = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const id2 = useDesktopStore.getState().openWindow('suite-atlas', 'TerraAtlas', 'map');

    // id2 is active. Close id1 (not active).
    useDesktopStore.getState().closeWindow(id1);
    expect(useDesktopStore.getState().activeWindowId).toBe(id2);
  });
});

// ============================================================================
// 3. minimizeWindow — Focus Promotion
// ============================================================================

describe('minimizeWindow Focus Promotion', () => {
  beforeEach(resetStore);

  it('minimizing the active window promotes next-highest-z non-minimized window', () => {
    const store = useDesktopStore.getState();
    const id1 = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const id2 = useDesktopStore.getState().openWindow('suite-atlas', 'TerraAtlas', 'map');

    useDesktopStore.getState().minimizeWindow(id2);
    expect(useDesktopStore.getState().activeWindowId).toBe(id1);

    // id2 should be minimized
    const w2 = useDesktopStore.getState().windows.find(w => w.id === id2);
    expect(w2?.state).toBe('minimized');
  });

  it('minimizing the only window sets activeWindowId to null', () => {
    const store = useDesktopStore.getState();
    const id = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    useDesktopStore.getState().minimizeWindow(id);
    expect(useDesktopStore.getState().activeWindowId).toBeNull();
  });
});

// ============================================================================
// 4. focusWindow — Restore and Toggle
// ============================================================================

describe('focusWindow Behavior', () => {
  beforeEach(resetStore);

  it('focusWindow on a minimized window restores it to normal', () => {
    const store = useDesktopStore.getState();
    const id = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    useDesktopStore.getState().minimizeWindow(id);
    expect(useDesktopStore.getState().windows[0].state).toBe('minimized');

    useDesktopStore.getState().focusWindow(id);
    const w = useDesktopStore.getState().windows.find(w => w.id === id);
    expect(w?.state).toBe('normal');
    expect(useDesktopStore.getState().activeWindowId).toBe(id);
  });

  it('focusWindow on already-active non-minimized window minimizes it (toggle)', () => {
    const store = useDesktopStore.getState();
    const id = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    expect(useDesktopStore.getState().activeWindowId).toBe(id);

    // Toggle: calling focusWindow on already-active should minimize
    useDesktopStore.getState().focusWindow(id);
    const w = useDesktopStore.getState().windows.find(w => w.id === id);
    expect(w?.state).toBe('minimized');
  });

  it('focusWindow promotes a background window to active', () => {
    const store = useDesktopStore.getState();
    const id1 = store.openWindow('suite-forge', 'TerraForge', 'hammer');
    const id2 = useDesktopStore.getState().openWindow('suite-atlas', 'TerraAtlas', 'map');
    expect(useDesktopStore.getState().activeWindowId).toBe(id2);

    // Focus id1 (background window, not minimized — should activate it, not toggle)
    // But since id1 is not the active window, it should just focus
    useDesktopStore.getState().focusWindow(id1);
    expect(useDesktopStore.getState().activeWindowId).toBe(id1);
  });
});

// ============================================================================
// 5. Keyboard Shortcut Contracts (Source Inspection)
// ============================================================================

describe('Keyboard Shortcut Contracts (source inspection)', () => {
  let shortcutSource: string;

  beforeEach(async () => {
    const fs = await import('fs');
    shortcutSource = fs.readFileSync(
      'apps/os-shell/src/hooks/useKeyboardShortcuts.ts',
      'utf-8'
    );
  });

  it('Ctrl+K toggles command palette', () => {
    expect(shortcutSource).toContain("key === 'k'");
    expect(shortcutSource).toContain('ctrlKey');
    expect(shortcutSource).toContain('toggleCommandPalette');
  });

  it('Ctrl+` toggles start menu', () => {
    expect(shortcutSource).toContain("key === '`'");
    expect(shortcutSource).toContain('toggleStartMenu');
  });

  it('Escape closes command palette and start menu', () => {
    expect(shortcutSource).toContain("key === 'Escape'");
    expect(shortcutSource).toContain('closeCommandPalette');
    expect(shortcutSource).toContain('closeStartMenu');
  });

  it('input elements are excluded from module shortcuts', () => {
    expect(shortcutSource).toContain('isInputElement');
  });
});
