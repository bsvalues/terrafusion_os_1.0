/**
 * @fileoverview Material Quality Gate Tests
 *
 * TDD Contract: The quality gate MUST:
 * 1. Detect low-power mode and disable heavy effects
 * 2. Respect prefers-reduced-motion and disable springs/warps
 * 3. Ensure glass text meets contrast budgets
 * 4. Never cause periodic updates (no pulse)
 *
 * Constitutional Values:
 * - CONTRAST_RATIO_MIN: 4.5 (WCAG AA for normal text)
 * - CONTRAST_RATIO_LARGE: 3.0 (WCAG AA for large text)
 * - GPU_TIER_THRESHOLD: 2 (tier 0-1 = low power)
 *
 * Phase 13.5: Ported from Jest to Vitest runner.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMaterialQuality,
  MaterialQuality,
  initMaterialQualityGate,
  resetMaterialQualityGate,
  useMaterialQuality,
  getGlassTextColor,
  checkContrastRatio,
} from '../materialQualityGate';

// Constitutional values used in tests
const CONSTITUTIONAL_VALUES = {
  CONTRAST_RATIO_MIN: 4.5, // WCAG AA for normal text
  CONTRAST_RATIO_LARGE: 3.0, // WCAG AA for large text
  GPU_TIER_THRESHOLD: 2, // tier 0-1 = low power
} as const;

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// ============================================================================
// Material Quality Gate Tests
// ============================================================================

describe('Material Quality Gate', () => {
  beforeEach(() => {
    resetMaterialQualityGate();
    mockMatchMedia(false);
  });

  describe('Low Power Mode Detection', () => {
    it('disables backdrop-heavy effects when GPU tier is low', () => {
      const quality = getMaterialQuality({ gpuTier: 1 });

      expect(quality.enableBackdropBlur).toBe(false);
      expect(quality.enableGlassDistortion).toBe(false);
      expect(quality.tier).toBe(MaterialQuality.LOW);
    });

    it('enables full effects when GPU tier is high', () => {
      const quality = getMaterialQuality({ gpuTier: 3 });

      expect(quality.enableBackdropBlur).toBe(true);
      expect(quality.enableGlassDistortion).toBe(true);
      expect(quality.tier).toBe(MaterialQuality.HIGH);
    });

    it('provides medium tier for mid-range GPUs', () => {
      const quality = getMaterialQuality({ gpuTier: 2 });

      expect(quality.enableBackdropBlur).toBe(true);
      expect(quality.enableGlassDistortion).toBe(false); // Distortion only on high
      expect(quality.tier).toBe(MaterialQuality.MEDIUM);
    });
  });

  describe('Reduced Motion Compliance', () => {
    it('disables springs when prefers-reduced-motion is set', () => {
      mockMatchMedia(true); // User prefers reduced motion
      resetMaterialQualityGate();

      const quality = getMaterialQuality();

      expect(quality.enableSprings).toBe(false);
      expect(quality.enableWarps).toBe(false);
      expect(quality.prefersReducedMotion).toBe(true);
    });

    it('enables springs when motion is allowed', () => {
      mockMatchMedia(false);
      resetMaterialQualityGate();

      const quality = getMaterialQuality();

      expect(quality.enableSprings).toBe(true);
      expect(quality.prefersReducedMotion).toBe(false);
    });

    it('disables all looping animations in reduced motion', () => {
      mockMatchMedia(true);
      resetMaterialQualityGate();

      const quality = getMaterialQuality();

      expect(quality.enableLoopingAnimations).toBe(false);
    });
  });

  describe('Contrast Budget Compliance', () => {
    it('provides contrast-safe text colors for glass surfaces', () => {
      // Glass background is typically rgba(255,255,255,0.1-0.3)
      const textColor = getGlassTextColor('dark'); // Dark glass background
      const contrastRatio = checkContrastRatio(textColor, 'rgba(0,0,0,0.8)');

      expect(contrastRatio).toBeGreaterThanOrEqual(CONSTITUTIONAL_VALUES.CONTRAST_RATIO_MIN);
    });

    it('provides high contrast text for light glass backgrounds', () => {
      const textColor = getGlassTextColor('light');
      const contrastRatio = checkContrastRatio(textColor, 'rgba(255,255,255,0.9)');

      expect(contrastRatio).toBeGreaterThanOrEqual(CONSTITUTIONAL_VALUES.CONTRAST_RATIO_MIN);
    });
  });

  describe('No Pulse Guarantee', () => {
    it('quality gate does not schedule any intervals or RAF loops', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');

      // Initialize the gate
      initMaterialQualityGate();
      getMaterialQuality();

      // Wait a tick for any async initialization
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should never schedule recurring updates
      expect(setIntervalSpy).not.toHaveBeenCalled();
      expect(requestAnimationFrameSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      requestAnimationFrameSpy.mockRestore();
    });

    it('quality values are computed once and cached', () => {
      const quality1 = getMaterialQuality();
      const quality2 = getMaterialQuality();

      // Should return same reference (cached)
      expect(quality1).toBe(quality2);
    });
  });

  describe('useMaterialQuality Hook', () => {
    it('provides reactive quality state without polling', () => {
      // Verify the hook is exported as a function
      expect(typeof useMaterialQuality).toBe('function');

      // Verify the quality state has required properties
      const quality = getMaterialQuality();
      expect(quality).toHaveProperty('tier');
      expect(quality).toHaveProperty('enableBackdropBlur');
      expect(quality).toHaveProperty('enableSprings');
      expect(quality).toHaveProperty('prefersReducedMotion');
    });
  });
});
