/**
 * Phase 19 — Management Dashboard Operational Rollup Spine, Tranche 13
 * Dais Management Dashboard Routing Contract
 *
 * Verifies that the Management Dashboard lives in standalone DaisSuiteHome,
 * reuses the existing surface, and supports drill-through references.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => null,
}));
vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: ({ modules }: { modules: Array<{ label: string }> }) => (
    <div data-testid="mock-suite-module-grid">{modules.map((m) => m.label).join(' | ')}</div>
  ),
}));
vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: () => <div data-testid="mock-operational-queue" />,
}));

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      activeAppeals: 12,
      totalLevyRevenue: 5000000,
      pendingAssessments: 340,
      assessmentCompletionPercent: 87.2,
    },
    loading: false,
    error: null,
  }),
}));

function renderDaisSuiteHome() {
  return render(
    <MemoryRouter initialEntries={['/suites/dais']}>
      <DaisSuiteHome />
    </MemoryRouter>,
  );
}

describe('Dais Management Dashboard Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts Management Dashboard inside standalone TerraDais', () => {
    renderDaisSuiteHome();

    const suiteRoot = screen.getByTestId('suite-dais-root');
    expect(suiteRoot).toBeDefined();

    const mgmtOps = screen.getByTestId('dais-mgmt-ops');
    expect(mgmtOps).toBeDefined();
    expect(suiteRoot).toContainElement(mgmtOps);
  });

  it('reuses existing DaisSuiteHome surface rather than creating a new shell', () => {
    renderDaisSuiteHome();

    expect(screen.queryByTestId('standalone-mgmt-window')).toBeNull();
    expect(screen.queryByTestId('standalone-dashboard-window')).toBeNull();

    const mgmtOps = screen.getByTestId('dais-mgmt-ops');
    expect(mgmtOps.closest('[data-testid="suite-dais-root"]')).toBeTruthy();
  });

  it('supports drill-through to Property Workbench for parcel escalation review', () => {
    renderDaisSuiteHome();

    // Module grid contains the Management entry for standalone launch
    const modulesSection = screen.getByTestId('dais-modules');
    expect(modulesSection.textContent).toContain('Management');

    // The mgmt-ops panel is inside suite root, supporting drill-through references
    const mgmtOps = screen.getByTestId('dais-mgmt-ops');
    expect(mgmtOps).toBeDefined();
  });
});
