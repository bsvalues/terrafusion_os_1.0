/**
 * TerraFusion OS Keyboard Shortcuts Tests
 *
 * Phase 7: Global keyboard shortcuts for module activation
 * Ctrl+1..7 → Launch/Focus modules via activateModule()
 * Ctrl+` → Toggle Start Menu
 * Escape → Close Start Menu
 *
 * @module hooks/__tests__/useKeyboardShortcuts.test
 * @see Phase 7: Keyboard Shortcuts
 */

import { act, renderHook } from '@testing-library/react';

// ============================================================================
// Mock Setup - MUST come before useKeyboardShortcuts import
// ============================================================================

// Mock activateModule - THE canonical entry point
const mockActivateModule = jest.fn().mockResolvedValue(undefined);

jest.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: unknown[]) => mockActivateModule(...args),
}));

// Mock startMenuStore
const mockToggle = jest.fn();
const mockClose = jest.fn();
let mockIsOpen = false;

jest.mock('../../stores/startMenuStore', () => ({
  useStartMenuStore: jest.fn((selector) => {
    const state = {
      isOpen: mockIsOpen,
      toggle: mockToggle,
      close: mockClose,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Simulate a keyboard event on document
 */
function fireKeydown(key: string, options: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  document.dispatchEvent(event);
  return event;
}

/**
 * Simulate Ctrl+key combination
 */
function fireCtrlKey(key: string) {
  return fireKeydown(key, { ctrlKey: true });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('useKeyboardShortcuts', () => {
  // Import hook INSIDE describe block after mocks are set up
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useKeyboardShortcuts } = require('../useKeyboardShortcuts');

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOpen = false;
    // Reset document.activeElement to body
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  afterEach(() => {
    // Clean up any input elements
    document.body.innerHTML = '';
  });

  // ==========================================================================
  // SC-7.1: Ctrl+1 through Ctrl+7 activates corresponding module
  // ==========================================================================

  describe('Module Shortcuts (Ctrl+1 through Ctrl+7)', () => {
    const moduleShortcuts = [
      { key: '1', moduleId: 'costforge', name: 'CostForge' },
      { key: '2', moduleId: 'terra-gaia', name: 'TerraGaia' },
      { key: '3', moduleId: 'atlas-ai', name: 'ATLAS' },
      { key: '4', moduleId: 'reporting', name: 'Analytics' },
      { key: '5', moduleId: 'marketplace', name: 'Marketplace' },
      { key: '6', moduleId: 'counties', name: 'Counties Hub' },
      { key: '7', moduleId: 'government-architecture', name: 'Gov Architecture' },
    ];

    test.each(moduleShortcuts)(
      'Ctrl+$key launches $name module',
      async ({ key, moduleId }) => {
        renderHook(() => useKeyboardShortcuts());

        await act(async () => {
          fireCtrlKey(key);
        });

        expect(mockActivateModule).toHaveBeenCalledTimes(1);
        expect(mockActivateModule).toHaveBeenCalledWith(moduleId, {
          source: 'keyboard_shortcut',
          focusIfOpen: true,  // SC-7.2: Focus existing window
        });
      }
    );

    test('Ctrl+8 does NOT trigger any module', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('8');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+9 does NOT trigger any module', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('9');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+0 does NOT trigger any module', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('0');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SC-7.4: Ctrl+` toggles Start Menu
  // ==========================================================================

  describe('Start Menu Toggle (Ctrl+`)', () => {
    test('Ctrl+` calls toggle on startMenuStore', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('`');
      });

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test('Ctrl+` works when Start Menu is closed', async () => {
      mockIsOpen = false;
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('`');
      });

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    test('Ctrl+` works when Start Menu is open', async () => {
      mockIsOpen = true;
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('`');
      });

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SC-7.5: Escape closes Start Menu
  // ==========================================================================

  describe('Escape Key', () => {
    test('Escape closes Start Menu when open', async () => {
      mockIsOpen = true;
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('Escape');
      });

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('Escape does nothing when Start Menu is closed', async () => {
      mockIsOpen = false;
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('Escape');
      });

      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SC-7.5: Shortcuts don't fire when user is typing
  // ==========================================================================

  describe('Input Element Filtering', () => {
    test('Ctrl+1 does NOT fire when typing in input', async () => {
      renderHook(() => useKeyboardShortcuts());

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      await act(async () => {
        fireCtrlKey('1');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+1 does NOT fire when typing in textarea', async () => {
      renderHook(() => useKeyboardShortcuts());

      // Create and focus a textarea element
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      await act(async () => {
        fireCtrlKey('1');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+1 does NOT fire when typing in contenteditable', async () => {
      renderHook(() => useKeyboardShortcuts());

      // Create and focus a contenteditable element
      // Note: JSDOM needs setAttribute for isContentEditable to work
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      editable.tabIndex = 0; // Make it focusable
      document.body.appendChild(editable);
      editable.focus();

      // Verify focus worked
      expect(document.activeElement).toBe(editable);

      await act(async () => {
        fireCtrlKey('1');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+` STILL works when typing in input (global override)', async () => {
      renderHook(() => useKeyboardShortcuts());

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      await act(async () => {
        fireCtrlKey('`');
      });

      // Start menu toggle should STILL work as it's a global OS shortcut
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SC-7.3: Shortcuts work globally (cleanup on unmount)
  // ==========================================================================

  describe('Lifecycle', () => {
    test('Hook cleans up event listener on unmount', async () => {
      const { unmount } = renderHook(() => useKeyboardShortcuts());

      // Unmount the hook
      unmount();

      // Fire a shortcut - should NOT trigger anything
      await act(async () => {
        fireCtrlKey('1');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Multiple rapid shortcuts are handled correctly', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireCtrlKey('1');
        fireCtrlKey('2');
        fireCtrlKey('3');
      });

      expect(mockActivateModule).toHaveBeenCalledTimes(3);
      expect(mockActivateModule).toHaveBeenNthCalledWith(1, 'costforge', {
        source: 'keyboard_shortcut',
        focusIfOpen: true,
      });
      expect(mockActivateModule).toHaveBeenNthCalledWith(2, 'terra-gaia', {
        source: 'keyboard_shortcut',
        focusIfOpen: true,
      });
      expect(mockActivateModule).toHaveBeenNthCalledWith(3, 'atlas-ai', {
        source: 'keyboard_shortcut',
        focusIfOpen: true,
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    test('Alt+1 does NOT trigger (wrong modifier)', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('1', { altKey: true });
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Shift+1 does NOT trigger (wrong modifier)', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('1', { shiftKey: true });
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Ctrl+Shift+1 does NOT trigger (extra modifier)', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('1', { ctrlKey: true, shiftKey: true });
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });

    test('Just pressing 1 without Ctrl does NOT trigger', async () => {
      renderHook(() => useKeyboardShortcuts());

      await act(async () => {
        fireKeydown('1');
      });

      expect(mockActivateModule).not.toHaveBeenCalled();
    });
  });
});
