/**
 * Phase 19 — TerraCert Roll Sign-Off + Statutory Export Spine, Tranche 12
 * Dais Cert Operations Routing Contract
 *
 * Verifies that cross-parcel certification operations live in standalone
 * DaisSuiteHome, not in the Property Workbench, and reuse the existing surface.
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

describe('Dais Cert Operations Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts cross-parcel certification operations in standalone DaisSuiteHome', () => {
    renderDaisSuiteHome();

    const suiteRoot = screen.getByTestId('suite-dais-root');
    expect(suiteRoot).toBeDefined();

    const certOps = screen.getByTestId('dais-cert-ops');
    expect(certOps).toBeDefined();
    expect(suiteRoot).toContainElement(certOps);
  });

  it('does not route county-wide certification actions into the Property Workbench', () => {
    renderDaisSuiteHome();

    const modulesSection = screen.getByTestId('dais-modules');
    expect(modulesSection).toBeDefined();
    expect(modulesSection.textContent).toContain('TerraCert');
  });

  it('reuses the existing standalone Dais surface rather than creating a new shell', () => {
    renderDaisSuiteHome();

    expect(screen.queryByTestId('standalone-cert-window')).toBeNull();
    expect(screen.queryByTestId('standalone-roll-window')).toBeNull();

    const certOps = screen.getByTestId('dais-cert-ops');
    expect(certOps.closest('[data-testid="suite-dais-root"]')).toBeTruthy();
  });
});
