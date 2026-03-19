/**
 * @fileoverview Phase 7: Material Governance Contract Tests
 *
 * Enforces the four material laws of TerraFusion OS:
 *
 * 1. Liquid Glass is shell chrome ONLY
 * 2. Bento is for home/data surfaces
 * 3. Tactile is for high-stakes actions
 * 4. Neon is system state ONLY
 *
 * These are TDD-first contract tests. Tests 1, 3, 4, 5, 6 are expected
 * to FAIL until the components are updated to emit `data-material` attributes
 * and BentoCard is decoupled from LiquidPanel.
 *
 * Tests 2, 7, 8, 9, 10 verify existing correct behavior.
 *
 * @module materialGovernance.contract
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  getMaterialQuality,
  resetMaterialQualityGate,
  MaterialQuality,
} from '../materialQualityGate';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the quality gate hook so we can control quality tier per test
vi.mock('../materialQualityGate', async () => {
  const actual = await vi.importActual<typeof import('../materialQualityGate')>(
    '../materialQualityGate'
  );
  return {
    ...actual,
    useMaterialQuality: vi.fn(() => actual.getMaterialQuality()),
  };
});

// Mock framer-motion to avoid JSDOM limitations with animation runtime
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) => {
        const {
          whileHover,
          whileTap,
          transition,
          ...rest
        } = props;
        return React.createElement('button', { ...rest, ref });
      }),
    },
    useReducedMotion: () => false,
  };
});

const { useMaterialQuality } = await import('../materialQualityGate');
const mockUseMaterialQuality = vi.mocked(useMaterialQuality);

// ============================================================================
// Helpers
// ============================================================================

function setQualityTier(overrides: {
  tier: string;
  enableBackdropBlur: boolean;
  enableGlassDistortion: boolean;
  enableSprings: boolean;
  enableWarps: boolean;
  enableLoopingAnimations: boolean;
  prefersReducedMotion: boolean;
  gpuTier?: number;
}) {
  mockUseMaterialQuality.mockReturnValue({
    gpuTier: overrides.gpuTier ?? 3,
    ...overrides,
  } as ReturnType<typeof useMaterialQuality>);
}

const HIGH_QUALITY = {
  tier: 'high' as const,
  enableBackdropBlur: true,
  enableGlassDistortion: true,
  enableSprings: true,
  enableWarps: true,
  enableLoopingAnimations: true,
  prefersReducedMotion: false,
  gpuTier: 3,
};

const LOW_QUALITY = {
  tier: 'low' as const,
  enableBackdropBlur: false,
  enableGlassDistortion: false,
  enableSprings: false,
  enableWarps: false,
  enableLoopingAnimations: false,
  prefersReducedMotion: false,
  gpuTier: 0,
};

const REDUCED_MOTION_QUALITY = {
  tier: 'high' as const,
  enableBackdropBlur: true,
  enableGlassDistortion: false,
  enableSprings: false,
  enableWarps: false,
  enableLoopingAnimations: false,
  prefersReducedMotion: true,
  gpuTier: 3,
};

// ============================================================================
// Phase 7: Material Governance Contract
// ============================================================================

describe('Phase 7: Material Governance Contract', () => {
  afterEach(() => {
    resetMaterialQualityGate();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rule 1 — Liquid Glass is Shell Chrome Only
  // --------------------------------------------------------------------------

  describe('Rule 1 — Liquid Glass is Shell Chrome Only', () => {
    it('LiquidPanel renders data-material="liquid-glass"', async () => {
      setQualityTier(HIGH_QUALITY);

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel data-testid="lp-material">Content</LiquidPanel>
      );

      const panel = screen.getByTestId('lp-material');
      // TDD-first: this attribute does not exist yet — expected to FAIL
      expect(panel).toHaveAttribute('data-material', 'liquid-glass');
    });

    it('LiquidPanel with variant="shell" has glass class when quality is HIGH', async () => {
      setQualityTier(HIGH_QUALITY);

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel variant="shell" data-testid="lp-shell">Content</LiquidPanel>
      );

      const panel = screen.getByTestId('lp-shell');
      expect(panel).toHaveClass('liquid-panel--glass');
      expect(panel).toHaveClass('liquid-panel--shell');
    });
  });

  // --------------------------------------------------------------------------
  // Rule 2 — Bento is for Home Scene Data
  // --------------------------------------------------------------------------

  describe('Rule 2 — Bento is for Home Scene Data', () => {
    it('BentoCard does NOT wrap LiquidPanel', async () => {
      setQualityTier(HIGH_QUALITY);

      const { BentoCard } = await import('../BentoCard');

      render(
        <BentoCard data-testid="bc-independence" title="Test">
          Cell content
        </BentoCard>
      );

      const card = screen.getByTestId('bc-independence');

      // BentoCard must be its own surface — not a LiquidPanel wrapper.
      // LiquidPanel adds `liquid-panel` class and `data-quality-tier` attribute.
      // If either is present, BentoCard is still coupled to LiquidPanel.
      // TDD-first: BentoCard currently wraps LiquidPanel — expected to FAIL
      expect(card).not.toHaveClass('liquid-panel');
      expect(card).not.toHaveAttribute('data-quality-tier');
    });

    it('BentoCard renders data-material="bento"', async () => {
      setQualityTier(HIGH_QUALITY);

      const { BentoCard } = await import('../BentoCard');

      render(
        <BentoCard data-testid="bc-material" title="Revenue">
          $4.2B
        </BentoCard>
      );

      const card = screen.getByTestId('bc-material');
      // TDD-first: this attribute does not exist yet — expected to FAIL
      expect(card).toHaveAttribute('data-material', 'bento');
    });
  });

  // --------------------------------------------------------------------------
  // Rule 3 — Tactile for High-Stakes Actions
  // --------------------------------------------------------------------------

  describe('Rule 3 — Tactile for High-Stakes Actions', () => {
    it('TactileButton renders data-material="tactile"', async () => {
      setQualityTier(HIGH_QUALITY);

      const { TactileButton } = await import('../TactileButton');

      render(
        <TactileButton data-testid="tb-material">Submit</TactileButton>
      );

      const button = screen.getByTestId('tb-material');
      // TDD-first: this attribute does not exist yet — expected to FAIL
      expect(button).toHaveAttribute('data-material', 'tactile');
    });
  });

  // --------------------------------------------------------------------------
  // Rule 4 — Neon is System State Only
  // --------------------------------------------------------------------------

  describe('Rule 4 — Neon is System State Only', () => {
    it('NeonSignal renders data-material="neon"', async () => {
      const { NeonSignal } = await import('../NeonSignal');

      render(
        <NeonSignal status="healthy" data-testid="ns-material">
          SENTINEL Healthy
        </NeonSignal>
      );

      const signal = screen.getByTestId('ns-material');
      // TDD-first: this attribute does not exist yet — expected to FAIL
      expect(signal).toHaveAttribute('data-material', 'neon');
    });

    it('NeonSignal always requires a valid status prop and renders role="status"', async () => {
      const { NeonSignal } = await import('../NeonSignal');

      const statuses = ['healthy', 'degraded', 'down', 'active', 'locked'] as const;

      for (const status of statuses) {
        const { unmount } = render(
          <NeonSignal status={status} data-testid={`ns-${status}`}>
            {status.toUpperCase()}
          </NeonSignal>
        );

        const signal = screen.getByTestId(`ns-${status}`);
        expect(signal).toHaveAttribute('role', 'status');
        expect(signal).toHaveClass(`neon-signal--${status}`);
        expect(signal).toHaveTextContent(status.toUpperCase());

        unmount();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Rule 5 — Fallback Behavior
  // --------------------------------------------------------------------------

  describe('Rule 5 — Fallback Behavior', () => {
    it('reduced-motion: LiquidPanel disables looping animations (no shimmer)', async () => {
      setQualityTier(REDUCED_MOTION_QUALITY);

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel shimmer data-testid="lp-no-shimmer">
          Content
        </LiquidPanel>
      );

      const panel = screen.getByTestId('lp-no-shimmer');
      // Shimmer class should NOT be applied when enableLoopingAnimations is false
      expect(panel).not.toHaveClass('liquid-panel--shimmer');
      expect(panel).toHaveAttribute('data-reduced-motion', 'true');
    });

    it('LOW quality tier: LiquidPanel has no backdrop blur (static class)', async () => {
      setQualityTier(LOW_QUALITY);

      const { LiquidPanel } = await import('../LiquidPanel');

      render(
        <LiquidPanel variant="shell" data-testid="lp-low">
          Content
        </LiquidPanel>
      );

      const panel = screen.getByTestId('lp-low');
      // LOW tier renders static fallback, not glass
      expect(panel).toHaveClass('liquid-panel--static');
      expect(panel).not.toHaveClass('liquid-panel--glass');
      expect(panel).not.toHaveClass('liquid-panel--blur');
    });

    it('Material quality gate LOW returns correct capabilities', () => {
      const quality = getMaterialQuality({ gpuTier: 0 });

      expect(quality.tier).toBe(MaterialQuality.LOW);
      expect(quality.enableBackdropBlur).toBe(false);
      expect(quality.enableGlassDistortion).toBe(false);
      expect(quality.enableWarps).toBe(false);
    });
  });
});
