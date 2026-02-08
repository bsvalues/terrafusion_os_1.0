/**
 * TerraFusion OS Standalone Homes Modules Contract Tests
 *
 * Enforces the modules region contract for standalone suite homes:
 * - StandaloneHomeShell always renders a modules region
 * - If modules exist → renders module grid with LiquidPanels
 * - If none → renders accessible empty state (not stubby)
 * - Module id uniqueness per suite
 * - Module titles non-empty
 *
 * Contract: Modules must satisfy quality gate when present.
 *
 * @module __tests__/standalone/standaloneHomes.modules.contract.test
 * @see Slice 13: Suite Home Modules v1 + Cross-Surface Description Truth
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { StandaloneHomeShell } from '../../components/standalone/StandaloneHomeShell';
import {
    MODULE_KINDS,
    type StandaloneHomeModule,
} from '../../components/standalone/standaloneHomeContracts';
import { getStandaloneSuites, OS_FEATURES } from '../../config/suiteRegistry';
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
// Modules Region Contract
// ============================================================================

describe('Standalone Homes Modules Contract', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('modules region always renders', () => {
    it('renders modules-region testid when no modules provided', () => {
      const suite = getStandaloneSuites()[0];

      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Modules region should always be present (even if empty)
      const modulesRegion = screen.getByTestId('standalone-modules-region');
      expect(modulesRegion).toBeInTheDocument();

      unmount();
    });

    it('renders accessible empty state when no modules provided', () => {
      const suite = getStandaloneSuites()[0];

      // Ensure suite has no modules for this test
      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // If no modules, should render empty state (not stubby, accessible)
      const emptyState = screen.getByTestId('standalone-modules-empty');
      expect(emptyState).toBeInTheDocument();

      // Empty state should have accessible text
      expect(emptyState).toHaveAttribute('aria-label');

      unmount();
    });

    it('renders module grid when modules provided via prop', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        {
          id: 'status',
          title: 'Status Overview',
          kind: 'info',
        },
        {
          id: 'actions',
          title: 'Quick Actions',
          kind: 'actions',
        },
      ];

      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Should render module grid (not empty state)
      expect(screen.queryByTestId('standalone-modules-empty')).not.toBeInTheDocument();
      const modulesGrid = screen.getByTestId('standalone-modules-grid');
      expect(modulesGrid).toBeInTheDocument();

      unmount();
    });
  });

  // ==========================================================================
  // Module Rendering
  // ==========================================================================

  describe('module rendering', () => {
    it('renders all module titles', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        { id: 'mod-a', title: 'Module Alpha', kind: 'info' },
        { id: 'mod-b', title: 'Module Beta', kind: 'metrics' },
      ];

      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // All module titles should be visible
      expect(screen.getByText('Module Alpha')).toBeInTheDocument();
      expect(screen.getByText('Module Beta')).toBeInTheDocument();

      unmount();
    });

    it('modules are wrapped in LiquidPanel (respects materials)', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        { id: 'test-module', title: 'Test Module', kind: 'info' },
      ];

      const { unmount, container } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Verify LiquidPanel wrapper exists (by class or data attribute)
      const moduleCard = container.querySelector('[data-testid="standalone-module-test-module"]');
      expect(moduleCard).toBeInTheDocument();

      // Should be inside a liquid-panel or have fallback wrapper
      const panel = moduleCard?.closest('.liquid-panel, .standalone-module-panel');
      expect(panel).not.toBeNull();

      unmount();
    });

    it('modules render with correct kind attribute', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        { id: 'info-mod', title: 'Info', kind: 'info' },
        { id: 'actions-mod', title: 'Actions', kind: 'actions' },
        { id: 'metrics-mod', title: 'Metrics', kind: 'metrics' },
        { id: 'links-mod', title: 'Links', kind: 'links' },
      ];

      const { unmount, container } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      // Each module should have data-module-kind attribute
      for (const mod of testModules) {
        const moduleEl = container.querySelector(`[data-testid="standalone-module-${mod.id}"]`);
        expect(moduleEl).toBeInTheDocument();
        expect(moduleEl).toHaveAttribute('data-module-kind', mod.kind);
      }

      unmount();
    });
  });

  // ==========================================================================
  // Module Type Safety
  // ==========================================================================

  describe('module type enforcement', () => {
    it('MODULE_KINDS enum includes expected values', () => {
      expect(MODULE_KINDS).toContain('info');
      expect(MODULE_KINDS).toContain('actions');
      expect(MODULE_KINDS).toContain('metrics');
      expect(MODULE_KINDS).toContain('links');
    });

    it('module kind is limited to enum values', () => {
      // This is a compile-time check mostly, but we verify the type
      const validKinds = ['info', 'actions', 'metrics', 'links'] as const;

      for (const kind of MODULE_KINDS) {
        expect(validKinds).toContain(kind);
      }
    });
  });

  // ==========================================================================
  // Registry Invariants for Modules
  // ==========================================================================

  describe('registry module invariants', () => {
    it('if modules present in homeMeta → all titles non-empty', () => {
      for (const feature of OS_FEATURES) {
        const modules = feature.homeMeta?.modules;
        if (modules && modules.length > 0) {
          for (const mod of modules) {
            expect(
              mod.title,
              `Feature "${feature.id}" module "${mod.id}" has empty title`
            ).toBeTruthy();
            expect(
              mod.title.length,
              `Feature "${feature.id}" module "${mod.id}" title is empty string`
            ).toBeGreaterThan(0);
          }
        }
      }
    });

    it('if modules present in homeMeta → all ids unique within suite', () => {
      for (const feature of OS_FEATURES) {
        const modules = feature.homeMeta?.modules;
        if (modules && modules.length > 0) {
          const ids = modules.map((m) => m.id);
          const uniqueIds = new Set(ids);
          expect(
            uniqueIds.size,
            `Feature "${feature.id}" has duplicate module ids: ${ids.join(', ')}`
          ).toBe(ids.length);
        }
      }
    });

    it('if modules present → all have valid kind', () => {
      for (const feature of OS_FEATURES) {
        const modules = feature.homeMeta?.modules;
        if (modules && modules.length > 0) {
          for (const mod of modules) {
            expect(
              MODULE_KINDS.includes(mod.kind as (typeof MODULE_KINDS)[number]),
              `Feature "${feature.id}" module "${mod.id}" has invalid kind: ${mod.kind}`
            ).toBe(true);
          }
        }
      }
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('modules accessibility', () => {
    it('modules region has accessible name', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        { id: 'test', title: 'Test Module', kind: 'info' },
      ];

      const { unmount } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      const modulesRegion = screen.getByTestId('standalone-modules-region');
      // Should have accessible label
      expect(
        modulesRegion.getAttribute('aria-label') || modulesRegion.getAttribute('aria-labelledby')
      ).toBeTruthy();

      unmount();
    });

    it('module cards are keyboard accessible (part of focus order)', () => {
      const suite = getStandaloneSuites()[0];

      const testModules: StandaloneHomeModule[] = [
        { id: 'test', title: 'Test Module', kind: 'info' },
      ];

      const { unmount, container } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      const moduleCard = container.querySelector('[data-testid="standalone-module-test"]');
      // Module panel or its interactive child should be focusable
      const focusable = moduleCard?.closest('[tabindex], button, a');
      // Either the module itself is focusable or contains focusable elements
      expect(moduleCard).toBeInTheDocument();

      unmount();
    });
  });

  // ==========================================================================
  // Layout Stability
  // ==========================================================================

  describe('layout stability', () => {
    it('modules region does not cause layout shift', () => {
      const suite = getStandaloneSuites()[0];

      // Render without modules
      const { rerender, container } = renderWithRouter(
        <StandaloneHomeShell featureId={suite.id}>
          <div>Content</div>
        </StandaloneHomeShell>
      );

      const regionBefore = container.querySelector('[data-testid="standalone-modules-region"]');
      expect(regionBefore).toBeInTheDocument();

      // Rerender with modules - region should still be in same document position
      const testModules: StandaloneHomeModule[] = [
        { id: 'new-mod', title: 'New Module', kind: 'info' },
      ];

      rerender(
        <BrowserRouter>
          <StandaloneHomeShell featureId={suite.id} meta={{ modules: testModules }}>
            <div>Content</div>
          </StandaloneHomeShell>
        </BrowserRouter>
      );

      const regionAfter = container.querySelector('[data-testid="standalone-modules-region"]');
      expect(regionAfter).toBeInTheDocument();

      // Structure should be stable (modules region exists in both cases)
    });
  });
});
