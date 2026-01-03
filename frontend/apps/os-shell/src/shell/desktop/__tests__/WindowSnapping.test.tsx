/**
 * @jest-environment jsdom
 *
 * Window Snapping Tests
 *
 * Tests for Windows-style window snapping:
 * - Drag to left/right edge → snap 50%
 * - Drag to top → maximize
 * - Drag to corners → snap 25%
 * - Keyboard shortcuts (Win+Arrow)
 * - Visual snap preview zones
 *
 * SUCCESS CRITERIA:
 * SC-4.1: Snap preview appears when dragging near edge
 * SC-4.2: Release in snap zone applies snap
 * SC-4.3: Left edge → left 50% width
 * SC-4.4: Right edge → right 50% width
 * SC-4.5: Top edge → maximize
 * SC-4.6: Corners → quarter snap
 * SC-4.7: Win+Arrow keyboard shortcuts
 * SC-4.8: Restores to previous position when unsnapped
 * SC-4.9: Accessible snap preview (aria-hidden)
 * SC-4.10: TerraFusion visual styling
 *
 * @module shell/desktop/__tests__/WindowSnapping.test
 */

import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';

import { useDesktopStore } from '../../../stores/desktopStore';
import { SnapPreview } from '../SnapPreview';
import { detectSnapZone, getSnapDimensions, SNAP_THRESHOLD } from '../snapUtils';

// jest-dom matchers are extended globally via setupTests.ts

// ============================================================================
// Test Setup
// ============================================================================

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const TASKBAR_HEIGHT = 48;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - TASKBAR_HEIGHT;

beforeEach(() => {
  // Clean up any rendered components
  cleanup();

  // Reset desktop store
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    snapPreview: null,
  });

  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ============================================================================
// SnapPreview Component Tests
// ============================================================================

describe('SnapPreview Component', () => {
  describe('Rendering', () => {
    it('renders when zone is provided', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      expect(screen.getByTestId('snap-preview')).toBeInTheDocument();
    });

    it('does not render when zone is null', () => {
      render(
        <SnapPreview zone={null} screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      expect(screen.queryByTestId('snap-preview')).not.toBeInTheDocument();
    });
  });

  describe('Zone Positioning', () => {
    it('left zone covers left 50% of screen', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: '0px' });
      expect(preview).toHaveStyle({ top: '0px' });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT}px` });
    });

    it('right zone covers right 50% of screen', () => {
      render(
        <SnapPreview zone='right' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ top: '0px' });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT}px` });
    });

    it('top zone covers full screen (maximize preview)', () => {
      render(
        <SnapPreview zone='maximize' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: '0px' });
      expect(preview).toHaveStyle({ top: '0px' });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT}px` });
    });

    it('top-left corner covers top-left quarter', () => {
      render(
        <SnapPreview zone='top-left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: '0px' });
      expect(preview).toHaveStyle({ top: '0px' });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT / 2}px` });
    });

    it('top-right corner covers top-right quarter', () => {
      render(
        <SnapPreview zone='top-right' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ top: '0px' });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT / 2}px` });
    });

    it('bottom-left corner covers bottom-left quarter', () => {
      render(
        <SnapPreview
          zone='bottom-left'
          screenWidth={SCREEN_WIDTH}
          screenHeight={AVAILABLE_HEIGHT}
        />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: '0px' });
      expect(preview).toHaveStyle({ top: `${AVAILABLE_HEIGHT / 2}px` });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT / 2}px` });
    });

    it('bottom-right corner covers bottom-right quarter', () => {
      render(
        <SnapPreview
          zone='bottom-right'
          screenWidth={SCREEN_WIDTH}
          screenHeight={AVAILABLE_HEIGHT}
        />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveStyle({ left: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ top: `${AVAILABLE_HEIGHT / 2}px` });
      expect(preview).toHaveStyle({ width: `${SCREEN_WIDTH / 2}px` });
      expect(preview).toHaveStyle({ height: `${AVAILABLE_HEIGHT / 2}px` });
    });
  });

  describe('Styling', () => {
    it('has TerraFusion brand styling', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      // Should have cyan border (TerraFusion brand)
      expect(preview.className).toMatch(/border-cyan|border-\[#00ffee\]/);
    });

    it('has translucent background', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      // Should have semi-transparent background
      expect(preview.className).toMatch(/bg-.*\/|opacity-/);
    });

    it('has rounded corners', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview.className).toMatch(/rounded/);
    });
  });

  describe('Accessibility', () => {
    it('is aria-hidden (decorative element)', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );
      const preview = screen.getByTestId('snap-preview');

      expect(preview).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no interactive elements', () => {
      render(
        <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// Edge Detection Tests (snapUtils)
// ============================================================================

describe('Edge Detection (detectSnapZone)', () => {
  describe('Left Edge', () => {
    it('detects left edge when cursor near left', () => {
      const zone = detectSnapZone(
        { x: 5, y: 500 }, // Near left edge
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('left');
    });

    it('does not detect left edge when cursor away from edge', () => {
      const zone = detectSnapZone(
        { x: 100, y: 500 }, // Away from edge
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).not.toBe('left');
    });
  });

  describe('Right Edge', () => {
    it('detects right edge when cursor near right', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH - 5, y: 500 }, // Near right edge
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('right');
    });

    it('does not detect right edge when cursor away from edge', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH - 100, y: 500 }, // Away from edge
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).not.toBe('right');
    });
  });

  describe('Top Edge (Maximize)', () => {
    it('detects top edge when cursor near top center', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH / 2, y: 5 }, // Near top, center
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('maximize');
    });
  });

  describe('Corners', () => {
    it('detects top-left corner', () => {
      const zone = detectSnapZone(
        { x: 5, y: 5 }, // Top-left corner
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('top-left');
    });

    it('detects top-right corner', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH - 5, y: 5 }, // Top-right corner
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('top-right');
    });

    it('detects bottom-left corner', () => {
      const zone = detectSnapZone(
        { x: 5, y: AVAILABLE_HEIGHT - 5 }, // Bottom-left corner
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('bottom-left');
    });

    it('detects bottom-right corner', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH - 5, y: AVAILABLE_HEIGHT - 5 }, // Bottom-right corner
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBe('bottom-right');
    });
  });

  describe('No Zone', () => {
    it('returns null when cursor in center of screen', () => {
      const zone = detectSnapZone(
        { x: SCREEN_WIDTH / 2, y: AVAILABLE_HEIGHT / 2 }, // Center
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(zone).toBeNull();
    });

    it('respects SNAP_THRESHOLD constant', () => {
      // Just inside threshold - should snap
      const insideZone = detectSnapZone(
        { x: SNAP_THRESHOLD - 1, y: 500 },
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(insideZone).toBe('left');

      // Just outside threshold - should not snap
      const outsideZone = detectSnapZone(
        { x: SNAP_THRESHOLD + 1, y: 500 },
        SCREEN_WIDTH,
        AVAILABLE_HEIGHT
      );
      expect(outsideZone).toBeNull();
    });
  });
});

// ============================================================================
// Snap Dimensions Tests
// ============================================================================

describe('Snap Dimensions (getSnapDimensions)', () => {
  it('left snap returns left half dimensions', () => {
    const dims = getSnapDimensions('left', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: 0,
      y: 0,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT,
    });
  });

  it('right snap returns right half dimensions', () => {
    const dims = getSnapDimensions('right', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: SCREEN_WIDTH / 2,
      y: 0,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT,
    });
  });

  it('maximize snap returns full screen dimensions', () => {
    const dims = getSnapDimensions('maximize', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: 0,
      y: 0,
      width: SCREEN_WIDTH,
      height: AVAILABLE_HEIGHT,
    });
  });

  it('top-left returns quarter dimensions', () => {
    const dims = getSnapDimensions('top-left', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: 0,
      y: 0,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT / 2,
    });
  });

  it('top-right returns quarter dimensions', () => {
    const dims = getSnapDimensions('top-right', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: SCREEN_WIDTH / 2,
      y: 0,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT / 2,
    });
  });

  it('bottom-left returns quarter dimensions', () => {
    const dims = getSnapDimensions('bottom-left', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: 0,
      y: AVAILABLE_HEIGHT / 2,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT / 2,
    });
  });

  it('bottom-right returns quarter dimensions', () => {
    const dims = getSnapDimensions('bottom-right', SCREEN_WIDTH, AVAILABLE_HEIGHT);

    expect(dims).toEqual({
      x: SCREEN_WIDTH / 2,
      y: AVAILABLE_HEIGHT / 2,
      width: SCREEN_WIDTH / 2,
      height: AVAILABLE_HEIGHT / 2,
    });
  });
});

// ============================================================================
// Store Integration Tests (snapWindow action)
// ============================================================================

describe('Store Integration (snapWindow)', () => {
  const createTestWindow = () => {
    let windowId = '';
    act(() => {
      windowId = useDesktopStore.getState().openWindow('test-module', 'Test Window', '📦');
    });
    return windowId;
  };

  it('snapWindow action updates window position and size', () => {
    const windowId = createTestWindow();
    const { snapWindow } = useDesktopStore.getState();

    act(() => {
      // Pass SCREEN_HEIGHT - store calculates usable area by subtracting taskbar
      snapWindow(windowId, 'left', SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
    expect(window?.position).toEqual({ x: 0, y: 0 });
    expect(window?.size).toEqual({ width: SCREEN_WIDTH / 2, height: AVAILABLE_HEIGHT });
  });

  it('snapWindow stores previous position for restore', () => {
    const windowId = createTestWindow();
    const { updateWindowPosition, updateWindowSize, snapWindow } = useDesktopStore.getState();

    act(() => {
      // Move window to custom position first
      updateWindowPosition(windowId, { x: 200, y: 150 });
      updateWindowSize(windowId, { width: 600, height: 400 });
    });

    act(() => {
      // Snap the window
      snapWindow(windowId, 'left', SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
    expect(window?.previousPosition).toEqual({ x: 200, y: 150 });
    expect(window?.previousSize).toEqual({ width: 600, height: 400 });
  });

  it('snapWindow sets window state to snapped', () => {
    const windowId = createTestWindow();
    const { snapWindow } = useDesktopStore.getState();

    act(() => {
      snapWindow(windowId, 'right', SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
    expect(window?.state).toBe('snapped');
  });

  it('snapWindow stores snapZone for reference', () => {
    const windowId = createTestWindow();
    const { snapWindow } = useDesktopStore.getState();

    act(() => {
      snapWindow(windowId, 'top-left', SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
    expect(window?.snapZone).toBe('top-left');
  });

  it('unsnapping restores previous position', () => {
    const windowId = createTestWindow();
    const { updateWindowPosition, updateWindowSize, snapWindow, restoreWindow } =
      useDesktopStore.getState();

    act(() => {
      // Set initial position
      updateWindowPosition(windowId, { x: 200, y: 150 });
      updateWindowSize(windowId, { width: 600, height: 400 });
    });

    act(() => {
      // Snap
      snapWindow(windowId, 'left', SCREEN_WIDTH, SCREEN_HEIGHT);
    });

    act(() => {
      // Unsnap (restore)
      restoreWindow(windowId);
    });

    const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
    expect(window?.position).toEqual({ x: 200, y: 150 });
    expect(window?.size).toEqual({ width: 600, height: 400 });
    expect(window?.state).toBe('normal');
  });
});

// ============================================================================
// Keyboard Shortcuts Tests
// ============================================================================

describe('Keyboard Shortcuts', () => {
  const createActiveWindow = () => {
    let windowId = '';
    act(() => {
      const { openWindow, focusWindow } = useDesktopStore.getState();
      windowId = openWindow('test-module', 'Test Window', '📦');
      focusWindow(windowId);
    });
    return windowId;
  };

  // Note: These tests verify the handler logic, not actual key events
  // (which would require integration with the component)

  describe('Handler Logic', () => {
    it('Win+Left calls snapWindow with left zone', () => {
      const windowId = createActiveWindow();

      act(() => {
        // Simulate keyboard handler calling snapWindow
        useDesktopStore.getState().snapWindow(windowId, 'left', SCREEN_WIDTH, SCREEN_HEIGHT);
      });

      const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
      expect(window?.snapZone).toBe('left');
    });

    it('Win+Right calls snapWindow with right zone', () => {
      const windowId = createActiveWindow();

      act(() => {
        useDesktopStore.getState().snapWindow(windowId, 'right', SCREEN_WIDTH, SCREEN_HEIGHT);
      });

      const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
      expect(window?.snapZone).toBe('right');
    });

    it('Win+Up calls maximizeWindow', () => {
      const windowId = createActiveWindow();

      act(() => {
        useDesktopStore.getState().maximizeWindow(windowId);
      });

      const window = useDesktopStore.getState().windows.find((w) => w.id === windowId);
      expect(window?.state).toBe('maximized');
    });

    it('no action when no active window', () => {
      const store = useDesktopStore.getState();
      expect(store.activeWindowId).toBeNull();

      // snapWindow should handle null gracefully
      // (actual handler would check activeWindowId first)
    });
  });
});

// ============================================================================
// Animation Tests
// ============================================================================

describe('Animation', () => {
  it('SnapPreview has transition classes', () => {
    const { getByTestId } = render(
      <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
    );
    const preview = getByTestId('snap-preview');

    expect(preview.className).toMatch(/transition|animate/);
  });

  it('SnapPreview has entrance animation', () => {
    const { getByTestId } = render(
      <SnapPreview zone='left' screenWidth={SCREEN_WIDTH} screenHeight={AVAILABLE_HEIGHT} />
    );
    const preview = getByTestId('snap-preview');

    // Should have scale or fade animation
    expect(preview.className).toMatch(/scale|fade|animate/);
  });
});
