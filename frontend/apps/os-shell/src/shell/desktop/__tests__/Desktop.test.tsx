/**
 * TerraFusion OS Desktop Component Tests
 *
 * Tests for the root desktop orchestrator that combines all shell components.
 *
 * @module shell/desktop/__tests__/Desktop.test
 * @jest-environment jsdom
 * @see SUCCESS CRITERIA SC-2.4, SC-3.1, SC-3.11, SC-5.1, SC-7
 */

import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { Desktop } from '../Desktop';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Setup
// ============================================================================

// Mock child components to isolate Desktop logic
jest.mock('../DesktopBackground', () => ({
  DesktopBackground: () => <div data-testid='desktop-background'>Background</div>,
}));

jest.mock('../WindowManager', () => ({
  WindowManager: () => <div data-testid='window-manager'>WindowManager</div>,
}));

jest.mock('../Taskbar', () => ({
  Taskbar: () => <div data-testid='taskbar'>Taskbar</div>,
}));

jest.mock('../StartMenu', () => ({
  StartMenu: () => <div data-testid='start-menu'>StartMenu</div>,
}));

describe('Desktop', () => {
  // Reset stores before each test
  beforeEach(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
    });
    useStartMenuStore.setState({
      isOpen: false,
      searchQuery: '',
      pinnedApps: [],
      allApps: [],
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Desktop />);

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });

    it('renders DesktopBackground component', () => {
      render(<Desktop />);

      expect(screen.getByTestId('desktop-background')).toBeInTheDocument();
    });

    it('renders WindowManager component', () => {
      render(<Desktop />);

      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    });

    it('renders Taskbar component', () => {
      render(<Desktop />);

      expect(screen.getByTestId('taskbar')).toBeInTheDocument();
    });

    it('renders StartMenu when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('does not render StartMenu when closed', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: false });
      });

      render(<Desktop />);

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Layout Tests
  // ============================================================================

  describe('Layout', () => {
    it('fills entire viewport (100vw × 100vh)', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('w-screen');
      expect(desktop).toHaveClass('h-screen');
    });

    it('has correct stacking order (z-index layers)', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      const children = Array.from(desktop.children);

      // Verify correct order: background, icons, window-manager, taskbar, start-menu, toast
      expect(children[0]).toHaveAttribute('data-testid', 'desktop-background');
      expect(children[1]).toHaveAttribute('data-testid', 'desktop-icon-grid');
      expect(children[2]).toHaveAttribute('data-testid', 'window-manager');
      expect(children[3]).toHaveAttribute('data-testid', 'taskbar');
      expect(children[4]).toHaveAttribute('data-testid', 'start-menu');
    });

    it('prevents scroll/overflow', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('overflow-hidden');
    });

    it('uses relative positioning for stacking context', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('relative');
    });

    it('has dark background color as fallback', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('bg-[var(--tf-void-black)]');
    });
  });

  // ============================================================================
  // Keyboard Shortcuts Tests
  // ============================================================================

  describe('Keyboard Shortcuts', () => {
    it('opens StartMenu on Meta (Windows) key press', () => {
      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('closes StartMenu on Meta key press when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('closes StartMenu on Escape key', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not open StartMenu on Escape when closed', () => {
      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('handles OS key (alternative Windows key)', () => {
      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('cleans up keyboard listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(<Desktop />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  // ============================================================================
  // Store Integration Tests
  // ============================================================================

  describe('Store Integration', () => {
    it('reflects startMenuStore isOpen state', () => {
      render(<Desktop />);

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();

      act(() => {
        useStartMenuStore.getState().open();
      });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('updates when store state changes externally', () => {
      render(<Desktop />);

      // Initially closed
      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();

      // External state change
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();

      // Close again
      act(() => {
        useStartMenuStore.setState({ isOpen: false });
      });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Click Outside Behavior Tests
  // ============================================================================

  describe('Click Outside Behavior', () => {
    it('closes StartMenu when clicking on desktop background', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      // Click on the desktop container
      fireEvent.mouseDown(screen.getByTestId('desktop'));

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not close StartMenu when clicking inside StartMenu', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />);

      // Click on StartMenu (mocked)
      const startMenu = screen.getByTestId('start-menu');
      fireEvent.mouseDown(startMenu);

      // Should still be open (event stopped propagation)
      // Note: With mock, we verify the handler is set up correctly
      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="main" for primary content', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('role', 'main');
    });

    it('has accessible name via aria-label', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('aria-label', 'TerraFusion Desktop');
    });

    it('has tabIndex for focus management', () => {
      render(<Desktop />);

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('tabIndex', '-1');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles rapid keyboard events', () => {
      render(<Desktop />);

      // Rapid Meta key presses
      fireEvent.keyDown(document, { key: 'Meta' }); // open
      fireEvent.keyDown(document, { key: 'Meta' }); // close
      fireEvent.keyDown(document, { key: 'Meta' }); // open

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('handles multiple key types in sequence', () => {
      render(<Desktop />);

      fireEvent.keyDown(document, { key: 'Meta' }); // open
      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' }); // close
      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' }); // open again
      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('ignores other key presses', () => {
      render(<Desktop />);

      fireEvent.keyDown(document, { key: 'a' });
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });
});
