/**
 * TerraFusion OS Window Component Tests
 *
 * Tests for the draggable/resizable window component.
 *
 * @module shell/desktop/__tests__/Window.test
 * @jest-environment jsdom
 * @see SUCCESS CRITERIA SC-4
 */

import '@testing-library/jest-dom';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { DesktopWindow, useDesktopStore } from '../../../stores/desktopStore';
import { Window } from '../Window';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Setup
// ============================================================================

// Mock react-rnd since it requires actual DOM measurements
vi.mock('react-rnd', () => {
  const React = require('react');
  return {
    Rnd: React.forwardRef(
      ({ children, className, style, onMouseDown, position, size, ...props }: any, ref: any) => (
        <div
          ref={ref}
          data-testid='window'
          data-window-id={props['data-window-id']}
          className={className}
          style={{
            ...style,
            position: 'absolute',
            left: position?.x ?? 0,
            top: position?.y ?? 0,
            width: typeof size?.width === 'number' ? size.width : size?.width,
            height: typeof size?.height === 'number' ? size.height : size?.height,
          }}
          onMouseDown={onMouseDown}
        >
          {children}
        </div>
      )
    ),
  };
});

// Mock window data factory
const createMockWindow = (overrides: Partial<DesktopWindow> = {}): DesktopWindow => ({
  id: 'test-window-1',
  moduleId: 'test-module',
  title: 'Test Window',
  icon: 'FileText',
  position: { x: 100, y: 50 },
  size: { width: 800, height: 600 },
  state: 'normal',
  zIndex: 1,
  ...overrides,
});

describe('Window Component', () => {
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
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Rendering', () => {
    it('renders window with title bar', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByTestId('window')).toBeInTheDocument();
      expect(screen.getByTestId('window-titlebar')).toBeInTheDocument();
    });

    it('displays window title', () => {
      const mockWindow = createMockWindow({ title: 'Government Edition' });
      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      expect(titleBar).toHaveTextContent('Government Edition');
    });

    it('displays window icon', () => {
      const mockWindow = createMockWindow({ icon: 'Building2' });
      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      expect(titleBar.querySelector('svg')).toBeInTheDocument();
    });

    it('renders content area', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByTestId('window-content')).toBeInTheDocument();
    });

    it('renders children in content area', () => {
      const mockWindow = createMockWindow();
      render(
        <Window window={mockWindow}>
          <div data-testid='custom-content'>Custom Content</div>
        </Window>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('renders default placeholder when no children', () => {
      const mockWindow = createMockWindow({ moduleId: 'my-module' });
      render(<Window window={mockWindow} />);

      expect(screen.getByText(/Module ID: my-module/)).toBeInTheDocument();
    });

    it('does not render when minimized', () => {
      const mockWindow = createMockWindow({ state: 'minimized' });
      render(<Window window={mockWindow} />);

      expect(screen.queryByTestId('window')).not.toBeInTheDocument();
    });

    it('applies correct z-index', () => {
      const mockWindow = createMockWindow({ zIndex: 5 });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveStyle({ zIndex: 5 });
    });
  });

  // ============================================================================
  // Window Controls Tests
  // ============================================================================

  describe('Window Controls', () => {
    it('renders minimize button', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
    });

    it('renders maximize button', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
    });

    it('renders close button', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('renders restore button when maximized', () => {
      const mockWindow = createMockWindow({ state: 'maximized' });
      render(<Window window={mockWindow} />);

      expect(screen.getByLabelText('Restore')).toBeInTheDocument();
    });

    it('calls closeWindow when close button clicked', async () => {
      const mockWindow = createMockWindow();

      // Setup store with window
      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(useDesktopStore.getState().windows).toHaveLength(0);
    });

    it('calls minimizeWindow when minimize button clicked', async () => {
      const mockWindow = createMockWindow();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const minimizeButton = screen.getByLabelText('Minimize');
      await userEvent.click(minimizeButton);

      const updatedWindow = useDesktopStore.getState().windows[0];
      expect(updatedWindow.state).toBe('minimized');
    });

    it('calls maximizeWindow when maximize button clicked', async () => {
      const mockWindow = createMockWindow({ state: 'normal' });

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const maximizeButton = screen.getByLabelText('Maximize');
      await userEvent.click(maximizeButton);

      const updatedWindow = useDesktopStore.getState().windows[0];
      expect(updatedWindow.state).toBe('maximized');
    });

    it('calls restoreWindow when restore button clicked on maximized window', async () => {
      const mockWindow = createMockWindow({
        state: 'maximized',
        previousPosition: { x: 100, y: 50 },
        previousSize: { width: 800, height: 600 },
      });

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const restoreButton = screen.getByLabelText('Restore');
      await userEvent.click(restoreButton);

      const updatedWindow = useDesktopStore.getState().windows[0];
      expect(updatedWindow.state).toBe('normal');
    });
  });

  // ============================================================================
  // Focus Management Tests
  // ============================================================================

  describe('Focus Management', () => {
    it('shows active styling when window is active', () => {
      const mockWindow = createMockWindow();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals).toHaveStyle({
        border: '0.5px solid hsl(var(--tf-text) / 0.12)',
      });
    });

    it('shows inactive styling when window is not active', () => {
      const mockWindow = createMockWindow();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: 'other-window',
        });
      });

      render(<Window window={mockWindow} />);

      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals).toHaveStyle({
        border: '0.5px solid hsl(var(--tf-border) / 0.3)',
      });
    });

    it('calls focusWindow when clicking window', async () => {
      const mockWindow = createMockWindow();
      const otherWindow = createMockWindow({ id: 'other-window', zIndex: 2 });

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow, otherWindow],
          activeWindowId: 'other-window',
          nextZIndex: 3,
        });
      });

      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      fireEvent.mouseDown(window);

      expect(useDesktopStore.getState().activeWindowId).toBe(mockWindow.id);
    });

    it('does not call focusWindow if already active', async () => {
      const mockWindow = createMockWindow({ zIndex: 5 });

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
          nextZIndex: 6,
        });
      });

      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      fireEvent.mouseDown(window);

      // Z-index should not change if already active
      expect(useDesktopStore.getState().nextZIndex).toBe(6);
    });
  });

  // ============================================================================
  // Title Bar Tests
  // ============================================================================

  describe('Title Bar', () => {
    it('has correct height (40px)', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      expect(titleBar.className).toContain('h-10');
    });

    it('shows active title color when window is active', () => {
      const mockWindow = createMockWindow();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      const title = titleBar.querySelector('span.truncate');
      expect(title).not.toBeNull();
      expect(title!.className).toContain('text-white');
    });

    it('shows inactive title color when window is not active', () => {
      const mockWindow = createMockWindow();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: 'other-window',
        });
      });

      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      const title = titleBar.querySelector('span.truncate');
      expect(title).not.toBeNull();
      expect(title!.className).toContain('text-white/60');
    });

    it('toggles maximize on double-click', async () => {
      const mockWindow = createMockWindow({ state: 'normal' });

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(<Window window={mockWindow} />);

      // Double-click the drag handle area (which has the onDoubleClick handler)
      const titleBar = screen.getByTestId('window-titlebar');
      const dragHandle = titleBar.querySelector('.window-drag-handle');
      expect(dragHandle).toBeInTheDocument();
      fireEvent.doubleClick(dragHandle!);

      const updatedWindow = useDesktopStore.getState().windows[0];
      expect(updatedWindow.state).toBe('maximized');
    });
  });

  // ============================================================================
  // Maximized State Tests
  // ============================================================================

  describe('Maximized State', () => {
    it('fills available space when maximized', () => {
      const mockWindow = createMockWindow({ state: 'maximized' });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveStyle({ width: '100%' });
    });

    it('positions at origin when maximized', () => {
      const mockWindow = createMockWindow({
        state: 'maximized',
        position: { x: 200, y: 100 },
      });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveStyle({ left: 0, top: 0 });
    });

    it('does not show resize handles when maximized', () => {
      const mockWindow = createMockWindow({ state: 'maximized' });
      render(<Window window={mockWindow} />);

      // Our resize indicators have cursor classes
      const window = screen.getByTestId('window');
      const seHandle = window.querySelector('.cursor-se-resize');
      expect(seHandle).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Position and Size Tests
  // ============================================================================

  describe('Position and Size', () => {
    it('applies initial position', () => {
      const mockWindow = createMockWindow({
        position: { x: 150, y: 75 },
      });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveStyle({ left: '150px', top: '75px' });
    });

    it('applies initial size', () => {
      const mockWindow = createMockWindow({
        size: { width: 1000, height: 700 },
      });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveStyle({ width: '1000px', height: '700px' });
    });

    it('sets window ID as data attribute', () => {
      const mockWindow = createMockWindow({ id: 'my-window-123' });
      render(<Window window={mockWindow} />);

      const window = screen.getByTestId('window');
      expect(window).toHaveAttribute('data-window-id', 'my-window-123');
    });
  });

  // ============================================================================
  // Glass Morphism Styling Tests
  // ============================================================================

  describe('Glass Morphism Styling', () => {
    it('has glass background', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals.style.backdropFilter).toContain('blur(28px)');
    });

    it('has rounded corners', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals.className).toContain('rounded-lg');
    });

    it('has shadow effect', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals.style.boxShadow).not.toBe('');
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('control buttons have aria-labels', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
    });

    it('icon has aria-hidden', () => {
      const mockWindow = createMockWindow({ icon: 'Building2' });
      render(<Window window={mockWindow} />);

      const titleBar = screen.getByTestId('window-titlebar');
      const icon = titleBar.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon?.querySelector('svg')).toBeInTheDocument();
    });

    it('control buttons are keyboard focusable', () => {
      const mockWindow = createMockWindow();
      render(<Window window={mockWindow} />);

      const closeButton = screen.getByLabelText('Close');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  // ============================================================================
  // Control Button Click Event Propagation
  // ============================================================================

  describe('Event Propagation', () => {
    it('stops propagation on close button click', async () => {
      const mockWindow = createMockWindow();
      const windowClickHandler = vi.fn();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(
        <div onClick={windowClickHandler}>
          <Window window={mockWindow} />
        </div>
      );

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(windowClickHandler).not.toHaveBeenCalled();
    });

    it('stops propagation on minimize button click', async () => {
      const mockWindow = createMockWindow();
      const windowClickHandler = vi.fn();

      act(() => {
        useDesktopStore.setState({
          windows: [mockWindow],
          activeWindowId: mockWindow.id,
        });
      });

      render(
        <div onClick={windowClickHandler}>
          <Window window={mockWindow} />
        </div>
      );

      const minimizeButton = screen.getByLabelText('Minimize');
      await userEvent.click(minimizeButton);

      expect(windowClickHandler).not.toHaveBeenCalled();
    });
  });
});
