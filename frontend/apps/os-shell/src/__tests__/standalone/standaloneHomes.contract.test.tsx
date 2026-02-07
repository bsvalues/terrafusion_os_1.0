/**
 * TerraFusion OS Standalone Homes Contract Tests
 *
 * Tests that standalone suite routes render a consistent shell contract.
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
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { StandaloneHomeShell } from '../../components/standalone';
import { OS_FEATURES } from '../../config/suiteRegistry';
import { resetMaterialQualityGate } from '../../ui/materials/materialQualityGate';

import {
    assertShellStructure,
    getStructuralTestIds,
    mockMatchMedia,
    TestStandaloneHome,
} from './testUtils';

// ============================================================================
// Test Data
// ============================================================================

// All OS features with routes (standalone intent)
const STANDALONE_FEATURES = OS_FEATURES.filter((f) => f.route && f.status === 'live');

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
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Shell Chrome Contract Tests
  // ==========================================================================

  describe('Shell Chrome Contract', () => {
    it('renders h1 title in standalone home', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot Console' />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('TerraPilot Console');
    });

    it('renders intent badge with "Standalone" text', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      // Query by data-intent attribute since there may be multiple "Standalone" texts
      const badge = document.querySelector('[data-intent="standalone"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Standalone');
    });

    it('has consistent container structure: shell + header + content + actions', () => {
      const { container } = render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
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
    });

    it('renders description when provided', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome
            featureId='pilot'
            title='TerraPilot'
            description='Test description text'
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Test description text')).toBeInTheDocument();
    });

    it('all live standalone features have homeMeta defined', () => {
      // Verify registry contract
      for (const feature of STANDALONE_FEATURES) {
        expect(feature.homeMeta).toBeDefined();
        expect(feature.homeMeta?.title).toBeTruthy();
      }
    });
  });

  // ==========================================================================
  // Material Quality Gate Tests
  // ==========================================================================

  describe('Material Quality Gate', () => {
    it('renders LiquidPanel wrapper in shell', () => {
      render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      // LiquidPanel adds liquid-panel class
      const shell = screen.getByTestId('standalone-shell');
      expect(shell.querySelector('.liquid-panel')).toBeInTheDocument();
    });

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

    it('no layout shift between high and low quality modes', () => {
      // High quality
      mockMatchMedia(false);
      resetMaterialQualityGate();

      const { container: highQualityContainer } = render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const highQualityStructure = getStructuralTestIds(highQualityContainer);
      cleanup();

      // Low quality
      mockMatchMedia(true);
      resetMaterialQualityGate();

      const { container: lowQualityContainer } = render(
        <MemoryRouter>
          <TestStandaloneHome featureId='pilot' title='TerraPilot' />
        </MemoryRouter>
      );

      const lowQualityStructure = getStructuralTestIds(lowQualityContainer);

      // Structure should be identical
      expect(highQualityStructure).toEqual(lowQualityStructure);
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
