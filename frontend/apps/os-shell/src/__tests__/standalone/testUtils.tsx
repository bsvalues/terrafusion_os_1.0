/**
 * Test Utilities for Standalone Home Tests
 *
 * Provides mocks and helpers for testing StandaloneHomeShell and related components.
 *
 * @module __tests__/standalone/testUtils
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 */

import { vi } from 'vitest';
import type { ReactNode } from 'react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { StandaloneHomeShell } from '../../components/standalone';
import type { OsFeatureId } from '../../config/suiteRegistry';
import type { MaterialQualityState } from '../../ui/materials/materialQualityGate';
import { MaterialQuality, resetMaterialQualityGate } from '../../ui/materials/materialQualityGate';

// ============================================================================
// Material Quality Gate Mocks
// ============================================================================

/**
 * High quality state (animations enabled, blur enabled).
 */
export const HIGH_QUALITY_STATE: MaterialQualityState = {
  tier: MaterialQuality.HIGH,
  gpuTier: 3,
  enableBackdropBlur: true,
  enableGlassDistortion: true,
  enableSprings: true,
  enableWarps: true,
  enableLoopingAnimations: true,
  prefersReducedMotion: false,
};

/**
 * Medium quality state (blur enabled, no distortion).
 */
export const MEDIUM_QUALITY_STATE: MaterialQualityState = {
  tier: MaterialQuality.MEDIUM,
  gpuTier: 2,
  enableBackdropBlur: true,
  enableGlassDistortion: false,
  enableSprings: true,
  enableWarps: false,
  enableLoopingAnimations: true,
  prefersReducedMotion: false,
};

/**
 * Low quality state (all effects disabled).
 */
export const LOW_QUALITY_STATE: MaterialQualityState = {
  tier: MaterialQuality.LOW,
  gpuTier: 1,
  enableBackdropBlur: false,
  enableGlassDistortion: false,
  enableSprings: false,
  enableWarps: false,
  enableLoopingAnimations: false,
  prefersReducedMotion: true,
};

/**
 * Mock matchMedia for quality gate testing.
 */
export function mockMatchMedia(reducedMotion: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
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
 * Reset mocks between tests.
 */
export function resetMocks(): void {
  resetMaterialQualityGate();
  vi.clearAllMocks();
}

// ============================================================================
// Router Wrappers
// ============================================================================

export interface TestRouterOptions {
  initialRoute?: string;
  initialState?: Record<string, unknown>;
}

/**
 * Wrap component in MemoryRouter for testing.
 */
export function withRouter(children: ReactNode, options: TestRouterOptions = {}): ReactNode {
  const { initialRoute = '/', initialState } = options;
  const entries = initialState ? [{ pathname: initialRoute, state: initialState }] : [initialRoute];

  return (
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route path='*' element={<>{children}</>} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Standalone Shell Test Fixtures
// ============================================================================

/**
 * Props for creating a test standalone home.
 */
export interface TestStandaloneHomeProps {
  featureId: OsFeatureId;
  title?: string;
  description?: string;
  showWorkbenchCta?: boolean;
  children?: ReactNode;
}

/**
 * Create a test standalone home wrapped in StandaloneHomeShell.
 */
export function TestStandaloneHome({
  featureId,
  title,
  description,
  showWorkbenchCta = true,
  children,
}: TestStandaloneHomeProps): React.ReactElement {
  return (
    <StandaloneHomeShell
      featureId={featureId}
      meta={{
        title,
        description,
        showWorkbenchCta,
        primaryActions: [{ id: 'test-action', label: 'Test Action', intent: 'standalone' }],
      }}
    >
      {children ?? <div data-testid='suite-content'>Suite Content</div>}
    </StandaloneHomeShell>
  );
}

/**
 * Render a standalone home in a test router.
 */
export function renderStandaloneWithRouter(
  featureId: OsFeatureId,
  options: TestRouterOptions & { title?: string; description?: string } = {}
): ReactNode {
  const { initialRoute = `/${featureId}`, initialState, title, description } = options;

  return (
    <MemoryRouter
      initialEntries={
        initialState ? [{ pathname: initialRoute, state: initialState }] : [initialRoute]
      }
    >
      <Routes>
        <Route
          path={`/${featureId}`}
          element={
            <TestStandaloneHome featureId={featureId} title={title} description={description} />
          }
        />
        <Route
          path='/property/:parcelId/:suiteId'
          element={<div data-testid='workbench'>Workbench</div>}
        />
        <Route path='*' element={<div data-testid='fallback'>Fallback</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Parcel Context Fixtures
// ============================================================================

/**
 * Create parcel context state for testing workbench CTA.
 * Note: This returns the state format expected by StandaloneHomeShell,
 * which reads parcelId and parcelName directly from location.state.
 */
export function createParcelContext(
  parcelId: string,
  parcelName?: string
): Record<string, unknown> {
  return {
    parcelId,
    parcelName: parcelName ?? `Parcel ${parcelId}`,
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that all required standalone shell testids are present.
 */
export function assertShellStructure(container: HTMLElement): void {
  const shell = container.querySelector('[data-testid="standalone-shell"]');
  const header = container.querySelector('[data-testid="standalone-header"]');
  const content = container.querySelector('[data-testid="standalone-content"]');
  const actions = container.querySelector('[data-testid="standalone-actions"]');

  if (!shell) throw new Error('Missing standalone-shell');
  if (!header) throw new Error('Missing standalone-header');
  if (!content) throw new Error('Missing standalone-content');
  if (!actions) throw new Error('Missing standalone-actions');
}

/**
 * Get all testids from a container for structural comparison.
 */
export function getStructuralTestIds(container: HTMLElement): string[] {
  const elements = container.querySelectorAll('[data-testid]');
  return Array.from(elements).map((el) => el.getAttribute('data-testid') ?? '');
}
