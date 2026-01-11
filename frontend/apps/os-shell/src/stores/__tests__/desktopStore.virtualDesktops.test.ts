/**
 * TerraFusion OS - Virtual Desktop Tests (Priority 9)
 *
 * Critical tests to prevent cross-desktop focus bugs and ensure
 * deterministic behavior across desktop switching operations.
 *
 * @module stores/__tests__/desktopStore.virtualDesktops.test
 */

import { act, renderHook } from '@testing-library/react';
import { useDesktopStore } from '../desktopStore';

describe('Virtual Desktops - Priority 9', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useDesktopStore.setState({
        windows: [],
        activeWindowId: null,
        nextZIndex: 1,
        snapPreview: null,
        currentDesktopId: 'desktop-1',
        desktops: [
          { id: 'desktop-1', name: 'Desktop 1' },
          { id: 'desktop-2', name: 'Desktop 2' },
          { id: 'desktop-3', name: 'Desktop 3' },
          { id: 'desktop-4', name: 'Desktop 4' },
        ],
      });
    });
  });

  // ============================================================================
  // Test 1: Switch desktop selects only from that desktop
  // ============================================================================
  describe('Test 1: Desktop isolation - activeWindowId selection', () => {
    it('selects top window from target desktop only', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create windows on D1
      let win1Id: string;
      let win2Id: string;
      act(() => {
        win1Id = result.current.openWindow('mod1', 'Window 1', '📄');
        win2Id = result.current.openWindow('mod2', 'Window 2', '📊');
      });

      // Create windows on D2
      let win3Id: string;
      let win4Id: string;
      act(() => {
        result.current.switchDesktop('desktop-2');
        win3Id = result.current.openWindow('mod3', 'Window 3', '🎨');
        win4Id = result.current.openWindow('mod4', 'Window 4', '🔧');
      });

      // Switch back to D1
      act(() => {
        result.current.switchDesktop('desktop-1');
      });

      // Assert: activeWindowId must be from D1 only (win1 or win2)
      const activeId = result.current.activeWindowId;
      expect([win1Id, win2Id]).toContain(activeId);
      expect([win3Id, win4Id]).not.toContain(activeId);
    });

    it('returns null if target desktop has no windows', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create windows on D1
      act(() => {
        result.current.openWindow('mod1', 'Window 1', '📄');
        result.current.openWindow('mod2', 'Window 2', '📊');
      });

      // Switch to empty D2
      act(() => {
        result.current.switchDesktop('desktop-2');
      });

      // Assert: activeWindowId must be null on empty desktop
      expect(result.current.activeWindowId).toBeNull();
    });
  });

  // ============================================================================
  // Test 2: Switch desktop when all target windows are minimized
  // ============================================================================
  describe('Test 2: All-minimized case', () => {
    it('sets activeWindowId to null when all target windows are minimized', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create windows on D2 and minimize them all
      act(() => {
        result.current.switchDesktop('desktop-2');
        const win1 = result.current.openWindow('mod1', 'Window 1', '📄');
        const win2 = result.current.openWindow('mod2', 'Window 2', '📊');
        result.current.minimizeWindow(win1);
        result.current.minimizeWindow(win2);
      });

      // Switch to D1 then back to D2
      act(() => {
        result.current.switchDesktop('desktop-1');
        result.current.switchDesktop('desktop-2');
      });

      // Assert: activeWindowId must be null (no non-minimized windows)
      expect(result.current.activeWindowId).toBeNull();
    });

    it('selects non-minimized window even if some are minimized', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create windows on D2, minimize one
      let normalWindowId: string;
      act(() => {
        result.current.switchDesktop('desktop-2');
        const min1 = result.current.openWindow('mod1', 'Minimized 1', '📄');
        normalWindowId = result.current.openWindow('mod2', 'Normal', '📊');
        const min2 = result.current.openWindow('mod3', 'Minimized 2', '🎨');
        result.current.minimizeWindow(min1);
        result.current.minimizeWindow(min2);
      });

      // Switch away and back
      act(() => {
        result.current.switchDesktop('desktop-1');
        result.current.switchDesktop('desktop-2');
      });

      // Assert: activeWindowId must be the non-minimized window
      expect(result.current.activeWindowId).toBe(normalWindowId);
    });
  });

  // ============================================================================
  // Test 3: Move active window off current desktop clears active
  // ============================================================================
  describe('Test 3: Move active window behavior', () => {
    it('clears activeWindowId and selects next top window when moving active window away', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create two windows on D1
      let win1Id: string;
      let win2Id: string;
      act(() => {
        win1Id = result.current.openWindow('mod1', 'Window 1', '📄');
        win2Id = result.current.openWindow('mod2', 'Window 2', '📊');
        result.current.focusWindow(win2Id); // win2 is now active
      });

      expect(result.current.activeWindowId).toBe(win2Id);

      // Move active window (win2) to D2
      act(() => {
        result.current.moveWindowToDesktop(win2Id, 'desktop-2');
      });

      // Assert: activeWindowId should now be win1 (the remaining window on D1)
      expect(result.current.activeWindowId).toBe(win1Id);
      expect(result.current.currentDesktopId).toBe('desktop-1');

      // Verify win2 is now on D2
      const win2 = result.current.windows.find((w) => w.id === win2Id);
      expect(win2?.desktopId).toBe('desktop-2');
    });

    it('sets activeWindowId to null when moving the only window away', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create one window on D1
      let winId: string;
      act(() => {
        winId = result.current.openWindow('mod1', 'Only Window', '📄');
      });

      expect(result.current.activeWindowId).toBe(winId);

      // Move it to D2
      act(() => {
        result.current.moveWindowToDesktop(winId, 'desktop-2');
      });

      // Assert: activeWindowId should be null (no windows left on D1)
      expect(result.current.activeWindowId).toBeNull();
    });
  });

  // ============================================================================
  // Test 4: Move inactive window does NOT change active
  // ============================================================================
  describe('Test 4: Move inactive window', () => {
    it('preserves activeWindowId when moving inactive window', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create three windows on D1
      let win1Id: string;
      let win2Id: string;
      let win3Id: string;
      act(() => {
        win1Id = result.current.openWindow('mod1', 'Window 1', '📄');
        win2Id = result.current.openWindow('mod2', 'Window 2', '📊');
        win3Id = result.current.openWindow('mod3', 'Window 3', '🎨');
        result.current.focusWindow(win2Id); // win2 is active
      });

      expect(result.current.activeWindowId).toBe(win2Id);

      // Move inactive window (win3) to D2
      act(() => {
        result.current.moveWindowToDesktop(win3Id, 'desktop-2');
      });

      // Assert: activeWindowId should still be win2
      expect(result.current.activeWindowId).toBe(win2Id);
    });
  });

  // ============================================================================
  // Test 5: Next/Prev desktop wrap correctly
  // ============================================================================
  describe('Test 5: Desktop cycling', () => {
    it('cycles forward through all desktops with wraparound', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Start on D1
      expect(result.current.currentDesktopId).toBe('desktop-1');

      // Cycle forward: 1 → 2 → 3 → 4 → 1
      act(() => result.current.nextDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-2');

      act(() => result.current.nextDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-3');

      act(() => result.current.nextDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-4');

      act(() => result.current.nextDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-1'); // Wrapped
    });

    it('cycles backward through all desktops with wraparound', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Start on D1
      expect(result.current.currentDesktopId).toBe('desktop-1');

      // Cycle backward: 1 → 4 → 3 → 2 → 1
      act(() => result.current.previousDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-4'); // Wrapped

      act(() => result.current.previousDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-3');

      act(() => result.current.previousDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-2');

      act(() => result.current.previousDesktop());
      expect(result.current.currentDesktopId).toBe('desktop-1'); // Wrapped back
    });
  });

  // ============================================================================
  // Test 6: Windows created on current desktop
  // ============================================================================
  describe('Test 6: Window creation desktop assignment', () => {
    it('assigns new windows to currentDesktopId', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Switch to D3
      act(() => {
        result.current.switchDesktop('desktop-3');
      });

      // Create window
      let winId: string;
      act(() => {
        winId = result.current.openWindow('mod1', 'Window on D3', '🎨');
      });

      // Assert: window should be on D3
      const window = result.current.windows.find((w) => w.id === winId);
      expect(window?.desktopId).toBe('desktop-3');
    });

    it('creates windows on correct desktop across multiple switches', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create on D1
      let win1Id: string;
      act(() => {
        win1Id = result.current.openWindow('mod1', 'Window 1', '📄');
      });

      // Switch to D2 and create
      let win2Id: string;
      act(() => {
        result.current.switchDesktop('desktop-2');
        win2Id = result.current.openWindow('mod2', 'Window 2', '📊');
      });

      // Switch to D4 and create
      let win4Id: string;
      act(() => {
        result.current.switchDesktop('desktop-4');
        win4Id = result.current.openWindow('mod4', 'Window 4', '🔧');
      });

      // Verify assignments
      const win1 = result.current.windows.find((w) => w.id === win1Id);
      const win2 = result.current.windows.find((w) => w.id === win2Id);
      const win4 = result.current.windows.find((w) => w.id === win4Id);

      expect(win1?.desktopId).toBe('desktop-1');
      expect(win2?.desktopId).toBe('desktop-2');
      expect(win4?.desktopId).toBe('desktop-4');
    });
  });

  // ============================================================================
  // Bonus: zIndex determinism (ensures "top" is always consistent)
  // ============================================================================
  describe('Bonus: zIndex determinism', () => {
    it('selects window with highest zIndex as active', () => {
      const { result } = renderHook(() => useDesktopStore());

      // Create three windows on D1
      let win1Id: string;
      let win2Id: string;
      let win3Id: string;
      act(() => {
        win1Id = result.current.openWindow('mod1', 'Window 1', '📄');
        win2Id = result.current.openWindow('mod2', 'Window 2', '📊');
        win3Id = result.current.openWindow('mod3', 'Window 3', '🎨');
      });

      // Focus win1 (should get highest zIndex)
      act(() => {
        result.current.focusWindow(win1Id);
      });

      const win1 = result.current.windows.find((w) => w.id === win1Id);
      const win2 = result.current.windows.find((w) => w.id === win2Id);
      const win3 = result.current.windows.find((w) => w.id === win3Id);

      // Assert: win1 has highest zIndex
      expect(win1!.zIndex).toBeGreaterThan(win2!.zIndex);
      expect(win1!.zIndex).toBeGreaterThan(win3!.zIndex);

      // Switch away and back
      act(() => {
        result.current.switchDesktop('desktop-2');
        result.current.switchDesktop('desktop-1');
      });

      // Assert: win1 should be selected as active (highest zIndex)
      expect(result.current.activeWindowId).toBe(win1Id);
    });
  });
});
