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
 * @see Slice 6: Standalone Suite Homes Consistency
 */

import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Test data - standalone routes from suiteRegistry
const STANDALONE_ROUTES = [
  { path: '/pilot', name: 'TerraPilot', id: 'pilot' },
  // Add more standalone routes as they are created
];

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Render a standalone route for testing.
 */
function renderStandaloneRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path='*' element={<StandaloneRouteLoader />} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Lazy loader for standalone routes.
 * This mimics how the actual Router.tsx loads these routes.
 */
function StandaloneRouteLoader() {
  // Import the actual route components
  // For now, we'll use a placeholder since we're testing the contract
  return (
    <div data-testid='standalone-shell'>
      {/* This should be replaced by StandaloneHomeShell once implemented */}
      <div data-testid='route-loaded'>Route loaded</div>
    </div>
  );
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Standalone Homes Contract', () => {
  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // Shell Chrome Contract Tests
  // ==========================================================================

  describe('Shell Chrome Contract', () => {
    // TODO: These tests will fail initially (TDD style)
    // The implementation should make them pass

    it.skip('each standalone route renders h1 title', async () => {
      // This test will be enabled once StandaloneHomeShell is implemented
      for (const route of STANDALONE_ROUTES) {
        cleanup();
        renderStandaloneRoute(route.path);

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading.textContent).toBeTruthy();
      }
    });

    it.skip('renders intent badge with "Standalone" text', async () => {
      for (const route of STANDALONE_ROUTES) {
        cleanup();
        renderStandaloneRoute(route.path);

        const badge = screen.getByText('Standalone');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('data-intent', 'standalone');
      }
    });

    it.skip('consistent container structure: header + content + actions', async () => {
      for (const route of STANDALONE_ROUTES) {
        cleanup();
        renderStandaloneRoute(route.path);

        // Header section with title and badge
        const header = screen.getByTestId('standalone-header');
        expect(header).toBeInTheDocument();

        // Content section
        const content = screen.getByTestId('standalone-content');
        expect(content).toBeInTheDocument();

        // Actions section (may be empty but should exist)
        const actions = screen.getByTestId('standalone-actions');
        expect(actions).toBeInTheDocument();
      }
    });
  });

  // ==========================================================================
  // Material Quality Gate Tests
  // ==========================================================================

  describe('Material Quality Gate', () => {
    it.skip('renders LiquidPanel when quality gate enabled', async () => {
      // Mock high-quality settings
      jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: no-preference)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      renderStandaloneRoute('/pilot');

      // Should find liquid-panel class or data attribute
      const panel = screen.getByTestId('standalone-shell');
      expect(panel.querySelector('.liquid-panel')).toBeInTheDocument();
    });

    it.skip('renders fallback container when quality gate disabled', async () => {
      // Mock reduced motion / low quality
      jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      renderStandaloneRoute('/pilot');

      // Should find fallback class
      const panel = screen.getByTestId('standalone-shell');
      expect(panel.querySelector('.standalone-fallback')).toBeInTheDocument();
    });

    it.skip('no layout shift between gated and fallback modes', async () => {
      // Render both versions and compare layout metrics
      // This test checks that the structure is identical regardless of materials

      // High quality
      jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: no-preference)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container: highQualityContainer } = render(
        <MemoryRouter initialEntries={['/pilot']}>
          <Routes>
            <Route path='*' element={<StandaloneRouteLoader />} />
          </Routes>
        </MemoryRouter>
      );

      const highQualityElements = highQualityContainer.querySelectorAll('[data-testid]');
      const highQualityStructure = Array.from(highQualityElements).map((el) =>
        el.getAttribute('data-testid')
      );

      cleanup();

      // Low quality
      jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { container: lowQualityContainer } = render(
        <MemoryRouter initialEntries={['/pilot']}>
          <Routes>
            <Route path='*' element={<StandaloneRouteLoader />} />
          </Routes>
        </MemoryRouter>
      );

      const lowQualityElements = lowQualityContainer.querySelectorAll('[data-testid]');
      const lowQualityStructure = Array.from(lowQualityElements).map((el) =>
        el.getAttribute('data-testid')
      );

      // Same structure in both modes
      expect(highQualityStructure).toEqual(lowQualityStructure);
    });
  });

  // ==========================================================================
  // Suite Boundary Tests
  // ==========================================================================

  describe('Suite Boundary', () => {
    it.skip('OS shell owns chrome, suite owns content slot', async () => {
      renderStandaloneRoute('/pilot');

      // Shell-owned elements (header, actions row)
      const header = screen.getByTestId('standalone-header');
      expect(header).toBeInTheDocument();

      // Content slot should contain suite-specific content
      const content = screen.getByTestId('standalone-content');
      expect(content).toBeInTheDocument();

      // Content should be a child of the shell
      const shell = screen.getByTestId('standalone-shell');
      expect(shell).toContainElement(content);
    });

    it.skip('suite content does not leak into shell chrome', async () => {
      renderStandaloneRoute('/pilot');

      const header = screen.getByTestId('standalone-header');
      const content = screen.getByTestId('standalone-content');

      // Header should not contain content elements
      expect(header).not.toContainElement(content);

      // Content should have its own semantic boundary
      expect(content.getAttribute('role')).toBe('main');
    });
  });
});
