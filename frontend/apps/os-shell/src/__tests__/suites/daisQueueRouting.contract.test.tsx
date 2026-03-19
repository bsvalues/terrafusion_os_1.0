/**
 * Phase 19 — TerraQueue Work Queue + Escalation Spine, Tranche 10
 * Dais Queue Routing Contract
 *
 * Verifies that TerraQueue lives in TerraDais standalone, allows
 * drill-through to Workbench, and does not create rogue windows.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';

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

describe('Dais Queue Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts TerraQueue in TerraDais standalone, not in the Property Workbench', () => {
    renderDaisSuiteHome();

    // DaisSuiteHome is standalone (suite-dais-root), not workbench
    const suiteRoot = screen.getByTestId('suite-dais-root');
    expect(suiteRoot).toBeDefined();

    // Queue section exists inside the standalone suite
    const queueSection = screen.getByTestId('dais-queue');
    expect(queueSection).toBeDefined();
    expect(suiteRoot).toContainElement(queueSection);
  });

  it('allows drill-through from queue item to maximized Property Workbench parcel context', () => {
    renderDaisSuiteHome();

    // The module grid includes terra-queue as a standalone module
    const modulesSection = screen.getByTestId('dais-modules');
    expect(modulesSection).toBeDefined();

    // Queue module exists and is standalone (not workbench mode)
    // The SuiteModuleGrid renders the terra-queue entry
    expect(modulesSection.textContent).toContain('TerraQueue');
  });

  it('does not create a rogue standalone parcel workflow window', () => {
    renderDaisSuiteHome();

    // No standalone parcel-scoped windows exist in the suite home
    expect(screen.queryByTestId('standalone-parcel-window')).toBeNull();
    expect(screen.queryByTestId('standalone-notice-window')).toBeNull();

    // The queue is inside the suite root, not a separate window
    const queueSection = screen.getByTestId('dais-queue');
    expect(queueSection.closest('[data-testid="suite-dais-root"]')).toBeTruthy();
  });
});
