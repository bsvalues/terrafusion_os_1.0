/**
 * @vitest-environment jsdom
 */

/**
 * TerraFusion OS Desktop Store Tests
 * 
 * Comprehensive test suite for the Zustand store managing desktop window state.
 * Following TDD principles - tests written BEFORE implementation.
 * 
 * @module stores/__tests__/desktopStore.test
 * @see SUCCESS CRITERIA SC-4: Window Management System
 */

// Jest globals used (describe, it, expect, beforeEach, afterEach, jest)
import { act, renderHook } from '@testing-library/react';

// Import will be created after tests are written
import { useDesktopStore } from '../desktopStore';

// Reset store before each test
beforeEach(() => {
  // Clear the store state before each test
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
});

describe('Desktop Store', () => {
  describe('Initial State', () => {
    it('starts with empty windows array', () => {
      const { windows } = useDesktopStore.getState();
      expect(windows).toEqual([]);
    });

    it('starts with no active window', () => {
      const { activeWindowId } = useDesktopStore.getState();
      expect(activeWindowId).toBeNull();
    });

    it('starts with nextZIndex of 1', () => {
      const { nextZIndex } = useDesktopStore.getState();
      expect(nextZIndex).toBe(1);
    });
  });

  describe('openWindow', () => {
    it('creates a new window with correct properties', () => {
      const { openWindow } = useDesktopStore.getState();
      
      act(() => {
        openWindow('government-edition', 'Government Edition', '🏛️');
      });

      const { windows } = useDesktopStore.getState();
      expect(windows).toHaveLength(1);
      expect(windows[0]).toMatchObject({
        moduleId: 'government-edition',
        title: 'Government Edition',
        icon: '🏛️',
        state: 'normal',
      });
    });

    it('generates unique window ID', () => {
      const { openWindow } = useDesktopStore.getState();
      
      let windowId1: string = '';
      let windowId2: string = '';
      
      act(() => {
        windowId1 = openWindow('module-1', 'Module 1', '📊');
        windowId2 = openWindow('module-2', 'Module 2', '📈');
      });

      expect(windowId1).toBeDefined();
      expect(windowId2).toBeDefined();
      expect(windowId1).not.toBe(windowId2);
    });

    it('assigns incrementing z-index to new windows', () => {
      const { openWindow } = useDesktopStore.getState();
      
      act(() => {
        openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈');
        openWindow('module-3', 'Module 3', '📉');
      });

      const { windows } = useDesktopStore.getState();
      expect(windows[0].zIndex).toBe(1);
      expect(windows[1].zIndex).toBe(2);
      expect(windows[2].zIndex).toBe(3);
    });

    it('sets new window as active', () => {
      const { openWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      const { activeWindowId } = useDesktopStore.getState();
      expect(activeWindowId).toBe(windowId);
    });

    it('assigns default position with cascade offset for multiple windows', () => {
      const { openWindow } = useDesktopStore.getState();
      
      act(() => {
        openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈');
      });

      const { windows } = useDesktopStore.getState();
      // Second window should be offset from first (cascade effect)
      expect(windows[1].position.x).toBeGreaterThan(windows[0].position.x);
      expect(windows[1].position.y).toBeGreaterThan(windows[0].position.y);
    });

    it('assigns default size of 800x600', () => {
      const { openWindow } = useDesktopStore.getState();
      
      act(() => {
        openWindow('module-1', 'Module 1', '📊');
      });

      const { windows } = useDesktopStore.getState();
      expect(windows[0].size).toEqual({ width: 800, height: 600 });
    });
  });

  describe('closeWindow', () => {
    it('removes window from windows array', () => {
      const { openWindow, closeWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      expect(useDesktopStore.getState().windows).toHaveLength(1);

      act(() => {
        closeWindow(windowId);
      });

      expect(useDesktopStore.getState().windows).toHaveLength(0);
    });

    it('clears activeWindowId if closed window was active', () => {
      const { openWindow, closeWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(windowId);

      act(() => {
        closeWindow(windowId);
      });

      expect(useDesktopStore.getState().activeWindowId).toBeNull();
    });

    it('sets next highest z-index window as active when closing active window', () => {
      const { openWindow, closeWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      let window2Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        window2Id = openWindow('module-2', 'Module 2', '📈');
      });

      // window2 should be active (last opened, highest z-index)
      expect(useDesktopStore.getState().activeWindowId).toBe(window2Id);

      act(() => {
        closeWindow(window2Id);
      });

      // window1 should now be active
      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });

    it('does nothing if window ID does not exist', () => {
      const { openWindow, closeWindow } = useDesktopStore.getState();
      
      act(() => {
        openWindow('module-1', 'Module 1', '📊');
      });

      const windowsBefore = useDesktopStore.getState().windows.length;

      act(() => {
        closeWindow('non-existent-id');
      });

      expect(useDesktopStore.getState().windows).toHaveLength(windowsBefore);
    });
  });

  describe('minimizeWindow', () => {
    it('sets window state to minimized', () => {
      const { openWindow, minimizeWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        minimizeWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.state).toBe('minimized');
    });

    it('clears activeWindowId when minimizing active window', () => {
      const { openWindow, minimizeWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(windowId);

      act(() => {
        minimizeWindow(windowId);
      });

      expect(useDesktopStore.getState().activeWindowId).toBeNull();
    });

    it('activates next non-minimized window when minimizing active window', () => {
      const { openWindow, minimizeWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      let window2Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        window2Id = openWindow('module-2', 'Module 2', '📈');
      });

      act(() => {
        minimizeWindow(window2Id);
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });
  });

  describe('maximizeWindow', () => {
    it('sets window state to maximized', () => {
      const { openWindow, maximizeWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        maximizeWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.state).toBe('maximized');
    });

    it('stores previous position before maximizing', () => {
      const { openWindow, maximizeWindow, updateWindowPosition } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        updateWindowPosition(windowId, { x: 100, y: 100 });
      });

      act(() => {
        maximizeWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.previousPosition).toEqual({ x: 100, y: 100 });
    });

    it('stores previous size before maximizing', () => {
      const { openWindow, maximizeWindow, updateWindowSize } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        updateWindowSize(windowId, { width: 900, height: 700 });
      });

      act(() => {
        maximizeWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.previousSize).toEqual({ width: 900, height: 700 });
    });

    it('brings window to front when maximizing', () => {
      const { openWindow, maximizeWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈');
      });

      const window1ZIndexBefore = useDesktopStore.getState().windows.find(w => w.id === window1Id)?.zIndex;
      
      act(() => {
        maximizeWindow(window1Id);
      });

      const window1ZIndexAfter = useDesktopStore.getState().windows.find(w => w.id === window1Id)?.zIndex;
      expect(window1ZIndexAfter).toBeGreaterThan(window1ZIndexBefore!);
    });

    it('sets maximized window as active', () => {
      const { openWindow, maximizeWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈'); // This becomes active
      });

      act(() => {
        maximizeWindow(window1Id);
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });
  });

  describe('restoreWindow', () => {
    it('restores minimized window to normal state', () => {
      const { openWindow, minimizeWindow, restoreWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        minimizeWindow(windowId);
      });

      expect(useDesktopStore.getState().windows.find(w => w.id === windowId)?.state).toBe('minimized');

      act(() => {
        restoreWindow(windowId);
      });

      expect(useDesktopStore.getState().windows.find(w => w.id === windowId)?.state).toBe('normal');
    });

    it('restores maximized window to normal state with previous position/size', () => {
      const { openWindow, maximizeWindow, restoreWindow, updateWindowPosition, updateWindowSize } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        updateWindowPosition(windowId, { x: 150, y: 150 });
        updateWindowSize(windowId, { width: 900, height: 700 });
      });
      
      act(() => {
        maximizeWindow(windowId);
      });

      act(() => {
        restoreWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.state).toBe('normal');
      expect(window?.position).toEqual({ x: 150, y: 150 });
      expect(window?.size).toEqual({ width: 900, height: 700 });
    });

    it('sets restored window as active', () => {
      const { openWindow, minimizeWindow, restoreWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        minimizeWindow(windowId);
      });

      expect(useDesktopStore.getState().activeWindowId).toBeNull();

      act(() => {
        restoreWindow(windowId);
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(windowId);
    });

    it('brings restored window to front', () => {
      const { openWindow, minimizeWindow, restoreWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈');
      });
      
      act(() => {
        minimizeWindow(window1Id);
      });

      act(() => {
        restoreWindow(window1Id);
      });

      const windows = useDesktopStore.getState().windows;
      const window1ZIndex = windows.find(w => w.id === window1Id)?.zIndex;
      const maxZIndex = Math.max(...windows.map(w => w.zIndex));
      
      expect(window1ZIndex).toBe(maxZIndex);
    });
  });

  describe('focusWindow', () => {
    it('sets window as active', () => {
      const { openWindow, focusWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      let window2Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        window2Id = openWindow('module-2', 'Module 2', '📈');
      });

      // window2 is active by default
      expect(useDesktopStore.getState().activeWindowId).toBe(window2Id);

      act(() => {
        focusWindow(window1Id);
      });

      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });

    it('brings window to front (highest z-index)', () => {
      const { openWindow, focusWindow } = useDesktopStore.getState();
      
      let window1Id: string = '';
      
      act(() => {
        window1Id = openWindow('module-1', 'Module 1', '📊');
        openWindow('module-2', 'Module 2', '📈');
        openWindow('module-3', 'Module 3', '📉');
      });

      // Focus window1 which should have lowest z-index
      act(() => {
        focusWindow(window1Id);
      });

      const windows = useDesktopStore.getState().windows;
      const window1ZIndex = windows.find(w => w.id === window1Id)?.zIndex;
      const maxZIndex = Math.max(...windows.map(w => w.zIndex));
      
      expect(window1ZIndex).toBe(maxZIndex);
    });

    it('does not increment z-index if window is already frontmost', () => {
      const { openWindow, focusWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      const { nextZIndex: zIndexBefore } = useDesktopStore.getState();

      act(() => {
        focusWindow(windowId);
      });

      const { nextZIndex: zIndexAfter } = useDesktopStore.getState();
      expect(zIndexAfter).toBe(zIndexBefore);
    });

    it('restores minimized window when focused', () => {
      const { openWindow, minimizeWindow, focusWindow } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });
      
      act(() => {
        minimizeWindow(windowId);
      });

      expect(useDesktopStore.getState().windows.find(w => w.id === windowId)?.state).toBe('minimized');

      act(() => {
        focusWindow(windowId);
      });

      expect(useDesktopStore.getState().windows.find(w => w.id === windowId)?.state).toBe('normal');
    });
  });

  describe('updateWindowPosition', () => {
    it('updates window position', () => {
      const { openWindow, updateWindowPosition } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        updateWindowPosition(windowId, { x: 200, y: 300 });
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.position).toEqual({ x: 200, y: 300 });
    });

    it('clamps position to non-negative values', () => {
      const { openWindow, updateWindowPosition } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        updateWindowPosition(windowId, { x: -50, y: -100 });
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.position.x).toBeGreaterThanOrEqual(0);
      expect(window?.position.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateWindowSize', () => {
    it('updates window size', () => {
      const { openWindow, updateWindowSize } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        updateWindowSize(windowId, { width: 1000, height: 800 });
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.size).toEqual({ width: 1000, height: 800 });
    });

    it('enforces minimum size of 400x300', () => {
      const { openWindow, updateWindowSize } = useDesktopStore.getState();
      
      let windowId: string = '';
      act(() => {
        windowId = openWindow('module-1', 'Module 1', '📊');
      });

      act(() => {
        updateWindowSize(windowId, { width: 200, height: 100 });
      });

      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.size.width).toBeGreaterThanOrEqual(400);
      expect(window?.size.height).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Selector Functions', () => {
    describe('getWindowById', () => {
      it('returns window by ID', () => {
        const { openWindow } = useDesktopStore.getState();
        
        let windowId: string = '';
        act(() => {
          windowId = openWindow('module-1', 'Module 1', '📊');
        });

        const window = useDesktopStore.getState().getWindowById(windowId);
        expect(window).toBeDefined();
        expect(window?.moduleId).toBe('module-1');
      });

      it('returns undefined for non-existent ID', () => {
        const window = useDesktopStore.getState().getWindowById('non-existent');
        expect(window).toBeUndefined();
      });
    });

    describe('getActiveWindow', () => {
      it('returns the currently active window', () => {
        const { openWindow } = useDesktopStore.getState();
        
        let windowId: string = '';
        act(() => {
          windowId = openWindow('module-1', 'Module 1', '📊');
        });

        const activeWindow = useDesktopStore.getState().getActiveWindow();
        expect(activeWindow?.id).toBe(windowId);
      });

      it('returns undefined when no window is active', () => {
        const activeWindow = useDesktopStore.getState().getActiveWindow();
        expect(activeWindow).toBeUndefined();
      });
    });

    describe('getNonMinimizedWindows', () => {
      it('returns only windows that are not minimized', () => {
        const { openWindow, minimizeWindow } = useDesktopStore.getState();
        
        let window1Id: string = '';
        let window2Id: string = '';
        
        act(() => {
          window1Id = openWindow('module-1', 'Module 1', '📊');
          window2Id = openWindow('module-2', 'Module 2', '📈');
        });
        
        act(() => {
          minimizeWindow(window1Id);
        });

        const nonMinimized = useDesktopStore.getState().getNonMinimizedWindows();
        expect(nonMinimized).toHaveLength(1);
        expect(nonMinimized[0].id).toBe(window2Id);
      });
    });

    describe('getWindowsSortedByZIndex', () => {
      it('returns windows sorted by z-index ascending', () => {
        const { openWindow, focusWindow } = useDesktopStore.getState();
        
        let window1Id: string = '';
        
        act(() => {
          window1Id = openWindow('module-1', 'Module 1', '📊');
          openWindow('module-2', 'Module 2', '📈');
          openWindow('module-3', 'Module 3', '📉');
        });
        
        act(() => {
          focusWindow(window1Id); // Bring window1 to front
        });

        const sorted = useDesktopStore.getState().getWindowsSortedByZIndex();
        
        // Verify ascending order
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].zIndex).toBeGreaterThan(sorted[i - 1].zIndex);
        }
        
        // window1 should be last (highest z-index)
        expect(sorted[sorted.length - 1].id).toBe(window1Id);
      });
    });
  });

  describe('React Hook Integration', () => {
    it('re-renders when windows change', () => {
      const { result } = renderHook(() => useDesktopStore((state) => state.windows));
      
      expect(result.current).toHaveLength(0);

      act(() => {
        useDesktopStore.getState().openWindow('module-1', 'Module 1', '📊');
      });

      expect(result.current).toHaveLength(1);
    });

    it('re-renders when activeWindowId changes', () => {
      const { result } = renderHook(() => useDesktopStore((state) => state.activeWindowId));
      
      expect(result.current).toBeNull();

      let windowId: string = '';
      act(() => {
        windowId = useDesktopStore.getState().openWindow('module-1', 'Module 1', '📊');
      });

      expect(result.current).toBe(windowId);
    });
  });
});
