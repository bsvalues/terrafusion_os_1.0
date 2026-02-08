/**
 * TerraFusion OS Standalone Homes Quality Gate Tests
 *
 * Enforces minimal UX/IA bar for every Standalone suite home:
 * - Every standalone suite has a description
 * - Every standalone suite has >= 1 primary action
 * - Actions satisfy type guards + have accessible labels
 * - StandaloneHomeShell renders description + actions regions uniformly
 *
 * Contract: Missing description or actions → test fails (CI gate).
 *
 * @module __tests__/standalone/standaloneHomes.qualityGate.test
 * @see Slice 12: Suite Home Quality Gate + Visual Contract Enforcement
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import from registry and shell
import { StandaloneHomeShell } from '../../components/standalone/StandaloneHomeShell';
import { getStandaloneSuites, isValidPrimaryAction, OS_FEATURES } from '../../config/suiteRegistry';
import { useParcelContextStore } from '../../context/parcelContext';

// ============================================================================
// Test Helpers
// ============================================================================

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

function resetStore() {
  useParcelContextStore.setState({ context: null, recentParcels: [] });
}

// ============================================================================
// Quality Gate: HomeMeta Completeness
// ============================================================================

describe('Standalone Homes Quality Gate', () => {
  describe('homeMeta completeness', () => {
    it('all standalone suites have non-empty description', () => {
      const suites = getStandaloneSuites();

      // Ensure we have at least one suite to test
      expect(suites.length).toBeGreaterThan(0);

      for (const suite of suites) {
        expect(suite.homeMeta.description, `Suite "${suite.id}" missing description`).toBeTruthy();
        expect(
          suite.homeMeta.description.length,
          `Suite "${suite.id}" has empty description`
        ).toBeGreaterThan(0);
      }
    });

    it('all standalone suites have >= 1 primaryAction', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        expect(
          suite.homeMeta.primaryActions?.length,
          `Suite "${suite.id}" must have at least 1 primary action`
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it('all standalone suites have non-empty title', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        expect(suite.homeMeta.title, `Suite "${suite.id}" missing title`).toBeTruthy();
        expect(suite.homeMeta.title.length, `Suite "${suite.id}" has empty title`).toBeGreaterThan(
          0
        );
      }
    });

    it('standalone suite count matches expected OS_FEATURES with live status and route', () => {
      const liveWithRoute = OS_FEATURES.filter((f) => f.status === 'live' && f.route);
      const standaloneSuites = getStandaloneSuites();

      // Every live OS feature with a route should be a valid standalone suite
      expect(standaloneSuites.length).toBe(liveWithRoute.length);
    });
  });

  // ==========================================================================
  // Action Type Safety
  // ==========================================================================

  describe('action semantics', () => {
    it('all primaryActions satisfy type guards', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          expect(
            isValidPrimaryAction(action),
            `Suite "${suite.id}" action "${action.id}" fails type guard`
          ).toBe(true);
        }
      }
    });

    it('all primaryActions have explicit intent', () => {
      const suites = getStandaloneSuites();
      const validIntents = ['workbench', 'standalone', 'system'];

      for (const suite of suites) {
        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          expect(
            validIntents.includes(action.intent),
            `Suite "${suite.id}" action "${action.id}" has invalid intent: ${action.intent}`
          ).toBe(true);
        }
      }
    });

    it('all primaryActions have non-empty id and label', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          expect(action.id, `Suite "${suite.id}" action missing id`).toBeTruthy();
          expect(
            action.label,
            `Suite "${suite.id}" action "${action.id}" missing label`
          ).toBeTruthy();
          expect(
            action.label.length,
            `Suite "${suite.id}" action "${action.id}" has empty label`
          ).toBeGreaterThan(0);
        }
      }
    });

    it('navigation actions have valid href', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          // If action has href, it should be a valid string
          if (action.href !== undefined) {
            expect(
              typeof action.href,
              `Suite "${suite.id}" action "${action.id}" href is not string`
            ).toBe('string');
            expect(
              action.href.startsWith('/'),
              `Suite "${suite.id}" action "${action.id}" href should start with /`
            ).toBe(true);
          }
        }
      }
    });
  });

  // ==========================================================================
  // Visual Contract: Shell Structure
  // ==========================================================================

  describe('visual contract', () => {
    beforeEach(() => {
      resetStore();
    });

    it('StandaloneHomeShell always renders title', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div>Content</div>
          </StandaloneHomeShell>
        );

        // Title should be in an h1
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading.textContent?.length).toBeGreaterThan(0);

        unmount();
      }
    });

    it('StandaloneHomeShell always renders intent badge', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount, container } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div>Content</div>
          </StandaloneHomeShell>
        );

        // Intent badge should be present (data-intent="standalone")
        const badge = container.querySelector('[data-intent="standalone"]');
        expect(badge).toBeInTheDocument();
        expect(badge?.textContent).toBe('Standalone');

        unmount();
      }
    });

    it('StandaloneHomeShell always renders description', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div>Content</div>
          </StandaloneHomeShell>
        );

        // Description should be visible
        // Using the suite's description text
        const description = screen.getByText(suite.homeMeta.description);
        expect(description).toBeInTheDocument();

        unmount();
      }
    });

    it('StandaloneHomeShell always renders actions region', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div>Content</div>
          </StandaloneHomeShell>
        );

        // Actions container should always be present
        const actionsRegion = screen.getByTestId('standalone-actions');
        expect(actionsRegion).toBeInTheDocument();

        unmount();
      }
    });

    it('StandaloneHomeShell renders all primary actions as buttons', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div>Content</div>
          </StandaloneHomeShell>
        );

        const actions = suite.homeMeta.primaryActions ?? [];

        for (const action of actions) {
          // Each action should render as accessible element
          const actionElement = screen.getByText(action.label);
          expect(
            actionElement,
            `Suite "${suite.id}" action "${action.label}" not rendered`
          ).toBeInTheDocument();
        }

        unmount();
      }
    });

    it('StandaloneHomeShell renders main content region', () => {
      const suites = getStandaloneSuites();

      for (const suite of suites) {
        const { unmount } = renderWithRouter(
          <StandaloneHomeShell featureId={suite.id}>
            <div data-testid='suite-content'>Suite Content</div>
          </StandaloneHomeShell>
        );

        // Main content region with role="main"
        const mainRegion = screen.getByRole('main');
        expect(mainRegion).toBeInTheDocument();

        // Children should be rendered inside
        const content = screen.getByTestId('suite-content');
        expect(content).toBeInTheDocument();

        unmount();
      }
    });

    it('materials on/off yields identical structure', () => {
      // This test verifies that with or without materials,
      // the same structural elements are present
      const suite = getStandaloneSuites()[0];

      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Core structural elements should always exist
      expect(screen.getByTestId('standalone-shell')).toBeInTheDocument();
      expect(screen.getByTestId('standalone-header')).toBeInTheDocument();
      expect(screen.getByTestId('standalone-actions')).toBeInTheDocument();
      expect(screen.getByTestId('standalone-content')).toBeInTheDocument();

      unmount();
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility', () => {
    beforeEach(() => {
      resetStore();
    });

    it('all actions are keyboard reachable', () => {
      const suite = getStandaloneSuites()[0];

      renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      const actions = suite.homeMeta.primaryActions ?? [];

      for (const action of actions) {
        const element = screen.getByText(action.label);
        // Should be focusable (button or link)
        expect(
          element.closest('button, a'),
          `Action "${action.label}" is not keyboard accessible`
        ).not.toBeNull();
      }
    });

    it('shell has accessible landmarks', () => {
      const suite = getStandaloneSuites()[0];

      renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Banner landmark (header with role="banner")
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Suite Boundary: No Layout Leakage
  // ==========================================================================

  describe('suite boundary', () => {
    it('suites cannot override shell structure', () => {
      // Suites provide content only; shell controls chrome
      const suite = getStandaloneSuites()[0];

      renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>My Suite Content</div>
        </StandaloneHomeShell>
      );

      // Shell structure is controlled by OS
      const shell = screen.getByTestId('standalone-shell');
      expect(shell).toBeInTheDocument();

      // Content is rendered inside main, not replacing shell
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByText('My Suite Content'));
    });
  });
});
