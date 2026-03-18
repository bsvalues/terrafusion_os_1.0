/**
 * @fileoverview Phase 7 (Slices 7.5 + 7.6): TerraSphere Legibility Tests
 *
 * Validates that TerraSphere and TerraSphereIcon remain legible and
 * visually correct at small icon sizes (dock @ 28px, suite tiles @ 36px).
 *
 * TDD-first: several tests target attributes/behavior that do NOT yet exist
 * (data-size-class, compact geometry reduction). These are expected to fail
 * until the component is updated in a later slice.
 *
 * Test Framework: Vitest with globals, jsdom, @testing-library/react
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Imports under test
// ---------------------------------------------------------------------------

import { TerraSphere } from '../TerraSphere';
import { TerraSphereIcon } from '../TerraSphereIcon';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Override window.matchMedia so prefers-reduced-motion reports `reduce`.
 * Must be called BEFORE rendering components that read the media query.
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 7: TerraSphere Legibility', () => {
  afterEach(() => {
    // Restore default matchMedia mock (matches: false)
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
  });

  // -------------------------------------------------------------------------
  // 1. Small-size rendering sanity check
  // -------------------------------------------------------------------------
  it('TerraSphere at size={28} renders without clipping', () => {
    const { container } = render(<TerraSphere size={28} />);

    // TerraSphere renders a div container; the inner sphere is div-based
    // (not SVG). Verify the root container exists and has the correct size.
    const root = container.querySelector('.terrasphere-container');
    expect(root).not.toBeNull();
    expect(root).toBeInTheDocument();

    // The container should have width/height set to 28
    const style = (root as HTMLElement).style;
    expect(style.width).toBe('28px');
    expect(style.height).toBe('28px');
  });

  // -------------------------------------------------------------------------
  // 2. Compact geometry at very small sizes (TDD-first -- EXPECTED TO FAIL)
  // -------------------------------------------------------------------------
  it('TerraSphere at size={20} uses simplified geometry', () => {
    const { container } = render(<TerraSphere size={20} />);

    // At very small sizes the component should suppress particle and orbital
    // elements that are illegible. Currently TerraSphere renders all rings
    // regardless of size, so this test is expected to FAIL until the compact
    // mode is implemented.
    const particles = container.querySelectorAll('[class*="particle"]');
    const orbitals = container.querySelectorAll('[class*="orbital"]');

    expect(particles.length).toBe(0);
    expect(orbitals.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 3. data-size-class attribute (TDD-first -- EXPECTED TO FAIL)
  // -------------------------------------------------------------------------
  it('TerraSphere emits data-size-class="compact" when size < 32', () => {
    // size={28} should yield compact
    const { container, rerender } = render(<TerraSphere size={28} />);
    const rootCompact = container.querySelector('.terrasphere-container');
    expect(rootCompact).toHaveAttribute('data-size-class', 'compact');

    // size={48} should yield standard
    rerender(<TerraSphere size={48} />);
    const rootStandard = container.querySelector('.terrasphere-container');
    expect(rootStandard).toHaveAttribute('data-size-class', 'standard');
  });

  // -------------------------------------------------------------------------
  // 4. TerraSphereIcon glyph visibility at dock size
  // -------------------------------------------------------------------------
  it('TerraSphereIcon glyph visible at size={28}', () => {
    render(
      <TerraSphereIcon
        size={28}
        variant="default"
        glyph={<span data-testid="test-glyph">G</span>}
      />,
    );

    const glyph = screen.getByTestId('test-glyph');
    expect(glyph).toBeInTheDocument();
    expect(glyph).toHaveTextContent('G');
  });

  // -------------------------------------------------------------------------
  // 5. prefers-reduced-motion: no orbital ring rotation
  // -------------------------------------------------------------------------
  it('prefers-reduced-motion: no orbital ring rotation', () => {
    enableReducedMotion();

    const { container } = render(<TerraSphere size={48} />);

    // When reduced motion is active, inline animation properties on the
    // sphere and rings should either be absent or set to 'none'.
    // The current component does not yet gate on prefers-reduced-motion
    // itself (quality gate handles it at a higher level), so we check
    // whether the component exposes a data attribute or class that
    // downstream CSS can target.
    const sphere = container.querySelector('.terrasphere');
    const rings = container.querySelectorAll('.sphere-ring');

    // Check that inline animation styles contain rotating animations.
    // If the component properly respects reduced motion, these should
    // be absent or 'none'. This assertion documents the expected
    // behavior; it may pass or fail depending on implementation state.
    const hasInlineAnimation = (el: Element): boolean => {
      const style = (el as HTMLElement).style.animation;
      return !!style && style !== 'none' && style.includes('infinite');
    };

    // At least the sphere should exist
    expect(sphere).toBeInTheDocument();

    // In a reduced-motion environment, we expect NO looping animations
    // on the sphere element itself.
    if (sphere) {
      // NOTE: Current implementation always sets inline animation.
      // This test documents the desired future behavior.
      // When the component is updated, this will pass.
      expect(hasInlineAnimation(sphere)).toBe(false);
    }
  });
});
