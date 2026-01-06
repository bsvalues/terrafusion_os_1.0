/**
 * TerraFusion OS - Alt+Tab Store Tests
 *
 * Tests for altTabStore.ts - window switching state management
 *
 * Priority 14: Alt+Tab MVP
 *
 * @module stores/altTabStore.test
 */

import { act, renderHook } from '@testing-library/react';
import { useAltTabStore } from './altTabStore';

describe('altTabStore - Priority 14: Alt+Tab MVP', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAltTabStore());
    act(() => {
      result.current.close();
    });
  });

  describe('open()', () => {
    it('should open Alt+Tab with candidate list', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win2');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.candidateWindowIds).toEqual(['win1', 'win2', 'win3']);
    });

    it('should start at current active window if in candidates', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win2');
      });

      expect(result.current.selectedIndex).toBe(1); // win2 is at index 1
      expect(result.current.getSelectedWindowId()).toBe('win2');
    });

    it('should start at index 0 if active window not in candidates', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win99');
      });

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.getSelectedWindowId()).toBe('win1');
    });

    it('should not open with empty candidate list', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open([], 'win1');
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should store previousActiveWindowId for cancel', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2'], 'win1');
      });

      expect(result.current.previousActiveWindowId).toBe('win1');
    });
  });

  describe('next()', () => {
    it('should cycle forward through candidates', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
      });

      act(() => {
        result.current.next();
      });

      expect(result.current.selectedIndex).toBe(1);
      expect(result.current.getSelectedWindowId()).toBe('win2');

      act(() => {
        result.current.next();
      });

      expect(result.current.selectedIndex).toBe(2);
      expect(result.current.getSelectedWindowId()).toBe('win3');
    });

    it('should wrap around to start when reaching end', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
      });

      // Go to end
      act(() => {
        result.current.next();
        result.current.next();
      });

      expect(result.current.selectedIndex).toBe(2);

      // Wrap around
      act(() => {
        result.current.next();
      });

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.getSelectedWindowId()).toBe('win1');
    });

    it('should be a no-op when not open', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.next();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('prev()', () => {
    it('should cycle backward through candidates', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win3');
      });

      act(() => {
        result.current.prev();
      });

      expect(result.current.selectedIndex).toBe(1);
      expect(result.current.getSelectedWindowId()).toBe('win2');

      act(() => {
        result.current.prev();
      });

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.getSelectedWindowId()).toBe('win1');
    });

    it('should wrap around to end when reaching start', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
      });

      expect(result.current.selectedIndex).toBe(0);

      // Wrap around to end
      act(() => {
        result.current.prev();
      });

      expect(result.current.selectedIndex).toBe(2);
      expect(result.current.getSelectedWindowId()).toBe('win3');
    });

    it('should be a no-op when not open', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.prev();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('commit()', () => {
    it('should return selected window ID and close', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
        result.current.next(); // Select win2
      });

      let selectedId: string | null = null;
      act(() => {
        selectedId = result.current.commit();
      });

      expect(selectedId).toBe('win2');
      expect(result.current.isOpen).toBe(false);
    });

    it('should clear all state after commit', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2'], 'win1');
        result.current.commit();
      });

      expect(result.current.candidateWindowIds).toEqual([]);
      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.previousActiveWindowId).toBe(null);
    });
  });

  describe('cancel()', () => {
    it('should return previous active window ID and close', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
        result.current.next(); // Move to win2
        result.current.next(); // Move to win3
      });

      let previousId: string | null = null;
      act(() => {
        previousId = result.current.cancel();
      });

      expect(previousId).toBe('win1'); // Restore to original active window
      expect(result.current.isOpen).toBe(false);
    });

    it('should clear all state after cancel', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2'], 'win1');
        result.current.cancel();
      });

      expect(result.current.candidateWindowIds).toEqual([]);
      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.previousActiveWindowId).toBe(null);
    });
  });

  describe('close()', () => {
    it('should close without committing or canceling', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2'], 'win1');
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.candidateWindowIds).toEqual([]);
    });
  });

  describe('frozen candidate list invariant', () => {
    it('should maintain frozen candidate list during session', () => {
      const { result } = renderHook(() => useAltTabStore());

      act(() => {
        result.current.open(['win1', 'win2', 'win3'], 'win1');
      });

      const originalCandidates = result.current.candidateWindowIds;

      // Cycle through
      act(() => {
        result.current.next();
        result.current.prev();
        result.current.next();
      });

      // Candidate list should be unchanged
      expect(result.current.candidateWindowIds).toEqual(originalCandidates);
    });
  });
});
