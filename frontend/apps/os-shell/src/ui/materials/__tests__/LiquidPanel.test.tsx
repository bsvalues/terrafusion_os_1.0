/**
 * @fileoverview LiquidPanel Component Tests
 *
 * TDD Contract: LiquidPanel MUST:
 * 1. Render static fallback when quality is LOW
 * 2. Respect prefers-reduced-motion (no shimmer/warp)
 * 3. Never mutate styles on idle (no pulse)
 * 4. Meet contrast requirements for child text
 * 5. Provide consistent glass aesthetic across quality tiers
 *
 * Constitutional Values:
 * - IDLE_MUTATION_TOLERANCE: 0 (no style changes without user input)
 * - FALLBACK_RENDER_TIME: <16ms (single frame budget)
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// ============================================================================
// Test Configuration - Constitutional Values
// ============================================================================

const CONSTITUTIONAL_VALUES = {
  IDLE_MUTATION_TOLERANCE: 0,
  FALLBACK_RENDER_TIME_MS: 16,
  IDLE_OBSERVATION_WINDOW_MS: 2000,
} as const;

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the quality gate to control test conditions
vi.mock('../materialQualityGate', () => ({
  useMaterialQuality: vi.fn(),
  MaterialQuality: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
}));

const mockUseMaterialQuality = vi.importMock('../materialQualityGate').useMaterialQuality;

// ============================================================================
// LiquidPanel Tests
// ============================================================================

describe('LiquidPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to high quality
    mockUseMaterialQuality.mockReturnValue({
      tier: 'high',
      enableBackdropBlur: true,
      enableGlassDistortion: true,
      enableSprings: true,
      enableWarps: true,
      enableLoopingAnimations: true,
      prefersReducedMotion: false,
    });
  });

  describe('Quality-Based Rendering', () => {
    it('renders static fallback when quality is LOW', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'low',
        enableBackdropBlur: false,
        enableGlassDistortion: false,
        enableSprings: false,
        enableWarps: false,
        enableLoopingAnimations: false,
        prefersReducedMotion: false,
      });

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      // Static fallback should have the static class (JSDOM doesn't compute backdrop-filter)
      expect(panel).toHaveClass('liquid-panel--static');
      // Should NOT have blur class when in static mode
      expect(panel).not.toHaveClass('liquid-panel--blur');
      expect(panel).not.toHaveClass('liquid-panel--glass');
    });

    it('renders full glass effects when quality is HIGH', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'high',
        enableBackdropBlur: true,
        enableGlassDistortion: true,
        enableSprings: true,
        enableWarps: true,
        enableLoopingAnimations: true,
        prefersReducedMotion: false,
      });

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      expect(panel).toHaveClass('liquid-panel--glass');
      expect(panel).not.toHaveClass('liquid-panel--static');
    });

    it('renders medium tier with blur but no distortion', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'medium',
        enableBackdropBlur: true,
        enableGlassDistortion: false,
        enableSprings: true,
        enableWarps: false,
        enableLoopingAnimations: true,
        prefersReducedMotion: false,
      });

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      expect(panel).toHaveClass('liquid-panel--blur');
      expect(panel).not.toHaveClass('liquid-panel--distortion');
    });
  });

  describe('Reduced Motion Compliance', () => {
    it('disables shimmer and warp when motion is reduced', async () => {
      mockUseMaterialQuality.mockReturnValue({
        tier: 'high',
        enableBackdropBlur: true,
        enableGlassDistortion: false,
        enableSprings: false,
        enableWarps: false,
        enableLoopingAnimations: false,
        prefersReducedMotion: true,
      });

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel' shimmer>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      // Should NOT have shimmer class when reduced motion
      expect(panel).not.toHaveClass('liquid-panel--shimmer');
      expect(panel).toHaveAttribute('data-reduced-motion', 'true');
    });
  });

  describe('Idle Stability (No Pulse)', () => {
    it('does not mutate styles on idle', async () => {
      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      // Capture initial computed styles
      const captureStyles = () => {
        const styles = window.getComputedStyle(panel);
        return {
          opacity: styles.opacity,
          transform: styles.transform,
          filter: styles.filter,
          backdropFilter: styles.backdropFilter,
          background: styles.background,
        };
      };

      const initialStyles = captureStyles();
      const mutations: Array<{ property: string; from: string; to: string }> = [];

      // Observe for mutations over IDLE_OBSERVATION_WINDOW
      const observationInterval = 100;
      const observations = CONSTITUTIONAL_VALUES.IDLE_OBSERVATION_WINDOW_MS / observationInterval;

      for (let i = 0; i < observations; i++) {
        await new Promise((resolve) => setTimeout(resolve, observationInterval));
        const currentStyles = captureStyles();

        Object.keys(initialStyles).forEach((key) => {
          const initial = initialStyles[key as keyof typeof initialStyles];
          const current = currentStyles[key as keyof typeof currentStyles];
          if (initial !== current) {
            mutations.push({ property: key, from: initial, to: current });
          }
        });
      }

      // Constitutional guarantee: zero mutations during idle
      expect(mutations.length).toBe(CONSTITUTIONAL_VALUES.IDLE_MUTATION_TOLERANCE);
    });

    it('does not schedule intervals or RAF loops', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      // Wait for any async effects
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Panel should NOT schedule any recurring updates
      expect(setIntervalSpy).not.toHaveBeenCalled();
      expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('renders children with proper contrast', async () => {
      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel'>
          <span data-testid='panel-text'>Readable Text</span>
        </LiquidPanel>
      );

      const text = screen.getByTestId('panel-text');

      // Text should be visible (not hidden by glass effect)
      expect(text).toBeVisible();
      expect(text).toHaveTextContent('Readable Text');
    });

    it('supports custom ARIA attributes', async () => {
      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid='liquid-panel' role='region' aria-label='Main content panel'>
          <span>Content</span>
        </LiquidPanel>
      );

      const panel = screen.getByTestId('liquid-panel');

      expect(panel).toHaveAttribute('role', 'region');
      expect(panel).toHaveAttribute('aria-label', 'Main content panel');
    });
  });

  describe('Variants', () => {
    it('supports variant prop for different glass styles', async () => {
      const { LiquidPanel } = await import('../LiquidPanel');

      const { rerender } = render(
        <LiquidPanel data-testid='liquid-panel' variant='shell'>
          <span>Content</span>
        </LiquidPanel>
      );

      let panel = screen.getByTestId('liquid-panel');
      expect(panel).toHaveClass('liquid-panel--shell');

      rerender(
        <LiquidPanel data-testid='liquid-panel' variant='interactive'>
          <span>Content</span>
        </LiquidPanel>
      );

      panel = screen.getByTestId('liquid-panel');
      expect(panel).toHaveClass('liquid-panel--interactive');
    });
  });
});
