/**
 * TerraFusion OS Window Peek Store Tests
 *
 * Priority 13: Tests for window peek state management.
 *
 * @module stores/__tests__/windowPeekStore.test
 */

import { act } from 'react';
import { useWindowPeekStore, PEEK_DELAY_MS, PEEK_HIDE_DELAY_MS } from '../windowPeekStore';

// ============================================================================
// Test Setup
// ============================================================================

beforeEach(() => {
  act(() => {
    useWindowPeekStore.getState().hidePeek();
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('windowPeekStore', () => {
  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('starts with no target window', () => {
      const { targetWindowId } = useWindowPeekStore.getState();
      expect(targetWindowId).toBeNull();
    });

    it('starts with no position', () => {
      const { position } = useWindowPeekStore.getState();
      expect(position).toBeNull();
    });

    it('starts not visible', () => {
      const { isVisible } = useWindowPeekStore.getState();
      expect(isVisible).toBe(false);
    });

    it('starts with no pending window', () => {
      const { pendingWindowId } = useWindowPeekStore.getState();
      expect(pendingWindowId).toBeNull();
    });
  });

  // ==========================================================================
  // showPeek
  // ==========================================================================

  describe('showPeek', () => {
    it('sets target window ID', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBe('window-1');
    });

    it('sets position', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
      });

      expect(useWindowPeekStore.getState().position).toEqual({ x: 100, y: 200 });
    });

    it('sets isVisible to true', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(true);
    });

    it('clears pending window ID', () => {
      act(() => {
        useWindowPeekStore.getState().setPending('window-2');
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });
  });

  // ==========================================================================
  // hidePeek
  // ==========================================================================

  describe('hidePeek', () => {
    it('clears target window ID', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
        useWindowPeekStore.getState().hidePeek();
      });

      expect(useWindowPeekStore.getState().targetWindowId).toBeNull();
    });

    it('clears position', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
        useWindowPeekStore.getState().hidePeek();
      });

      expect(useWindowPeekStore.getState().position).toBeNull();
    });

    it('sets isVisible to false', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('window-1', { x: 100, y: 200 });
        useWindowPeekStore.getState().hidePeek();
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });

    it('clears pending window ID', () => {
      act(() => {
        useWindowPeekStore.getState().setPending('window-1');
        useWindowPeekStore.getState().hidePeek();
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });
  });

  // ==========================================================================
  // setPending / clearPending
  // ==========================================================================

  describe('pending state', () => {
    it('setPending sets pending window ID', () => {
      act(() => {
        useWindowPeekStore.getState().setPending('window-1');
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBe('window-1');
    });

    it('clearPending clears pending window ID', () => {
      act(() => {
        useWindowPeekStore.getState().setPending('window-1');
        useWindowPeekStore.getState().clearPending();
      });

      expect(useWindowPeekStore.getState().pendingWindowId).toBeNull();
    });
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('constants', () => {
    it('PEEK_DELAY_MS is 300', () => {
      expect(PEEK_DELAY_MS).toBe(300);
    });

    it('PEEK_HIDE_DELAY_MS is 100', () => {
      expect(PEEK_HIDE_DELAY_MS).toBe(100);
    });
  });
});
