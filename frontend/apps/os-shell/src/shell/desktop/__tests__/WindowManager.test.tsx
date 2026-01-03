/**
 * TerraFusion OS WindowManager Component Tests
 *
 * Tests for the window layer manager that renders all windows from store.
 *
 * @module shell/desktop/__tests__/WindowManager.test
 * @jest-environment jsdom
 * @see SUCCESS CRITERIA SC-4
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import { DesktopWindow, useDesktopStore } from '../../../stores/desktopStore';
import { WindowManager } from '../WindowManager';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Setup
// ============================================================================

// Mock Window component to simplify testing WindowManager logic
jest.mock('../Window', () => ({
  Window: ({ window }: { window: DesktopWindow }) => (
    <div
      data-testid={`window-${window.id}`}
      data-window-id={window.id}
      data-z-index={window.zIndex}
      data-state={window.state}
      style={{ zIndex: window.zIndex }}
    >
      {window.title}
    </div>
  ),
}));

// Helper to create mock windows
const createMockWindow = (overrides: Partial<DesktopWindow> = {}): DesktopWindow => ({
  id: `window-${Math.random().toString(36).substr(2, 9)}`,
  moduleId: 'test-module',
  title: 'Test Window',
  icon: '📋',
  position: { x: 100, y: 50 },
  size: { width: 800, height: 600 },
  state: 'normal',
  zIndex: 1,
  ...overrides,
});

describe('WindowManager', () => {
  // Reset store before each test
  beforeEach(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
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
    it('renders container element', () => {
      render(<WindowManager />);

      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    });

    it('renders no windows when store is empty', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container.children).toHaveLength(0);
    });

    it('renders all non-minimized windows from store', () => {
      const windows = [
        createMockWindow({ id: 'win-1', title: 'Window 1', state: 'normal' }),
        createMockWindow({ id: 'win-2', title: 'Window 2', state: 'normal' }),
        createMockWindow({ id: 'win-3', title: 'Window 3', state: 'maximized' }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      expect(screen.getByTestId('window-win-1')).toBeInTheDocument();
      expect(screen.getByTestId('window-win-2')).toBeInTheDocument();
      expect(screen.getByTestId('window-win-3')).toBeInTheDocument();
    });

    it('does not render minimized windows', () => {
      const windows = [
        createMockWindow({ id: 'win-1', title: 'Visible', state: 'normal' }),
        createMockWindow({ id: 'win-2', title: 'Hidden', state: 'minimized' }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      expect(screen.getByTestId('window-win-1')).toBeInTheDocument();
      expect(screen.queryByTestId('window-win-2')).not.toBeInTheDocument();
    });

    it('renders correct number of windows', () => {
      const windows = [
        createMockWindow({ id: 'win-1', state: 'normal' }),
        createMockWindow({ id: 'win-2', state: 'normal' }),
        createMockWindow({ id: 'win-3', state: 'minimized' }),
        createMockWindow({ id: 'win-4', state: 'maximized' }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      // 3 non-minimized windows should be rendered
      expect(container.querySelectorAll('[data-window-id]')).toHaveLength(3);
    });
  });

  // ============================================================================
  // Z-Index Ordering Tests
  // ============================================================================

  describe('Z-Index Ordering', () => {
    it('renders windows in z-index order (lowest first)', () => {
      const windows = [
        createMockWindow({ id: 'win-back', title: 'Back', zIndex: 1 }),
        createMockWindow({ id: 'win-front', title: 'Front', zIndex: 3 }),
        createMockWindow({ id: 'win-middle', title: 'Middle', zIndex: 2 }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      const renderedWindows = container.querySelectorAll('[data-window-id]');

      // Windows should be ordered by z-index: back (1), middle (2), front (3)
      expect(renderedWindows[0]).toHaveAttribute('data-window-id', 'win-back');
      expect(renderedWindows[1]).toHaveAttribute('data-window-id', 'win-middle');
      expect(renderedWindows[2]).toHaveAttribute('data-window-id', 'win-front');
    });

    it('window with highest z-index appears last in DOM', () => {
      const windows = [
        createMockWindow({ id: 'win-1', zIndex: 5 }),
        createMockWindow({ id: 'win-2', zIndex: 10 }),
        createMockWindow({ id: 'win-3', zIndex: 1 }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      const lastChild = container.lastElementChild;

      expect(lastChild).toHaveAttribute('data-window-id', 'win-2');
      expect(lastChild).toHaveAttribute('data-z-index', '10');
    });

    it('maintains z-index order when windows have same z-index', () => {
      const windows = [
        createMockWindow({ id: 'win-a', zIndex: 1 }),
        createMockWindow({ id: 'win-b', zIndex: 1 }),
        createMockWindow({ id: 'win-c', zIndex: 1 }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      // Should render all windows without error
      const container = screen.getByTestId('window-manager');
      expect(container.querySelectorAll('[data-window-id]')).toHaveLength(3);
    });
  });

  // ============================================================================
  // Store Integration Tests
  // ============================================================================

  describe('Store Integration', () => {
    it('updates when windows are opened', () => {
      render(<WindowManager />);

      expect(screen.queryByTestId('window-new-win')).not.toBeInTheDocument();

      act(() => {
        // openWindow signature: (moduleId: string, title: string, icon: string)
        useDesktopStore.getState().openWindow('test', 'New Window', '📋');
      });

      // After opening, a window should appear
      const container = screen.getByTestId('window-manager');
      expect(container.querySelectorAll('[data-window-id]')).toHaveLength(1);
    });

    it('updates when windows are closed', () => {
      const window = createMockWindow({ id: 'win-to-close' });

      act(() => {
        useDesktopStore.setState({ windows: [window] });
      });

      render(<WindowManager />);

      expect(screen.getByTestId('window-win-to-close')).toBeInTheDocument();

      act(() => {
        useDesktopStore.getState().closeWindow('win-to-close');
      });

      expect(screen.queryByTestId('window-win-to-close')).not.toBeInTheDocument();
    });

    it('updates when window is minimized', () => {
      const window = createMockWindow({ id: 'win-minimize', state: 'normal' });

      act(() => {
        useDesktopStore.setState({ windows: [window] });
      });

      render(<WindowManager />);

      expect(screen.getByTestId('window-win-minimize')).toBeInTheDocument();

      act(() => {
        useDesktopStore.getState().minimizeWindow('win-minimize');
      });

      expect(screen.queryByTestId('window-win-minimize')).not.toBeInTheDocument();
    });

    it('updates when window is restored from minimized', () => {
      const window = createMockWindow({ id: 'win-restore', state: 'minimized' });

      act(() => {
        useDesktopStore.setState({ windows: [window] });
      });

      render(<WindowManager />);

      expect(screen.queryByTestId('window-win-restore')).not.toBeInTheDocument();

      act(() => {
        useDesktopStore.getState().restoreWindow('win-restore');
      });

      expect(screen.getByTestId('window-win-restore')).toBeInTheDocument();
    });

    it('updates when window z-index changes', () => {
      const windows = [
        createMockWindow({ id: 'win-1', zIndex: 1 }),
        createMockWindow({ id: 'win-2', zIndex: 2 }),
      ];

      act(() => {
        useDesktopStore.setState({ windows, nextZIndex: 3 });
      });

      render(<WindowManager />);

      // win-2 should be last (highest z-index)
      let container = screen.getByTestId('window-manager');
      expect(container.lastElementChild).toHaveAttribute('data-window-id', 'win-2');

      // Focus win-1 to bring it to front
      act(() => {
        useDesktopStore.getState().focusWindow('win-1');
      });

      // Now win-1 should be last (highest z-index)
      container = screen.getByTestId('window-manager');
      expect(container.lastElementChild).toHaveAttribute('data-window-id', 'win-1');
    });
  });

  // ============================================================================
  // Container Styling Tests
  // ============================================================================

  describe('Container Styling', () => {
    it('fills available space above taskbar', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('h-[calc(100vh-48px)]');
    });

    it('has absolute positioning', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('absolute');
    });

    it('is positioned at top-left', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('top-0');
      expect(container).toHaveClass('left-0');
    });

    it('spans full width', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('w-full');
    });

    it('allows pointer events to pass through to desktop', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('pointer-events-none');
    });

    it('has overflow hidden to contain windows', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveClass('overflow-hidden');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('handles rapid window open/close operations', () => {
      render(<WindowManager />);

      act(() => {
        // Open 3 windows rapidly - openWindow signature: (moduleId, title, icon)
        useDesktopStore.getState().openWindow('test', 'Rapid 1', '📋');
        useDesktopStore.getState().openWindow('test', 'Rapid 2', '📋');
        useDesktopStore.getState().openWindow('test', 'Rapid 3', '📋');
      });

      const container = screen.getByTestId('window-manager');
      expect(container.querySelectorAll('[data-window-id]')).toHaveLength(3);

      // Close middle window
      const windows = useDesktopStore.getState().windows;
      act(() => {
        useDesktopStore.getState().closeWindow(windows[1].id);
      });

      expect(container.querySelectorAll('[data-window-id]')).toHaveLength(2);
    });

    it('handles window with undefined state gracefully', () => {
      const window = createMockWindow({ id: 'win-undefined' });
      // @ts-expect-error - Testing edge case with undefined state
      delete window.state;

      act(() => {
        useDesktopStore.setState({ windows: [window] });
      });

      // Should not crash
      render(<WindowManager />);

      // Window without state should still render (treated as normal)
      expect(screen.getByTestId('window-manager')).toBeInTheDocument();
    });

    it('handles empty window title', () => {
      const window = createMockWindow({ id: 'win-empty', title: '' });

      act(() => {
        useDesktopStore.setState({ windows: [window] });
      });

      render(<WindowManager />);

      expect(screen.getByTestId('window-win-empty')).toBeInTheDocument();
    });

    it('handles very high z-index values', () => {
      const windows = [
        createMockWindow({ id: 'win-normal', zIndex: 1 }),
        createMockWindow({ id: 'win-high', zIndex: 999999 }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container.lastElementChild).toHaveAttribute('data-z-index', '999999');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('has proper role for window container', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveAttribute('role', 'region');
    });

    it('has aria-label describing the region', () => {
      render(<WindowManager />);

      const container = screen.getByTestId('window-manager');
      expect(container).toHaveAttribute('aria-label', 'Application windows');
    });

    it('announces window count to screen readers', () => {
      const windows = [
        createMockWindow({ id: 'win-1', state: 'normal' }),
        createMockWindow({ id: 'win-2', state: 'normal' }),
        createMockWindow({ id: 'win-3', state: 'minimized' }),
      ];

      act(() => {
        useDesktopStore.setState({ windows });
      });

      render(<WindowManager />);

      // Should have live region or similar for screen reader
      const container = screen.getByTestId('window-manager');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });
  });
});
