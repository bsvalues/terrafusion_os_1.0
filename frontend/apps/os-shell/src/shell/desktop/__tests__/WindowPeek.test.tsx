/**
 * TerraFusion OS Window Peek Component Tests
 *
 * Priority 13: Tests for window peek preview functionality.
 *
 * SUCCESS CRITERIA:
 * SC-13.1: Hover over taskbar button shows preview
 * SC-13.3: Preview shows window title and icon
 * SC-13.4: Preview shows module description
 * SC-13.5: Close button in preview
 * SC-13.6: Clicking preview brings window to front
 * SC-13.7: Smooth fade animations
 * SC-13.8: Position above taskbar button
 * SC-13.9: Accessibility (ARIA)
 * SC-13.10: Auto-hide when mouse leaves
 *
 * @module shell/desktop/__tests__/WindowPeek.test
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDesktopStore } from '../../../stores/desktopStore';
import { useWindowPeekStore } from '../../../stores/windowPeekStore';
import { WindowPeek } from '../WindowPeek';

// ============================================================================
// Mock Setup
// ============================================================================

const mockFocusWindow = jest.fn();
const mockCloseWindow = jest.fn();

jest.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: jest.fn(),
}));

const mockUseDesktopStore = useDesktopStore as jest.MockedFunction<typeof useDesktopStore>;

// ============================================================================
// Test Setup
// ============================================================================

const mockWindows = [
  {
    id: 'window-1',
    moduleId: 'costforge',
    title: 'CostForge',
    icon: 'Layers',
    state: 'normal' as const,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    desktopId: 'desktop-1',
    zIndex: 1,
  },
  {
    id: 'window-2',
    moduleId: 'terra-gaia',
    title: 'TerraGaia',
    icon: 'Map',
    state: 'minimized' as const,
    position: { x: 200, y: 100 },
    size: { width: 800, height: 600 },
    desktopId: 'desktop-1',
    zIndex: 2,
  },
  {
    id: 'window-3',
    moduleId: 'atlas-ai',
    title: 'ATLAS AI',
    icon: 'Brain',
    state: 'maximized' as const,
    position: { x: 0, y: 0 },
    size: { width: 1920, height: 1080 },
    desktopId: 'desktop-1',
    zIndex: 3,
  },
];

beforeEach(() => {
  jest.clearAllMocks();

  // Reset peek store
  act(() => {
    useWindowPeekStore.getState().hidePeek();
  });

  // Setup desktop store mock
  mockUseDesktopStore.mockImplementation((selector) => {
    const state = {
      windows: mockWindows,
      activeWindowId: 'window-1',
      focusWindow: mockFocusWindow,
      closeWindow: mockCloseWindow,
    };
    return typeof selector === 'function' ? selector(state as any) : state;
  });
});

afterEach(() => {
  cleanup();
});

// ============================================================================
// Helper Functions
// ============================================================================

function showPeekForWindow(windowId: string) {
  act(() => {
    useWindowPeekStore.getState().showPeek(windowId, { x: 500, y: 700 });
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('WindowPeek', () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  describe('rendering', () => {
    it('does not render when not visible', () => {
      render(<WindowPeek />);
      expect(screen.queryByTestId('window-peek')).not.toBeInTheDocument();
    });

    it('renders when visible with target window', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByTestId('window-peek')).toBeInTheDocument();
    });

    it('does not render when visible but window not found', () => {
      act(() => {
        useWindowPeekStore.getState().showPeek('nonexistent', { x: 500, y: 700 });
      });
      render(<WindowPeek />);
      expect(screen.queryByTestId('window-peek')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-13.3: Window Title and Icon
  // ==========================================================================

  describe('window title and icon (SC-13.3)', () => {
    it('shows window title', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByText('CostForge')).toBeInTheDocument();
    });

    it('shows window icon', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      const peek = screen.getByTestId('window-peek');
      expect(peek.querySelector('svg')).toBeInTheDocument();
    });

    it('shows different window title', () => {
      showPeekForWindow('window-2');
      render(<WindowPeek />);
      expect(screen.getByText('TerraGaia')).toBeInTheDocument();
    });

    it('shows different window icon', () => {
      showPeekForWindow('window-2');
      render(<WindowPeek />);
      const peek = screen.getByTestId('window-peek');
      expect(peek.querySelector('svg')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-13.4: Module Description
  // ==========================================================================

  describe('module description (SC-13.4)', () => {
    it('shows CostForge description', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByText('Property Assessment & Cost Analysis')).toBeInTheDocument();
    });

    it('shows TerraGaia description', () => {
      showPeekForWindow('window-2');
      render(<WindowPeek />);
      expect(screen.getByText('Geographic Information System')).toBeInTheDocument();
    });

    it('shows ATLAS AI description', () => {
      showPeekForWindow('window-3');
      render(<WindowPeek />);
      expect(screen.getByText('AI-Powered Intelligence Assistant')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Window State Display
  // ==========================================================================

  describe('window state display', () => {
    it('shows Normal state indicator', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByText(/Normal/i)).toBeInTheDocument();
    });

    it('shows Minimized state indicator', () => {
      showPeekForWindow('window-2');
      render(<WindowPeek />);
      expect(screen.getByText(/Minimized/i)).toBeInTheDocument();
    });

    it('shows Maximized state indicator', () => {
      showPeekForWindow('window-3');
      render(<WindowPeek />);
      expect(screen.getByText(/Maximized/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SC-13.5: Close Button
  // ==========================================================================

  describe('close button (SC-13.5)', () => {
    it('renders close button', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByTestId('window-peek-close')).toBeInTheDocument();
    });

    it('close button has accessible label', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByLabelText(/Close CostForge/i)).toBeInTheDocument();
    });

    it('clicking close button calls closeWindow', async () => {
      const user = userEvent.setup();
      showPeekForWindow('window-1');
      render(<WindowPeek />);

      await user.click(screen.getByTestId('window-peek-close'));

      expect(mockCloseWindow).toHaveBeenCalledWith('window-1');
    });

    it('clicking close button hides peek', async () => {
      const user = userEvent.setup();
      showPeekForWindow('window-1');
      render(<WindowPeek />);

      await user.click(screen.getByTestId('window-peek-close'));

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });
  });

  // ==========================================================================
  // SC-13.6: Click to Focus
  // ==========================================================================

  describe('click to focus (SC-13.6)', () => {
    it('clicking peek calls focusWindow', async () => {
      const user = userEvent.setup();
      showPeekForWindow('window-1');
      render(<WindowPeek />);

      await user.click(screen.getByTestId('window-peek'));

      expect(mockFocusWindow).toHaveBeenCalledWith('window-1');
    });

    it('clicking peek hides the preview', async () => {
      const user = userEvent.setup();
      showPeekForWindow('window-1');
      render(<WindowPeek />);

      await user.click(screen.getByTestId('window-peek'));

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
    });
  });

  // ==========================================================================
  // SC-13.9: Accessibility
  // ==========================================================================

  describe('accessibility (SC-13.9)', () => {
    it('has role="tooltip"', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('has aria-label with window title', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      expect(screen.getByLabelText(/Preview of CostForge/i)).toBeInTheDocument();
    });

    it('close button is focusable', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      const closeButton = screen.getByTestId('window-peek-close');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  // ==========================================================================
  // SC-13.10: Auto-hide on Mouse Leave
  // ==========================================================================

  describe('auto-hide on mouse leave (SC-13.10)', () => {
    it('hides when mouse leaves peek', async () => {
      jest.useFakeTimers();
      showPeekForWindow('window-1');
      render(<WindowPeek />);

      const peek = screen.getByTestId('window-peek');
      fireEvent.mouseLeave(peek);

      // Should not hide immediately (there's a small delay)
      expect(useWindowPeekStore.getState().isVisible).toBe(true);

      // After PEEK_HIDE_DELAY_MS, should hide
      act(() => {
        jest.advanceTimersByTime(100); // PEEK_HIDE_DELAY_MS
      });

      expect(useWindowPeekStore.getState().isVisible).toBe(false);
      jest.useRealTimers();
    });
  });

  // ==========================================================================
  // SC-13.8: Positioning
  // ==========================================================================

  describe('positioning (SC-13.8)', () => {
    it('has fixed positioning', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      const peek = screen.getByTestId('window-peek');
      expect(peek).toHaveClass('fixed');
    });

    it('has high z-index', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      const peek = screen.getByTestId('window-peek');
      expect(peek).toHaveClass('z-[9999]');
    });
  });

  // ==========================================================================
  // SC-13.7: Animations
  // ==========================================================================

  describe('animations (SC-13.7)', () => {
    it('has animation classes', () => {
      showPeekForWindow('window-1');
      render(<WindowPeek />);
      const peek = screen.getByTestId('window-peek');
      expect(peek).toHaveClass('animate-in');
      expect(peek).toHaveClass('fade-in');
    });
  });
});
