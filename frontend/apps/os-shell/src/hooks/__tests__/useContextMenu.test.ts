/**
 * TerraFusion OS useContextMenu Hook Tests
 *
 * Priority 6: Reusable context menu state management.
 *
 * SUCCESS CRITERIA:
 * SC-9.4: Click outside closes any context menu
 * SC-9.5: Escape closes any context menu
 * SC-9.6: Menu positioned at cursor location
 * SC-9.9: useContextMenu hook is reusable across components
 *
 * @module hooks/__tests__/useContextMenu.test
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useContextMenu } from '../useContextMenu';

describe('useContextMenu Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('initial state', () => {
    it('starts with menu closed', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(result.current.isOpen).toBe(false);
    });

    it('starts with null position', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });

    it('starts with null targetData', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(result.current.targetData).toBeNull();
    });
  });

  // ==========================================================================
  // SC-9.6: Menu positioned at cursor location
  // ==========================================================================

  describe('open menu (SC-9.6)', () => {
    it('openMenu sets isOpen to true', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('openMenu sets position from cursor', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 150, y: 250 });
      });

      expect(result.current.position).toEqual({ x: 150, y: 250 });
    });

    it('openMenu can include targetData', () => {
      const { result } = renderHook(() => useContextMenu<{ id: string }>());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 }, { id: 'test-module' });
      });

      expect(result.current.targetData).toEqual({ id: 'test-module' });
    });

    it('opening menu at new position updates position', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      act(() => {
        result.current.openMenu({ x: 300, y: 400 });
      });

      expect(result.current.position).toEqual({ x: 300, y: 400 });
    });
  });

  // ==========================================================================
  // Close Menu
  // ==========================================================================

  describe('close menu', () => {
    it('closeMenu sets isOpen to false', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      act(() => {
        result.current.closeMenu();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('closeMenu clears targetData', () => {
      const { result } = renderHook(() => useContextMenu<{ id: string }>());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 }, { id: 'test' });
      });

      act(() => {
        result.current.closeMenu();
      });

      expect(result.current.targetData).toBeNull();
    });

    it('closeMenu preserves last position', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      act(() => {
        result.current.closeMenu();
      });

      // Position is preserved for potential re-open
      expect(result.current.position).toEqual({ x: 100, y: 200 });
    });
  });

  // ==========================================================================
  // handleContextMenu Event Handler
  // ==========================================================================

  describe('handleContextMenu', () => {
    it('returns an event handler function', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(typeof result.current.handleContextMenu).toBe('function');
    });

    it('handler opens menu at event coordinates', () => {
      const { result } = renderHook(() => useContextMenu());

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 250,
        clientY: 350,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleContextMenu(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
      expect(result.current.position).toEqual({ x: 250, y: 350 });
    });

    it('handler can receive targetData', () => {
      const { result } = renderHook(() => useContextMenu<{ moduleId: string }>());

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleContextMenu(mockEvent, { moduleId: 'costforge' });
      });

      expect(result.current.targetData).toEqual({ moduleId: 'costforge' });
    });
  });

  // ==========================================================================
  // SC-9.5: Escape closes menu
  // ==========================================================================

  describe('keyboard handling (SC-9.5)', () => {
    it('Escape key closes open menu', () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      expect(result.current.isOpen).toBe(true);

      // Simulate Escape keydown
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('Escape does nothing when menu is closed', () => {
      const { result } = renderHook(() => useContextMenu());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  // ==========================================================================
  // SC-9.4: Click outside closes menu
  // ==========================================================================

  describe('click outside (SC-9.4)', () => {
    it('click outside closes open menu', async () => {
      const { result } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      expect(result.current.isOpen).toBe(true);

      // Wait for click outside listener to be attached
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Simulate click outside
      act(() => {
        const event = new MouseEvent('mousedown', { bubbles: true });
        document.dispatchEvent(event);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe('cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const { result, unmount } = renderHook(() => useContextMenu());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 });
      });

      unmount();

      // Should have removed the listeners
      expect(removeSpy).toHaveBeenCalled();

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  // ==========================================================================
  // Type Safety (TypeScript)
  // ==========================================================================

  describe('type safety', () => {
    it('supports generic targetData type', () => {
      interface WindowData {
        windowId: string;
        title: string;
      }

      const { result } = renderHook(() => useContextMenu<WindowData>());

      act(() => {
        result.current.openMenu({ x: 100, y: 200 }, {
          windowId: 'win-1',
          title: 'CostForge',
        });
      });

      // TypeScript should infer the correct type
      expect(result.current.targetData?.windowId).toBe('win-1');
      expect(result.current.targetData?.title).toBe('CostForge');
    });
  });
});
