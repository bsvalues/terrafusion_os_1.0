/**
 * TerraFusion OS Window Animations Tests
 *
 * Test Coverage:
 * - Animation variants (open, close, minimize, restore, focus)
 * - Animation timing configurations
 * - Animation state transitions
 * - Utility functions (getAnimationConfigForState, getAnimationVariantForState)
 * - Integration with Window component
 *
 * @module shell/desktop/__tests__/WindowAnimations
 */

import { render, screen, waitFor } from '@testing-library/react';
import { DesktopWindow } from '../../../stores/desktopStore';
import { Window } from '../Window';
import {
    WINDOW_ANIMATION_TIMING,
    closeAnimationConfig,
    focusAnimationConfig,
    getAnimationConfigForState,
    getAnimationVariantForState,
    minimizeAnimationConfig,
    openAnimationConfig,
    restoreAnimationConfig,
    windowCloseVariants,
    windowFocusVariants,
    windowMinimizeVariants,
    windowOpenVariants,
    windowRestoreVariants,
    windowVariants,
} from '../windowAnimations';

// ============================================================================
// Mock desktopStore
// ============================================================================

vi.mock('../../../stores/desktopStore', () => ({
  useDesktopStore: () => ({
    activeWindowId: 'test-window-1',
    focusWindow: vi.fn(),
    closeWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    updateWindowPosition: vi.fn(),
    updateWindowSize: vi.fn(),
    // Snap-related mocks
    detectSnapZone: vi.fn(),
    setSnapPreview: vi.fn(),
    clearSnapPreview: vi.fn(),
    snapWindow: vi.fn(),
  }),
}));

// ============================================================================
// Test Data
// ============================================================================

const mockWindow: DesktopWindow = {
  id: 'test-window-1',
  moduleId: 'test-module',
  title: 'Test Window',
  icon: '🧪',
  state: 'normal',
  position: { x: 100, y: 100 },
  size: { width: 800, height: 600 },
  zIndex: 100,
};

// ============================================================================
// Animation Variants Tests
// ============================================================================

describe('Window Animation Variants', () => {
  describe('windowOpenVariants', () => {
    it('should have correct initial state (hidden)', () => {
      expect(windowOpenVariants.initial).toEqual({
        scale: 0.8,
        opacity: 0,
        y: 20,
      });
    });

    it('should have correct open state (visible)', () => {
      expect(windowOpenVariants.open).toEqual({
        scale: 1,
        opacity: 1,
        y: 0,
      });
    });
  });

  describe('windowCloseVariants', () => {
    it('should have correct open state', () => {
      expect(windowCloseVariants.open).toEqual({
        scale: 1,
        opacity: 1,
        y: 0,
      });
    });

    it('should have correct closing state (shrink + fade)', () => {
      expect(windowCloseVariants.closing).toEqual({
        scale: 0.8,
        opacity: 0,
        y: 20,
      });
    });
  });

  describe('windowMinimizeVariants', () => {
    it('should have correct open state', () => {
      expect(windowMinimizeVariants.open).toEqual({
        scale: 1,
        opacity: 1,
        x: 0,
        y: 0,
      });
    });

    it('should slide to taskbar position when minimizing', () => {
      expect(windowMinimizeVariants.minimizing).toEqual({
        scale: 0.1,
        opacity: 0,
        y: 500, // Slide down to taskbar
        x: 0, // Centered
      });
    });
  });

  describe('windowRestoreVariants', () => {
    it('should start from minimized position', () => {
      expect(windowRestoreVariants.minimizing).toEqual({
        scale: 0.1,
        opacity: 0,
        y: 500,
        x: 0,
      });
    });

    it('should restore to normal position', () => {
      expect(windowRestoreVariants.restoring).toEqual({
        scale: 1,
        opacity: 1,
        y: 0,
        x: 0,
      });
    });
  });

  describe('windowFocusVariants', () => {
    it('should have subtle shadow when unfocused', () => {
      expect(windowFocusVariants.unfocused).toEqual({
        scale: 1,
        boxShadow: '0 8px 32px hsl(var(--tf-bg) / 0.4)',
      });
    });

    it('should pulse shadow when focused', () => {
      expect(windowFocusVariants.focused).toHaveProperty('boxShadow');
      expect(Array.isArray(windowFocusVariants.focused.boxShadow)).toBe(true);
      const shadows = windowFocusVariants.focused.boxShadow as string[];
      expect(shadows).toHaveLength(3); // Pulse animation keyframes
    });
  });

  describe('Combined windowVariants', () => {
    it('should include all animation states', () => {
      expect(windowVariants).toHaveProperty('initial');
      expect(windowVariants).toHaveProperty('open');
      expect(windowVariants).toHaveProperty('closing');
      expect(windowVariants).toHaveProperty('minimizing');
      expect(windowVariants).toHaveProperty('restoring');
      expect(windowVariants).toHaveProperty('unfocused');
      expect(windowVariants).toHaveProperty('focused');
    });
  });
});

// ============================================================================
// Animation Timing Tests
// ============================================================================

describe('Window Animation Timing', () => {
  it('should have standard timing config', () => {
    expect(WINDOW_ANIMATION_TIMING.standard).toEqual({
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    });
  });

  it('should have quick timing config', () => {
    expect(WINDOW_ANIMATION_TIMING.quick).toEqual({
      type: 'spring',
      stiffness: 400,
      damping: 35,
      mass: 0.6,
    });
  });

  it('should have subtle timing config', () => {
    expect(WINDOW_ANIMATION_TIMING.subtle).toEqual({
      duration: 0.2,
      ease: 'easeInOut',
    });
  });
});

// ============================================================================
// Animation Config Tests
// ============================================================================

describe('Animation Configs', () => {
  describe('openAnimationConfig', () => {
    it('should transition from initial to open', () => {
      expect(openAnimationConfig.initial).toBe('initial');
      expect(openAnimationConfig.animate).toBe('open');
      expect(openAnimationConfig.exit).toBe('closing');
      expect(openAnimationConfig.transition).toBe(WINDOW_ANIMATION_TIMING.standard);
    });
  });

  describe('closeAnimationConfig', () => {
    it('should transition from open to closing', () => {
      expect(closeAnimationConfig.initial).toBe('open');
      expect(closeAnimationConfig.animate).toBe('closing');
      expect(closeAnimationConfig.transition).toBe(WINDOW_ANIMATION_TIMING.standard);
    });
  });

  describe('minimizeAnimationConfig', () => {
    it('should use quick timing', () => {
      expect(minimizeAnimationConfig.animate).toBe('minimizing');
      expect(minimizeAnimationConfig.transition).toBe(WINDOW_ANIMATION_TIMING.quick);
    });
  });

  describe('restoreAnimationConfig', () => {
    it('should use quick timing', () => {
      expect(restoreAnimationConfig.animate).toBe('restoring');
      expect(restoreAnimationConfig.transition).toBe(WINDOW_ANIMATION_TIMING.quick);
    });
  });

  describe('focusAnimationConfig', () => {
    it('should use subtle timing', () => {
      expect(focusAnimationConfig.animate).toBe('focused');
      expect(focusAnimationConfig.transition).toBe(WINDOW_ANIMATION_TIMING.subtle);
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getAnimationConfigForState', () => {
  it('should return openAnimationConfig when opening', () => {
    const config = getAnimationConfigForState('normal', true, false, false, false);
    expect(config).toBe(openAnimationConfig);
  });

  it('should return closeAnimationConfig when closing', () => {
    const config = getAnimationConfigForState('normal', false, true, false, false);
    expect(config).toBe(closeAnimationConfig);
  });

  it('should return minimizeAnimationConfig when minimizing', () => {
    const config = getAnimationConfigForState('normal', false, false, true, false);
    expect(config).toBe(minimizeAnimationConfig);
  });

  it('should return restoreAnimationConfig when restoring', () => {
    const config = getAnimationConfigForState('minimized', false, false, false, true);
    expect(config).toBe(restoreAnimationConfig);
  });

  it('should return openAnimationConfig by default', () => {
    const config = getAnimationConfigForState('normal', false, false, false, false);
    expect(config).toBe(openAnimationConfig);
  });
});

describe('getAnimationVariantForState', () => {
  it('should return "initial" when opening', () => {
    const variant = getAnimationVariantForState('normal', false, true, false, false, false);
    expect(variant).toBe('initial');
  });

  it('should return "closing" when closing', () => {
    const variant = getAnimationVariantForState('normal', false, false, true, false, false);
    expect(variant).toBe('closing');
  });

  it('should return "minimizing" when minimizing', () => {
    const variant = getAnimationVariantForState('normal', false, false, false, true, false);
    expect(variant).toBe('minimizing');
  });

  it('should return "restoring" when restoring', () => {
    const variant = getAnimationVariantForState('minimized', false, false, false, false, true);
    expect(variant).toBe('restoring');
  });

  it('should return "focused" when active', () => {
    const variant = getAnimationVariantForState('normal', true, false, false, false, false);
    expect(variant).toBe('focused');
  });

  it('should return "unfocused" when inactive', () => {
    const variant = getAnimationVariantForState('normal', false, false, false, false, false);
    expect(variant).toBe('unfocused');
  });
});

// ============================================================================
// Window Component Integration Tests
// ============================================================================

describe('Window Component Animations', () => {
  it('should render with motion.div wrapper', () => {
    render(<Window window={mockWindow} />);

    const windowElement = screen.getByTestId('window');
    expect(windowElement).toBeInTheDocument();
  });

  it('should start in "opening" animation state', async () => {
    render(<Window window={mockWindow} />);

    // Window visuals should be rendered (animations handle visibility)
    await waitFor(() => {
      const windowVisuals = screen.getByTestId('tf-window-chrome');
      expect(windowVisuals).toBeInTheDocument();
    });
  });

  it('should transition to "open" after opening animation', async () => {
    render(<Window window={mockWindow} />);

    // Wait for animation to complete
    await waitFor(
      () => {
        const windowVisuals = screen.getByTestId('tf-window-chrome');
        expect(windowVisuals).toHaveStyle({ opacity: '1' });
      },
      { timeout: 1000 }
    );
  });
});

// ============================================================================
// Government-Grade Compliance Tests
// ============================================================================

describe('Government-Grade Animation Requirements', () => {
  it('should use spring physics for smooth motion', () => {
    expect(WINDOW_ANIMATION_TIMING.standard.type).toBe('spring');
    expect(WINDOW_ANIMATION_TIMING.quick.type).toBe('spring');
  });

  it('should have appropriate stiffness for responsiveness', () => {
    // Standard: balanced for open/close
    expect(WINDOW_ANIMATION_TIMING.standard.stiffness).toBe(300);
    // Quick: more responsive for minimize/restore
    expect(WINDOW_ANIMATION_TIMING.quick.stiffness).toBe(400);
  });

  it('should have appropriate damping to prevent oscillation', () => {
    // Sufficient damping to avoid excessive bounce
    expect(WINDOW_ANIMATION_TIMING.standard.damping).toBeGreaterThanOrEqual(30);
    expect(WINDOW_ANIMATION_TIMING.quick.damping).toBeGreaterThanOrEqual(35);
  });

  it('should use subtle timing for focus effects', () => {
    // Focus should be quick and non-distracting
    expect(WINDOW_ANIMATION_TIMING.subtle.duration).toBeLessThanOrEqual(0.2);
  });

  it('should scale appropriately during minimize', () => {
    // Should be small enough to "disappear" into taskbar
    expect(windowMinimizeVariants.minimizing.scale).toBeLessThanOrEqual(0.1);
  });

  it('should maintain accessibility during animations', () => {
    // Opacity should never be 1 in initial state (prevents flash)
    expect(windowOpenVariants.initial.opacity).toBe(0);
    // Final opacity should be fully visible
    expect(windowOpenVariants.open.opacity).toBe(1);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Animation Performance', () => {
  it('should use transform properties for GPU acceleration', () => {
    // scale, x, y use CSS transforms (GPU accelerated)
    expect(windowOpenVariants.initial).toHaveProperty('scale');
    expect(windowOpenVariants.initial).toHaveProperty('y');
    expect(windowMinimizeVariants.minimizing).toHaveProperty('x');
  });

  it('should avoid animating layout-triggering properties', () => {
    // Should NOT animate width, height, margin, padding, etc.
    const allVariants = [
      windowOpenVariants,
      windowCloseVariants,
      windowMinimizeVariants,
      windowRestoreVariants,
      windowFocusVariants,
    ];

    allVariants.forEach((variants) => {
      Object.values(variants).forEach((variant) => {
        expect(variant).not.toHaveProperty('width');
        expect(variant).not.toHaveProperty('height');
        expect(variant).not.toHaveProperty('margin');
        expect(variant).not.toHaveProperty('padding');
      });
    });
  });

  it('should use appropriate animation durations', () => {
    // Spring animations don't have duration (physics-based)
    expect(WINDOW_ANIMATION_TIMING.standard).not.toHaveProperty('duration');
    expect(WINDOW_ANIMATION_TIMING.quick).not.toHaveProperty('duration');

    // Subtle animations should be brief
    expect(WINDOW_ANIMATION_TIMING.subtle.duration).toBeLessThanOrEqual(0.2);
  });
});
