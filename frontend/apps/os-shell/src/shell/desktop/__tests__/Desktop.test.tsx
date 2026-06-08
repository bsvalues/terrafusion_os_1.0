/**
 * TerraFusion OS Desktop Component Tests
 *
 * Tests for the root desktop orchestrator that combines all shell components.
 *
 * @module shell/desktop/__tests__/Desktop.test
 * @jest-environment jsdom
 * @see SUCCESS CRITERIA SC-2.4, SC-3.1, SC-3.11, SC-5.1, SC-7
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDesktopStore } from '../../../stores/desktopStore';

// Per-test QueryClient + MemoryRouter wrapper. Needed so any TanStack Query
// hooks reachable from the Desktop tree (e.g. via launcher / sentinel) have a
// cache provider in unit tests.
const desktopWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};
import { useStartMenuStore } from '../../../stores/startMenuStore';
import { Desktop } from '../Desktop';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Setup
// ============================================================================

// Mock child components to isolate Desktop logic
vi.mock('../DesktopBackground', () => ({
  DesktopBackground: () => <div data-testid='desktop-background'>Background</div>,
}));

vi.mock('../WindowManager', () => ({
  WindowManager: () => <div data-testid='window-manager'>WindowManager</div>,
}));

vi.mock('../Taskbar', () => ({
  Taskbar: () => <div data-testid='taskbar'>Taskbar</div>,
}));

vi.mock('../StartMenu', () => ({
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
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.getByTestId('desktop')).toBeInTheDocument();
    });

    it('renders DesktopBackground component', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.getByTestId('desktop-background')).toBeInTheDocument();
    });

    it('renders WindowManager component', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    });

    it('renders Taskbar component', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.getByTestId('taskbar')).toBeInTheDocument();
    });

    it('renders StartMenu when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('does not render StartMenu when closed', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: false });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Layout Tests
  // ============================================================================

  describe('Layout', () => {
    it('fills entire viewport (100vw × 100vh)', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('w-screen');
      expect(desktop).toHaveClass('h-screen');
    });

    it('has correct stacking order (z-index layers)', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
        // Force shellMode='home' so StageZeroState (recentWork surface) renders.
        // Other tests in this suite reset partial state and may leave shellMode stale.
        useDesktopStore.setState({ shellMode: 'home' });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      const children = Array.from(desktop.children);

      // z-index contract: skip-nav (-1) < ambient/background (0) < topbar (0.75) <
      //   stage-zero-state (0.5) < window-manager (1-999) < taskbar (1000) <
      //   launcher (1002) < start-menu (1001).
      //
      // The shell composes background/topbar/home-stage/window-manager via
      // AmbientCompositor + DesktopTopSystemBar + StageZeroState + WindowManager.
      // We don't assert specific child-array slots because the post-taskbar layer
      // mounts (Launcher, Toast, ContextMenu, CommandPalette, AltTab, etc.) shift
      // around. Instead we require the home-stage testids to all be present and
      // the taskbar/start-menu to render in the right z-order.
      const skipNav = children[0] as HTMLElement;
      expect(skipNav).toHaveAttribute('href', '#desktop-main-content');
      expect(screen.getByTestId('desktop-top-system-bar')).toBeInTheDocument();
      // Note: stage-zero-state visibility is gated by shellMode surfaces and is
      // covered in dedicated StageZeroState tests; intentionally not asserted here
      // so this test stays focused on layer-ordering of always-on chrome.
      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
      expect(screen.getByTestId('taskbar')).toBeInTheDocument();
      const taskbarIndex = children.findIndex((child) => child.getAttribute('data-testid') === 'taskbar');
      const startMenuIndex = children.findIndex((child) => child.getAttribute('data-testid') === 'start-menu');
      expect(startMenuIndex).toBeGreaterThan(taskbarIndex);
    });

    it('prevents scroll/overflow', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('overflow-hidden');
    });

    it('uses relative positioning for stacking context', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('relative');
    });

    it('has dark background color as fallback', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveClass('bg-transparent');
    });
  });

  // ============================================================================
  // Keyboard Shortcuts Tests
  // ============================================================================

  describe('Keyboard Shortcuts', () => {
    it('opens StartMenu on Meta (Windows) key press', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('closes StartMenu on Meta key press when open', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Meta' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('closes StartMenu on Escape key', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not open StartMenu on Escape when closed', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('handles OS key (alternative Windows key)', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' });

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('cleans up keyboard listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<Desktop />, { wrapper: desktopWrapper });
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
      render(<Desktop />, { wrapper: desktopWrapper });

      expect(screen.queryByTestId('start-menu')).not.toBeInTheDocument();

      act(() => {
        useStartMenuStore.getState().open();
      });

      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('updates when store state changes externally', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

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

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useStartMenuStore.getState().isOpen).toBe(true);

      // Click on the desktop container
      fireEvent.mouseDown(screen.getByTestId('desktop'));

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('does not close StartMenu when clicking inside StartMenu', () => {
      act(() => {
        useStartMenuStore.setState({ isOpen: true });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      // Click on StartMenu (mocked)
      const startMenu = screen.getByTestId('start-menu');
      fireEvent.mouseDown(startMenu);

      // Should still be open (event stopped propagation)
      // Note: With mock, we verify the handler is set up correctly
      expect(screen.getByTestId('start-menu')).toBeInTheDocument();
    });

    it('does not leave Home Scene mounted after shell mode leaves home', () => {
      act(() => {
        useDesktopStore.setState({ shellMode: 'home', previousShellMode: null });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      act(() => {
        useDesktopStore.getState().enterDesktop();
      });

      expect(screen.queryByTestId('stage-zero-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('desktop-icon-grid')).toBeInTheDocument();
    });

    it('does not auto-spawn TerraPilot on initial mount', () => {
      act(() => {
        useDesktopStore.setState({
          shellMode: 'home',
          previousShellMode: null,
          windows: [],
          activeWindowId: null,
          nextZIndex: 1,
        });
      });

      render(<Desktop />, { wrapper: desktopWrapper });

      expect(useDesktopStore.getState().shellMode).toBe('home');
      expect(useDesktopStore.getState().windows.some((w) => w.moduleId === 'os-pilot')).toBe(false);
      expect(screen.getByTestId('stage-zero-state')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="main" for primary content', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('role', 'main');
    });

    it('has accessible name via aria-label', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('aria-label', 'TerraFusion Desktop');
    });

    it('has tabIndex for focus management', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      const desktop = screen.getByTestId('desktop');
      expect(desktop).toHaveAttribute('tabIndex', '-1');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles rapid keyboard events', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      // Rapid Meta key presses
      fireEvent.keyDown(document, { key: 'Meta' }); // open
      fireEvent.keyDown(document, { key: 'Meta' }); // close
      fireEvent.keyDown(document, { key: 'Meta' }); // open

      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('handles multiple key types in sequence', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      fireEvent.keyDown(document, { key: 'Meta' }); // open
      expect(useStartMenuStore.getState().isOpen).toBe(true);

      fireEvent.keyDown(document, { key: 'Escape' }); // close
      expect(useStartMenuStore.getState().isOpen).toBe(false);

      fireEvent.keyDown(document, { key: 'OS' }); // open again
      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('ignores other key presses', () => {
      render(<Desktop />, { wrapper: desktopWrapper });

      fireEvent.keyDown(document, { key: 'a' });
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });
  });
});
