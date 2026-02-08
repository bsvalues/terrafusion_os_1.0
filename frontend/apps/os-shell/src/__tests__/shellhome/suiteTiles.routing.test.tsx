/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SUITE TILES ROUTING TESTS
 * Slice 2: Suite UX Clarity Pass - Routing Contract Verification
 *
 * Tests the suite tile navigation contract:
 * - Every tile has a valid href (no undefined, no #)
 * - Tiles marked 'workbench' route to /property/:parcelId/tab
 * - Tiles marked 'standalone' route to /<suitename>
 * - OS entrypoints route to their standalone paths
 * - No dead tiles
 *
 * Routing Decision Framework:
 * - Workbench tab: Suite's primary job is parcel-scoped
 * - Standalone home: Cross-parcel, operational, admin, monitoring
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { CONSTITUTIONAL_SUITES } from '../../config/suiteRegistry';
import { ShellHome } from '../../shell/home/ShellHome';

// Mock navigation to capture route targets
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock stores to prevent initialization errors
vi.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: () => vi.fn(),
}));

vi.mock('../../stores/startMenuStore', () => ({
  useStartMenuStore: () => [],
}));

// Test wrapper with router context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
);

const renderShellHome = () => {
  return render(
    <TestWrapper>
      <ShellHome />
    </TestWrapper>
  );
};

describe('Suite Tiles - Routing Contract', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Suite tiles have valid routes', () => {
    it('each constitutional suite tile is clickable', async () => {
      const user = userEvent.setup();
      renderShellHome();

      // Find suite launcher section
      const suiteHeading = screen.getByRole('heading', { name: /launch suite/i });
      expect(suiteHeading).toBeInTheDocument();

      // Each constitutional suite should be present
      for (const suite of CONSTITUTIONAL_SUITES) {
        const tile = screen.getByRole('button', { name: new RegExp(suite.displayName, 'i') });
        expect(tile).toBeInTheDocument();

        // Click should trigger navigation
        await user.click(tile);
        expect(mockNavigate).toHaveBeenCalled();
        mockNavigate.mockClear();
      }
    });

    it('no suite tile has undefined or # href', async () => {
      const user = userEvent.setup();
      renderShellHome();

      // Get all suite tiles (role=button with suite names)
      for (const suite of CONSTITUTIONAL_SUITES) {
        const tile = screen.getByRole('button', { name: new RegExp(suite.displayName, 'i') });
        await user.click(tile);

        // Route should be defined and not just #
        const lastCall = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
        expect(lastCall).toBeDefined();
        const route = lastCall[0];
        expect(route).toBeDefined();
        expect(route).not.toBe('#');
        expect(route).not.toBe('');
        expect(typeof route).toBe('string');
      }
    });
  });

  describe('Workbench intent tiles', () => {
    it('tiles with workbenchTab=true route to /property/:parcelId/tab', async () => {
      const user = userEvent.setup();
      renderShellHome();

      const workbenchSuites = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab);

      for (const suite of workbenchSuites) {
        mockNavigate.mockClear();
        const tile = screen.getByRole('button', { name: new RegExp(suite.displayName, 'i') });
        await user.click(tile);

        const lastCall = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
        expect(lastCall).toBeDefined();
        const route = lastCall[0] as string;

        // Should route to property workbench with tab
        expect(route).toMatch(/^\/property\/[^/]+/);
        // Could have a tab segment like /property/123/forge
      }
    });

    it('workbench tiles include intent indicator (Workbench badge)', () => {
      renderShellHome();

      // Look for tiles with Workbench badge (updated implementation)
      const workbenchBadges = screen.getAllByText('Workbench');
      expect(workbenchBadges.length).toBeGreaterThan(0);

      // Should have as many Workbench badges as workbench suites
      const workbenchSuites = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab);
      expect(workbenchBadges.length).toBe(workbenchSuites.length);
    });
  });

  describe('Standalone intent tiles', () => {
    it('OS entrypoints route to standalone paths', async () => {
      const user = userEvent.setup();
      renderShellHome();

      // Pilot Console
      const pilotButton = screen.getByRole('button', { name: /pilot console/i });
      await user.click(pilotButton);
      expect(mockNavigate).toHaveBeenCalledWith('/pilot');

      mockNavigate.mockClear();

      // TerraTrace
      const traceButton = screen.getByRole('button', { name: /terratrace/i });
      await user.click(traceButton);
      expect(mockNavigate).toHaveBeenCalledWith('/pilot/dashboard');

      mockNavigate.mockClear();

      // TerraPrime
      const primeButton = screen.getByRole('button', { name: /terraprime/i });
      await user.click(primeButton);
      expect(mockNavigate).toHaveBeenCalledWith('/suites/terra-prime');
    });

    it('OS entrypoints do NOT have WB badge', () => {
      renderShellHome();

      // Find OS entrypoints (they use TactileButton, not SuiteCard)
      const pilotButton = screen.getByRole('button', { name: /pilot console/i });
      const traceButton = screen.getByRole('button', { name: /terratrace/i });
      const primeButton = screen.getByRole('button', { name: /terraprime/i });

      // These should not contain WB badge
      expect(within(pilotButton).queryByText('WB')).not.toBeInTheDocument();
      expect(within(traceButton).queryByText('WB')).not.toBeInTheDocument();
      expect(within(primeButton).queryByText('WB')).not.toBeInTheDocument();
    });
  });

  describe('No dead tiles', () => {
    it('all suite routes resolve to valid paths', async () => {
      const user = userEvent.setup();
      renderShellHome();

      const allSuiteButtons = CONSTITUTIONAL_SUITES.map((suite) =>
        screen.getByRole('button', { name: new RegExp(suite.displayName, 'i') })
      );

      for (const button of allSuiteButtons) {
        mockNavigate.mockClear();
        await user.click(button);

        const lastCall = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
        const route = lastCall?.[0] as string | undefined;

        // Route must be defined and look like a valid path
        expect(route).toBeDefined();
        expect(route).toMatch(/^\//); // Starts with /
        expect(route).not.toMatch(/undefined/i); // No undefined in route
      }
    });

    it('all OS entrypoint routes resolve to valid paths', async () => {
      const user = userEvent.setup();
      renderShellHome();

      const osEntrypoints = [
        { name: /pilot console/i, expectedRoute: '/pilot' },
        { name: /terratrace/i, expectedRoute: '/pilot/dashboard' },
        { name: /terraprime/i, expectedRoute: '/suites/terra-prime' },
      ];

      for (const { name, expectedRoute } of osEntrypoints) {
        mockNavigate.mockClear();
        const button = screen.getByRole('button', { name });
        await user.click(button);

        expect(mockNavigate).toHaveBeenCalledWith(expectedRoute);
      }
    });
  });

  describe('Intent metadata contract', () => {
    it('suite tiles expose data-intent attribute for testing', () => {
      renderShellHome();

      for (const suite of CONSTITUTIONAL_SUITES) {
        const tile = screen.getByRole('button', { name: new RegExp(suite.displayName, 'i') });

        // Expect data-intent attribute
        expect(tile).toHaveAttribute('data-intent');
        const intent = tile.getAttribute('data-intent');
        expect(['workbench', 'standalone']).toContain(intent);
      }
    });

    it('tiles with intent=workbench show "Workbench" badge text', () => {
      renderShellHome();

      // Expect badge text to be "Workbench" for workbench tiles
      const workbenchLabels = screen.queryAllByText('Workbench');
      const workbenchSuites = CONSTITUTIONAL_SUITES.filter((s) => s.workbenchTab);
      expect(workbenchLabels.length).toBe(workbenchSuites.length);
    });
  });
});
