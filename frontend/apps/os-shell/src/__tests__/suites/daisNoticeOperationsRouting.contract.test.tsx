/**
 * Phase 19 — TerraNotice Batch Dispatch + Mail/Print Queue Spine, Tranche 11
 * Dais Notice Operations Routing Contract
 *
 * Verifies that TerraNotice batch operations live in TerraDais standalone,
 * allow drill-through to notice detail, and do not create rogue windows.
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

describe('Dais Notice Operations Routing Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hosts notice batch operations in TerraDais standalone, not in the Property Workbench', () => {
    renderDaisSuiteHome();

    const suiteRoot = screen.getByTestId('suite-dais-root');
    expect(suiteRoot).toBeDefined();

    const noticeOps = screen.getByTestId('dais-notice-ops');
    expect(noticeOps).toBeDefined();
    expect(suiteRoot).toContainElement(noticeOps);
  });

  it('includes notice batch queue module in the standalone module grid', () => {
    renderDaisSuiteHome();

    const modulesSection = screen.getByTestId('dais-modules');
    expect(modulesSection).toBeDefined();
    expect(modulesSection.textContent).toContain('TerraNotice');
  });

  it('does not create a rogue standalone notice dispatch window', () => {
    renderDaisSuiteHome();

    expect(screen.queryByTestId('standalone-notice-dispatch-window')).toBeNull();
    expect(screen.queryByTestId('standalone-batch-window')).toBeNull();

    const noticeOps = screen.getByTestId('dais-notice-ops');
    expect(noticeOps.closest('[data-testid="suite-dais-root"]')).toBeTruthy();
  });
});
