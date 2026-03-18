/**
 * @vitest-environment jsdom
 */

/**
 * TerraFusion OS — Launcher → Window → Taskbar Contract Tests
 *
 * Proves the data-flow chain: module launch → window in store → taskbar
 * binding. The taskbar reads windows[] and activeWindowId directly from
 * the desktop store; these tests verify the predicates the Taskbar.tsx
 * component relies on.
 *
 * KEY ARCHITECTURAL TRUTH (from 3-6-9 Object Placement Codex):
 *   - Parcel-scoped suite IDs ('forge','atlas','dais','dossier') route to
 *     the Property Workbench — they do NOT spawn standalone windows.
 *   - Suite-workspace IDs ('suite-forge','suite-atlas',...) DO spawn standalone.
 *   - Unclassified IDs (e.g. 'gpt','settings') spawn standalone (graceful).
 *
 * Contract surface:
 *   1. Codex routing: parcel-scoped → workbench, suite-workspace → standalone
 *   2. Workbench carries _routedTab metadata for the original suite
 *   3. Standalone modules match taskbar isRunning/isActive predicates
 *   4. focusWindow toggles minimized (taskbar click behavior)
 *   5. Non-pinned standalone windows appear in RunningApps zone
 *   6. Full lifecycle trail for standalone windows
 *
 * @module stores/__tests__/launcherWindowTaskbar.contract.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useDesktopStore, evaluateSpawnIntent } from '../desktopStore';
import { shellEventBus } from '../shellEventBus';
import type { ShellEvent } from '../../../../../os-platform/core/types';

// ── IDs that map to parcel-scoped-app in MODULE_OBJECT_TYPES (route to workbench) ──
const PARCEL_SCOPED_SUITE_IDS = ['forge', 'atlas', 'dais', 'dossier'] as const;

// ── IDs that map to suite-workspace (spawn standalone windows) ──
const SUITE_WORKSPACE_IDS = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'] as const;

// ── Constitutional suite IDs as used in CONSTITUTIONAL_SUITES ──
const CONSTITUTIONAL_IDS = ['forge', 'atlas', 'dais', 'dossier', 'gpt'] as const;
const PINNED_SET = new Set<string>(CONSTITUTIONAL_IDS);

// ── Event collector ──
let events: ShellEvent[] = [];
let unsubscribe: (() => void) | null = null;

beforeEach(() => {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });
  events = [];
  shellEventBus.clear();
  unsubscribe = shellEventBus.subscribe((e) => events.push(e));
});

afterEach(() => {
  unsubscribe?.();
  shellEventBus.clear();
});

// ── Helpers (mirror exact taskbar predicates from Taskbar.tsx) ──

/** Taskbar predicate: is a window running for this module? */
function isRunning(moduleId: string): boolean {
  const { windows } = useDesktopStore.getState();
  return windows.some((w) => w.moduleId === moduleId);
}

/** Taskbar predicate: is this module's window the active window? */
function isActive(moduleId: string): boolean {
  const { windows, activeWindowId } = useDesktopStore.getState();
  return windows.some((w) => w.moduleId === moduleId && w.id === activeWindowId);
}

/** Taskbar predicate: non-pinned running windows (RunningApps zone) */
function nonPinnedWindows(): string[] {
  const { windows } = useDesktopStore.getState();
  return windows
    .filter((w) => !PINNED_SET.has(w.moduleId ?? ''))
    .map((w) => w.moduleId);
}

/** Taskbar click handler mirror: find window by moduleId, then focusWindow */
function taskbarClickSuite(suiteId: string): void {
  const { windows, focusWindow } = useDesktopStore.getState();
  const suiteWindow = windows.find((w) => w.moduleId === suiteId);
  if (suiteWindow) {
    focusWindow(suiteWindow.id);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. 3-6-9 Codex routing: parcel-scoped suites route to workbench
// ═══════════════════════════════════════════════════════════════════════════

describe('codex routing for parcel-scoped suite IDs', () => {
  it.each(PARCEL_SCOPED_SUITE_IDS)(
    '"%s" evaluates to route-to-workbench',
    (suiteId) => {
      const verdict = evaluateSpawnIntent(suiteId);
      expect(verdict.decision).toBe('route-to-workbench');
    }
  );

  it('openWindow("forge") routes to property-workbench window', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('forge', 'TerraForge', '🔨');

    const { windows } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0].moduleId).toBe('property-workbench');
  });

  it('routed window carries _routedTab metadata', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('forge', 'TerraForge', '🔨');

    const { windows } = useDesktopStore.getState();
    expect(windows[0].metadata).toMatchObject({ _routedTab: 'forge' });
  });

  it('second parcel-scoped suite reuses existing workbench window', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('forge', 'TerraForge', '🔨');
    openWindow('atlas', 'TerraAtlas', '🗺️');

    const { windows } = useDesktopStore.getState();
    // Only one workbench window, not two
    const workbenches = windows.filter((w) => w.moduleId === 'property-workbench');
    expect(workbenches).toHaveLength(1);
    // Metadata updated to the latest routed tab
    expect(workbenches[0].metadata).toMatchObject({ _routedTab: 'atlas' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Suite-workspace IDs spawn standalone windows
// ═══════════════════════════════════════════════════════════════════════════

describe('suite-workspace IDs spawn standalone', () => {
  it.each(SUITE_WORKSPACE_IDS)(
    '"%s" evaluates to open (lawful window spawn)',
    (wsId) => {
      const verdict = evaluateSpawnIntent(wsId);
      expect(verdict.decision).toBe('open');
    }
  );

  it('openWindow("suite-forge") creates a standalone window', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');

    const { windows } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0].moduleId).toBe('suite-forge');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Standalone window → taskbar running/active predicates
// ═══════════════════════════════════════════════════════════════════════════

describe('taskbar isRunning predicate (standalone windows)', () => {
  it('returns false when no windows open', () => {
    expect(isRunning('suite-forge')).toBe(false);
  });

  it('returns true after opening a suite-workspace window', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');
    expect(isRunning('suite-forge')).toBe(true);
  });

  it('returns false for a different module', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');
    expect(isRunning('suite-atlas')).toBe(false);
  });

  it('returns false after closing the window', () => {
    const { openWindow } = useDesktopStore.getState();
    const id = openWindow('suite-forge', 'TerraForge', '🔨');

    const { closeWindow } = useDesktopStore.getState();
    closeWindow(id);
    expect(isRunning('suite-forge')).toBe(false);
  });

  it('workbench shows as running for property-workbench moduleId', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('forge', 'TerraForge', '🔨'); // routes to workbench
    expect(isRunning('property-workbench')).toBe(true);
    expect(isRunning('forge')).toBe(false); // parcel-scoped ID not in windows
  });
});

describe('taskbar isActive predicate (standalone windows)', () => {
  it('most recently opened standalone window is active', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');
    expect(isActive('suite-forge')).toBe(true);
  });

  it('opening a second window makes the first inactive', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');
    openWindow('suite-atlas', 'TerraAtlas', '🗺️');
    expect(isActive('suite-forge')).toBe(false);
    expect(isActive('suite-atlas')).toBe(true);
  });

  it('focusWindow restores activity', () => {
    const { openWindow } = useDesktopStore.getState();
    const forgeId = openWindow('suite-forge', 'TerraForge', '🔨');
    openWindow('suite-atlas', 'TerraAtlas', '🗺️');

    const { focusWindow } = useDesktopStore.getState();
    focusWindow(forgeId);
    expect(isActive('suite-forge')).toBe(true);
    expect(isActive('suite-atlas')).toBe(false);
  });

  it('minimized window is not active', () => {
    const { openWindow } = useDesktopStore.getState();
    const id = openWindow('suite-forge', 'TerraForge', '🔨');

    const { minimizeWindow } = useDesktopStore.getState();
    minimizeWindow(id);
    expect(isActive('suite-forge')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Taskbar click → focusWindow binding (standalone windows)
// ═══════════════════════════════════════════════════════════════════════════

describe('taskbar click handler (focusWindow binding)', () => {
  it('clicking a running module focuses its window', () => {
    const { openWindow } = useDesktopStore.getState();
    const forgeId = openWindow('suite-forge', 'TerraForge', '🔨');
    openWindow('suite-atlas', 'TerraAtlas', '🗺️');

    // Simulate taskbar click on suite-forge
    taskbarClickSuite('suite-forge');

    expect(isActive('suite-forge')).toBe(true);
    const focusEvent = events.find(
      (e) => e.type === 'window_focused' && e.windowId === forgeId
    );
    expect(focusEvent).toBeDefined();
  });

  it('clicking active module triggers toggle-minimize', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');

    taskbarClickSuite('suite-forge');

    const { windows } = useDesktopStore.getState();
    const win = windows.find((w) => w.moduleId === 'suite-forge');
    expect(win?.state).toBe('minimized');
  });

  it('clicking minimized module restores it', () => {
    const { openWindow } = useDesktopStore.getState();
    const forgeId = openWindow('suite-forge', 'TerraForge', '🔨');

    const { minimizeWindow } = useDesktopStore.getState();
    minimizeWindow(forgeId);

    openWindow('suite-atlas', 'TerraAtlas', '🗺️');

    taskbarClickSuite('suite-forge');

    const { windows } = useDesktopStore.getState();
    const win = windows.find((w) => w.moduleId === 'suite-forge');
    expect(win?.state).toBe('normal');
    expect(isActive('suite-forge')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. RunningApps zone: non-pinned overflow
// ═══════════════════════════════════════════════════════════════════════════

describe('RunningApps zone (non-pinned overflow)', () => {
  it('workbench-routed window appears in overflow (moduleId=property-workbench)', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('forge', 'TerraForge', '🔨'); // routes to workbench
    // Workbench is not a constitutional suite ID → it overflows
    expect(nonPinnedWindows()).toContain('property-workbench');
  });

  it('suite-workspace window appears in overflow when not in PINNED_SET', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('suite-forge', 'TerraForge', '🔨');
    // 'suite-forge' is not in CONSTITUTIONAL_IDS → overflow
    expect(nonPinnedWindows()).toContain('suite-forge');
  });

  it('true standalone modules appear in overflow', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('settings', 'Settings', '⚙️');
    expect(nonPinnedWindows()).toEqual(['settings']);
  });

  it('unclassified "gpt" spawns standalone and IS pinned', () => {
    const { openWindow } = useDesktopStore.getState();
    openWindow('gpt', 'TerraGPT', '🧠');
    // 'gpt' is in CONSTITUTIONAL_IDS → pinned, not overflow
    expect(isRunning('gpt')).toBe(true);
    expect(nonPinnedWindows()).not.toContain('gpt');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Full lifecycle trail for standalone windows
// ═══════════════════════════════════════════════════════════════════════════

describe('full lifecycle trail (open → close)', () => {
  it('traces the complete chain for a standalone module', () => {
    const { openWindow } = useDesktopStore.getState();

    // OPEN: appears as running
    const id = openWindow('suite-forge', 'TerraForge', '🔨');
    expect(isRunning('suite-forge')).toBe(true);
    expect(isActive('suite-forge')).toBe(true);

    // Second window → first becomes inactive
    openWindow('suite-atlas', 'TerraAtlas', '🗺️');
    expect(isRunning('suite-forge')).toBe(true);
    expect(isActive('suite-forge')).toBe(false);

    // FOCUS: taskbar click restores activity
    taskbarClickSuite('suite-forge');
    expect(isActive('suite-forge')).toBe(true);

    // MINIMIZE: still running, not active
    const { minimizeWindow } = useDesktopStore.getState();
    minimizeWindow(id);
    expect(isRunning('suite-forge')).toBe(true);
    expect(isActive('suite-forge')).toBe(false);

    // CLOSE: gone
    const { closeWindow } = useDesktopStore.getState();
    closeWindow(id);
    expect(isRunning('suite-forge')).toBe(false);
    expect(isActive('suite-forge')).toBe(false);
  });

  it('event chain matches lifecycle actions', () => {
    const { openWindow } = useDesktopStore.getState();
    const id = openWindow('suite-forge', 'TerraForge', '🔨');

    openWindow('suite-atlas', 'TerraAtlas', '🗺️');
    taskbarClickSuite('suite-forge');

    const { minimizeWindow, closeWindow } = useDesktopStore.getState();
    minimizeWindow(id);
    closeWindow(id);

    const forgeEvents = events
      .filter((e) => e.moduleId === 'suite-forge')
      .map((e) => e.type);

    expect(forgeEvents).toEqual([
      'window_opened',
      'window_focused',
      'window_minimized',
      'window_closed',
    ]);
  });

  it('workbench lifecycle: route → focus → close', () => {
    const { openWindow } = useDesktopStore.getState();

    // Route forge to workbench
    openWindow('forge', 'TerraForge', '🔨');
    expect(isRunning('property-workbench')).toBe(true);

    // Route atlas → reuses workbench, refocuses it
    openWindow('atlas', 'TerraAtlas', '🗺️');
    const { windows } = useDesktopStore.getState();
    const wbs = windows.filter((w) => w.moduleId === 'property-workbench');
    expect(wbs).toHaveLength(1);

    // Close workbench → all routed suites gone
    const { closeWindow } = useDesktopStore.getState();
    closeWindow(wbs[0].id);
    expect(isRunning('property-workbench')).toBe(false);
  });
});
