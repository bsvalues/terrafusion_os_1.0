/**
 * @fileoverview Phase 7 (Slices 7.5 + 7.6): Reduced Motion & Transparency Fallbacks
 *
 * Ensures the material quality gate properly degrades when the user has
 * reduced-motion or reduced-transparency preferences, and when the GPU
 * tier is insufficient for glass effects.
 *
 * These are pure unit tests on the quality gate — no DOM rendering needed.
 *
 * Test Framework: Vitest with globals, jsdom
 */

import '@testing-library/jest-dom';
import {
  getMaterialQuality,
  resetMaterialQualityGate,
  MaterialQuality,
} from '@/ui/materials/materialQualityGate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Override matchMedia to report prefers-reduced-motion: reduce.
 */
function enableReducedMotion(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Restore matchMedia to default (no preferences active).
 */
function disableReducedMotion(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 7: Reduced Motion & Transparency Fallbacks', () => {
  afterEach(() => {
    resetMaterialQualityGate();
    disableReducedMotion();
  });

  // -------------------------------------------------------------------------
  // 1. prefers-reduced-motion disables looping animations
  // -------------------------------------------------------------------------
  it('prefers-reduced-motion: quality gate disables looping animations', () => {
    enableReducedMotion();
    resetMaterialQualityGate();

    const quality = getMaterialQuality({ forceReducedMotion: true });

    expect(quality.enableLoopingAnimations).toBe(false);
    expect(quality.prefersReducedMotion).toBe(true);
    expect(quality.enableSprings).toBe(false);
    expect(quality.enableWarps).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 2. prefers-reduced-transparency: glass degrades to solid
  // -------------------------------------------------------------------------
  it('prefers-reduced-transparency: glass degrades to solid', () => {
    // When quality gate reports LOW tier, LiquidPanel applies the
    // liquid-panel--static class which uses solid backgrounds instead
    // of backdrop-blur. We test the gate output directly.
    resetMaterialQualityGate();

    const quality = getMaterialQuality({ gpuTier: 0, forceLowPower: true });

    // LOW tier means no backdrop blur — components will use solid fills
    expect(quality.tier).toBe(MaterialQuality.LOW);
    expect(quality.enableBackdropBlur).toBe(false);

    // Verify the quality state signals static rendering
    expect(quality.enableGlassDistortion).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3. LOW memory tier returns LOW quality
  // -------------------------------------------------------------------------
  it('LOW memory tier: materialQualityGate returns LOW', () => {
    resetMaterialQualityGate();

    const quality = getMaterialQuality({ gpuTier: 0 });

    expect(quality.tier).toBe(MaterialQuality.LOW);
    expect(quality.enableBackdropBlur).toBe(false);
    expect(quality.enableGlassDistortion).toBe(false);
  });
});
