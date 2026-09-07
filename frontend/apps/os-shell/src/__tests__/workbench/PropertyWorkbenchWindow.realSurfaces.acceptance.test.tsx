/**
 * Reserved-office launch acceptance after OS-COUNTY-CONTEXT-001 forward staging.
 * The actual window must expose its unavailable boundary, never the real
 * Clerk/Treasury/Audit modules or their API actions. Canonical six-tab hosting
 * regressions remain in tabMapping and the domain workflow screen suites.
 * No tab module is mocked here; shell/store dependencies remain isolated.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activateModuleMock, selectParcelMock, openWorkbenchWindowMock, authIdentity } = vi.hoisted(() => ({
  authIdentity: { countyId: 'benton', userId: 'u-test', roles: ['assessor'] },
  activateModuleMock: vi.fn(),
  selectParcelMock: vi.fn(),
  openWorkbenchWindowMock: vi.fn(),
}));

// ── Window chrome + shell deps (mirrors segmentContext / tabMapping) ───────────
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: any) => {
    const state = {
      activeParcel: {
        parcelId: 'ACC-1',
        address: '1 Acceptance Ave',
        ownerName: 'Acceptance Tester',
        totalAssessedValue: 250000,
        marketValue: 260000,
        landValue: 80000,
        improvementValue: 170000,
        propertyType: 'Residential',
        legalDescription: 'LOT 1',
        dataSource: 'fixture',
      },
      activeParcelLoading: false,
      selectParcel: selectParcelMock,
      appeals: [],
      documents: [],
      operations: [],
      recordings: [],
      taxStatements: [],
      auditTrail: [],
      relatedDataStatus: 'idle',
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: () => [],
  useRecentParcelMeta: () => ({}),
  recordRecentParcelMeta: vi.fn(),
  openWorkbenchWindow: openWorkbenchWindowMock,
}));

vi.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: (selector: any) => selector({ open: vi.fn() }),
}));

vi.mock('../../shell/command-palette/useParcelSearch', () => ({
  useParcelSearch: () => ({ results: [], totalCount: 0, isLoading: false }),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ countyId: 'benton', userId: 'u-test', role: 'assessor' }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => authIdentity,
}));

vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'],
    hiddenCount: 0,
    showAll: true,
    toggleShowAll: vi.fn(),
  }),
}));

vi.mock('../../services/badges', () => ({ BADGE_PROVIDERS: [] }));
vi.mock('../../services/quickActions', () => ({ QUICK_ACTION_PROVIDERS: [] }));
vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false }),
}));
vi.mock('../../components/workbench/ContextRibbon', () => ({ ContextRibbon: () => <div data-testid='ctx-ribbon' /> }));
vi.mock('../../components/workbench/ActivityFeed', () => ({ ActivityFeed: () => <div data-testid='activity-feed' /> }));

// Pilot transport stays real; forbidden execution is observed at HTTP below.
vi.mock('../../runtime/env', () => ({
  // Matches the real getEnv() shape: { DEV, PROD, MODE }.
  getEnv: () => ({ DEV: false, PROD: false, MODE: 'test' }),
}));

import PropertyWorkbenchWindow from '../../pages/workbench/PropertyWorkbenchWindow';

describe('PropertyWorkbenchWindow real-surface acceptance (WO-WB-ACCEPT-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['clerk', 'property-clerk-tab'],
    ['treasury', 'property-treasury-tab'],
    ['audit', 'property-audit-tab'],
  ])('launching the window into reserved %s is unavailable without module or API execution', async (tabId, testId) => {
    const http = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    let view: ReturnType<typeof render> | undefined;
    try {
      await act(async () => { view = render(<PropertyWorkbenchWindow metadata={{ parcelId: 'ACC-1', tabId }} />); });
      expect(await screen.findByText('Reserved office unavailable')).toBeInTheDocument();
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
      for (const office of ['clerk', 'treasury', 'audit']) {
        expect(screen.queryByTestId('property-' + office + '-tab')).not.toBeInTheDocument();
        expect(screen.queryByRole('tab', { name: new RegExp('^' + office + '$', 'i') })).not.toBeInTheDocument();
      }
      // Even a role fixture exposing every historical tab cannot reactivate offices.
      expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot']);
      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
      expect(http).not.toHaveBeenCalled();
    } finally { view?.unmount(); http.mockRestore(); }
  });
});
