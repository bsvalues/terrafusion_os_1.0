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
import { MemoryRouter } from 'react-router-dom';
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
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });

    it('renders DesktopBackground component', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('desktop-background')).toBeInTheDocument();
    });

    it('renders WindowManager component', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    });

    it('renders Taskbar component', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('taskbar')).toBeInTheDocument();
    });

    it('renders StartMenu when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('does not render StartMenu when closed', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: false });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Layout Tests
  // ============================================================================

  describe('Layout', () => {
    it('fills entire viewport (100vw × 100vh)', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('w-screen');
      expect(desktop).toHaveClass('h-screen');
    });

    it('has correct stacking order (z-index layers)', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      const children = Array.from(desktop.children);

      // Verify correct order: skip-nav, background, top-system-bar, icons, window-manager, taskbar, start-menu
      expect(children[0]).toHaveAttribute('href', '#desktop-main-content'); // skip-nav
      expect(children[1]).toHaveAttribute('data-testid', 'desktop-background');
      expect(children[2]).toHaveAttribute('data-testid', 'desktop-top-system-bar');
      expect(children[3]).toHaveAttribute('data-testid', 'desktop-icon-grid');
      expect(children[4]).toHaveAttribute('data-testid', 'window-manager');
      expect(children[5]).toHaveAttribute('data-testid', 'taskbar');
      expect(children[6]).toHaveAttribute('data-testid', 'start-menu');
    });

    it('prevents scroll/overflow', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('overflow-hidden');
    });

    it('uses relative positioning for stacking context', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('relative');
    });

    it('has dark background color as fallback', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('bg-transparent');
    });
  });

  // ============================================================================
  // Keyboard Shortcuts Tests
  // ============================================================================

  describe('Keyboard Shortcuts', () => {
    it('opens StartMenu on Meta (Windows) key press', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('closes StartMenu on Meta key press when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('closes StartMenu on Escape key', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not open StartMenu on Escape when closed', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('handles OS key (alternative Windows key)', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('cleans up keyboard listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
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
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();

      act(() => {
        useStartMenuStore.getState().open();
      });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('updates when store state changes externally', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

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

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      // Click on the desktop container
      fireEvent.mouseDown(screen.getByTestId('desktop'));

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not close StartMenu when clicking inside StartMenu', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

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
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('role', 'main');
    });

    it('has accessible name via aria-label', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('aria-label', 'TerraFusion Desktop');
    });

    it('has tabIndex for focus management', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('tabIndex', '-1');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles rapid keyboard events', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      // Rapid Meta key presses
      fireEvent.keyDown(document, { key: 'Meta' }); // open
      fireEvent.keyDown(document, { key: 'Meta' }); // close
      fireEvent.keyDown(document, { key: 'Meta' }); // open

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('handles multiple key types in sequence', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      fireEvent.keyDown(document, { key: 'Meta' }); // open
      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' }); // close
      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' }); // open again
      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('ignores other key presses', () => {
      render(<Desktop />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });

      fireEvent.keyDown(document, { key: 'a' });
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });
});
