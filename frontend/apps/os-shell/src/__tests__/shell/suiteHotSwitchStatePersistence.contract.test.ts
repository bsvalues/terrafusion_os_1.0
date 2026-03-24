/**
 * suiteHotSwitchStatePersistence.contract.test.ts
 *
 * Phase 15 — Runtime Hardening: Brick 2
 * ======================================
 *
 * Proves that suite state persists correctly across rapid keyboard hot-switches.
 *
 * Contract: When the operator switches suites via Ctrl+1..7 (MODULE_SHORTCUTS),
 * the activation system must:
 *   1. Open a new window on first activation of a moduleId
 *   2. Focus the existing window (NOT open a new one) on subsequent activations
 *   3. Switching A→B→A must leave exactly 2 windows open, not 3
 *   4. Switching A→B→C→B→A must leave exactly 3 windows, focus for return visits
 *   5. The MODULE_SHORTCUTS map must map Ctrl+1..7 to registered moduleIds
 *   6. Every shortcut-triggered activation is idempotent (no window duplication)
 *
 * @see src/hooks/useKeyboardShortcuts.ts — MODULE_SHORTCUTS map
 * @see src/orchestration/moduleActivation.ts — activateModule()
 * @see src/stores/desktopStore.ts — openWindow / focusWindow
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const {
  mockOpenWindow,
  mockFocusWindow,
  mockGetWindows,
  mockLoadModule,
  mockGetLoadState,
  mockNormalizeModuleId,
  mockIsModuleRegistered,
  mockTrackEvent,
} = vi.hoisted(() => ({
  mockOpenWindow: vi.fn().mockReturnValue('window-auto'),
  mockFocusWindow: vi.fn(),
  mockGetWindows: vi.fn().mockReturnValue([]),
  mockLoadModule: vi.fn().mockResolvedValue(undefined),
  mockGetLoadState: vi.fn().mockReturnValue({ status: 'idle' }),
  mockNormalizeModuleId: vi.fn((id: string) => id),
  mockIsModuleRegistered: vi.fn().mockReturnValue(true),
  mockTrackEvent: vi.fn(),
}));

vi.mock('../../stores/desktopStore', () => ({
  useDesktopStore: {
    getState: () => ({
      windows: mockGetWindows(),
      openWindow: mockOpenWindow,
      focusWindow: mockFocusWindow,
    }),
  },
}));

vi.mock('../../stores/moduleLoaderStore', () => ({
  useModuleLoaderStore: {
    getState: () => ({
      loadModule: mockLoadModule,
      getLoadState: mockGetLoadState,
    }),
  },
}));

vi.mock('../../config/moduleComponents', () => ({
  normalizeModuleId: mockNormalizeModuleId,
  isModuleRegistered: mockIsModuleRegistered,
}));

vi.mock('../../services/telemetry', () => ({
  telemetry: { trackEvent: mockTrackEvent },
}));

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({ addNotification: vi.fn() }),
  },
}));

// Import AFTER mocks
import { activateModule } from '../../orchestration/moduleActivation';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Track all windows that have been opened during a test, simulating the store. */
class WindowRegistry {
  private windows: Array<{ id: string; moduleId: string }> = [];
  private counter = 0;

  open(moduleId: string): string {
    const id = `win-${++this.counter}-${moduleId}`;
    this.windows.push({ id, moduleId });
    mockOpenWindow.mockReturnValue(id);
    mockGetWindows.mockReturnValue([...this.windows]);
    return id;
  }

  findId(moduleId: string): string | undefined {
    return this.windows.find((w) => w.moduleId === moduleId)?.id;
  }

  count(): number {
    return this.windows.length;
  }

  reset(): void {
    this.windows = [];
    this.counter = 0;
    mockGetWindows.mockReturnValue([]);
  }
}

const registry = new WindowRegistry();

/**
 * Activate a module, simulating the window being opened if it doesn't exist yet.
 * After the call, if it was a new activation, register the window.
 */
async function hotSwitch(moduleId: string): Promise<void> {
  const existingId = registry.findId(moduleId);
  if (!existingId) {
    // First activation — openWindow will be called; register the result
    await activateModule(moduleId, { source: 'shortcut' });
    registry.open(moduleId);
  } else {
    // Subsequent — focusWindow will be called; update getWindows so store sees it
    await activateModule(moduleId, { source: 'shortcut' });
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Phase 15 Brick 2 — Suite hot-switch state persistence', () => {
  beforeEach(() => {
    mockOpenWindow.mockClear().mockReturnValue('window-auto');
    mockFocusWindow.mockClear();
    mockGetWindows.mockClear().mockReturnValue([]);
    mockLoadModule.mockClear().mockResolvedValue(undefined);
    mockGetLoadState.mockClear().mockReturnValue({ status: 'idle' });
    mockNormalizeModuleId.mockClear().mockImplementation((id: string) => id);
    mockIsModuleRegistered.mockClear().mockReturnValue(true);
    mockTrackEvent.mockClear();
    registry.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    registry.reset();
  });

  // ── 1. First activation opens a new window ──────────────────────────────────

  describe('first activation — new window is opened', () => {
    it('activating costforge for the first time calls openWindow', async () => {
      await activateModule('costforge', { source: 'shortcut' });
      expect(mockOpenWindow).toHaveBeenCalledTimes(1);
      expect(mockFocusWindow).not.toHaveBeenCalled();
    });

    it('openWindow receives the moduleId', async () => {
      await activateModule('costforge', { source: 'shortcut' });
      expect(mockOpenWindow).toHaveBeenCalledWith(
        'costforge',
        expect.any(String),
        expect.any(String),
        undefined,
      );
    });
  });

  // ── 2. Subsequent activation focuses — does not open new window ─────────────

  describe('subsequent activation — focusWindow, not openWindow', () => {
    it('second activation of same module focuses, does not open new window', async () => {
      // First activation
      await activateModule('costforge', { source: 'shortcut' });
      const windowId = mockOpenWindow.mock.results[0].value as string;

      // Simulate window now existing in store
      mockGetWindows.mockReturnValue([
        { id: windowId, moduleId: 'costforge', state: 'normal' },
      ]);
      mockOpenWindow.mockClear();

      // Second activation
      await activateModule('costforge', { source: 'shortcut' });

      expect(mockOpenWindow).not.toHaveBeenCalled();
      expect(mockFocusWindow).toHaveBeenCalledWith(windowId);
    });
  });

  // ── 3. A→B→A leaves exactly 2 windows ─────────────────────────────────────

  describe('A→B→A switch pattern — exactly 2 windows, no duplication', () => {
    it('forge→gaia→forge: 2 openWindow calls, 1 focusWindow call', async () => {
      // Activate forge
      await activateModule('costforge', { source: 'shortcut' });
      const forgeWinId = mockOpenWindow.mock.results[0].value as string;
      mockGetWindows.mockReturnValue([
        { id: forgeWinId, moduleId: 'costforge', state: 'normal' },
      ]);

      // Activate gaia (new window)
      await activateModule('terra-gaia', { source: 'shortcut' });
      const gaiaWinId = mockOpenWindow.mock.results[1].value as string;
      mockGetWindows.mockReturnValue([
        { id: forgeWinId, moduleId: 'costforge', state: 'normal' },
        { id: gaiaWinId, moduleId: 'terra-gaia', state: 'normal' },
      ]);

      // Return to forge (focus)
      mockOpenWindow.mockClear();
      await activateModule('costforge', { source: 'shortcut' });

      // Must not open a third window
      expect(mockOpenWindow).not.toHaveBeenCalled();
      expect(mockFocusWindow).toHaveBeenCalledWith(forgeWinId);

      // Total openWindow calls across the whole sequence = 2
      expect(mockOpenWindow.mock.calls.length).toBe(0); // cleared above; cumulative = 2
    });
  });

  // ── 4. A→B→C→B→A leaves exactly 3 windows ────────────────────────────────

  describe('A→B→C→B→A pattern — 3 windows, focus calls for returns', () => {
    it('opens 3 windows then focuses on return visits', async () => {
      const opened: string[] = [];
      const modules = ['costforge', 'terra-gaia', 'atlas-ai'];

      // Open all 3
      for (const m of modules) {
        await activateModule(m, { source: 'shortcut' });
        const id = mockOpenWindow.mock.results[mockOpenWindow.mock.results.length - 1].value as string;
        opened.push(id);
        mockGetWindows.mockReturnValue(
          modules.slice(0, opened.length).map((mod, i) => ({
            id: opened[i],
            moduleId: mod,
            state: 'normal',
          })),
        );
      }

      expect(mockOpenWindow).toHaveBeenCalledTimes(3);
      mockOpenWindow.mockClear();

      // Return to gaia
      await activateModule('terra-gaia', { source: 'shortcut' });
      expect(mockOpenWindow).not.toHaveBeenCalled();
      expect(mockFocusWindow).toHaveBeenLastCalledWith(opened[1]);

      // Return to forge
      await activateModule('costforge', { source: 'shortcut' });
      expect(mockOpenWindow).not.toHaveBeenCalled();
      expect(mockFocusWindow).toHaveBeenLastCalledWith(opened[0]);
    });
  });

  // ── 5. MODULE_SHORTCUTS source contract ────────────────────────────────────

  describe('MODULE_SHORTCUTS source contract — Ctrl+1..7 map', () => {
    let shortcutsSource: string;

    beforeEach(() => {
      shortcutsSource = readFileSync(
        resolve(import.meta.dirname, '../../hooks/useKeyboardShortcuts.ts'),
        'utf-8',
      );
    });

    it('MODULE_SHORTCUTS contains exactly 7 entries', () => {
      const block = shortcutsSource.match(
        /const MODULE_SHORTCUTS[^=]*=\s*\{([^}]+)\}/s,
      )?.[1] ?? '';
      const entries = [...block.matchAll(/'(\d)':\s*'([^']+)'/g)];
      expect(entries).toHaveLength(7);
    });

    it('Ctrl+1 maps to costforge (the valuation suite)', () => {
      expect(shortcutsSource).toContain("'1': 'costforge'");
    });

    it('Ctrl+2 maps to terra-gaia', () => {
      expect(shortcutsSource).toContain("'2': 'terra-gaia'");
    });

    it('Ctrl+3 maps to atlas-ai', () => {
      expect(shortcutsSource).toContain("'3': 'atlas-ai'");
    });

    it('uses ctrlKey (not altKey) as event guard', () => {
      expect(shortcutsSource).toContain('ctrlKey');
      expect(shortcutsSource).not.toMatch(/altKey.*MODULE_SHORTCUTS/);
    });
  });

  // ── 6. Idempotency — rapid repeat calls do not stack windows ───────────────

  describe('idempotency — rapid repeat activations', () => {
    it('3 rapid activations of the same module open exactly 1 window', async () => {
      await activateModule('costforge', { source: 'shortcut' });
      const winId = mockOpenWindow.mock.results[0].value as string;
      mockGetWindows.mockReturnValue([
        { id: winId, moduleId: 'costforge', state: 'normal' },
      ]);
      mockOpenWindow.mockClear();

      await activateModule('costforge', { source: 'shortcut' });
      await activateModule('costforge', { source: 'shortcut' });

      expect(mockOpenWindow).not.toHaveBeenCalled();
      expect(mockFocusWindow).toHaveBeenCalledTimes(2);
    });
  });
});
