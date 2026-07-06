/**
 * PropertyWorkbenchWindow.realSurfaces.acceptance.test.tsx
 *
 * WO-WB-ACCEPT-004 — Operator acceptance: the desktop window host renders the REAL
 * Clerk/Treasury/Audit surfaces end-to-end (not via module stubs). Complements:
 *   - PropertyWorkbenchWindow.tabMapping.test.tsx (proves the window MAP points at
 *     the real modules, using stubs), and
 *   - workbenchRealHosting.gate.test.tsx (proves those components render real
 *     surfaces in ROUTE context).
 * This is the one journey neither covers directly: launching the actual
 * PropertyWorkbenchWindow into clerk/treasury/audit and getting the real
 * property-<tab>-tab surface. Frontend-only, fully mocked — no backend/tool
 * integration is exercised or claimed.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { activateModuleMock, selectParcelMock, openWorkbenchWindowMock } = vi.hoisted(() => ({
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
  useAuthContext: () => ({ countyId: 'benton', userId: 'u-test', roles: ['assessor'] }),
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

// ── Component-layer deps used by the REAL Clerk/Treasury/Audit tabs ────────────
// (NOT stubbing the tab modules — they render for real.)
vi.mock('../../api/pilotApi', () => ({
  // Matches the real invokeTool contract: { success, correlationId, result?: { output } }.
  invokeTool: vi.fn().mockResolvedValue({ success: true, correlationId: 'acc-corr-1', result: { output: '' } }),
  listPilotTools: vi.fn().mockResolvedValue({ count: 0, tools: [] }),
  filterMuseReadOnlyTools: (tools: unknown[]) => tools,
}));

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
  ])('launching the window into %s renders the REAL surface end-to-end', async (tabId, testId) => {
    render(<PropertyWorkbenchWindow metadata={{ parcelId: 'ACC-1', tabId }} />);

    // The real (un-stubbed) tab component mounts inside the actual window host.
    expect(await screen.findByTestId(testId, {}, { timeout: 5000 })).toBeInTheDocument();
    // Honest state: no placeholder / coming-soon surface under the tab.
    expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
  });
});
