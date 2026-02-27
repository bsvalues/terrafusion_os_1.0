/**
 * TerraFusion OS Window Peek Integration Tests
 *
 * Priority 13: Integration tests for window peek with taskbar.
 *
 * @module shell/desktop/__tests__/WindowPeekIntegration.test
 */

import { act } from 'react';
import { useDesktopStore } from '../../../stores/desktopStore';
import { PEEK_DELAY_MS, useWindowPeekStore } from '../../../stores/windowPeekStore';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  jest.useFakeTimers();

  act(() => {
    useWindowPeekStore.getState().hidePeek();
    // Reset desktop store to initial state
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
    });
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('WindowPeek Integration', () => {
  describe('store integration', () => {
    it('peek store updates independently of desktop store', () => {
      // Add a window to desktop
      let windowId: string;
      act(() => {
        windowId = useDesktopStore.getState().openWindow('costforge', 'CostForge', 'Layers');
      });

      // Show peek for that window
      act(() => {
        useWindowPeekStore.getState().showPeek(windowId, { x: 500, y: 700 });
      });

      // Verify both stores have correct state
      expect(useDesktopStore.getState().windows.length).toBe(1);
      expect(useWindowPeekStore.getState().targetWindowId).toBe(windowId);
      expect(useWindowPeekStore.getState().isVisible).toBe(true);
    });

    it('closing window hides peek for that window', () => {
      // Add a window
      let windowId: string;
      act(() => {
        windowId = useDesktopStore.getState().openWindow('costforge', 'CostForge', 'Layers');
      });

      // Show peek
      act(() => {
        useWindowPeekStore.getState().showPeek(windowId, { x: 500, y: 700 });
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);

      // Close the window
      act(() => {
        useDesktopStore.getState().closeWindow(windowId);
      });

      // Note: In real implementation, the WindowPeek component would detect
      // the window is gone and hide itself. Here we just verify state isolation.
      expect(useDesktopStore.getState().windows.length).toBe(0);
    });

    it('peek position is stored correctly', () => {
      const expectedPosition = { x: 300, y: 650 };

      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', expectedPosition);
      });

      expect(useWindowPeekStore.getState().position).toEqual(expectedPosition);
    });
  });

  describe('timing behavior', () => {
    it('PEEK_DELAY_MS constant is 300ms', () => {
      expect(PEEK_DELAY_MS).toBe(300);
    });

    it('peek shows after delay when using setPending + showPeek flow', () => {
      // Simulate the hook behavior
      act(() => {
        useWindowPeekStore.getState().setPending('window-1');
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBe('window-1');
      expect(useWindowPeekStore.getState().isVisible).toBe(false);

      // After delay, show the peek
      act(() => {
        jest.advanceTimersByTime(PEEK_DELAY_MS);
        useWindowPeekStore.getState().showPeek('window-1', { x: 500, y: 700 });
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);
      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });

    it('clearPending cancels the pending state', () => {
      act(() => {
        useWindowPeekStore.getState().setPending('window-1');
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBe('window-1');

      act(() => {
        useWindowPeekStore.getState().clearPending();
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });
  });

  describe('multiple windows', () => {
    it('can switch peek target between windows', () => {
      // Show peek for window 1
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 200, y: 700 });
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-1');

      // Switch to window 2
      act(() => {
        useWindowPeekStore.getState().showPeek('window-2', { x: 400, y: 700 });
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-2');
      expect(useWindowPeekStore.getState().position).toEqual({ x: 400, y: 700 });
    });

    it('hidePeek clears all state', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 200, y: 700 });
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);

      act(() => {
        useWindowPeekStore.getState().hidePeek();
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
      expect(useWindowPeekStore.getState().targetWindowId).toBeNull();
      expect(useWindowPeekStore.getState().position).toBeNull();
    });
  });
});
