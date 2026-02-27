/**
 * TerraFusion OS Window Peek Hook Tests
 *
 * Priority 13: Tests for window peek hover delay behavior.
 *
 * SUCCESS CRITERIA:
 * SC-13.2: 300ms delay before showing
 * SC-13.10: Auto-hide when mouse leaves
 *
 * @module hooks/__tests__/useWindowPeek.test
 */

import { act, renderHook } from '@testing-library/react';

import { useWindowPeekStore, PEEK_DELAY_MS, PEEK_HIDE_DELAY_MS } from '../../stores/windowPeekStore';
import { useWindowPeek } from '../useWindowPeek';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  jest.useFakeTimers();
  act(() => {
    useWindowPeekStore.getState().hidePeek();
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ============================================================================
// Helper
// ============================================================================

function createMockButtonRect(): DOMRect {
  return {
    x: 100,
    y: 700,
    width: 120,
    height: 40,
    top: 700,
    right: 220,
    bottom: 740,
    left: 100,
    toJSON: () => ({}),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useWindowPeek', () => {
  // ==========================================================================
  // SC-13.2: 300ms Delay Before Showing
  // ==========================================================================

  describe('show delay (SC-13.2)', () => {
    it('does not show immediately on mouse enter', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      // Should not be visible yet
      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });

    it('sets pending window ID on mouse enter', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBe('window-1');
    });

    it('shows peek after PEEK_DELAY_MS', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      // Advance time by delay
      act(() => {
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);
      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-1');
    });

    it('does not show before PEEK_DELAY_MS', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      // Advance time by less than delay
      act(() => {
        jest.advanceTimersByTime(PEEK_DELAY_MS - 50);
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });

    it('calculates correct position from button rect', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      const position = useWindowPeekStore.getState().position;
      // Should be centered: buttonRect.left + buttonRect.width / 2 = 100 + 60 = 160
      expect(position?.x).toBe(160);
    });
  });

  // ==========================================================================
  // SC-13.10: Hide on Mouse Leave
  // ==========================================================================

  describe('hide on mouse leave (SC-13.10)', () => {
    it('cancels pending show on mouse leave', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      // Leave before delay completes
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.handleMouseLeave();
      });

      // Advance past original delay
      act(() => {
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      // Should not have shown
      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });

    it('clears pending window ID on mouse leave', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
        result.current.handleMouseLeave();
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });

    it('hides peek after PEEK_HIDE_DELAY_MS on mouse leave', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      // Show the peek first
      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);

      // Leave
      act(() => {
        result.current.handleMouseLeave();
        jest.advanceTimersByTime(PEEK_HIDE_DELAY_MS);
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });

    it('does not hide immediately on mouse leave (small delay)', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      // Show the peek first
      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      // Leave
      act(() => {
        result.current.handleMouseLeave();
      });

      // Should still be visible (delay not complete)
      expect(useWindowPeekStore.getState().isVisible).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('cancels hide if mouse enters again', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect = createMockButtonRect();

      // Show peek
      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect);
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      // Start leaving
      act(() => {
        result.current.handleMouseLeave();
      });

      // Re-enter before hide delay
      act(() => {
        jest.advanceTimersByTime(50);
        result.current.handleMouseEnter('window-1', buttonRect);
      });

      // Advance past original hide delay
      act(() => {
        jest.advanceTimersByTime(PEEK_HIDE_DELAY_MS);
      });

      // Should still be pending or showing (not hidden)
      const state = useWindowPeekStore.getState();
      expect(state.pendingWindowId === 'window-1' || state.isVisible).toBe(true);
    });

    it('switching windows updates target', () => {
      const { result } = renderHook(() => useWindowPeek());
      const buttonRect1 = createMockButtonRect();
      const buttonRect2 = { ...createMockButtonRect(), left: 250, x: 250 };

      // Hover window 1
      act(() => {
        result.current.handleMouseEnter('window-1', buttonRect1);
        jest.advanceTimersByTime(PEEK_DELAY_MS);
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-1');

      // Quick switch to window 2
      act(() => {
        result.current.handleMouseLeave();
        result.current.handleMouseEnter('window-2', buttonRect2);
        jest.advanceTimersByTime(PEEK_DELAY_MS + PEEK_HIDE_DELAY_MS);
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-2');
    });
  });
});
