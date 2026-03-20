/**
 * TerraFusion OS Standalone Homes Contract Tests
 *
 * Tests that standalone suite routes render a consistent shell contract.
 * Parameterized over ALL standalone suites from the registry (Slice 7).
 *
 * Contract requirements:
 * - h1 title present
 * - Intent badge "Standalone"
 * - Consistent container structure (header + content + actions)
 * - materialQualityGate on/off produces no layout shift
 *
 * @module __tests__/standalone/standaloneHomes.contract.test
 * @vitest-environment jsdom
 * @see Slice 6.1: Unskip + Harden Standalone Contract Suite
 * @see Slice 7: Registry-Driven Contract Enforcement
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
  toOsActor: vi.fn((auth: any) => ({
    userId: auth.userId ?? 'u-test',
    countyId: auth.countyId ?? 'benton',
    roles: auth.roles ?? [],
  })),
}));
vi.mock('../../auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));
import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { StandaloneHomeShell } from '../../components/standalone';
import { getStandaloneSuites, type StandaloneSuiteDefinition } from '../../config/suiteRegistry';
import { resetMaterialQualityGate } from '../../ui/materials/materialQualityGate';

import {
    assertShellStructure,
    getStructuralTestIds,
    mockMatchMedia,
    TestStandaloneHome,
} from './testUtils';

// ============================================================================
// Test Data - Registry-Driven (Slice 7)
// ============================================================================

// All live standalone suites from registry
const STANDALONE_SUITES = getStandaloneSuites();

// ============================================================================
// Test Setup
// ============================================================================

describe('Standalone Homes Contract', () => {
  beforeEach(() => {
    mockMatchMedia(false); // Default: no reduced motion
  });

  afterEach(() => {
    cleanup();
    resetMaterialQualityGate();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Shell Chrome Contract Tests - Parameterized
  // ==========================================================================

  describe('Shell Chrome Contract', () => {
    it.each(STANDALONE_SUITES.map((s) => [s.id, s] as [string, StandaloneSuiteDefinition]))(
      'renders h1 title for %s',
      (_, suite) => {
        render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent(suite.homeMeta.title!);
      }
    );

    it.each(STANDALONE_SUITES.map((s) => [s.id, s] as [string, StandaloneSuiteDefinition]))(
      'renders intent badge for %s',
      (_, suite) => {
        render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        // Query by data-intent attribute since there may be multiple "Standalone" texts
        const badge = document.querySelector('[data-intent="standalone"]');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('Standalone');
      }
    );

    it.each(STANDALONE_SUITES.map((s) => [s.id, s] as [string, StandaloneSuiteDefinition]))(
      'has consistent container structure for %s',
      (_, suite) => {
        const { container } = render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        // Use assertion helper
        assertShellStructure(container);

        // Verify hierarchy
        const shell = screen.getByTestId('standalone-shell');
        const header = screen.getByTestId('standalone-header');
        const content = screen.getByTestId('standalone-content');
        const actions = screen.getByTestId('standalone-actions');

        expect(shell).toContainElement(header);
        expect(shell).toContainElement(content);
        expect(header).toContainElement(actions);
      }
    );

    it('all live standalone features have homeMeta defined', () => {
      // Verify registry contract (this is also in registryCompleteness but repeated for contract clarity)
      for (const suite of STANDALONE_SUITES) {
        expect(suite.homeMeta).toBeDefined();
        expect(suite.homeMeta.title).toBeTruthy();
      }
    });
  });

  // ==========================================================================
  // Material Quality Gate Tests - Parameterized
  // ==========================================================================

  describe('Material Quality Gate', () => {
    it.each(STANDALONE_SUITES.map((s) => [s.id, s] as [string, StandaloneSuiteDefinition]))(
      'renders LiquidPanel wrapper for %s',
      (_, suite) => {
        render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        // LiquidPanel adds liquid-panel class
        const shell = screen.getByTestId('standalone-shell');
        expect(shell.querySelector('.liquid-panel')).toBeInTheDocument();
      }
    );

    it.each(STANDALONE_SUITES.map((s) => [s.id, s] as [string, StandaloneSuiteDefinition]))(
      'no layout shift between quality modes for %s',
      (_, suite) => {
        // High quality
        mockMatchMedia(false);
        resetMaterialQualityGate();

        const { container: highQualityContainer } = render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        const highQualityStructure = getStructuralTestIds(highQualityContainer);
        cleanup();

        // Low quality
        mockMatchMedia(true);
        resetMaterialQualityGate();

        const { container: lowQualityContainer } = render(
          <MemoryRouter>
            <TestStandaloneHome featureId={suite.id} title={suite.homeMeta.title} />
          </MemoryRouter>
        );

        const lowQualityStructure = getStructuralTestIds(lowQualityContainer);

        // Structure should be identical
        expect(highQualityStructure).toEqual(lowQualityStructure);
      }
    );

    it('adds standalone-fallback class when reduced motion enabled', () => {
      resetMaterialQualityGate();
      mockMatchMedia(true); // Reduced motion

      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const shell = screen.getByTestId('standalone-shell');
      expect(shell).toHaveClass('standalone-fallback');
    });

    it('LiquidPanel has quality tier data attribute', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const liquidPanel = document.querySelector('.liquid-panel');
      expect(liquidPanel).toHaveAttribute('data-quality-tier');
    });
  });

  // ==========================================================================
  // Suite Boundary Tests
  // ==========================================================================

  describe('Suite Boundary', () => {
    it('OS shell owns chrome, suite owns content slot', () => {
      render(
        <MemoryRouter>
          <StandaloneHomeShell featureId='pilot' meta={{ title: 'Test' }}>
            <div data-testid='suite-specific-content'>Suite Content</div>
          </StandaloneHomeShell>
        </MemoryRouter>
      );

      // Shell-owned elements
      const header = screen.getByTestId('standalone-header');
      expect(header).toBeInTheDocument();

      // Suite-owned content in content slot
      const content = screen.getByTestId('standalone-content');
      const suiteContent = screen.getByTestId('suite-specific-content');
      expect(content).toContainElement(suiteContent);

      // Content is child of shell
      const shell = screen.getByTestId('standalone-shell');
      expect(shell).toContainElement(content);
    });

    it('suite content does not leak into shell chrome', () => {
      render(
        <MemoryRouter>
          <StandaloneHomeShell featureId='pilot' meta={{ title: 'Test' }}>
            <div data-testid='suite-specific-content'>Suite Content</div>
          </StandaloneHomeShell>
        </MemoryRouter>
      );

      const header = screen.getByTestId('standalone-header');
      const suiteContent = screen.getByTestId('suite-specific-content');

      // Header should NOT contain suite content
      expect(header).not.toContainElement(suiteContent);
    });

    it('content has main landmark role', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const content = screen.getByTestId('standalone-content');
      expect(content).toHaveAttribute('role', 'main');
    });

    it('header has banner landmark role', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const header = screen.getByTestId('standalone-header');
      expect(header).toHaveAttribute('role', 'banner');
    });
  });

  // ==========================================================================
  // Primary Actions Tests
  // ==========================================================================

  describe('Primary Actions', () => {
    it('renders primary actions from meta', () => {
      render(
        <MemoryRouter>
          <StandaloneHomeShell
            featureId='pilot'
            meta={{
              title: 'Test',
              primaryActions: [
                { id: 'action-1', label: 'Action One', intent: 'standalone', href: '/action1' },
                { id: 'action-2', label: 'Action Two', intent: 'standalone', href: '/action2' },
              ],
            }}
          >
            <div>Content</div>
          </StandaloneHomeShell>
        </MemoryRouter>
      );

      expect(screen.getByText('Action One')).toBeInTheDocument();
      expect(screen.getByText('Action Two')).toBeInTheDocument();
    });

    it('merges registry and prop actions', () => {
      // Pilot has registry actions, we add more
      render(
        <MemoryRouter>
          <StandaloneHomeShell
            featureId='pilot'
            meta={{
              primaryActions: [{ id: 'extra', label: 'Extra Action', intent: 'standalone' }],
            }}
          >
            <div>Content</div>
          </StandaloneHomeShell>
        </MemoryRouter>
      );

      // Should have both registry actions (View Tools, Dashboard) and extra
      expect(screen.getByText('Extra Action')).toBeInTheDocument();
    });
  });
});
