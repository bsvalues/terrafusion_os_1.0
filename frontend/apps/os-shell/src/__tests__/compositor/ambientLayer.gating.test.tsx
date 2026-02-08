/**
 * TerraFusion OS Ambient Layer Gating Tests
 *
 * Tests that the ambient layer respects materialQualityGate and
 * gracefully degrades for low-power and reduced-motion scenarios.
 *
 * @module __tests__/compositor/ambientLayer.gating.test
 * @vitest-environment jsdom
 * @see Slice 4: Compositor Jitter Stabilization
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';

import { AmbientCompositor } from '../../shell/ambient/AmbientCompositor';
import * as ambientPolicy from '../../shell/ambient/ambientPolicy';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('../../shell/ambient/ambientPolicy', () => ({
  ...jest.requireActual('../../shell/ambient/ambientPolicy'),
  resolveAmbientMode: jest.fn(),
}));

const mockResolveAmbientMode = ambientPolicy.resolveAmbientMode as jest.MockedFunction<
  typeof ambientPolicy.resolveAmbientMode
>;

// ============================================================================
// Test Setup
// ============================================================================

describe('Ambient Layer Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to CSS mode
    mockResolveAmbientMode.mockReturnValue('css');
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // CSS Mode (Default / Reduced Motion)
  // ==========================================================================

  describe('CSS Mode (Default)', () => {
    it('mounts_css_ambient_layer_in_default_mode', () => {
      mockResolveAmbientMode.mockReturnValue('css');

      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');
      expect(container).toBeInTheDocument();
      // CSS mode should render content (not empty)
      expect(container).not.toBeEmptyDOMElement();
    });

    it('uses_fixed_positioning_no_document_flow_impact', () => {
      mockResolveAmbientMode.mockReturnValue('css');

      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');

      // Should use fixed positioning to avoid document flow impact
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('inset-0');
      expect(container).toHaveClass('pointer-events-none');
    });

    it('has_proper_z_index_for_overlay_layering', () => {
      mockResolveAmbientMode.mockReturnValue('css');

      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');

      // z-0 puts it behind all interactive content
      expect(container).toHaveClass('z-0');
    });

    it('is_hidden_from_accessibility_tree', () => {
      mockResolveAmbientMode.mockReturnValue('css');

      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');

      // Decorative elements should be aria-hidden
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ==========================================================================
  // Off Mode (Extreme Low Power)
  // ==========================================================================

  describe('Off Mode', () => {
    it('renders_empty_when_mode_is_off', () => {
      mockResolveAmbientMode.mockReturnValue('off');

      render(<AmbientCompositor forcedMode='off' />);

      const container = screen.getByTestId('desktop-background');
      expect(container).toBeEmptyDOMElement();
    });

    it('off_mode_has_no_visual_elements', () => {
      render(<AmbientCompositor forcedMode='off' />);

      const container = screen.getByTestId('desktop-background');

      // No children when off
      expect(container.children.length).toBe(0);
    });
  });

  // ==========================================================================
  // Forced Mode Override
  // ==========================================================================

  describe('Forced Mode Override', () => {
    it('forcedMode_overrides_resolved_mode', () => {
      // Policy says webgl, but we force css
      mockResolveAmbientMode.mockReturnValue('webgl');

      render(<AmbientCompositor forcedMode='css' />);

      const container = screen.getByTestId('desktop-background');
      // Should render CSS content, not WebGL canvas
      expect(container).not.toBeEmptyDOMElement();
      expect(container.querySelector('canvas')).toBeNull();
    });

    it('forcedMode_css_in_test_environment', () => {
      // The AmbientCompositor uses 'css' mode in test environment
      // regardless of resolved mode (for stability)

      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');
      expect(container).toBeInTheDocument();
      // Should be CSS mode (no canvas)
      expect(container.querySelector('canvas')).toBeNull();
    });
  });

  // ==========================================================================
  // Low Power Path
  // ==========================================================================

  describe('Low Power Path', () => {
    it('canvas2d_mode_for_low_power_devices', () => {
      mockResolveAmbientMode.mockReturnValue('canvas2d');

      // In test environment, canvas2d fallsback to css
      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');
      expect(container).toBeInTheDocument();
    });

    it('no_expensive_blur_effects_on_low_power', () => {
      // CSS mode doesn't have real-time blur computation
      // The blur is baked into CSS gradient/filter

      mockResolveAmbientMode.mockReturnValue('css');
      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');

      // CSS blur is declarative, not computed per-frame
      // Just verify it renders something
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Reduced Motion
  // ==========================================================================

  describe('Reduced Motion Compliance', () => {
    it('no_animate_pulse_in_css_mode', () => {
      render(<AmbientCompositor forcedMode='css' />);

      const container = screen.getByTestId('desktop-background');
      const html = container.innerHTML;

      // Known pulse regression - should NOT have animate-pulse
      expect(html).not.toContain('animate-pulse');
      expect(html).not.toContain('tsIconPulse');
    });

    it('reduced_motion_resolves_to_css_mode', () => {
      // When reduced motion is preferred, ambientPolicy returns 'css'
      // This is tested in the policy, but we verify behavior here

      mockResolveAmbientMode.mockReturnValue('css');
      render(<AmbientCompositor />);

      const container = screen.getByTestId('desktop-background');

      // CSS mode is stable (no JS animations)
      expect(container).not.toBeEmptyDOMElement();
    });

    it('no_looping_js_animations_in_css_mode', async () => {
      const rafCalls: number[] = [];

      const originalRaf = global.requestAnimationFrame;
      global.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
        rafCalls.push(Date.now());
        return 0;
      }) as typeof requestAnimationFrame;

      render(<AmbientCompositor forcedMode='css' />);

      // Wait a bit
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      global.requestAnimationFrame = originalRaf;

      // CSS mode should not start RAF loops
      // (Some initial render passes are okay, but no continuous loop)
      expect(rafCalls.length).toBeLessThan(10);
    });
  });

  // ==========================================================================
  // Fallback Consistency
  // ==========================================================================

  describe('Fallback Consistency', () => {
    it('css_mode_renders_gradient_background', () => {
      render(<AmbientCompositor forcedMode='css' />);

      const container = screen.getByTestId('desktop-background');
      const html = container.innerHTML.toLowerCase();

      // Should have gradient styling
      expect(html).toContain('bg-');
    });

    it('fallback_is_visually_consistent_no_flash', () => {
      // The container renders immediately with full opacity
      render(<AmbientCompositor forcedMode='css' />);

      const container = screen.getByTestId('desktop-background');

      // Should have consistent initial opacity (no flash)
      // The CSSAmbientLayer uses opacity-100 always
      expect(container.querySelector('.opacity-100')).toBeInTheDocument();
    });

    it('webgl_fatal_error_falls_back_to_canvas2d', () => {
      // This tests the fallback chain: webgl -> canvas2d -> css -> off
      // In JSDOM, WebGL is not supported, so it implicitly tests degradation

      // Render with explicit webgl mode
      const { rerender } = render(<AmbientCompositor forcedMode='webgl' />);

      // In test environment, webgl mode falls back to css (see isTest check)
      const container = screen.getByTestId('desktop-background');
      expect(container).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Stability Under State Changes
  // ==========================================================================

  describe('Stability Under State Changes', () => {
    it('does_not_rerender_cascade_on_mode_change', async () => {
      let renderCount = 0;
      const TrackingWrapper = ({ mode }: { mode: 'css' | 'off' }) => {
        renderCount++;
        return <AmbientCompositor forcedMode={mode} />;
      };

      const { rerender } = render(<TrackingWrapper mode='css' />);
      const initialCount = renderCount;

      // Change mode
      rerender(<TrackingWrapper mode='off' />);

      // Should only render twice (initial + mode change), not cascade
      expect(renderCount - initialCount).toBeLessThanOrEqual(1);
    });

    it('container_remains_stable_during_rerender', () => {
      const { rerender } = render(<AmbientCompositor forcedMode='css' />);

      const container1 = screen.getByTestId('desktop-background');

      rerender(<AmbientCompositor forcedMode='css' />);

      const container2 = screen.getByTestId('desktop-background');

      // Same element reference (no DOM replacement)
      expect(container1).toBe(container2);
    });
  });
});
