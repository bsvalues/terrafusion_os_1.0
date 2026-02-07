/**
 * TerraFusion OS AmbientCompositor Stability Tests
 *
 * Tests that the AmbientCompositor does not cause periodic rerenders
 * or start animation loops when in CSS mode (the default for desktop).
 *
 * @module shell/ambient/__tests__/AmbientCompositor.stability.test
 * @vitest-environment jsdom
 * @see Phase A TDD - UI Stabilization
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';

import { AmbientCompositor } from '../AmbientCompositor';

describe('AmbientCompositor Stability', () => {
  // Track RAF and interval usage
  let rafCalls: number;
  let intervalCalls: number;
  let rafSpy: jest.SpyInstance;
  let intervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    rafCalls = 0;
    intervalCalls = 0;

    rafSpy = jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCalls++;
      return 0;
    });

    intervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((...args) => {
      intervalCalls++;
      // Return a fake timer ID but don't actually run the interval
      return 999 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
    rafSpy.mockRestore();
    intervalSpy.mockRestore();
  });

  describe('CSS Mode (Default)', () => {
    it('does_not_start_any_animation_loop_in_css_mode', async () => {
      render(<AmbientCompositor forcedMode='css' />);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const initialRafCalls = rafCalls;

      // Advance 10 seconds
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      const rafGrowth = rafCalls - initialRafCalls;

      // FAIL CONDITION: RAF should not grow over time in CSS mode
      // CSS mode uses pure CSS animations, no JS animation loop needed
      expect(rafGrowth).toBeLessThan(10);
    });

    it('does_not_start_any_interval_in_css_mode', async () => {
      render(<AmbientCompositor forcedMode='css' />);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // FAIL CONDITION: No intervals should be started in CSS mode
      expect(intervalCalls).toBe(0);
    });

    it('renders_CssAmbient_layer_in_css_mode', () => {
      render(<AmbientCompositor forcedMode='css' />);

      // The CssAmbient renders CSSAmbientLayer which has the background
      const background = screen.getByTestId('desktop-background');
      expect(background).toBeInTheDocument();
    });

    it('css_layer_has_no_animation_classes_that_cause_rerender', () => {
      render(<AmbientCompositor forcedMode='css' />);

      const background = screen.getByTestId('desktop-background');
      const htmlContent = background.innerHTML;

      // Check that the known pulse class is NOT present
      // (Previous pulse regression used animate-pulse or similar)
      expect(htmlContent).not.toContain('animate-pulse');
      expect(htmlContent).not.toContain('tsIconPulse');
    });
  });

  describe('Off Mode', () => {
    it('renders_nothing_when_mode_is_off', () => {
      render(<AmbientCompositor forcedMode='off' />);

      const background = screen.getByTestId('desktop-background');
      expect(background).toBeEmptyDOMElement();
    });

    it('starts_no_timers_when_mode_is_off', async () => {
      render(<AmbientCompositor forcedMode='off' />);

      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(rafCalls).toBe(0);
      expect(intervalCalls).toBe(0);
    });
  });

  describe('Fallback Behavior', () => {
    it('does_not_trigger_rerender_cascade_on_fallback', async () => {
      let renderCount = 0;
      const TrackingWrapper = () => {
        renderCount++;
        return <AmbientCompositor forcedMode='css' />;
      };

      render(<TrackingWrapper />);

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      const initialRenderCount = renderCount;

      // Advance 10 seconds
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      const renderGrowth = renderCount - initialRenderCount;

      // FAIL CONDITION: Renders should not grow over time (indicates timer-driven updates)
      expect(renderGrowth).toBe(0);
    });
  });

  describe('Test Environment Detection', () => {
    it('uses_css_mode_in_test_environment', () => {
      // AmbientCompositor should detect NODE_ENV=test and use CSS mode
      render(<AmbientCompositor />);

      // Should fall back to CSS in test environment
      const background = screen.getByTestId('desktop-background');
      expect(background).toBeInTheDocument();
      // And it should not be empty (off mode) - CSS mode renders layers
      expect(background).not.toBeEmptyDOMElement();
    });
  });
});
